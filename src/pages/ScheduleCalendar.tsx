import { useState, useMemo, useEffect, useCallback } from 'react';
import { useAppStore } from '@/store';
import {
  Card,
  CardContent,
  Button,
  Input,
  Select,
  Textarea,
  Modal,
  Badge,
  Empty,
} from '@/components/ui';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  Users,
  Grid3X3,
  Edit2,
  Trash2,
  XCircle,
  AlertTriangle,
  CheckCircle,
  Lock,
  Clock,
  Filter,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { TIME_SLOTS, type Schedule, type Stall, type Vendor, type Conflict } from '@/types';
import { checkScheduleConflict } from '@/services/conflictService';
import { cn } from '@/lib/utils';

const WEEK_DAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

const DOT_COLORS = [
  'bg-primary',
  'bg-neon-green',
  'bg-neon-pink',
  'bg-info',
  'bg-warning',
  'bg-purple-400',
];

const STATUS_VARIANTS: Record<'confirmed' | 'cancelled', 'success' | 'danger'> = {
  confirmed: 'success',
  cancelled: 'danger',
};

const STATUS_LABELS: Record<'confirmed' | 'cancelled', string> = {
  confirmed: '已确认',
  cancelled: '已取消',
};

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getMonthMatrix(year: number, month: number): Array<Array<Date | null>> {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startWeekday = firstDay.getDay();
  const totalDays = lastDay.getDate();

  const weeks: Array<Array<Date | null>> = [];
  let currentWeek: Array<Date | null> = [];

  for (let i = 0; i < startWeekday; i++) {
    currentWeek.push(null);
  }

  for (let day = 1; day <= totalDays; day++) {
    currentWeek.push(new Date(year, month, day));
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }

  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push(null);
    }
    weeks.push(currentWeek);
  }

  return weeks;
}

