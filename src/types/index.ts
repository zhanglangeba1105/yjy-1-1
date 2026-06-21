export type VendorStatus = 'normal' | 'leave' | 'disabled';

export type StallStatus = 'available' | 'maintenance' | 'disabled';

export type ScheduleStatus = 'confirmed' | 'cancelled';

export type ConflictType =
  | 'stall_conflict'
  | 'vendor_conflict'
  | 'vendor_unavailable'
  | 'vendor_disabled'
  | 'stall_disabled';

export interface Vendor {
  id: string;
  name: string;
  phone: string;
  category: string;
  avatar: string;
  status: VendorStatus;
  unavailableDates: string[];
  createdAt: string;
}

export interface Stall {
  id: string;
  code: string;
  name: string;
  zone: string;
  area: number;
  suitableCategories: string[];
  status: StallStatus;
  createdAt: string;
}

export interface Schedule {
  id: string;
  vendorId: string;
  stallId: string;
  date: string;
  timeSlot: string;
  status: ScheduleStatus;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Revenue {
  id: string;
  scheduleId?: string;
  vendorId: string;
  stallId: string;
  date: string;
  amount: number;
  note?: string;
  createdAt: string;
}

export interface Conflict {
  id: string;
  type: ConflictType;
  message: string;
  date: string;
  scheduleIds: string[];
  affectedIds?: string[];
}

export const TIME_SLOTS = [
  '17:00-19:00',
  '18:00-20:00',
  '19:00-21:00',
  '20:00-22:00',
  '21:00-23:00',
  '17:00-22:00',
] as const;

export type TimeSlot = (typeof TIME_SLOTS)[number];

export interface AppSettings {
  currencySymbol: string;
  defaultTimeSlots: TimeSlot[];
  theme: 'light' | 'dark';
}
