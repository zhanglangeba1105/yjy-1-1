import type { Vendor, VendorStatus } from '../types';
import { vendorStorage } from './storage';

function generateId(prefix: string = 'vendor'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export interface VendorCreateInput {
  name: string;
  phone: string;
  category: string;
  avatar?: string;
  status?: VendorStatus;
  unavailableDates?: string[];
}

export interface VendorUpdateInput extends Partial<VendorCreateInput> {
  id: string;
}

export interface VendorSearchParams {
  keyword?: string;
  category?: string;
  status?: VendorStatus;
}

function getAll(): Vendor[] {
  return vendorStorage.get();
}

function getById(id: string): Vendor | undefined {
  return getAll().find((v) => v.id === id);
}

function create(input: VendorCreateInput): Vendor {
  const now = new Date().toISOString();
  const vendor: Vendor = {
    id: generateId(),
    name: input.name,
    phone: input.phone,
    category: input.category,
    avatar: input.avatar ?? '',
    status: input.status ?? 'normal',
    unavailableDates: input.unavailableDates ?? [],
    createdAt: now,
  };

  vendorStorage.update((prev) => [...prev, vendor]);
  return vendor;
}

function update(input: VendorUpdateInput): Vendor | undefined {
  let updated: Vendor | undefined;
  vendorStorage.update((prev) =>
    prev.map((v) => {
      if (v.id !== input.id) return v;
      updated = { ...v, ...input };
      return updated;
    }),
  );
  return updated;
}

function remove(id: string): boolean {
  let found = false;
  vendorStorage.update((prev) => prev.filter((v) => {
    if (v.id === id) {
      found = true;
      return false;
    }
    return true;
  }));
  return found;
}

function search(params: VendorSearchParams): Vendor[] {
  let results = getAll();

  if (params.keyword) {
    const kw = params.keyword.toLowerCase();
    results = results.filter(
      (v) =>
        v.name.toLowerCase().includes(kw) ||
        v.phone.toLowerCase().includes(kw) ||
        v.category.toLowerCase().includes(kw),
    );
  }

  if (params.category) {
    results = results.filter((v) => v.category === params.category);
  }

  if (params.status) {
    results = results.filter((v) => v.status === params.status);
  }

  return results;
}

function getAllCategories(): string[] {
  const categories = new Set(getAll().map((v) => v.category));
  return Array.from(categories).sort();
}

export const vendorService = {
  getAll,
  getById,
  create,
  update,
  delete: remove,
  search,
  getAllCategories,
};

export default vendorService;
