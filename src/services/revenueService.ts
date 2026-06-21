import type { Revenue } from '../types';
import { revenueStorage } from './storage';

function generateId(prefix: string = 'revenue'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export interface RevenueCreateInput {
  scheduleId?: string;
  vendorId: string;
  stallId: string;
  date: string;
  amount: number;
  note?: string;
}

export interface RevenueUpdateInput extends Partial<RevenueCreateInput> {
  id: string;
}

export interface RevenueSearchParams {
  vendorId?: string;
  stallId?: string;
  scheduleId?: string;
  dateFrom?: string;
  dateTo?: string;
  date?: string;
  minAmount?: number;
  maxAmount?: number;
}

function getAll(): Revenue[] {
  return revenueStorage.get();
}

function getById(id: string): Revenue | undefined {
  return getAll().find((r) => r.id === id);
}

function create(input: RevenueCreateInput): Revenue {
  const now = new Date().toISOString();
  const revenue: Revenue = {
    id: generateId(),
    scheduleId: input.scheduleId,
    vendorId: input.vendorId,
    stallId: input.stallId,
    date: input.date,
    amount: input.amount,
    note: input.note,
    createdAt: now,
  };

  revenueStorage.update((prev) => [...prev, revenue]);
  return revenue;
}

function update(input: RevenueUpdateInput): Revenue | undefined {
  let updated: Revenue | undefined;
  revenueStorage.update((prev) =>
    prev.map((r) => {
      if (r.id !== input.id) return r;
      updated = { ...r, ...input };
      return updated;
    }),
  );
  return updated;
}

function remove(id: string): boolean {
  let found = false;
  revenueStorage.update((prev) => prev.filter((r) => {
    if (r.id === id) {
      found = true;
      return false;
    }
    return true;
  }));
  return found;
}

function search(params: RevenueSearchParams): Revenue[] {
  let results = getAll();

  if (params.vendorId) {
    results = results.filter((r) => r.vendorId === params.vendorId);
  }

  if (params.stallId) {
    results = results.filter((r) => r.stallId === params.stallId);
  }

  if (params.scheduleId) {
    results = results.filter((r) => r.scheduleId === params.scheduleId);
  }

  if (params.date) {
    results = results.filter((r) => r.date === params.date);
  }

  if (params.dateFrom) {
    results = results.filter((r) => r.date >= params.dateFrom!);
  }

  if (params.dateTo) {
    results = results.filter((r) => r.date <= params.dateTo!);
  }

  if (params.minAmount !== undefined) {
    results = results.filter((r) => r.amount >= params.minAmount!);
  }

  if (params.maxAmount !== undefined) {
    results = results.filter((r) => r.amount <= params.maxAmount!);
  }

  return results.sort((a, b) => a.date.localeCompare(b.date));
}

function getTotalByDateRange(dateFrom: string, dateTo: string): number {
  return getAll()
    .filter((r) => r.date >= dateFrom && r.date <= dateTo)
    .reduce((sum, r) => sum + r.amount, 0);
}

function getTotalByVendor(vendorId: string, dateFrom?: string, dateTo?: string): number {
  let records = getAll().filter((r) => r.vendorId === vendorId);
  if (dateFrom) records = records.filter((r) => r.date >= dateFrom);
  if (dateTo) records = records.filter((r) => r.date <= dateTo);
  return records.reduce((sum, r) => sum + r.amount, 0);
}

function getTotalByStall(stallId: string, dateFrom?: string, dateTo?: string): number {
  let records = getAll().filter((r) => r.stallId === stallId);
  if (dateFrom) records = records.filter((r) => r.date >= dateFrom);
  if (dateTo) records = records.filter((r) => r.date <= dateTo);
  return records.reduce((sum, r) => sum + r.amount, 0);
}

function getSummaryByDateRange(dateFrom: string, dateTo: string): {
  total: number;
  count: number;
  byVendor: Map<string, number>;
  byStall: Map<string, number>;
} {
  const records = getAll().filter((r) => r.date >= dateFrom && r.date <= dateTo);
  const byVendor = new Map<string, number>();
  const byStall = new Map<string, number>();
  let total = 0;

  for (const r of records) {
    total += r.amount;
    byVendor.set(r.vendorId, (byVendor.get(r.vendorId) ?? 0) + r.amount);
    byStall.set(r.stallId, (byStall.get(r.stallId) ?? 0) + r.amount);
  }

  return { total, count: records.length, byVendor, byStall };
}

export const revenueService = {
  getAll,
  getById,
  create,
  update,
  delete: remove,
  search,
  getTotalByDateRange,
  getTotalByVendor,
  getTotalByStall,
  getSummaryByDateRange,
};

export default revenueService;
