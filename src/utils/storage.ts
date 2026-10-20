/**
 * Offline-First Local Database Storage Engine for uPVC Craft Pro
 * Handles persistent storage across browser sessions using localStorage
 */

export const STORAGE_KEYS = {
  QUOTATIONS: 'upvc_craft_quotations',
  INVOICES: 'upvc_craft_invoices',
  CUSTOMERS: 'upvc_craft_customers',
  PROFILE: 'upvc_craft_profile',
  SETTINGS: 'upvc_craft_settings',
  RATE_SHEET: 'upvc_craft_rates',
  SIDEBAR: 'upvc_sidebar_collapsed',
} as const;

export function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;
    const parsed = JSON.parse(raw);
    return parsed !== null && parsed !== undefined ? parsed : defaultValue;
  } catch (err) {
    console.warn(`[uPVC Storage] Failed to load key "${key}" from localStorage:`, err);
    return defaultValue;
  }
}

export function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`[uPVC Storage] Failed to persist key "${key}" to localStorage:`, err);
  }
}

export function removeFromStorage(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (err) {
    console.error(`[uPVC Storage] Failed to remove key "${key}":`, err);
  }
}

/**
 * Exports complete application database as a JSON string for backups
 */
export function exportDatabaseBackup(): string {
  const backup: Record<string, any> = {};
  Object.values(STORAGE_KEYS).forEach((k) => {
    try {
      const item = localStorage.getItem(k);
      if (item) backup[k] = JSON.parse(item);
    } catch {}
  });
  return JSON.stringify(backup, null, 2);
}

/**
 * Resets the application database back to factory sample records
 */
export function clearAllStorageData(): void {
  Object.values(STORAGE_KEYS).forEach((k) => {
    try {
      localStorage.removeItem(k);
    } catch {}
  });
}
