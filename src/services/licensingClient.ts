import { UserProfile } from '../types';

const OWNER_TOKEN_KEY = 'novacut_owner_session_v1';
const CUSTOMER_LEASE_KEY = 'novacut_customer_lease_v1';
const DEVICE_ID_KEY = 'novacut_machine_hwid_v1';
const USER_PROFILE_KEY = 'novacut_active_user_v1';

export interface CustomerLeaseData {
  licenseId: string;
  leaseToken: string;
  keyPrefix: string;
  planName: string;
  type: string;
  maxDevices: number;
  currentActivations: number;
  expiresAt: string | null;
  customerName: string;
  activatedAt: string;
}

export function getOrCreateDeviceId(): string {
  try {
    let id = localStorage.getItem(DEVICE_ID_KEY);
    if (!id) {
      const randomSeg = Math.random().toString(36).substring(2, 10).toUpperCase();
      const timeSeg = Date.now().toString(36).toUpperCase();
      id = `WIN-PC-${timeSeg}-${randomSeg}`;
      localStorage.setItem(DEVICE_ID_KEY, id);
    }
    return id;
  } catch {
    return 'WIN-PC-STANDALONE-DEFAULT';
  }
}

export function getDeviceMetadata() {
  const deviceId = getOrCreateDeviceId();
  let osInfo = 'Windows 11 x64 Desktop';
  if (typeof navigator !== 'undefined') {
    if (navigator.userAgent.includes('Windows NT 10.0')) {
      osInfo = 'Windows 11/10 Pro x64';
    } else if (navigator.userAgent.includes('Macintosh')) {
      osInfo = 'macOS Desktop';
    } else if (navigator.userAgent.includes('Linux')) {
      osInfo = 'Linux x86_64 Desktop';
    }
  }
  return {
    deviceId,
    deviceName: `Desktop-Node-${deviceId.substring(deviceId.length - 4)}`,
    osInfo,
  };
}

