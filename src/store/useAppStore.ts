import { create } from 'zustand';
import type {
  Vendor,
  Stall,
  Schedule,
  Revenue,
  Conflict,
  AppSettings,
  ScheduleStatus,
  StallStatus,
  VendorStatus,
} from '@/types';
import { vendorService } from '@/services/vendorService';
import { stallService } from '@/services/stallService';
import { scheduleService } from '@/services/scheduleService';
import { revenueService } from '@/services/revenueService';
import { detectConflicts } from '@/services/conflictService';
import { settingsStorage } from '@/services/storage';
import { initializeMockData } from '@/utils';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
  duration: number;
}

interface AppState {
  vendors: Vendor[];
  stalls: Stall[];
  schedules: Schedule[];
  revenues: Revenue[];
  conflicts: Conflict[];
  settings: AppSettings;
  isInitialized: boolean;
  loading: boolean;
  toasts: ToastMessage[];

  initialize: () => void;
  refreshConflicts: () => void;

  addToast: (type: ToastType, message: string, duration?: number) => void;
  removeToast: (id: string) => void;

  createVendor: (data: Partial<Vendor> & { name: string; phone: string; category: string }) => Vendor;
  updateVendor: (id: string, data: Partial<Vendor>) => Vendor | undefined;
  deleteVendor: (id: string) => boolean;

  createStall: (data: Partial<Stall> & { code: string; name: string; zone: string; area: number }) => Stall;
  updateStall: (id: string, data: Partial<Stall>) => Stall | undefined;
  deleteStall: (id: string) => boolean;

  createSchedule: (
    data: Partial<Schedule> & { vendorId: string; stallId: string; date: string; timeSlot: string }
  ) => Schedule;
  updateSchedule: (id: string, data: Partial<Schedule>) => Schedule | undefined;
  deleteSchedule: (id: string) => boolean;
  cancelSchedule: (id: string) => Schedule | undefined;

  createRevenue: (
    data: Partial<Revenue> & { vendorId: string; stallId: string; date: string; amount: number }
  ) => Revenue;
  updateRevenue: (id: string, data: Partial<Revenue>) => Revenue | undefined;
  deleteRevenue: (id: string) => boolean;
}

