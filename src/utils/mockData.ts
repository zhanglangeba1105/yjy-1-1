import { format, addDays, subDays } from 'date-fns';
import type { Vendor, Stall, Schedule, Revenue } from '../types';
import { TIME_SLOTS } from '../types';
import { vendorService } from '../services/vendorService';
import { stallService } from '../services/stallService';
import { scheduleService } from '../services/scheduleService';
import { revenueService } from '../services/revenueService';

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

const today = new Date();
const fmt = (d: Date) => format(d, 'yyyy-MM-dd');

const VENDOR_INFO = [
  { name: '张记烧烤', phone: '13800000001', category: '烧烤' },
  { name: '李阿姨麻辣烫', phone: '13800000002', category: '麻辣烫' },
  { name: '老王奶茶', phone: '13800000003', category: '奶茶' },
  { name: '陈家小火锅', phone: '13800000004', category: '小火锅' },
  { name: '刘氏炸串', phone: '13800000005', category: '炸串' },
  { name: '苏姐凉皮', phone: '13800000006', category: '凉皮' },
  { name: '赵师傅臭豆腐', phone: '13800000007', category: '臭豆腐' },
  { name: '孙家糖葫芦', phone: '13800000008', category: '糖葫芦' },
  { name: '周记手抓饼', phone: '13800000009', category: '手抓饼' },
  { name: '吴家烤冷面', phone: '13800000010', category: '烤冷面' },
];

const STALL_CODES = ['A01', 'A02', 'A03', 'A04', 'A05', 'A06', 'A07', 'A08', 'B01', 'B02', 'B03', 'B04', 'B05', 'C01', 'C02'];
const ZONE_MAP: Record<string, string> = {
  A01: 'A区', A02: 'A区', A03: 'A区', A04: 'A区', A05: 'A区', A06: 'A区', A07: 'A区', A08: 'A区',
  B01: 'B区', B02: 'B区', B03: 'B区', B04: 'B区', B05: 'B区',
  C01: 'C区', C02: 'C区',
};
const SUITABLE_CATEGORIES: Record<string, string[]> = {
  A01: ['烧烤', '炸串'],
  A02: ['麻辣烫', '小火锅'],
  A03: ['奶茶', '糖葫芦'],
  A04: ['凉皮', '臭豆腐'],
  A05: ['手抓饼', '烤冷面'],
  A06: ['烧烤', '炸串', '臭豆腐'],
  A07: ['麻辣烫', '奶茶', '凉皮'],
  A08: ['小火锅', '炸串', '手抓饼'],
  B01: ['烧烤', '麻辣烫'],
  B02: ['奶茶', '小火锅'],
  B03: ['炸串', '凉皮', '烤冷面'],
  B04: ['臭豆腐', '糖葫芦', '手抓饼'],
  B05: ['烧烤', '奶茶', '炸串'],
  C01: ['麻辣烫', '凉皮', '臭豆腐'],
  C02: ['烧烤', '小火锅'],
};
const AREAS: Record<string, number> = {
  A01: 12, A02: 10, A03: 8, A04: 9, A05: 11, A06: 15, A07: 10, A08: 13,
  B01: 9, B02: 7, B03: 8, B04: 6, B05: 12,
  C01: 10, C02: 9,
};

function generateMockVendors(): Vendor[] {
  const vendors: Vendor[] = [];
  const tomorrow = fmt(addDays(today, 1));
  const dayAfterTomorrow = fmt(addDays(today, 2));

  VENDOR_INFO.forEach((info, index) => {
    const vendor: Vendor = {
      id: generateId('vendor'),
      name: info.name,
      phone: info.phone,
      category: info.category,
      avatar: '',
      status: 'normal',
      unavailableDates: [],
      createdAt: new Date().toISOString(),
    };

    if (info.name === '张记烧烤') {
      vendor.unavailableDates = [tomorrow];
    } else if (info.name === '李阿姨麻辣烫') {
      vendor.unavailableDates = [dayAfterTomorrow];
    } else if (info.name === '苏姐凉皮') {
      vendor.status = 'leave';
    } else if (info.name === '吴家烤冷面') {
      vendor.status = 'disabled';
    }

    vendors.push(vendor);
  });

  return vendors;
}

