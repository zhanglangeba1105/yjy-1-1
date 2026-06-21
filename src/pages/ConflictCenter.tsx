import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store';
import {
  Card,
  CardHeader,
  CardContent,
  Badge,
  Button,
  Modal,
  Input,
  Select,
  Empty,
} from '@/components/ui';
import {
  AlertTriangle,
  Store,
  Users,
  CalendarOff,
  UserX,
  Ban,
  CheckCircle2,
  Calendar,
  Clock,
  Edit,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  format,
  formatISO,
  isToday,
  parseISO,
} from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type {
  Conflict,
  ConflictType,
  Schedule,
} from '@/types';
import { checkScheduleConflict } from '@/services/conflictService';

type ConflictTab = 'all' | ConflictType;

const tabConfigs: {
  key: ConflictTab;
  label: string;
  icon: typeof AlertTriangle;
}[] = [
  { key: 'all', label: '全部冲突', icon: AlertTriangle },
  { key: 'stall_conflict', label: '摊位冲突', icon: Store },
  { key: 'vendor_conflict', label: '摊主冲突', icon: Users },
  { key: 'vendor_unavailable', label: '摊主不可出摊', icon: CalendarOff },
  { key: 'vendor_disabled', label: '摊主被禁用', icon: UserX },
  { key: 'stall_disabled', label: '摊位不可用', icon: Ban },
];

const conflictTypeBadge: Record<
  ConflictType,
  { label: string; variant: 'danger' | 'warning' | 'info' | 'default' }
> = {
  stall_conflict: { label: '摊位冲突', variant: 'danger' },
  vendor_conflict: { label: '摊主冲突', variant: 'danger' },
  vendor_unavailable: { label: '不可出摊', variant: 'warning' },
  vendor_disabled: { label: '摊主禁用', variant: 'info' },
  stall_disabled: { label: '摊位禁用', variant: 'info' },
};

const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

