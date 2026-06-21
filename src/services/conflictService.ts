import type { Schedule, Vendor, Stall, Conflict, ConflictType } from '../types';

export interface ParsedTimeSlot {
  startMinutes: number;
  endMinutes: number;
}

export function parseTimeSlot(slot: string): ParsedTimeSlot {
  const [startStr, endStr] = slot.split('-');
  const [startH, startM] = startStr.split(':').map(Number);
  const [endH, endM] = endStr.split(':').map(Number);
  return {
    startMinutes: startH * 60 + startM,
    endMinutes: endH * 60 + endM,
  };
}

export function timeSlotsOverlap(slotA: string, slotB: string): boolean {
  const a = parseTimeSlot(slotA);
  const b = parseTimeSlot(slotB);
  return a.startMinutes < b.endMinutes && b.startMinutes < a.endMinutes;
}

function generateId(): string {
  return `conflict_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function createConflict(
  type: ConflictType,
  message: string,
  date: string,
  scheduleIds: string[],
  affectedIds?: string[],
): Conflict {
  return {
    id: generateId(),
    type,
    message,
    date,
    scheduleIds,
    affectedIds,
  };
}

export function detectConflicts(
  schedules: Schedule[],
  vendors: Vendor[],
  stalls: Stall[],
  excludeScheduleId?: string,
): Conflict[] {
  const conflicts: Conflict[] = [];

  const vendorMap = new Map(vendors.map((v) => [v.id, v]));
  const stallMap = new Map(stalls.map((s) => [s.id, s]));

  const activeSchedules = schedules.filter(
    (s) => s.status === 'confirmed' && s.id !== excludeScheduleId,
  );

  for (const schedule of activeSchedules) {
    const vendor = vendorMap.get(schedule.vendorId);
    const stall = stallMap.get(schedule.stallId);

    if (vendor?.status === 'disabled') {
      conflicts.push(
        createConflict(
          'vendor_disabled',
          `摊贩「${vendor.name}」已被禁用，无法排班`,
          schedule.date,
          [schedule.id],
          [vendor.id],
        ),
      );
    }

    if (stall?.status === 'disabled') {
      conflicts.push(
        createConflict(
          'stall_disabled',
          `档口「${stall.name}」已被禁用，无法排班`,
          schedule.date,
          [schedule.id],
          [stall.id],
        ),
      );
    }

    if (vendor && vendor.unavailableDates.includes(schedule.date)) {
      conflicts.push(
        createConflict(
          'vendor_unavailable',
          `摊贩「${vendor.name}」在 ${schedule.date} 不可用`,
          schedule.date,
          [schedule.id],
          [vendor.id],
        ),
      );
    }
  }

  const stallDateGroups = new Map<string, Schedule[]>();
  for (const schedule of activeSchedules) {
    const key = `${schedule.stallId}_${schedule.date}`;
    if (!stallDateGroups.has(key)) {
      stallDateGroups.set(key, []);
    }
    stallDateGroups.get(key)!.push(schedule);
  }

  for (const [, group] of stallDateGroups) {
    if (group.length < 2) continue;

    const processed = new Set<string>();
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        const a = group[i];
        const b = group[j];
        if (timeSlotsOverlap(a.timeSlot, b.timeSlot)) {
          const pairKey = [a.id, b.id].sort().join('_');
          if (processed.has(pairKey)) continue;
          processed.add(pairKey);

          const stallInfo = stallMap.get(a.stallId);
          conflicts.push(
            createConflict(
              'stall_conflict',
              `档口「${stallInfo?.name ?? a.stallId}」在 ${a.date} ${a.timeSlot} 与 ${b.timeSlot} 时段冲突`,
              a.date,
              [a.id, b.id],
              [a.stallId],
            ),
          );
        }
      }
    }
  }

  const vendorDateGroups = new Map<string, Schedule[]>();
  for (const schedule of activeSchedules) {
    const key = `${schedule.vendorId}_${schedule.date}`;
    if (!vendorDateGroups.has(key)) {
      vendorDateGroups.set(key, []);
    }
    vendorDateGroups.get(key)!.push(schedule);
  }

  for (const [, group] of vendorDateGroups) {
    if (group.length < 2) continue;

    const processed = new Set<string>();
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        const a = group[i];
        const b = group[j];
        if (timeSlotsOverlap(a.timeSlot, b.timeSlot)) {
          const pairKey = [a.id, b.id].sort().join('_');
          if (processed.has(pairKey)) continue;
          processed.add(pairKey);

          const vendorInfo = vendorMap.get(a.vendorId);
          conflicts.push(
            createConflict(
              'vendor_conflict',
              `摊贩「${vendorInfo?.name ?? a.vendorId}」在 ${a.date} ${a.timeSlot} 与 ${b.timeSlot} 时段冲突`,
              a.date,
              [a.id, b.id],
              [a.vendorId],
            ),
          );
        }
      }
    }
  }

  return conflicts;
}

export function checkScheduleConflict(
  newSchedule: Schedule,
  allSchedules: Schedule[],
  vendors: Vendor[],
  stalls: Stall[],
  excludeId?: string,
): Conflict[] {
  const schedulesToCheck = [...allSchedules, newSchedule];
  return detectConflicts(schedulesToCheck, vendors, stalls, excludeId ?? newSchedule.id).filter((c) =>
    c.scheduleIds.includes(newSchedule.id),
  );
}