export default function ScheduleCalendar() {
  const {
    vendors,
    stalls,
    schedules,
    conflicts,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    cancelSchedule,
    addToast,
  } = useAppStore();

  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string>(formatDate(today));

  const [vendorFilter, setVendorFilter] = useState('all');
  const [stallFilter, setStallFilter] = useState('all');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);

  const [formVendorId, setFormVendorId] = useState('');
  const [formStallId, setFormStallId] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formTimeSlot, setFormTimeSlot] = useState('');
  const [formNote, setFormNote] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [detectedConflicts, setDetectedConflicts] = useState<Conflict[]>([]);

  const [expandedTimeSlots, setExpandedTimeSlots] = useState<Set<string>>(new Set());
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const longPressTimer = useState<ReturnType<typeof setTimeout> | null>(null);

  const vendorMap = useMemo(
    () => new Map(vendors.map((v) => [v.id, v])),
    [vendors]
  );
  const stallMap = useMemo(
    () => new Map(stalls.map((s) => [s.id, s])),
    [stalls]
  );

  const monthTitle = `${currentYear}年${currentMonth + 1}月`;
  const monthMatrix = useMemo(
    () => getMonthMatrix(currentYear, currentMonth),
    [currentYear, currentMonth]
  );

  const todayStr = formatDate(today);

  const conflictScheduleIds = useMemo(() => {
    const set = new Set<string>();
    conflicts.forEach((c) => c.scheduleIds.forEach((id) => set.add(id)));
    return set;
  }, [conflicts]);

  const schedulesByDate = useMemo(() => {
    const map = new Map<string, Schedule[]>();
    for (const s of schedules) {
      if (vendorFilter !== 'all' && s.vendorId !== vendorFilter) continue;
      if (stallFilter !== 'all' && s.stallId !== stallFilter) continue;
      if (!map.has(s.date)) map.set(s.date, []);
      map.get(s.date)!.push(s);
    }
    return map;
  }, [schedules, vendorFilter, stallFilter]);

  const selectedDateSchedules = useMemo(() => {
    const list = schedulesByDate.get(selectedDate) || [];
    return [...list].sort((a, b) => a.timeSlot.localeCompare(b.timeSlot));
  }, [schedulesByDate, selectedDate]);

  const schedulesGroupedByTimeSlot = useMemo(() => {
    const groups = new Map<string, Schedule[]>();
    for (const s of selectedDateSchedules) {
      if (!groups.has(s.timeSlot)) groups.set(s.timeSlot, []);
      groups.get(s.timeSlot)!.push(s);
    }
    return groups;
  }, [selectedDateSchedules]);

  const runConflictCheck = useCallback(
    (params: { vendorId: string; stallId: string; date: string; timeSlot: string; excludeId?: string }) => {
      if (!params.vendorId || !params.stallId || !params.date || !params.timeSlot) {
        setDetectedConflicts([]);
        return;
      }
      const tempSchedule: Schedule = {
        id: params.excludeId || `temp_${Date.now()}`,
        vendorId: params.vendorId,
        stallId: params.stallId,
        date: params.date,
        timeSlot: params.timeSlot,
        status: 'confirmed',
        note: formNote,
        createdAt: '',
        updatedAt: '',
      };
      const result = checkScheduleConflict(
        tempSchedule,
        schedules,
        vendors,
        stalls,
        params.excludeId
      );
      setDetectedConflicts(result);
    },
    [schedules, vendors, stalls, formNote]
  );

  useEffect(() => {
    runConflictCheck({
      vendorId: formVendorId,
      stallId: formStallId,
      date: formDate,
      timeSlot: formTimeSlot,
      excludeId: editingSchedule?.id,
    });
  }, [formVendorId, formStallId, formDate, formTimeSlot, editingSchedule, runConflictCheck]);

  useEffect(() => {
    const firstSlot = Array.from(schedulesGroupedByTimeSlot.keys())[0];
    if (firstSlot) {
      setExpandedTimeSlots((prev) => {
        const next = new Set(prev);
        next.add(firstSlot);
        return next;
      });
    }
  }, [selectedDate, schedulesGroupedByTimeSlot]);

  const goPrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentYear((y) => y - 1);
      setCurrentMonth(11);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const goNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentYear((y) => y + 1);
      setCurrentMonth(0);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const openCreateModal = (date?: string) => {
    setEditingSchedule(null);
    setFormVendorId('');
    setFormStallId('');
    setFormDate(date || selectedDate);
    setFormTimeSlot('');
    setFormNote('');
    setFormErrors({});
    setDetectedConflicts([]);
    setModalOpen(true);
  };

  const openEditModal = (schedule: Schedule) => {
    setEditingSchedule(schedule);
    setFormVendorId(schedule.vendorId);
    setFormStallId(schedule.stallId);
    setFormDate(schedule.date);
    setFormTimeSlot(schedule.timeSlot);
    setFormNote(schedule.note || '');
    setFormErrors({});
    setModalOpen(true);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formVendorId) errors.vendorId = '请选择摊主';
    if (!formStallId) errors.stallId = '请选择摊位';
    if (!formDate) errors.date = '请选择日期';
    if (!formTimeSlot) errors.timeSlot = '请选择时间段';
    if (detectedConflicts.length > 0) {
      errors.conflict = '存在冲突，无法提交';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    const vendor = vendorMap.get(formVendorId);
    const stall = stallMap.get(formStallId);

    if (editingSchedule) {
      updateSchedule(editingSchedule.id, {
        vendorId: formVendorId,
        stallId: formStallId,
        date: formDate,
        timeSlot: formTimeSlot,
        note: formNote,
      });
      addToast('success', `排班已更新：${vendor?.name || ''} - ${stall?.code || ''}`);
    } else {
      createSchedule({
        vendorId: formVendorId,
        stallId: formStallId,
        date: formDate,
        timeSlot: formTimeSlot,
        status: 'confirmed',
        note: formNote,
      });
      addToast('success', `排班已创建：${vendor?.name || ''} - ${stall?.code || ''}`);
    }
    setModalOpen(false);
  };

  const handleCancelSchedule = (id: string) => {
    const result = cancelSchedule(id);
    if (result) {
      addToast('warning', '排班已取消');
    }
  };

  const handleDeleteSchedule = (id: string) => {
    deleteSchedule(id);
    addToast('success', '排班已删除');
    setDeleteConfirmId(null);
  };

  const toggleTimeSlot = (slot: string) => {
    setExpandedTimeSlots((prev) => {
      const next = new Set(prev);
      if (next.has(slot)) {
        next.delete(slot);
      } else {
        next.add(slot);
      }
      return next;
    });
  };

  const handleCellMouseDown = (date: Date) => {
    if (longPressTimer[0]) clearTimeout(longPressTimer[0]);
    longPressTimer[0] = setTimeout(() => {
      openCreateModal(formatDate(date));
    }, 500);
  };

  const handleCellMouseUp = () => {
    if (longPressTimer[0]) {
      clearTimeout(longPressTimer[0]);
      longPressTimer[0] = null;
    }
  };

  const handleCellContextMenu = (e: React.MouseEvent, date: Date) => {
    e.preventDefault();
    openCreateModal(formatDate(date));
  };

  const selectedDateObj = new Date(selectedDate + 'T00:00:00');
  const selectedWeekDay = WEEK_DAYS[selectedDateObj.getDay()];

  const getSchedulesForDate = (date: Date | null): Schedule[] => {
    if (!date) return [];
    return schedulesByDate.get(formatDate(date)) || [];
  };

  const hasConflictForDate = (date: Date | null): boolean => {
    const list = getSchedulesForDate(date);
    return list.some((s) => conflictScheduleIds.has(s.id));
  };

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                <CalendarIcon className="w-7 h-7 text-primary" />
                排班管理
              </h1>
              <p className="text-sm text-gray-400 mt-1">
                管理夜市摊主排班安排，实时检测冲突
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto items-stretch">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500 shrink-0" />
                <Select
                  value={vendorFilter}
                  onChange={(e) => setVendorFilter(e.target.value)}
                  options={[
                    { value: 'all', label: '全部摊主' },
                    ...vendors.map((v) => ({ value: v.id, label: v.name })),
                  ]}
                  containerClassName="sm:w-36"
                />
                <Select
                  value={stallFilter}
                  onChange={(e) => setStallFilter(e.target.value)}
                  options={[
                    { value: 'all', label: '全部摊位' },
                    ...stalls.map((s) => ({ value: s.id, label: s.code })),
                  ]}
                  containerClassName="sm:w-32"
                />
              </div>
              <Button onClick={() => openCreateModal()} className="whitespace-nowrap">
                <Plus className="w-4 h-4" />
                申请新排班
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 lg:w-2/3 space-y-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" onClick={goPrevMonth}>
                    <ChevronLeft className="w-5 h-5" />
                  </Button>
                  <h2 className="text-xl font-bold text-white min-w-[140px] text-center">
                    {monthTitle}
                  </h2>
                  <Button variant="outline" size="icon" onClick={goNextMonth}>
                    <ChevronRight className="w-5 h-5" />
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="primary" size="sm" dot>
                    有排班
                  </Badge>
                  <Badge variant="danger" size="sm" dot>
                    有冲突
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-2 mb-2">
                {WEEK_DAYS.map((d) => (
                  <div
                    key={d}
                    className="text-center text-xs font-medium text-gray-400 py-2"
                  >
                    {d}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-2">
                {monthMatrix.flat().map((date, idx) => {
                  const isCurrentMonth =
                    date && date.getMonth() === currentMonth && date.getFullYear() === currentYear;
                  const isToday = date && formatDate(date) === todayStr;
                  const isSelected = date && formatDate(date) === selectedDate;
                  const daySchedules = getSchedulesForDate(date);
                  const hasConflict = hasConflictForDate(date);

                  const stallIds = Array.from(new Set(daySchedules.map((s) => s.stallId))).slice(0, 3);

                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={!date}
                      onClick={() => date && setSelectedDate(formatDate(date))}
                      onMouseDown={() => date && handleCellMouseDown(date)}
                      onMouseUp={handleCellMouseUp}
                      onMouseLeave={handleCellMouseUp}
                      onContextMenu={(e) => date && handleCellContextMenu(e, date)}
                      onTouchStart={() => date && handleCellMouseDown(date)}
                      onTouchEnd={handleCellMouseUp}
                      className={cn(
                        'relative aspect-square min-h-[72px] rounded-xl p-2 flex flex-col items-center justify-start',
                        'transition-all duration-200 ease-out',
                        date && 'cursor-pointer',
                        !date && 'opacity-0 pointer-events-none',
                        !isSelected && date && 'hover:shadow-lg hover:shadow-primary/10 hover:border-primary/40',
                        isSelected
                          ? 'bg-primary text-white shadow-lg shadow-primary/30'
                          : isCurrentMonth
                          ? 'bg-dark-card border border-dark-border'
                          : 'bg-dark-bg/50 border border-dark-border/50 opacity-40',
                        isToday && !isSelected && 'border-2 border-primary/80',
                        hasConflict && !isSelected && 'animate-pulse-border'
                      )}
                    >
                      <span
                        className={cn(
                          'text-sm font-semibold',
                          isSelected ? 'text-white' : isCurrentMonth ? 'text-white' : 'text-gray-500'
                        )}
                      >
                        {date?.getDate()}
                      </span>

                      {daySchedules.length > 0 && (
                        <div className="flex gap-1 mt-1 flex-wrap justify-center">
                          {hasConflict ? (
                            <span className="w-2 h-2 rounded-full bg-danger shadow-[0_0_6px_rgba(229,57,53,0.8)] animate-pulse" />
                          ) : (
                            stallIds.map((sid, i) => (
                              <span
                                key={sid}
                                className={cn(
                                  'w-2 h-2 rounded-full shadow-[0_0_4px_currentColor]',
                                  DOT_COLORS[i % DOT_COLORS.length]
                                )}
                              />
                            ))
                          )}
                        </div>
                      )}

                      {daySchedules.length > 3 && !hasConflict && (
                        <span
                          className={cn(
                            'absolute bottom-1 right-1 text-[9px]',
                            isSelected ? 'text-white/80' : 'text-gray-500'
                          )}
                        >
                          +{daySchedules.length - 3}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:w-1/3 space-y-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-white">
                    {selectedDate} {selectedWeekDay}
                  </h2>
                  <p className="text-sm text-gray-400 mt-0.5">
                    共 {selectedDateSchedules.length} 个排班
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => openCreateModal(selectedDate)}>
                  <Plus className="w-4 h-4" />
                  快捷申请
                </Button>
              </div>

              {selectedDateSchedules.length === 0 ? (
                <Empty
                  title="当日暂无排班"
                  description="点击上方快捷申请按钮为此日安排排班"
                  action={
                    <Button size="sm" onClick={() => openCreateModal(selectedDate)}>
                      <Plus className="w-4 h-4" />
                      申请排班
                    </Button>
                  }
                />
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                  {Array.from(schedulesGroupedByTimeSlot.entries()).map(
                    ([timeSlot, slotSchedules], groupIdx) => {
                      const isExpanded = expandedTimeSlots.has(timeSlot);
                      const slotHasConflict = slotSchedules.some((s) =>
                        conflictScheduleIds.has(s.id)
                      );
                      return (
                        <div
                          key={timeSlot}
                          className={cn(
                            'rounded-xl border overflow-hidden transition-all duration-300 animate-slide-up',
                            slotHasConflict
                              ? 'border-danger/40 bg-danger/5'
                              : 'border-dark-border bg-dark-card/50'
                          )}
                          style={{ animationDelay: `${groupIdx * 60}ms` }}
                        >
                          <button
                            type="button"
                            onClick={() => toggleTimeSlot(timeSlot)}
                            className="w-full flex items-center justify-between p-3 hover:bg-white/5 transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-primary" />
                              <span className="text-sm font-semibold text-white">
                                {timeSlot}
                              </span>
                              <Badge variant="default" size="sm">
                                {slotSchedules.length}个
                              </Badge>
                              {slotHasConflict && (
                                <Badge variant="danger" size="sm" dot>
                                  冲突
                                </Badge>
                              )}
                            </div>
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-gray-400" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-gray-400" />
                            )}
                          </button>

                          {isExpanded && (
                            <div className="px-3 pb-3 space-y-2 border-t border-dark-border/50 pt-3">
                              {slotSchedules.map((s, itemIdx) => {
                                const vendor = vendorMap.get(s.vendorId);
                                const stall = stallMap.get(s.stallId);
                                const hasConflict = conflictScheduleIds.has(s.id);
                                return (
                                  <div
                                    key={s.id}
                                    className={cn(
                                      'p-3 rounded-lg border transition-all duration-200 animate-slide-up',
                                      hasConflict
                                        ? 'border-danger/40 bg-danger/5'
                                        : 'border-dark-border bg-dark-bg'
                                    )}
                                    style={{ animationDelay: `${itemIdx * 40}ms` }}
                                  >
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                      <div className="flex items-center gap-2 flex-wrap min-w-0">
                                        <span className="px-2 py-0.5 rounded-md bg-primary/20 text-primary text-xs font-bold font-display tracking-wider">
                                          {stall?.code || '???'}
                                        </span>
                                        <span className="text-sm font-medium text-white truncate">
                                          {vendor?.name || '未知摊主'}
                                        </span>
                                        {vendor?.category && (
                                          <span className="text-xs text-gray-400">
                                            · {vendor.category}
                                          </span>
                                        )}
                                      </div>
                                      <Badge
                                        variant={STATUS_VARIANTS[s.status]}
                                        size="sm"
                                      >
                                        {STATUS_LABELS[s.status]}
                                      </Badge>
                                    </div>

                                    {hasConflict && (
                                      <div className="flex items-start gap-2 p-2 rounded-lg bg-danger/10 border border-danger/20 mb-2">
                                        <AlertTriangle className="w-4 h-4 text-danger shrink-0 mt-0.5" />
                                        <span className="text-xs text-danger leading-relaxed">
                                          该排班存在冲突，请前往冲突中心查看详情
                                        </span>
                                      </div>
                                    )}

                                    {s.note && (
                                      <p className="text-xs text-gray-400 mb-2 line-clamp-2">
                                        备注：{s.note}
                                      </p>
                                    )}

                                    <div className="flex gap-2 pt-1 border-t border-dark-border/30">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => openEditModal(s)}
                                        className="flex-1 text-xs"
                                      >
                                        <Edit2 className="w-3 h-3" />
                                        编辑
                                      </Button>
                                      {s.status === 'confirmed' && (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleCancelSchedule(s.id)}
                                          className="flex-1 text-xs text-warning hover:text-warning hover:bg-warning/10 hover:border-warning/30 border border-transparent"
                                        >
                                          <XCircle className="w-3 h-3" />
                                          取消
                                        </Button>
                                      )}
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setDeleteConfirmId(s.id)}
                                        className="flex-1 text-xs text-danger hover:text-danger hover:bg-danger/10 hover:border-danger/30 border border-transparent"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                        删除
                                      </Button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    }
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingSchedule ? '编辑排班' : '申请新排班'}
        description={
          editingSchedule ? '修改排班信息，系统将重新检测冲突' : '填写排班信息，系统将实时检测冲突'
        }
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              取消
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={detectedConflicts.length > 0}
            >
              {editingSchedule ? '保存修改' : '确认申请'}
            </Button>
          </>
        }
      >
        <div className="space-y-4 pb-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="摊主 *"
              value={formVendorId}
              onChange={(e) => setFormVendorId(e.target.value)}
              options={vendors.map((v) => ({
                value: v.id,
                label: `${v.name}${v.category ? ` (${v.category})` : ''}`,
                disabled: v.status === 'disabled',
              }))}
              placeholder="选择摊主..."
              error={formErrors.vendorId}
            />
            <Select
              label="摊位 *"
              value={formStallId}
              onChange={(e) => setFormStallId(e.target.value)}
              options={stalls.map((s) => ({
                value: s.id,
                label: `${s.code} - ${s.zone}`,
                disabled: s.status !== 'available',
              }))}
              placeholder="选择摊位..."
              error={formErrors.stallId}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="日期 *"
              type="date"
              value={formDate}
              onChange={(e) => setFormDate(e.target.value)}
              error={formErrors.date}
            />
            <Select
              label="时间段 *"
              value={formTimeSlot}
              onChange={(e) => setFormTimeSlot(e.target.value)}
              options={TIME_SLOTS.map((t) => ({ value: t, label: t }))}
              placeholder="选择时间段..."
              error={formErrors.timeSlot}
            />
          </div>

          {formVendorId &&
            (() => {
              const v = vendorMap.get(formVendorId);
              if (v?.status === 'disabled') {
                return (
                  <div className="flex items-start gap-2 p-3 rounded-xl bg-danger/10 border border-danger/30">
                    <Lock className="w-4 h-4 text-danger shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-medium text-danger">该摊主已被禁用</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        请先在摊主管理中启用此摊主
                      </p>
                    </div>
                  </div>
                );
              }
              if (v && v.unavailableDates.includes(formDate)) {
                return (
                  <div className="flex items-start gap-2 p-3 rounded-xl bg-warning/10 border border-warning/30">
                    <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-medium text-warning">该摊主此日不可用</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {v.name} 在 {formDate} 标记为不可用日期
                      </p>
                    </div>
                  </div>
                );
              }
              return null;
            })()}

          {formStallId &&
            (() => {
              const s = stallMap.get(formStallId);
              if (s && s.status !== 'available') {
                return (
                  <div className="flex items-start gap-2 p-3 rounded-xl bg-danger/10 border border-danger/30">
                    <Lock className="w-4 h-4 text-danger shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-medium text-danger">该摊位当前不可用</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        摊位 {s.code} 状态为：
                        {s.status === 'maintenance' ? '维修中' : '已停用'}
                      </p>
                    </div>
                  </div>
                );
              }
              return null;
            })()}

          <Textarea
            label="备注"
            value={formNote}
            onChange={(e) => setFormNote(e.target.value)}
            placeholder="可选：填写排班备注信息..."
            rows={3}
          />

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300 leading-none block">
              冲突检测结果
            </label>
            {detectedConflicts.length > 0 ? (
              <div className="p-4 rounded-xl bg-danger/10 border border-danger/30 space-y-2 animate-pulse-border">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="w-5 h-5 text-danger" />
                  <span className="text-sm font-semibold text-danger">
                    检测到 {detectedConflicts.length} 个冲突
                  </span>
                </div>
                <ul className="space-y-1">
                  {detectedConflicts.map((c) => (
                    <li
                      key={c.id}
                      className="text-xs text-danger/90 flex items-start gap-2 leading-relaxed"
                    >
                      <span className="mt-1.5 w-1 h-1 rounded-full bg-danger shrink-0" />
                      <span>{c.message}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-gray-400 pt-1 border-t border-danger/20 mt-2">
                  请调整排班信息以解决冲突
                </p>
              </div>
            ) : formVendorId && formStallId && formDate && formTimeSlot ? (
              <div className="p-4 rounded-xl bg-success/10 border border-success/30">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-success" />
                  <span className="text-sm font-semibold text-success">
                    ✓ 无冲突，可以安排
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-dark-bg border border-dark-border">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span className="text-xs text-gray-400">
                    填写完整信息后将自动进行冲突检测
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </Modal>

      <Modal
        open={deleteConfirmId !== null}
        onClose={() => setDeleteConfirmId(null)}
        title="确认删除排班"
        description="此操作不可撤销"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteConfirmId(null)}>
              取消
            </Button>
            <Button
              variant="danger"
              onClick={() => deleteConfirmId && handleDeleteSchedule(deleteConfirmId)}
            >
              确认删除
            </Button>
          </>
        }
      >
        <div className="flex items-start gap-3 py-2">
          <div className="p-2 rounded-xl bg-danger/15 text-danger shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-white font-medium mb-1">
              确定要删除这个排班吗？
            </p>
            {(() => {
              const s = schedules.find((x) => x.id === deleteConfirmId);
              if (!s) return null;
              const v = vendorMap.get(s.vendorId);
              const st = stallMap.get(s.stallId);
              return (
                <p className="text-xs text-gray-400 leading-relaxed">
                  {s.date} {s.timeSlot}
                  <br />
                  {v?.name || '未知摊主'} @ {st?.code || '未知摊位'}
                </p>
              );
            })()}
          </div>
        </div>
      </Modal>
    </div>
  );
}