export default function ConflictCenter() {
  const navigate = useNavigate();
  const {
    conflicts,
    vendors,
    stalls,
    schedules,
    settings,
    updateSchedule,
    cancelSchedule,
    addToast,
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<ConflictTab>('all');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [editDate, setEditDate] = useState('');
  const [editTimeSlot, setEditTimeSlot] = useState('');
  const [editStallId, setEditStallId] = useState('');
  const [editConflicts, setEditConflicts] = useState<Conflict[]>([]);

  const vendorMap = useMemo(
    () => new Map(vendors.map((v) => [v.id, v])),
    [vendors]
  );
  const stallMap = useMemo(
    () => new Map(stalls.map((s) => [s.id, s])),
    [stalls]
  );
  const scheduleMap = useMemo(
    () => new Map(schedules.map((s) => [s.id, s])),
    [schedules]
  );

  const today = formatISO(new Date(), { representation: 'date' });

  const stats = useMemo(() => {
    const todayCount = conflicts.filter((c) => isToday(parseISO(c.date))).length;
    return {
      total: conflicts.length,
      today: todayCount,
      resolved: 0,
    };
  }, [conflicts]);

  const filteredConflicts = useMemo(() => {
    const list = activeTab === 'all'
      ? conflicts
      : conflicts.filter((c) => c.type === activeTab);
    return [...list].sort((a, b) => b.date.localeCompare(a.date));
  }, [conflicts, activeTab]);

  const tabCounts = useMemo(() => {
    const counts: Record<ConflictTab, number> = {
      all: conflicts.length,
      stall_conflict: 0,
      vendor_conflict: 0,
      vendor_unavailable: 0,
      vendor_disabled: 0,
      stall_disabled: 0,
    };
    for (const c of conflicts) {
      counts[c.type] = (counts[c.type] || 0) + 1;
    }
    return counts;
  }, [conflicts]);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleEditSchedule = (schedule: Schedule) => {
    setEditingSchedule(schedule);
    setEditDate(schedule.date);
    setEditTimeSlot(schedule.timeSlot);
    setEditStallId(schedule.stallId);
    setEditConflicts([]);
  };

  const handleSaveEdit = () => {
    if (!editingSchedule) return;
    const tempSchedule: Schedule = {
      ...editingSchedule,
      date: editDate,
      timeSlot: editTimeSlot,
      stallId: editStallId,
    };
    const detected = checkScheduleConflict(
      tempSchedule,
      schedules,
      vendors,
      stalls,
      editingSchedule.id
    );
    if (detected.length > 0) {
      setEditConflicts(detected);
      addToast('warning', '编辑后仍存在冲突，请调整后再保存');
      return;
    }
    updateSchedule(editingSchedule.id, {
      date: editDate,
      timeSlot: editTimeSlot,
      stallId: editStallId,
    });
    addToast('success', '排班更新成功');
    setEditingSchedule(null);
  };

  const handleCancelSchedule = (id: string) => {
    cancelSchedule(id);
    addToast('success', '排班已取消');
  };

  const goToSchedule = (date?: string) => {
    if (date) {
      navigate(`/schedule?date=${date}`);
    } else {
      navigate('/schedule');
    }
  };

  const formatDate = (dateStr: string) => {
    const d = parseISO(dateStr);
    const weekDay = weekDays[d.getDay()];
    return {
      full: format(d, 'yyyy年MM月dd日', { locale: zhCN }),
      week: `星期${weekDay}`,
    };
  };

  const getScheduleInfo = (scheduleId: string) => {
    const s = scheduleMap.get(scheduleId);
    if (!s) return null;
    const v = vendorMap.get(s.vendorId);
    const st = stallMap.get(s.stallId);
    return { schedule: s, vendor: v, stall: st };
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <AlertTriangle className="w-8 h-8 text-warning" />
            冲突中心
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            自动检测并管理所有排班冲突
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="hover:scale-none before:from-danger/30 before:via-danger/20 before:to-danger/10">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">总冲突数</p>
                <p className="text-3xl font-bold text-white mt-2 font-display">
                  {stats.total}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-danger/20 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-danger" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:scale-none before:from-warning/30 before:via-warning/20 before:to-warning/10">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">今日冲突</p>
                <p className="text-3xl font-bold text-white mt-2 font-display">
                  {stats.today}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-warning/20 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:scale-none before:from-success/30 before:via-success/20 before:to-success/10">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">已解决</p>
                <p className="text-3xl font-bold text-white mt-2 font-display">
                  {stats.resolved}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-success/20 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabConfigs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'relative px-4 py-2 rounded-xl border transition-all duration-200 flex items-center gap-2',
                isActive
                  ? 'bg-primary/20 border-primary text-white shadow-[0_0_20px_rgba(255,107,53,0.3)]'
                  : 'bg-dark-card border-dark-border text-gray-400 hover:border-gray-500 hover:text-white'
              )}
            >
              <Icon className="w-4 h-4" />
              <span className="text-sm font-medium">{tab.label}</span>
              <Badge
                variant={isActive ? 'primary' : 'default'}
                size="sm"
                className="ml-1"
              >
                {tabCounts[tab.key]}
              </Badge>
            </button>
          );
        })}
      </div>

      {filteredConflicts.length === 0 ? (
        <Card className="hover:scale-none">
          <CardContent className="py-16">
            <Empty
              icon={CheckCircle2}
              title="太棒了！当前没有任何排班冲突 🎉"
              description="所有排班状态正常，继续保持！"
              action={
                <Button variant="success" onClick={() => goToSchedule()}>
                  去排班
                </Button>
              }
              iconClassName="bg-success/20 border-success/30"
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredConflicts.map((conflict) => {
            const dateInfo = formatDate(conflict.date);
            const badgeConfig = conflictTypeBadge[conflict.type];
            const isExpanded = expandedIds.has(conflict.id);

            return (
              <Card key={conflict.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3 flex-wrap">
                      <Badge
                        variant={badgeConfig.variant}
                        dot
                        size="md"
                      >
                        {badgeConfig.label}
                      </Badge>
                      <span className="text-white font-medium">
                        {dateInfo.full}
                      </span>
                      <Badge variant="default" size="sm">
                        {dateInfo.week}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => goToSchedule(conflict.date)}
                      >
                        一键去调整
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-lg text-white font-semibold">
                    {conflict.message}
                  </p>

                  <div className="space-y-3">
                    {conflict.scheduleIds.map((sid) => {
                      const info = getScheduleInfo(sid);
                      if (!info) return null;
                      const { schedule, vendor, stall } = info;

                      return (
                        <div
                          key={sid}
                          className="p-4 rounded-xl bg-dark-bg/50 border border-dark-border flex flex-col sm:flex-row sm:items-center gap-3"
                        >
                          <div className="flex-1 flex items-center gap-4 flex-wrap">
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4 text-neon-pink" />
                              <span className="text-white font-medium">
                                {vendor?.name || '未知摊主'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Store className="w-4 h-4 text-neon-green" />
                              <span className="text-gray-300">
                                {stall?.code || stall?.name || '未知摊位'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-primary" />
                              <span className="text-gray-300">
                                {schedule.timeSlot}
                              </span>
                            </div>
                            <Badge
                              variant={
                                schedule.status === 'confirmed'
                                  ? 'success'
                                  : 'default'
                              }
                              size="sm"
                            >
                              {schedule.status === 'confirmed'
                                ? '已确认'
                                : '已取消'}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditSchedule(schedule)}
                            >
                              <Edit className="w-4 h-4" />
                              编辑
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() =>
                                handleCancelSchedule(schedule.id)
                              }
                            >
                              取消排班
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {conflict.affectedIds &&
                    conflict.affectedIds.length > 0 && (
                      <button
                        onClick={() => toggleExpand(conflict.id)}
                        className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp className="w-4 h-4" />
                            收起详情
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-4 h-4" />
                            展开详情
                          </>
                        )}
                      </button>
                    )}

                  {isExpanded &&
                    conflict.affectedIds && (
                      <div className="p-4 rounded-xl bg-dark-bg/30 border border-dark-border space-y-2">
                        <p className="text-sm text-gray-400">
                          涉及的对象：
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {conflict.affectedIds.map((aid) => {
                            const v = vendorMap.get(aid);
                            const s = stallMap.get(aid);
                            const info = v || s;
                            if (!info) return null;
                            const label = v
                              ? `摊主: ${v.name}`
                              : `摊位: ${(s as any).code || (s as any).name}`;
                            return (
                              <Badge
                                key={aid}
                                variant="default"
                                size="sm"
                              >
                                {label}
                              </Badge>
                            );
                          })}
                        </div>
                      </div>
                    )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        open={!!editingSchedule}
        onClose={() => setEditingSchedule(null)}
        title="编辑排班"
        description="修改排班信息，系统会自动检测冲突"
        size="md"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setEditingSchedule(null)}
            >
              取消
            </Button>
            <Button variant="primary" onClick={handleSaveEdit}>
              保存修改
            </Button>
          </>
        }
      >
        {editingSchedule && (
          <div className="space-y-4 pb-4">
            <Input
              label="日期"
              type="date"
              value={editDate}
              onChange={(e) => setEditDate(e.target.value)}
            />
            <Select
              label="时段"
              value={editTimeSlot}
              onChange={(e) => setEditTimeSlot(e.target.value)}
              options={settings.defaultTimeSlots.map((ts) => ({
                value: ts,
                label: ts,
              }))}
            />
            <Select
              label="摊位"
              value={editStallId}
              onChange={(e) => setEditStallId(e.target.value)}
              options={stalls.map((s) => ({
                value: s.id,
                label: `${s.code} - ${s.name}`,
              }))}
            />
            {editConflicts.length > 0 && (
              <div className="p-3 rounded-xl bg-danger/10 border border-danger/30 space-y-2">
                <p className="text-sm font-medium text-danger">
                  检测到以下冲突：
                </p>
                {editConflicts.map((c) => (
                  <p key={c.id} className="text-sm text-gray-300">
                    {c.message}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