function generateId(prefix: string = 'id'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export const useAppStore = create<AppState>((set, get) => ({
  vendors: [],
  stalls: [],
  schedules: [],
  revenues: [],
  conflicts: [],
  settings: {
    currencySymbol: '¥',
    defaultTimeSlots: ['17:00-19:00', '18:00-20:00', '19:00-21:00', '20:00-22:00', '21:00-23:00'],
    theme: 'light',
  },
  isInitialized: false,
  loading: false,
  toasts: [],

  initialize: () => {
    let vendors = vendorService.getAll();
    let stalls = stallService.getAll();
    let schedules = scheduleService.getAll();
    let revenues = revenueService.getAll();
    const isFirstLoad = vendors.length === 0;

    if (isFirstLoad) {
      initializeMockData();
      vendors = vendorService.getAll();
      stalls = stallService.getAll();
      schedules = scheduleService.getAll();
      revenues = revenueService.getAll();
    }

    const settings = settingsStorage.get();
    const conflicts = detectConflicts(schedules, vendors, stalls);

    set({
      vendors,
      stalls,
      schedules,
      revenues,
      settings,
      conflicts,
      isInitialized: true,
    });

    if (isFirstLoad) {
      setTimeout(() => {
        get().addToast('info', '已加载示例数据，欢迎使用夜市排班器！');
      }, 100);
    }
  },

  refreshConflicts: () => {
    const { schedules, vendors, stalls } = get();
    const conflicts = detectConflicts(schedules, vendors, stalls);
    set({ conflicts });
  },

  addToast: (type, message, duration = 3000) => {
    const id = generateId('toast');
    const toast: ToastMessage = { id, type, message, duration };
    set((state) => ({ toasts: [...state.toasts, toast] }));

    setTimeout(() => {
      get().removeToast(id);
    }, duration);
  },

  removeToast: (id) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
  },

  createVendor: (data) => {
    const vendor = vendorService.create({
      name: data.name,
      phone: data.phone,
      category: data.category,
      avatar: data.avatar,
      status: data.status as VendorStatus,
      unavailableDates: data.unavailableDates,
    });
    set((state) => ({ vendors: [...state.vendors, vendor] }));
    return vendor;
  },

  updateVendor: (id, data) => {
    const updated = vendorService.update({ id, ...data });
    if (updated) {
      set((state) => ({
        vendors: state.vendors.map((v) => (v.id === id ? updated : v)),
      }));
    }
    return updated;
  },

  deleteVendor: (id) => {
    const found = vendorService.delete(id);
    if (found) {
      set((state) => ({
        vendors: state.vendors.filter((v) => v.id !== id),
      }));
      get().refreshConflicts();
    }
    return found;
  },

  createStall: (data) => {
    const stall = stallService.create({
      code: data.code,
      name: data.name,
      zone: data.zone,
      area: data.area,
      suitableCategories: data.suitableCategories,
      status: data.status as StallStatus,
    });
    set((state) => ({ stalls: [...state.stalls, stall] }));
    return stall;
  },

  updateStall: (id, data) => {
    const updated = stallService.update({ id, ...data });
    if (updated) {
      set((state) => ({
        stalls: state.stalls.map((s) => (s.id === id ? updated : s)),
      }));
    }
    return updated;
  },

  deleteStall: (id) => {
    const found = stallService.delete(id);
    if (found) {
      set((state) => ({
        stalls: state.stalls.filter((s) => s.id !== id),
      }));
      get().refreshConflicts();
    }
    return found;
  },

  createSchedule: (data) => {
    const schedule = scheduleService.create({
      vendorId: data.vendorId,
      stallId: data.stallId,
      date: data.date,
      timeSlot: data.timeSlot,
      status: data.status as ScheduleStatus,
      note: data.note,
    });
    set((state) => ({ schedules: [...state.schedules, schedule] }));
    get().refreshConflicts();
    return schedule;
  },

  updateSchedule: (id, data) => {
    const updated = scheduleService.update({ id, ...data });
    if (updated) {
      set((state) => ({
        schedules: state.schedules.map((s) => (s.id === id ? updated : s)),
      }));
      get().refreshConflicts();
    }
    return updated;
  },

  deleteSchedule: (id) => {
    const found = scheduleService.delete(id);
    if (found) {
      set((state) => ({
        schedules: state.schedules.filter((s) => s.id !== id),
      }));
      get().refreshConflicts();
    }
    return found;
  },

  cancelSchedule: (id) => {
    const cancelled = scheduleService.cancel(id);
    if (cancelled) {
      set((state) => ({
        schedules: state.schedules.map((s) => (s.id === id ? cancelled : s)),
      }));
      get().refreshConflicts();
    }
    return cancelled;
  },

  createRevenue: (data) => {
    const revenue = revenueService.create({
      scheduleId: data.scheduleId,
      vendorId: data.vendorId,
      stallId: data.stallId,
      date: data.date,
      amount: data.amount,
      note: data.note,
    });
    set((state) => ({ revenues: [...state.revenues, revenue] }));
    return revenue;
  },

  updateRevenue: (id, data) => {
    const updated = revenueService.update({ id, ...data });
    if (updated) {
      set((state) => ({
        revenues: state.revenues.map((r) => (r.id === id ? updated : r)),
      }));
    }
    return updated;
  },

  deleteRevenue: (id) => {
    const found = revenueService.delete(id);
    if (found) {
      set((state) => ({
        revenues: state.revenues.filter((r) => r.id !== id),
      }));
    }
    return found;
  },
}));
