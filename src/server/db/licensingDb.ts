import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface OwnerRecord {
  email: string;
  addedAt: string;
  status: 'active' | 'suspended';
  notes?: string;
}

export type LicenseType = 'lifetime' | 'monthly' | 'annual' | 'custom' | 'trial';
export type LicenseStatus = 'available' | 'active' | 'expired' | 'suspended' | 'revoked';

export interface LicenseRecord {
  id: string;
  keyHash: string; // SHA-256 hash of uppercase normalized license key
  keyPrefix: string; // e.g. "NVST-XXXX-****" for safe display
  type: LicenseType;
  planName: string;
  status: LicenseStatus;
  maxDevices: number;
  currentActivations: number;
  expiresAt: string | null; // ISO string, null for lifetime
  customerName: string;
  customerEmail?: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface DeviceActivationRecord {
  id: string;
  licenseId: string;
  deviceId: string;
  deviceName: string;
  osInfo: string;
  ipAddress?: string;
  activatedAt: string;
  lastSeen: string;
  status: 'active' | 'deactivated';
}

export interface AdminAuditLog {
  id: string;
  timestamp: string;
  actorEmail: string;
  action: string;
  targetId?: string;
  details: Record<string, any>;
}

export interface CustomerRecord {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  licenseIds: string[];
}

interface DatabaseSchema {
  version: number;
  owners: OwnerRecord[];
  licenses: LicenseRecord[];
  devices: DeviceActivationRecord[];
  customers: CustomerRecord[];
  auditLogs: AdminAuditLog[];
}

export function normalizeEmail(email: string): string {
  if (!email) return '';
  const trimmed = email.trim().toLowerCase();
  const parts = trimmed.split('@');
  if (parts.length !== 2) return trimmed;

  let [local, domain] = parts;
  if (domain === 'googlemail.com') domain = 'gmail.com';

  if (domain === 'gmail.com') {
    local = local.replace(/\./g, '');
    const plusIdx = local.indexOf('+');
    if (plusIdx !== -1) {
      local = local.substring(0, plusIdx);
    }
  }

  return `${local}@${domain}`;
}

export function hashKey(rawKey: string): string {
  const normalized = rawKey.trim().toUpperCase();
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

export function generateKeyString(): string {
  // Format: NVST-XXXX-XXXX-XXXX-XXXX
  const randomBlock = () => crypto.randomBytes(2).toString('hex').toUpperCase();
  return `NVST-${randomBlock()}-${randomBlock()}-${randomBlock()}-${randomBlock()}`;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'licensing_store.json');

class LicensingDatabase {
  private data: DatabaseSchema;
  private isLoaded: boolean = false;

  constructor() {
    this.data = this.getDefaultSchema();
    this.init();
  }

  private getDefaultSchema(): DatabaseSchema {
    return {
      version: 1,
      owners: [],
      licenses: [],
      devices: [],
      customers: [],
      auditLogs: [],
    };
  }

  private init() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
      } else {
        this.seedInitialData();
        this.persist();
      }
      this.isLoaded = true;
    } catch (e) {
      console.error('[LicensingDb] Failed to initialize persistent DB:', e);
      this.seedInitialData();
    }

