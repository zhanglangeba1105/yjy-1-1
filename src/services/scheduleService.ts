import type { Schedule, ScheduleStatus } from '../types';
import { scheduleStorage } from './storage';

function generateId(prefix: string = 'schedule'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export interface ScheduleCreateInput {
  vendorId: string;
  stallId: string;
  date: string;
  timeSlot: string;
  status?: ScheduleStatus;
  note?: string;
}

export interface ScheduleUpdateInput extends Partial<ScheduleCreateInput> {
  id: string;
}

export interface ScheduleSearchParams {
  vendorId?: string;
  stallId?: string;
  dateFrom?: string;
  dateTo?: string;
  date?: string;
  status?: ScheduleStatus;
  timeSlot?: string;
}

function getAll(): Schedule[] {
  return scheduleStorage.get();
}

function getById(id: string): Schedule | undefined {
  return getAll().find((s) => s.id === id);
}

function create(input: ScheduleCreateInput): Schedule {
  const now = new Date().toISOString();
  const schedule: Schedule = {
    id: generateId(),
    vendorId: input.vendorId,
    stallId: input.stallId,
    date: input.date,
    timeSlot: input.timeSlot,
    status: input.status ?? 'confirmed',
    note: input.note,
    createdAt: now,
    updatedAt: now,
  };

  scheduleStorage.update((prev) => [...prev, schedule]);
  return schedule;
}

function update(input: ScheduleUpdateInput): Schedule | undefined {
  let updated: Schedule | undefined;
  const now = new Date().toISOString();
  scheduleStorage.update((prev) =>
    prev.map((s) => {
      if (s.id !== input.id) return s;
      updated = { ...s, ...input, updatedAt: now };
      return updated;
    }),
  );
  return updated;
}

function remove(id: string): boolean {
  let found = false;
  scheduleStorage.update((prev) => prev.filter((s) => {
    if (s.id === id) {
      found = true;
      return false;
    }
    return true;
  }));
  return found;
}

function search(params: ScheduleSearchParams): Schedule[] {
  let results = getAll();

  if (params.vendorId) {
    results = results.filter((s) => s.vendorId === params.vendorId);
  }

  if (params.stallId) {
    results = results.filter((s) => s.stallId === params.stallId);
  }

  if (params.date) {
    results = results.filter((s) => s.date === params.date);
  }

  if (params.dateFrom) {
    results = results.filter((s) => s.date >= params.dateFrom!);
  }

  if (params.dateTo) {
    results = results.filter((s) => s.date <= params.dateTo!);
  }

  if (params.status) {
    results = results.filter((s) => s.status === params.status);
  }

  if (params.timeSlot) {
    results = results.filter((s) => s.timeSlot === params.timeSlot);
  }

  return results.sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return a.timeSlot.localeCompare(b.timeSlot);
  });
}

function getByDateRange(dateFrom: string, dateTo: string): Schedule[] {
  return getAll()
    .filter((s) => s.date >= dateFrom && s.date <= dateTo)
    .sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.timeSlot.localeCompare(b.timeSlot);
    });
}

function getByVendorAndDateRange(vendorId: string, dateFrom: string, dateTo: string): Schedule[] {
  return getByDateRange(dateFrom, dateTo).filter((s) => s.vendorId === vendorId);
}

function getByStallAndDateRange(stallId: string, dateFrom: string, dateTo: string): Schedule[] {
  return getByDateRange(dateFrom, dateTo).filter((s) => s.stallId === stallId);
}

function cancel(id: string): Schedule | undefined {
  return update({ id, status: 'cancelled' });
}

export const scheduleService = {
  getAll,
  getById,
  create,
  update,
  delete: remove,
  search,
  getByDateRange,
  getByVendorAndDateRange,
  getByStallAndDateRange,
  cancel,
};

export default scheduleService;
