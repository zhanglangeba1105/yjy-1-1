import type { Vendor, Stall, Schedule, Revenue, AppSettings } from '../types';

export const STORAGE_KEYS = {
  VENDORS: 'night_market_vendors',
  STALLS: 'night_market_stalls',
  SCHEDULES: 'night_market_schedules',
  REVENUES: 'night_market_revenues',
  SETTINGS: 'night_market_settings',
} as const;

export interface StorageAdapter<T> {
  get: () => T;
  set: (value: T) => void;
  clear: () => void;
  update: (fn: (prev: T) => T) => T;
}

export function createStorageAdapter<T>(key: string, defaultValue: T): StorageAdapter<T> {
  const get = (): T => {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) {
        return defaultValue;
      }
      return JSON.parse(raw) as T;
    } catch {
      return defaultValue;
    }
  };

  const set = (value: T): void => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      console.warn(`Failed to write to localStorage key: ${key}`);
    }
  };

  const clear = (): void => {
    localStorage.removeItem(key);
  };

  const update = (fn: (prev: T) => T): T => {
    const current = get();
    const next = fn(current);
    set(next);
    return next;
  };

  return { get, set, clear, update };
}

export const vendorStorage = createStorageAdapter<Vendor[]>(STORAGE_KEYS.VENDORS, []);

export const stallStorage = createStorageAdapter<Stall[]>(STORAGE_KEYS.STALLS, []);

export const scheduleStorage = createStorageAdapter<Schedule[]>(STORAGE_KEYS.SCHEDULES, []);

export const revenueStorage = createStorageAdapter<Revenue[]>(STORAGE_KEYS.REVENUES, []);

const defaultSettings: AppSettings = {
  currencySymbol: '¥',
  defaultTimeSlots: ['17:00-19:00', '18:00-20:00', '19:00-21:00', '20:00-22:00', '21:00-23:00'],
  theme: 'light',
};

export const settingsStorage = createStorageAdapter<AppSettings>(STORAGE_KEYS.SETTINGS, defaultSettings);