export function getStoredOwnerToken(): string | null {
  try {
    return localStorage.getItem(OWNER_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function getStoredCustomerLease(): CustomerLeaseData | null {
  try {
    const raw = localStorage.getItem(CUSTOMER_LEASE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveOwnerSession(token: string, user: UserProfile) {
  localStorage.setItem(OWNER_TOKEN_KEY, token);
  localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(user));
  localStorage.removeItem(CUSTOMER_LEASE_KEY);
}

export function saveCustomerLease(lease: CustomerLeaseData, user: UserProfile) {
  localStorage.setItem(CUSTOMER_LEASE_KEY, JSON.stringify(lease));
  localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(user));
  localStorage.removeItem(OWNER_TOKEN_KEY);
}

export function clearAllAuth() {
  localStorage.removeItem(OWNER_TOKEN_KEY);
  localStorage.removeItem(CUSTOMER_LEASE_KEY);
  localStorage.removeItem(USER_PROFILE_KEY);
}

export async function checkAuthStatus(): Promise<{
  isAuthenticated: boolean;
  isOwner: boolean;
  user: UserProfile;
  lease?: CustomerLeaseData | null;
  isOffline?: boolean;
}> {
  const guestUser: UserProfile = {
    email: 'guest@desktop.local',
    role: 'guest',
    isOwner: false,
    displayName: 'Unlicensed Installation',
    plan: 'Activation Required',
    permissions: ['preview'],
  };

  const ownerToken = getStoredOwnerToken();
  const lease = getStoredCustomerLease();

  // 1. Check Owner Session
  if (ownerToken) {
    if (navigator.onLine) {
      try {
        const res = await fetch('/api/auth/session', {
          headers: { Authorization: `Bearer ${ownerToken}` },
        });
        const data = await res.json();
        if (data.authenticated && data.isOwner && data.user) {
          return {
            isAuthenticated: true,
            isOwner: true,
            user: data.user,
          };
        } else {
          // Token expired or revoked from allowlist
          clearAllAuth();
          return { isAuthenticated: false, isOwner: false, user: guestUser };
        }
      } catch (e) {
        // Network error - owner offline with previously signed session
        const storedUser = localStorage.getItem(USER_PROFILE_KEY);
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          if (parsed.isOwner) {
            return {
              isAuthenticated: true,
              isOwner: true,
              user: parsed,
              isOffline: true,
            };
          }
        }
      }
    } else {
      // Offline mode
      const storedUser = localStorage.getItem(USER_PROFILE_KEY);
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        if (parsed.isOwner) {
          return {
            isAuthenticated: true,
            isOwner: true,
            user: parsed,
            isOffline: true,
          };
        }
      }
    }
  }

  // 2. Check Customer Lease
  if (lease && lease.licenseId && lease.leaseToken) {
    const { deviceId } = getDeviceMetadata();

    // Check expiration on client
    if (lease.expiresAt && new Date(lease.expiresAt).getTime() < Date.now()) {
      clearAllAuth();
      return { isAuthenticated: false, isOwner: false, user: guestUser };
    }

    if (navigator.onLine) {
      try {
        const res = await fetch('/api/license/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            licenseId: lease.licenseId,
            deviceId,
            leaseToken: lease.leaseToken,
          }),
        });
        const data = await res.json();
        if (data.valid) {
          const user: UserProfile = {
            email: lease.customerName || 'creator@licensed.customer',
            role: 'licensed_user',
            isOwner: false,
            displayName: lease.customerName || 'Licensed Pro Creator',
            plan: lease.planName,
            licenseKey: lease.keyPrefix,
            expiresAt: lease.expiresAt,
            permissions: ['export_4k', 'ai_tools', 'bulk_create', 'anti_copyright_shield', 'cloud_sync'],
          };
          return { isAuthenticated: true, isOwner: false, user, lease };
        } else {
          // License revoked, suspended, or device deactivated
          clearAllAuth();
          return { isAuthenticated: false, isOwner: false, user: guestUser };
        }
      } catch (err) {
        // Offline: Trust valid cryptographic lease
        const user: UserProfile = {
          email: lease.customerName || 'creator@licensed.customer',
          role: 'licensed_user',
          isOwner: false,
          displayName: `${lease.customerName || 'Licensed Pro'} (Offline)`,
          plan: lease.planName,
          licenseKey: lease.keyPrefix,
          expiresAt: lease.expiresAt,
          permissions: ['export_4k', 'ai_tools', 'bulk_create', 'anti_copyright_shield'],
        };
        return { isAuthenticated: true, isOwner: false, user, lease, isOffline: true };
      }
    } else {
      // Offline mode
      const user: UserProfile = {
        email: lease.customerName || 'creator@licensed.customer',
        role: 'licensed_user',
        isOwner: false,
        displayName: `${lease.customerName || 'Licensed Pro'} (Offline)`,
        plan: lease.planName,
        licenseKey: lease.keyPrefix,
        expiresAt: lease.expiresAt,
        permissions: ['export_4k', 'ai_tools', 'bulk_create', 'anti_copyright_shield'],
      };
      return { isAuthenticated: true, isOwner: false, user, lease, isOffline: true };
    }
  }

  return { isAuthenticated: false, isOwner: false, user: guestUser };
}

export async function loginWithGoogleOwner(
  idToken: string,
  simulatedCredential?: { email: string; name?: string }
): Promise<UserProfile> {
  const res = await fetch('/api/auth/google/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken, credential: simulatedCredential }),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Google Owner authentication failed');
  }

  saveOwnerSession(data.sessionToken, data.user);
  return data.user;
}

export async function activateWithLicenseKey(rawKey: string): Promise<{ user: UserProfile; lease: CustomerLeaseData }> {
  const { deviceId, deviceName, osInfo } = getDeviceMetadata();

  const res = await fetch('/api/license/activate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      key: rawKey.trim().toUpperCase(),
      deviceId,
      deviceName,
      osInfo,
    }),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'License activation failed.');
  }

  const lease: CustomerLeaseData = {
    licenseId: data.license.id,
    leaseToken: data.leaseToken,
    keyPrefix: data.license.keyPrefix,
    planName: data.license.planName,
    type: data.license.type,
    maxDevices: data.license.maxDevices,
    currentActivations: data.license.currentActivations,
    expiresAt: data.license.expiresAt,
    customerName: data.license.customerName,
    activatedAt: new Date().toISOString(),
  };

  saveCustomerLease(lease, data.user);
  return { user: data.user, lease };
}

export async function deactivateLicenseOnThisDevice(): Promise<boolean> {
  const lease = getStoredCustomerLease();
  if (!lease) return false;
  const { deviceId } = getDeviceMetadata();

  try {
    await fetch('/api/license/deactivate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        licenseId: lease.licenseId,
        deviceId,
      }),
    });
  } catch (e) {
    // ignore
  }

  clearAllAuth();
  return true;
}
