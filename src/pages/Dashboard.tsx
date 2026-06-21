import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Users,
  Coins,
  AlertTriangle,
  ChevronRight,
  UserPlus,
  MapPin,
  ClipboardList,
  DollarSign,
} from 'lucide-react';
import {
  format,
  startOfWeek,
  addDays,
  isSameDay,
} from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useAppStore } from '@/store';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Badge,
  Empty,
} from '@/components/ui';
import type { Schedule, Vendor, Stall } from '@/types';
import { cn } from '@/lib/utils';

const STAT_COLORS = ['primary', 'neon-orange', 'success'] as const;

function getScheduleHourRange(timeSlot: string): { start: number; end: number } {
  const [startStr, endStr] = timeSlot.split('-');
  const start = parseInt(startStr.split(':')[0], 10);
  const end = parseInt(endStr.split(':')[0], 10);
  return { start, end };
}

function getCategoryEmoji(category: string): string {
  const c = category.toLowerCase();
  if (c.includes('面') || c.includes('粉') || c.includes('面条')) return '🍜';
  if (c.includes('烤') || c.includes('肉') || c.includes('串')) return '🍖';
  if (c.includes('饮') || c.includes('奶茶') || c.includes('茶')) return '🧋';
  if (c.includes('冰') || c.includes('饮')) return '🥤';
  if (c.includes('炸') || c.includes('串') || c.includes('小吃')) return '🍢';
  if (c.includes('海鲜') || c.includes('虾') || c.includes('鱼')) return '🦐';
  if (c.includes('寿司') || c.includes('日料')) return '🍣';
  if (c.includes('火锅')) return '🍲';
  if (c.includes('披萨') || c.includes('汉堡')) return '🍕';
  if (c.includes('水果')) return '🍉';
  if (c.includes('冰') || c.includes('淇淋')) return '🍦';
  return '🍴';
}

