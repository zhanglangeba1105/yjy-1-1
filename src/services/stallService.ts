import type { Stall, StallStatus } from '../types';
import { stallStorage } from './storage';

function generateId(prefix: string = 'stall'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export interface StallCreateInput {
  code: string;
  name: string;
  zone: string;
  area: number;
  suitableCategories?: string[];
  status?: StallStatus;
}

export interface StallUpdateInput extends Partial<StallCreateInput> {
  id: string;
}

export interface StallSearchParams {
  keyword?: string;
  zone?: string;
  status?: StallStatus;
  suitableCategory?: string;
  minArea?: number;
  maxArea?: number;
}

function getAll(): Stall[] {
  return stallStorage.get();
}

function getById(id: string): Stall | undefined {
  return getAll().find((s) => s.id === id);
}

function create(input: StallCreateInput): Stall {
  const now = new Date().toISOString();
  const stall: Stall = {
    id: generateId(),
    code: input.code,
    name: input.name,
    zone: input.zone,
    area: input.area,
    suitableCategories: input.suitableCategories ?? [],
    status: input.status ?? 'available',
    createdAt: now,
  };

  stallStorage.update((prev) => [...prev, stall]);
  return stall;
}

function update(input: StallUpdateInput): Stall | undefined {
  let updated: Stall | undefined;
  stallStorage.update((prev) =>
    prev.map((s) => {
      if (s.id !== input.id) return s;
      updated = { ...s, ...input };
      return updated;
    }),
  );
  return updated;
}

function remove(id: string): boolean {
  let found = false;
  stallStorage.update((prev) => prev.filter((s) => {
    if (s.id === id) {
      found = true;
      return false;
    }
    return true;
  }));
  return found;
}

function search(params: StallSearchParams): Stall[] {
  let results = getAll();

  if (params.keyword) {
    const kw = params.keyword.toLowerCase();
    results = results.filter(
      (s) =>
        s.code.toLowerCase().includes(kw) ||
        s.name.toLowerCase().includes(kw) ||
        s.zone.toLowerCase().includes(kw),
    );
  }

  if (params.zone) {
    results = results.filter((s) => s.zone === params.zone);
  }

  if (params.status) {
    results = results.filter((s) => s.status === params.status);
  }

  if (params.suitableCategory) {
    results = results.filter((s) => s.suitableCategories.includes(params.suitableCategory!));
  }

  if (params.minArea !== undefined) {
    results = results.filter((s) => s.area >= params.minArea!);
  }

  if (params.maxArea !== undefined) {
    results = results.filter((s) => s.area <= params.maxArea!);
  }

  return results;
}

function getAllZones(): string[] {
  const zones = new Set(getAll().map((s) => s.zone));
  return Array.from(zones).sort();
}

export const stallService = {
  getAll,
  getById,
  create,
  update,
  delete: remove,
  search,
  getAllZones,
};

export default stallService;
