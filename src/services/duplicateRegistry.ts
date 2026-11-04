import { DuplicateCheckResult, ExportHistoryItem } from '../types';

const STORAGE_KEY = 'novacut_export_registry_v1';
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

// Simple fast perceptual hash generator from string and duration
export function generateVideoFingerprint(title: string, duration: number, clipName?: string): string {
  const cleanTitle = (title || 'untitled').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  const cleanClip = (clipName || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  const roundedDuration = Math.round(duration * 10) / 10;
  
  // Custom hash combination
  let hashVal = 0;
  const str = `${cleanTitle}_${cleanClip}_${roundedDuration}`;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hashVal = (hashVal << 5) - hashVal + char;
    hashVal |= 0; // Convert to 32bit integer
  }
  return `vfp_${Math.abs(hashVal).toString(36)}_${Math.round(duration)}`;
}

export function getLocalExports(): ExportHistoryItem[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
}

export function saveLocalExport(item: ExportHistoryItem): void {
  try {
    const list = getLocalExports();
    const updated = [item, ...list.filter((x) => x.id !== item.id)].slice(0, 50);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save export registry locally', e);
  }
}

export async function checkDuplicateExport(
  hash: string,
  title: string,
  duration: number
): Promise<DuplicateCheckResult> {
  const now = Date.now();

  // 1. First check local registry (works 100% offline)
  const localList = getLocalExports();
  const localFound = localList.find((item) => {
    const isHashMatch = item.hash === hash;
    const isDurationAndTitleMatch =
      Math.abs(item.duration - duration) < 0.3 &&
      item.title.trim().toLowerCase() === title.trim().toLowerCase();
    return isHashMatch || isDurationAndTitleMatch;
  });

  if (localFound) {
    const exportedTime = new Date(localFound.exportedAt).getTime();
    const elapsed = now - exportedTime;
    if (elapsed < THIRTY_DAYS_MS) {
      const remainingDays = Math.ceil((THIRTY_DAYS_MS - elapsed) / (24 * 60 * 60 * 1000));
      return {
        isDuplicate: true,
        previousExport: localFound,
        remainingDays,
        message: `Yeh video pehle hi ${new Date(localFound.exportedAt).toLocaleDateString()} ko banai ja chuki hai. Duplication policy ke tehat isko 30 dino tak dobara export nahi kiya ja sakta (${remainingDays} din baqi hain).`,
      };
    }
  }

  // 2. Then check remote server registry if online
  if (navigator.onLine) {
    try {
      const res = await fetch('/api/registry/check-duplicate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hash, title, duration }),
      });
      if (res.ok) {
        const serverResult = await res.json();
        if (serverResult.isDuplicate) {
          return {
            isDuplicate: true,
            previousExport: serverResult.previousExport,
            remainingDays: serverResult.remainingDays,
            message: serverResult.message,
          };
        }
      }
    } catch (e) {
      // Graceful offline fallback
    }
  }

  return { isDuplicate: false };
}

export async function recordNewExport(
  hash: string,
  title: string,
  duration: number,
  aspectRatio: string,
  resolution: string,
  userEmail: string
): Promise<ExportHistoryItem> {
  const item: ExportHistoryItem = {
    id: `exp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    hash,
    title,
    duration,
    aspectRatio,
    resolution,
    exportedAt: new Date().toISOString(),
    exportedBy: userEmail,
  };

  // Save to local storage for offline memory
  saveLocalExport(item);

  // Sync to server if online
  if (navigator.onLine) {
    try {
      await fetch('/api/registry/record-export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
    } catch (e) {
      // offline
    }
  }

  return item;
}