export default function Dashboard() {
  const {
    vendors,
    stalls,
    schedules,
    revenues,
    conflicts,
    settings,
  } = useAppStore();

  const [hoveredSchedule, setHoveredSchedule] = useState<string | null>(null);
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);

  const today = useMemo(() => new Date(), []);
  const todayStr = format(today, 'yyyy-MM-dd');

  const todaySchedules = useMemo(
    () =>
      schedules.filter(
        (s) => isSameDay(new Date(s.date), today) && s.status === 'confirmed'
      ),
    [schedules, today]
  );

  const stats = useMemo(() => {
    const todaySchedulesCount = todaySchedules.length;
    const activeVendorsCount = new Set(todaySchedules.map((s) => s.vendorId)).size;
    const todayRevenue = revenues
      .filter((r) => isSameDay(new Date(r.date), today))
      .reduce((sum, r) => sum + r.amount, 0);
    const conflictsCount = conflicts.length;
    return {
      todaySchedulesCount,
      activeVendorsCount,
      todayRevenue,
      conflictsCount,
    };
  }, [todaySchedules, revenues, conflicts, today]);

  const weekDays = useMemo(() => {
    const start = startOfWeek(today, { weekStartsOn: 1, locale: zhCN });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [today]);

  const weeklyRevenues = useMemo(() => {
    return weekDays.map((day) =>
      revenues
        .filter((r) => isSameDay(new Date(r.date), day))
        .reduce((sum, r) => sum + r.amount, 0)
    );
  }, [weekDays, revenues]);

  const weekMaxRevenue = Math.max(...weeklyRevenues, 1);

  const getVendor = (id: string): Vendor | undefined =>
    vendors.find((v) => v.id === id);
  const getStall = (id: string): Stall | undefined =>
    stalls.find((s) => s.id === id);

  const scheduleColors = (index: number): string => {
    const colorList = [
      'from-primary to-neon-orange',
      'from-neon-orange to-warning',
      'from-success to-neon-green',
      'from-info to-[#4DD0E1]',
      'from-neon-pink to-[#F06292]',
    ];
    return colorList[index % colorList.length];
  };

  const HOUR_START = 17;
  const HOUR_END = 23;
  const TOTAL_HOURS = HOUR_END - HOUR_START;
  const SLOT_WIDTH_PER_HOUR = 100 / TOTAL_HOURS;

  const schedulesByStall = useMemo(() => {
    const map = new Map<string, Schedule[]>();
    todaySchedules.forEach((s) => {
      const existing = map.get(s.stallId) || [];
      existing.push(s);
      map.set(s.stallId, existing);
    });
    return map;
  }, [todaySchedules]);

  const stallIdsWithSchedules = Array.from(schedulesByStall.keys());
  const stallsWithSchedules = stallIdsWithSchedules
    .map((id) => getStall(id))
    .filter((s): s is Stall => !!s);

  return (
    <div className="space-y-6 p-6 md:p-8 animate-slide-up">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-2">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">仪表盘</h1>
          <p className="text-gray-400">
            {format(today, 'yyyy年MM月dd日 EEEE', { locale: zhCN })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div
          className="opacity-0 animate-slide-up"
          style={{ animationDelay: '50ms' }}
        >
          <Card className="h-full overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400 mb-2">今日排班数</p>
                  <p className="text-3xl font-bold text-white">
                    {stats.todaySchedulesCount}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-primary" />
                </div>
              </div>
              <div className="mt-4 text-xs text-gray-500">
                已确认的排班
              </div>
            </CardContent>
          </Card>
        </div>

        <div
          className="opacity-0 animate-slide-up"
          style={{ animationDelay: '100ms' }}
        >
          <Card className="h-full overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400 mb-2">在营摊主数</p>
                  <p className="text-3xl font-bold text-white">
                    {stats.activeVendorsCount}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-neon-orange/20 flex items-center justify-center">
                  <Users className="w-6 h-6 text-neon-orange" />
                </div>
              </div>
              <div className="mt-4 text-xs text-gray-500">
                今日出摊摊主
              </div>
            </CardContent>
          </Card>
        </div>

        <div
          className="opacity-0 animate-slide-up"
          style={{ animationDelay: '150ms' }}
        >
          <Card className="h-full overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400 mb-2">今日预估收益</p>
                  <p className="text-3xl font-bold text-white">
                    {settings.currencySymbol}
                    {stats.todayRevenue.toLocaleString()}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-success/20 flex items-center justify-center">
                  <Coins className="w-6 h-6 text-success" />
                </div>
              </div>
              <div className="mt-4 text-xs text-gray-500">
                已录入收益
              </div>
            </CardContent>
          </Card>
        </div>

        <div
          className="opacity-0 animate-slide-up"
          style={{ animationDelay: '200ms' }}
        >
          <Card
            className={cn(
              'h-full overflow-hidden relative',
              stats.conflictsCount > 0 && [
                'bg-gradient-to-br from-danger/20 via-danger/10 to-danger/5',
                'border-danger/50',
                'animate-pulse-border',
              ]
            )}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400 mb-2">待处理冲突</p>
                  <p
                    className={cn(
                      'text-3xl font-bold',
                      stats.conflictsCount > 0 ? 'text-danger' : 'text-white'
                    )}
                  >
                    {stats.conflictsCount}
                  </p>
                </div>
                <div
                  className={cn(
                    'w-12 h-12 rounded-2xl flex items-center justify-center',
                    stats.conflictsCount > 0
                      ? 'bg-danger/20'
                      : 'bg-gray-500/20'
                  )}
                >
                  <AlertTriangle
                    className={cn(
                      'w-6 h-6',
                      stats.conflictsCount > 0 ? 'text-danger' : 'text-gray-500'
                    )}
                  />
                </div>
              </div>
              <div className="mt-4 text-xs text-gray-500">
                {stats.conflictsCount > 0 ? '需要及时处理' : '一切正常'}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {conflicts.length > 0 && (
        <div
          className="opacity-0 animate-slide-up"
          style={{ animationDelay: '250ms' }}
        >
          <Card className="bg-gradient-to-br from-danger/15 via-danger/5 to-transparent border-danger/40">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-danger/20 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-6 h-6 text-danger" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-white mb-3">
                    冲突预警
                  </h3>
                  <div className="space-y-2 mb-4">
                    {conflicts.slice(0, 3).map((c) => (
                      <Link
                        key={c.id}
                        to="/conflicts"
                        className="block p-3 rounded-xl bg-dark-bg/60 border border-dark-border hover:border-danger/40 hover:bg-dark-bg transition-all"
                      >
                        <p className="text-sm text-gray-300">{c.message}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {format(new Date(c.date), 'MM-dd', { locale: zhCN })}
                        </p>
                      </Link>
                    ))}
                  </div>
                  <Link to="/conflicts">
                    <Button variant="danger" size="sm">
                      查看全部冲突
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div
          className="opacity-0 animate-slide-up"
          style={{ animationDelay: '300ms' }}
        >
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-xl">今日排班时间轴</CardTitle>
                <CardDescription>17:00 - 23:00</CardDescription>
              </div>
              <Link to="/schedule">
                <Button variant="outline" size="sm">
                  去排班
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="pt-4">
              {todaySchedules.length === 0 ? (
                <Empty
                  title="今日暂无排班"
                  description="点击右上角去排班开始创建"
                  action={
                    <Link to="/schedule">
                      <Button variant="primary" size="sm">
                        <ClipboardList className="w-4 h-4" />
                        去排班
                      </Button>
                    </Link>
                  }
                />
              ) : (
                <div className="space-y-3 overflow-x-auto scrollbar-thin pb-2">
                  <div className="min-w-[600px]">
                    <div className="flex pl-28 mb-3 border-b border-dark-border pb-2">
                      {Array.from(
                        { length: TOTAL_HOURS },
                        (_, i) => HOUR_START + i
                      ).map((hour) => (
                        <div
                          key={hour}
                          className="flex-1 text-center text-xs text-gray-500"
                        >
                          {hour.toString().padStart(2, '0')}:00
                        </div>
                      ))}
                    </div>

                    {stallsWithSchedules.map((stall, stallIndex) => {
                      const stallSchedules = schedulesByStall.get(stall.id) || [];
                      return (
                        <div
                          key={stall.id}
                          className="flex items-stretch mb-3 last:mb-0"
                        >
                          <div className="w-28 flex-shrink-0 pr-3 flex flex-col justify-center">
                            <p className="text-sm font-medium text-white truncate">
                              {stall.code}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {stall.zone}
                            </p>
                          </div>
                          <div className="flex-1 relative h-14 rounded-xl bg-dark-bg/60 border border-dark-border overflow-hidden">
                            {Array.from(
                              { length: TOTAL_HOURS - 1 },
                              (_, i) => i + 1
                            ).map((i) => (
                              <div
                                key={i}
                                className="absolute top-0 bottom-0 w-px bg-dark-border"
                                style={{ left: `${i * SLOT_WIDTH_PER_HOUR}%` }}
                              />
                            ))}
                            {stallSchedules.map((s, idx) => {
                              const { start, end } = getScheduleHourRange(
                                s.timeSlot
                              );
                              const leftPercent =
                                ((start - HOUR_START) / TOTAL_HOURS) * 100;
                              const widthPercent =
                                ((end - start) / TOTAL_HOURS) * 100;
                              const vendor = getVendor(s.vendorId);
                              const isHovered = hoveredSchedule === s.id;
                              return (
                                <div
                                  key={s.id}
                                  className={cn(
                                    'absolute top-1/2 -translate-y-1/2 h-10 rounded-lg px-2',
                                    'bg-gradient-to-r',
                                    scheduleColors(stallIndex + idx),
                                    'cursor-pointer transition-all duration-200',
                                    'shadow-lg',
                                    isHovered && 'scale-y-110 z-10'
                                  )}
                                  style={{
                                    left: `${leftPercent}%`,
                                    width: `${widthPercent}%`,
                                  }}
                                  onMouseEnter={() =>
                                    setHoveredSchedule(s.id)
                                  }
                                  onMouseLeave={() =>
                                    setHoveredSchedule(null)
                                  }
                                >
                                  <div className="flex items-center justify-center h-full gap-1 min-w-0">
                                    <span className="text-xs flex-shrink-0">
                                      {vendor
                                        ? getCategoryEmoji(vendor.category)
                                        : '🍴'}
                                    </span>
                                    <span className="text-xs font-medium text-white truncate">
                                      {vendor?.name || '未知'}
                                    </span>
                                  </div>
                                  {isHovered && (
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-48">
                                      <div className="bg-dark-card border border-dark-border rounded-xl p-3 shadow-card-glow text-left">
                                        <p className="text-sm font-medium text-white mb-1">
                                          {vendor?.name || '未知摊主'}
                                        </p>
                                        <p className="text-xs text-gray-400 mb-1">
                                          摊位：{stall.code}（{stall.name}）
                                        </p>
                                        <p className="text-xs text-gray-400">
                                          时段：{s.timeSlot}
                                        </p>
                                        <div className="absolute left-1/2 -translate-x-1/2 -bottom-1.5 w-3 h-3 bg-dark-card border-r border-b border-dark-border rotate-45" />
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div
          className="opacity-0 animate-slide-up"
          style={{ animationDelay: '350ms' }}
        >
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-xl">本周收益趋势</CardTitle>
              <CardDescription>近7天收益柱状图</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              {weeklyRevenues.every((r) => r === 0) ? (
                <Empty
                  title="暂无收益数据"
                  description="录入收益后即可查看趋势图"
                  action={
                    <Link to="/revenue">
                      <Button variant="primary" size="sm">
                        <DollarSign className="w-4 h-4" />
                        录入收益
                      </Button>
                    </Link>
                  }
                />
              ) : (
                <div className="relative">
                  <svg
                    viewBox="0 0 600 320"
                    className="w-full h-auto"
                    preserveAspectRatio="xMidYMid meet"
                  >
                    <defs>
                      <linearGradient id="barGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#FF6B35" />
                        <stop offset="100%" stopColor="#FF8C42" />
                      </linearGradient>
                      <linearGradient id="barGradientHover" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#FF8C42" />
                        <stop offset="100%" stopColor="#FFB74D" />
                      </linearGradient>
                    </defs>

                    {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                      const y = 40 + 220 * (1 - ratio);
                      return (
                        <g key={ratio}>
                          <line
                            x1="50"
                            y1={y}
                            x2="580"
                            y2={y}
                            stroke="#36323E"
                            strokeDasharray="4,4"
                            strokeWidth="1"
                          />
                          <text
                            x="40"
                            y={y + 4}
                            textAnchor="end"
                            className="fill-gray-500"
                            style={{ fontSize: '11px' }}
                          >
                            ¥{Math.round(weekMaxRevenue * ratio)}
                          </text>
                        </g>
                      );
                    })}

                    {weeklyRevenues.map((revenue, index) => {
                      const barWidth = 50;
                      const barGroupWidth = (580 - 50) / 7;
                      const x = 50 + barGroupWidth * index + (barGroupWidth - barWidth) / 2;
                      const barHeight = (revenue / weekMaxRevenue) * 220;
                      const y = 40 + 220 - barHeight;
                      const isHovered = hoveredBar === index;
                      const isToday = isSameDay(weekDays[index], today);

                      return (
                        <g
                          key={index}
                          className="cursor-pointer"
                          onMouseEnter={() => setHoveredBar(index)}
                          onMouseLeave={() => setHoveredBar(null)}
                        >
                          {isHovered && (
                            <rect
                              x={x - 4}
                              y={y - 4}
                              width={barWidth + 8}
                              height={barHeight + 8}
                              rx="8"
                              fill="url(#barGradientHover)"
                              opacity="0.2"
                            />
                          )}
                          <rect
                            x={x}
                            y={y}
                            width={barWidth}
                            height={barHeight}
                            rx="8"
                            fill={isHovered ? 'url(#barGradientHover)' : 'url(#barGradient)'}
                            className="transition-all duration-200"
                            style={{
                              filter: isHovered
                                ? 'drop-shadow(0 0 10px rgba(255,140,66,0.6))'
                                : 'none',
                            }}
                          />
                          {isToday && (
                            <circle
                              cx={x + barWidth / 2}
                              cy={y + barHeight + 22}
                              r="3"
                              fill="#FF6B35"
                            />
                          )}
                          <text
                            x={x + barWidth / 2}
                            y={y + barHeight + 15}
                            textAnchor="middle"
                            className={cn(
                              'transition-all duration-200',
                              isToday ? 'fill-primary font-bold' : 'fill-gray-400'
                            )}
                            style={{ fontSize: '12px' }}
                          >
                            {format(weekDays[index], 'EEE', { locale: zhCN })}
                          </text>
                          {isHovered && revenue > 0 && (
                            <g>
                              <rect
                                x={x + barWidth / 2 - 40}
                                y={y - 44}
                                width="80"
                                height="34"
                                rx="8"
                                fill="#26222C"
                                stroke="#36323E"
                                strokeWidth="1"
                              />
                              <text
                                x={x + barWidth / 2}
                                y={y - 24}
                                textAnchor="middle"
                                className="fill-white"
                                style={{ fontSize: '13px', fontWeight: 600 }}
                              >
                                ¥{revenue.toLocaleString()}
                              </text>
                              <polygon
                                points={`${x + barWidth / 2 - 6},${y - 10} ${x + barWidth / 2 + 6},${y - 10} ${x + barWidth / 2},${y - 2}`}
                                fill="#26222C"
                                stroke="#36323E"
                                strokeWidth="1"
                              />
                            </g>
                          )}
                        </g>
                      );
                    })}
                  </svg>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div
        className="opacity-0 animate-slide-up"
        style={{ animationDelay: '400ms' }}
      >
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">快捷操作</CardTitle>
            <CardDescription>快速进入常用功能</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link to="/vendors">
                <div className="group p-5 rounded-2xl bg-dark-bg/60 border border-dark-border hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer h-full text-center">
                  <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 group-hover:scale-110 transition-all">
                    <UserPlus className="w-7 h-7 text-primary" />
                  </div>
                  <h4 className="text-white font-semibold mb-1">新增摊主</h4>
                  <p className="text-xs text-gray-500">添加新的摊主信息</p>
                </div>
              </Link>
              <Link to="/stalls">
                <div className="group p-5 rounded-2xl bg-dark-bg/60 border border-dark-border hover:border-neon-orange/50 hover:bg-neon-orange/5 transition-all cursor-pointer h-full text-center">
                  <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-neon-orange/20 flex items-center justify-center group-hover:bg-neon-orange/30 group-hover:scale-110 transition-all">
                    <MapPin className="w-7 h-7 text-neon-orange" />
                  </div>
                  <h4 className="text-white font-semibold mb-1">新增摊位</h4>
                  <p className="text-xs text-gray-500">管理夜市摊位信息</p>
                </div>
              </Link>
              <Link to="/schedule">
                <div className="group p-5 rounded-2xl bg-dark-bg/60 border border-dark-border hover:border-success/50 hover:bg-success/5 transition-all cursor-pointer h-full text-center">
                  <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-success/20 flex items-center justify-center group-hover:bg-success/30 group-hover:scale-110 transition-all">
                    <ClipboardList className="w-7 h-7 text-success" />
                  </div>
                  <h4 className="text-white font-semibold mb-1">申请排班</h4>
                  <p className="text-xs text-gray-500">为摊主安排出摊</p>
                </div>
              </Link>
              <Link to="/revenue">
                <div className="group p-5 rounded-2xl bg-dark-bg/60 border border-dark-border hover:border-info/50 hover:bg-info/5 transition-all cursor-pointer h-full text-center">
                  <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-info/20 flex items-center justify-center group-hover:bg-info/30 group-hover:scale-110 transition-all">
                    <DollarSign className="w-7 h-7 text-info" />
                  </div>
                  <h4 className="text-white font-semibold mb-1">录入收益</h4>
                  <p className="text-xs text-gray-500">记录每日营收数据</p>
                </div>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