function generateMockStalls(): Stall[] {
  const stalls: Stall[] = [];

  STALL_CODES.forEach((code) => {
    const stall: Stall = {
      id: generateId('stall'),
      code: code,
      name: `${ZONE_MAP[code]}${code}号摊位`,
      zone: ZONE_MAP[code],
      area: AREAS[code],
      suitableCategories: SUITABLE_CATEGORIES[code],
      status: 'available',
      createdAt: new Date().toISOString(),
    };

    if (code === 'A05') {
      stall.status = 'maintenance';
    } else if (code === 'C02') {
      stall.status = 'disabled';
    }

    stalls.push(stall);
  });

  return stalls;
}

function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateMockSchedules(vendors: Vendor[], stalls: Stall[]): Schedule[] {
  const schedules: Schedule[] = [];
  const now = new Date().toISOString();

  const dates: string[] = [];
  for (let i = 3; i >= 1; i--) {
    dates.push(fmt(subDays(today, i)));
  }
  dates.push(fmt(today));
  for (let i = 1; i <= 4; i++) {
    dates.push(fmt(addDays(today, i)));
  }

  const normalVendors = vendors.filter((v) => v.status === 'normal');
  const availableStalls = stalls.filter((s) => s.status === 'available');

  const vendorMap = new Map(vendors.map((v) => [v.name, v]));
  const stallMap = new Map(stalls.map((s) => [s.code, s]));

  const zhangji = vendorMap.get('张记烧烤')!;
  const liayi = vendorMap.get('李阿姨麻辣烫')!;
  const chenjia = vendorMap.get('陈家小火锅')!;
  const wujia = vendorMap.get('吴家烤冷面')!;

  const a01 = stallMap.get('A01')!;
  const a02 = stallMap.get('A02')!;
  const b01 = stallMap.get('B01')!;
  const c02 = stallMap.get('C02')!;

  const todayStr = fmt(today);
  const tomorrow = fmt(addDays(today, 1));
  const day2 = fmt(addDays(today, 2));

  schedules.push({
    id: generateId('schedule'),
    vendorId: zhangji.id,
    stallId: a01.id,
    date: todayStr,
    timeSlot: '18:00-20:00',
    status: 'confirmed',
    createdAt: now,
    updatedAt: now,
  });

  schedules.push({
    id: generateId('schedule'),
    vendorId: chenjia.id,
    stallId: a01.id,
    date: todayStr,
    timeSlot: '18:00-20:00',
    status: 'confirmed',
    createdAt: now,
    updatedAt: now,
  });

  schedules.push({
    id: generateId('schedule'),
    vendorId: liayi.id,
    stallId: a02.id,
    date: todayStr,
    timeSlot: '19:00-21:00',
    status: 'confirmed',
    createdAt: now,
    updatedAt: now,
  });

  schedules.push({
    id: generateId('schedule'),
    vendorId: liayi.id,
    stallId: b01.id,
    date: todayStr,
    timeSlot: '19:00-21:00',
    status: 'confirmed',
    createdAt: now,
    updatedAt: now,
  });

  schedules.push({
    id: generateId('schedule'),
    vendorId: zhangji.id,
    stallId: a01.id,
    date: tomorrow,
    timeSlot: '17:00-19:00',
    status: 'confirmed',
    createdAt: now,
    updatedAt: now,
  });

  schedules.push({
    id: generateId('schedule'),
    vendorId: wujia.id,
    stallId: b01.id,
    date: day2,
    timeSlot: '20:00-22:00',
    status: 'confirmed',
    createdAt: now,
    updatedAt: now,
  });

  schedules.push({
    id: generateId('schedule'),
    vendorId: zhangji.id,
    stallId: c02.id,
    date: fmt(addDays(today, 3)),
    timeSlot: '18:00-20:00',
    status: 'confirmed',
    createdAt: now,
    updatedAt: now,
  });

  let cancelledCount = 0;
  for (const date of dates) {
    const count = 3 + Math.floor(Math.random() * 4);
    const usedKeys = new Set<string>();

    for (let i = 0; i < count; i++) {
      const vendor = randomPick(normalVendors);
      const stall = randomPick(availableStalls);
      const timeSlot = randomPick(Array.from(TIME_SLOTS));
      const key = `${date}_${stall.id}_${timeSlot}_${vendor.id}`;

      if (usedKeys.has(key)) continue;
      usedKeys.add(key);

      const isConflictSlot =
        (date === todayStr && stall.id === a01.id && timeSlot === '18:00-20:00') ||
        (date === todayStr && vendor.id === liayi.id && timeSlot === '19:00-21:00') ||
        (date === tomorrow && vendor.id === zhangji.id) ||
        (date === day2 && vendor.id === wujia.id) ||
        (date === fmt(addDays(today, 3)) && stall.id === c02.id);

      if (isConflictSlot) continue;

      let status: Schedule['status'] = 'confirmed';
      if (cancelledCount < 2 && Math.random() < 0.1) {
        status = 'cancelled';
        cancelledCount++;
      }

      schedules.push({
        id: generateId('schedule'),
        vendorId: vendor.id,
        stallId: stall.id,
        date: date,
        timeSlot: timeSlot,
        status: status,
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  return schedules;
}

function generateMockRevenues(schedules: Schedule[]): Revenue[] {
  const revenues: Revenue[] = [];
  const now = new Date().toISOString();

  const dateRange: string[] = [];
  for (let i = 6; i >= 0; i--) {
    dateRange.push(fmt(subDays(today, i)));
  }

  const schedulesInRange = schedules.filter((s) => dateRange.includes(s.date) && s.status === 'confirmed');

  for (const schedule of schedulesInRange) {
    if (Math.random() < 0.5) {
      const amount = 300 + Math.floor(Math.random() * 2701);
      revenues.push({
        id: generateId('revenue'),
        scheduleId: schedule.id,
        vendorId: schedule.vendorId,
        stallId: schedule.stallId,
        date: schedule.date,
        amount: amount,
        createdAt: now,
      });
    }
  }

  return revenues;
}

export interface MockDataSet {
  vendors: Vendor[];
  stalls: Stall[];
  schedules: Schedule[];
  revenues: Revenue[];
}

export function generateAllMockData(): MockDataSet {
  const vendors = generateMockVendors();
  const stalls = generateMockStalls();
  const schedules = generateMockSchedules(vendors, stalls);
  const revenues = generateMockRevenues(schedules);
  return { vendors, stalls, schedules, revenues };
}

export function initializeMockData(): MockDataSet {
  const { vendors, stalls, schedules, revenues } = generateAllMockData();

  for (const v of vendors) {
    vendorService.create({
      name: v.name,
      phone: v.phone,
      category: v.category,
      avatar: v.avatar,
      status: v.status,
      unavailableDates: v.unavailableDates,
    });
  }

  const createdVendors = vendorService.getAll();

  for (const s of stalls) {
    stallService.create({
      code: s.code,
      name: s.name,
      zone: s.zone,
      area: s.area,
      suitableCategories: s.suitableCategories,
      status: s.status,
    });
  }

  const createdStalls = stallService.getAll();

  const vendorIdMap = new Map<string, string>();
  vendors.forEach((v, i) => {
    vendorIdMap.set(v.id, createdVendors[i].id);
  });

  const stallIdMap = new Map<string, string>();
  stalls.forEach((s, i) => {
    stallIdMap.set(s.id, createdStalls[i].id);
  });

  for (const sch of schedules) {
    scheduleService.create({
      vendorId: vendorIdMap.get(sch.vendorId) ?? sch.vendorId,
      stallId: stallIdMap.get(sch.stallId) ?? sch.stallId,
      date: sch.date,
      timeSlot: sch.timeSlot,
      status: sch.status,
      note: sch.note,
    });
  }

  const createdSchedules = scheduleService.getAll();
  const scheduleIdxMap = new Map<string, number>();
  schedules.forEach((s, i) => {
    scheduleIdxMap.set(s.id, i);
  });

  for (const rev of revenues) {
    const originalIdx = scheduleIdxMap.get(rev.scheduleId ?? '');
    const matchedSchedule = originalIdx !== undefined ? createdSchedules[originalIdx] : undefined;

    revenueService.create({
      scheduleId: matchedSchedule?.id,
      vendorId: vendorIdMap.get(rev.vendorId) ?? rev.vendorId,
      stallId: stallIdMap.get(rev.stallId) ?? rev.stallId,
      date: rev.date,
      amount: rev.amount,
      note: rev.note,
    });
  }

  return {
    vendors: createdVendors,
    stalls: createdStalls,
    schedules: createdSchedules,
    revenues: revenueService.getAll(),
  };
}