    // Refresh owner allowlist from process.env on every start
    this.syncEnvironmentOwners();
  }

  private persist() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const tmpFile = `${DB_FILE}.tmp.${Date.now()}`;
      fs.writeFileSync(tmpFile, JSON.stringify(this.data, null, 2), 'utf-8');
      fs.renameSync(tmpFile, DB_FILE);
    } catch (e) {
      console.error('[LicensingDb] Failed to save DB to disk:', e);
    }
  }

  public syncEnvironmentOwners() {
    const envOwners = [
      process.env.OWNER_EMAIL_1 || 'josnking01@gmail.com',
      process.env.OWNER_EMAIL_2 || 'mayorajput00786@gmail.com',
      process.env.OWNER_EMAIL_3,
    ].filter(Boolean) as string[];

    for (const email of envOwners) {
      if (email.startsWith('REPLACE_WITH')) continue;
      const normalized = normalizeEmail(email);
      if (!this.data.owners.some((o) => normalizeEmail(o.email) === normalized)) {
        this.data.owners.push({
          email: normalized,
          addedAt: new Date().toISOString(),
          status: 'active',
          notes: 'Configured via server environment allowlist',
        });
      }
    }
    this.persist();
  }

  private seedInitialData() {
    const primaryOwner = normalizeEmail(process.env.OWNER_EMAIL_1 || 'josnking01@gmail.com');
    const secondaryOwner = normalizeEmail(process.env.OWNER_EMAIL_2 || 'mayorajput00786@gmail.com');
    const defaultOwner = primaryOwner;
    this.data.owners = [
      {
        email: primaryOwner,
        addedAt: new Date().toISOString(),
        status: 'active',
        notes: 'Primary Master Owner (josnking01@gmail.com)',
      },
      {
        email: secondaryOwner,
        addedAt: new Date().toISOString(),
        status: 'active',
        notes: 'Co-Master Owner (mayorajput00786@gmail.com)',
      },
    ];

    // Seed Demo/Starter Keys for fast evaluation and testing
    // 1. Pro Active 30-Day Key
    const key1 = 'NVST-DEMO-PRO1-2026-KEY1';
    // 2. Lifetime VIP Key
    const key2 = 'NVST-LIFE-VIP9-2026-SEAT';
    // 3. Expired Test Key
    const key3 = 'NVST-EXPR-PAST-2025-OLD1';
    // 4. Revoked Test Key
    const key4 = 'NVST-RVKD-BAD9-2026-STOP';

    this.data.licenses = [
      {
        id: 'lic_demo_pro',
        keyHash: hashKey(key1),
        keyPrefix: 'NVST-DEMO-****-KEY1',
        type: 'monthly',
        planName: 'Pro Creator (Monthly)',
        status: 'available',
        maxDevices: 2,
        currentActivations: 0,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        customerName: 'Alex Rivers (YouTube Creator)',
        customerEmail: 'alex@creatorstudios.co',
        notes: 'Pre-activated creator demo license (2 device limit)',
        createdBy: defaultOwner,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'lic_demo_lifetime',
        keyHash: hashKey(key2),
        keyPrefix: 'NVST-LIFE-****-SEAT',
        type: 'lifetime',
        planName: 'Lifetime VIP Studio',
        status: 'available',
        maxDevices: 3,
        currentActivations: 0,
        expiresAt: null,
        customerName: 'Elena Rostova',
        customerEmail: 'elena@filmcut.art',
        notes: 'Permanent customer lifetime license',
        createdBy: defaultOwner,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'lic_demo_expired',
        keyHash: hashKey(key3),
        keyPrefix: 'NVST-EXPR-****-OLD1',
        type: 'trial',
        planName: '7-Day Fast Trial',
        status: 'expired',
        maxDevices: 1,
        currentActivations: 0,
        expiresAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        customerName: 'Expired Trial User',
        notes: 'Expired for testing rejection flows',
        createdBy: defaultOwner,
        createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'lic_demo_revoked',
        keyHash: hashKey(key4),
        keyPrefix: 'NVST-RVKD-****-STOP',
        type: 'monthly',
        planName: 'Pro Creator',
        status: 'revoked',
        maxDevices: 1,
        currentActivations: 0,
        expiresAt: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
        customerName: 'Suspended / Revoked Account',
        notes: 'Manually revoked for terms violation testing',
        createdBy: defaultOwner,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    this.data.auditLogs.push({
      id: `audit_${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorEmail: 'system',
      action: 'INITIALIZE_LICENSING_DATABASE',
      details: {
        primaryOwner: defaultOwner,
        seededLicenses: this.data.licenses.length,
      },
    });
  }

  // --- OWNERS ---
  public getOwners(): OwnerRecord[] {
    return [...this.data.owners];
  }

  public isOwner(email: string): boolean {
    if (!email) return false;
    const normalized = normalizeEmail(email);
    return this.data.owners.some((o) => normalizeEmail(o.email) === normalized && o.status === 'active');
  }

  public addOwner(email: string, notes?: string): boolean {
    const normalized = normalizeEmail(email);
    if (!normalized) return false;
    const existing = this.data.owners.find((o) => normalizeEmail(o.email) === normalized);
    if (existing) {
      existing.status = 'active';
      if (notes) existing.notes = notes;
    } else {
      this.data.owners.push({
        email: normalized,
        addedAt: new Date().toISOString(),
        status: 'active',
        notes,
      });
    }
    this.persist();
    return true;
  }

  public removeOwner(email: string): boolean {
    const normalized = normalizeEmail(email);
    const prevLen = this.data.owners.length;
    this.data.owners = this.data.owners.filter((o) => normalizeEmail(o.email) !== normalized);
    if (this.data.owners.length !== prevLen) {
      this.persist();
      return true;
    }
    return false;
  }

  // --- LICENSES ---
  public getLicenses(): LicenseRecord[] {
    // Recompute expired statuses automatically on read
    const now = Date.now();
    let changed = false;
    for (const lic of this.data.licenses) {
      if (lic.status === 'active' && lic.expiresAt && new Date(lic.expiresAt).getTime() < now) {
        lic.status = 'expired';
        lic.updatedAt = new Date().toISOString();
        changed = true;
      }
    }
    if (changed) this.persist();
    return [...this.data.licenses];
  }

  public findLicenseById(id: string): LicenseRecord | undefined {
    return this.data.licenses.find((l) => l.id === id);
  }

  public findLicenseByKeyHash(hash: string): LicenseRecord | undefined {
    return this.data.licenses.find((l) => l.keyHash === hash);
  }

  public addLicense(license: LicenseRecord) {
    this.data.licenses.unshift(license);
    this.persist();
  }

  public updateLicense(id: string, updates: Partial<LicenseRecord>): LicenseRecord | null {
    const lic = this.data.licenses.find((l) => l.id === id);
    if (!lic) return null;
    Object.assign(lic, updates, { updatedAt: new Date().toISOString() });
    this.persist();
    return lic;
  }

  public deleteLicense(id: string): boolean {
    const prevLen = this.data.licenses.length;
    this.data.licenses = this.data.licenses.filter((l) => l.id !== id);
    this.data.devices = this.data.devices.filter((d) => d.licenseId !== id);
    if (this.data.licenses.length !== prevLen) {
      this.persist();
      return true;
    }
    return false;
  }

  // --- DEVICES ---
  public getDevicesByLicense(licenseId: string): DeviceActivationRecord[] {
    return this.data.devices.filter((d) => d.licenseId === licenseId && d.status === 'active');
  }

  public getAllActiveDevices(): DeviceActivationRecord[] {
    return this.data.devices.filter((d) => d.status === 'active');
  }

  public findDevice(licenseId: string, deviceId: string): DeviceActivationRecord | undefined {
    return this.data.devices.find((d) => d.licenseId === licenseId && d.deviceId === deviceId && d.status === 'active');
  }

  public registerDevice(record: Omit<DeviceActivationRecord, 'id' | 'activatedAt' | 'lastSeen' | 'status'>): DeviceActivationRecord {
    // Check if this exact device is already registered for this license
    const existing = this.data.devices.find(
      (d) => d.licenseId === record.licenseId && d.deviceId === record.deviceId
    );

    const now = new Date().toISOString();
    if (existing) {
      existing.status = 'active';
      existing.lastSeen = now;
      existing.deviceName = record.deviceName || existing.deviceName;
      existing.osInfo = record.osInfo || existing.osInfo;
      if (record.ipAddress) existing.ipAddress = record.ipAddress;
      this.recalculateLicenseActivations(record.licenseId);
      this.persist();
      return existing;
    }

    const newRecord: DeviceActivationRecord = {
      id: `dev_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      licenseId: record.licenseId,
      deviceId: record.deviceId,
      deviceName: record.deviceName || 'Windows Workstation',
      osInfo: record.osInfo || 'Windows 11 x64',
      ipAddress: record.ipAddress,
      activatedAt: now,
      lastSeen: now,
      status: 'active',
    };

    this.data.devices.push(newRecord);
    this.recalculateLicenseActivations(record.licenseId);
    this.persist();
    return newRecord;
  }

  public deactivateDevice(licenseId: string, deviceId: string): boolean {
    const dev = this.data.devices.find(
      (d) => d.licenseId === licenseId && d.deviceId === deviceId && d.status === 'active'
    );
    if (dev) {
      dev.status = 'deactivated';
      this.recalculateLicenseActivations(licenseId);
      this.persist();
      return true;
    }
    return false;
  }

  public resetAllDevicesForLicense(licenseId: string): number {
    let count = 0;
    for (const dev of this.data.devices) {
      if (dev.licenseId === licenseId && dev.status === 'active') {
        dev.status = 'deactivated';
        count++;
      }
    }
    this.recalculateLicenseActivations(licenseId);
    this.persist();
    return count;
  }

  private recalculateLicenseActivations(licenseId: string) {
    const lic = this.data.licenses.find((l) => l.id === licenseId);
    if (!lic) return;
    const activeDevs = this.data.devices.filter((d) => d.licenseId === licenseId && d.status === 'active');
    lic.currentActivations = activeDevs.length;
    if (lic.status === 'available' && activeDevs.length > 0) {
      lic.status = 'active';
    } else if (lic.status === 'active' && activeDevs.length === 0) {
      lic.status = 'available';
    }
    lic.updatedAt = new Date().toISOString();
  }

  // --- AUDIT LOGS ---
  public addAuditLog(actorEmail: string, action: string, details: Record<string, any>, targetId?: string) {
    const log: AdminAuditLog = {
      id: `audit_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
      timestamp: new Date().toISOString(),
      actorEmail: normalizeEmail(actorEmail) || 'system',
      action,
      targetId,
      details,
    };
    this.data.auditLogs.unshift(log);
    // Keep last 1000 logs
    if (this.data.auditLogs.length > 1000) {
      this.data.auditLogs = this.data.auditLogs.slice(0, 1000);
    }
    this.persist();
    return log;
  }

  public getAuditLogs(limit: number = 100): AdminAuditLog[] {
    return this.data.auditLogs.slice(0, limit);
  }

  // --- METRICS ---
  public getMetrics() {
    const licenses = this.getLicenses();
    const active = licenses.filter((l) => l.status === 'active').length;
    const available = licenses.filter((l) => l.status === 'available').length;
    const expired = licenses.filter((l) => l.status === 'expired').length;
    const suspended = licenses.filter((l) => l.status === 'suspended').length;
    const revoked = licenses.filter((l) => l.status === 'revoked').length;
    const activeDevices = this.data.devices.filter((d) => d.status === 'active').length;

    // Unique customer emails or names
    const customerSet = new Set<string>();
    licenses.forEach((l) => {
      if (l.customerEmail) customerSet.add(l.customerEmail.toLowerCase());
      else if (l.customerName) customerSet.add(l.customerName.toLowerCase());
    });

    return {
      totalLicenses: licenses.length,
      activeLicenses: active,
      availableLicenses: available,
      expiredLicenses: expired,
      suspendedLicenses: suspended,
      revokedLicenses: revoked,
      totalCustomers: customerSet.size,
      activeDevices,
      totalOwners: this.data.owners.filter((o) => o.status === 'active').length,
    };
  }
}

export const db = new LicensingDatabase();
