import { UserProfile } from '../types';

const AUTH_STORAGE_KEY = 'novacut_user_auth_v1';
export const OWNER_EMAIL = 'josnking01@gmail.com';

export function getStoredUser(): UserProfile {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Double check if owner
      if (parsed.email && parsed.email.trim().toLowerCase() === OWNER_EMAIL) {
        return {
          ...parsed,
          role: 'owner_admin',
          isOwner: true,
          unlimited: true,
          displayName: 'Master Owner & Admin',
          plan: 'Lifetime Master License',
        };
      }
      return parsed;
    }
  } catch (e) {
    // fallback
  }

  // Default guest profile
  return {
    email: 'guest@novacut.local',
    role: 'guest',
    isOwner: false,
    displayName: 'Guest Creator',
    plan: 'Free Preview',
    permissions: ['preview', 'export_720p'],
  };
}

export function saveStoredUser(user: UserProfile): void {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
}

export function clearStoredUser(): void {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

export async function loginWithEmailOrKey(email: string, licenseKey?: string): Promise<UserProfile> {
  const cleanEmail = (email || '').trim().toLowerCase();

  // Instant Owner SuperAdmin Bypass for josnking01@gmail.com
  if (cleanEmail === OWNER_EMAIL) {
    const ownerUser: UserProfile = {
      email: OWNER_EMAIL,
      role: 'owner_admin',
      isOwner: true,
      displayName: 'Master Owner & Admin',
      plan: 'Lifetime Master License',
      unlimited: true,
      permissions: ['generate_keys', 'manage_users', 'bypass_duplicate_lock', 'export_4k', 'cloud_sync', 'ai_tools'],
    };
    saveStoredUser(ownerUser);
    return ownerUser;
  }

  // Try server verification
  if (navigator.onLine) {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, licenseKey }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        saveStoredUser(data.user);
        return data.user;
      } else {
        throw new Error(data.error || 'Authentication failed');
      }
    } catch (err: any) {
      if (err.message) throw err;
    }
  }

  // Offline or client validation for license keys
  if (licenseKey && licenseKey.toUpperCase().startsWith('NOVA-')) {
    const offlineUser: UserProfile = {
      email: cleanEmail || 'creator@licensed.local',
      role: 'licensed_user',
      isOwner: false,
      displayName: 'Licensed Pro Creator',
      plan: 'Pro VIP Studio',
      licenseKey: licenseKey.toUpperCase(),
      permissions: ['export_4k', 'ai_tools', 'cloud_sync'],
    };
    saveStoredUser(offlineUser);
    return offlineUser;
  }

  throw new Error('Please enter a valid license key or login with the master email.');
}
