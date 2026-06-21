import { useMemo, useState, useEffect } from 'react';
import { useAppStore } from '@/store';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
  Button,
  Modal,
  Input,
  Select,
  Textarea,
  Empty,
} from '@/components/ui';
import {
  DollarSign,
  TrendingUp,
  Calendar as CalendarIcon,
  Users,
  Store,
  Plus,
  Save,
  Check,
  Download,
  Pencil,
  Trash2,
  X,
  Trophy,
  Award,
  Medal,
} from 'lucide-react';
import {
  format,
  formatISO,
  parseISO,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  max,
  min,
} from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { Revenue, Schedule, Vendor, Stall } from '@/types';

type RevenueTab = 'entry' | 'report';

interface QuickEntry {
  scheduleId: string;
  vendorId: string;
  stallId: string;
  date: string;
  timeSlot: string;
  vendorName: string;
  vendorCategory: string;
  stallCode: string;
  stallName: string;
  existingRevenue?: Revenue;
  amount: string;
  note: string;
}

export default function RevenuePage() {
  const {
    revenues,
    schedules,
    vendors,
    stalls,
    settings,
    createRevenue,
    updateRevenue,
    deleteRevenue,
    addToast,
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<RevenueTab>('entry');

  const [entryDate, setEntryDate] = useState(
    formatISO(new Date(), { representation: 'date' })
  );

  const [quickEntries, setQuickEntries] = useState<QuickEntry[]>([]);

  const [newVendorId, setNewVendorId] = useState('');
  const [newStallId, setNewStallId] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newNote, setNewNote] = useState('');

  const [reportStartDate, setReportStartDate] = useState(
    formatISO(startOfMonth(new Date()), { representation: 'date' })
  );
  const [reportEndDate, setReportEndDate] = useState(
    formatISO(endOfMonth(new Date()), { representation: 'date' })
  );

  const [editingRevenue, setEditingRevenue] = useState<Revenue | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editNote, setEditNote] = useState('');

  const [deleteConfirm, setDeleteConfirm] = useState<Revenue | null>(null);
  const [chartHover, setChartHover] = useState<{ x: number; y: number; date: string; amount: number } | null>(null);

  const vendorMap = useMemo(
    () => new Map(vendors.map((v) => [v.id, v])),
    [vendors]
  );
  const stallMap = useMemo(
    () => new Map(stalls.map((s) => [s.id, s])),
    [stalls]
  );

  useEffect(() => {
    const daySchedules = schedules.filter(
      (s) => s.date === entryDate && s.status === 'confirmed'
    );
    const entries: QuickEntry[] = daySchedules.map((s) => {
      const v = vendorMap.get(s.vendorId);
      const st = stallMap.get(s.stallId);
      const existing = revenues.find(
        (r) => r.scheduleId === s.id || (r.vendorId === s.vendorId && r.stallId === s.stallId && r.date === s.date)
      );
      return {
        scheduleId: s.id,
        vendorId: s.vendorId,
        stallId: s.stallId,
        date: s.date,
        timeSlot: s.timeSlot,
        vendorName: v?.name || '未知摊主',
        vendorCategory: v?.category || '',
        stallCode: st?.code || 'A00',
        stallName: st?.name || '',
        existingRevenue: existing,
        amount: existing ? String(existing.amount) : '',
        note: existing?.note || '',
      };
    });
    setQuickEntries(entries);
  }, [entryDate, schedules, revenues, vendorMap, stallMap]);

  const dayRevenues = useMemo(() => {
    return revenues.filter((r) => r.date === entryDate);
  }, [revenues, entryDate]);

  const daySummary = useMemo(() => {
    const total = dayRevenues.reduce((sum, r) => sum + r.amount, 0);
    const expectedCount = quickEntries.length;
    const enteredCount = quickEntries.filter((e) => e.existingRevenue || e.amount).length;
    const avg = enteredCount > 0 ? total / enteredCount : 0;
    return {
      total,
      expectedCount,
      enteredCount,
      avg,
    };
  }, [dayRevenues, quickEntries]);

  const handleQuickSave = (entry: QuickEntry) => {
    const amountNum = parseFloat(entry.amount);
    if (!entry.amount || isNaN(amountNum) || amountNum <= 0) {
      addToast('error', '请输入有效的金额');
      return;
    }
    if (entry.existingRevenue) {
      updateRevenue(entry.existingRevenue.id, {
        amount: amountNum,
        note: entry.note || undefined,
      });
      addToast('success', '收益更新成功');
    } else {
      createRevenue({
        scheduleId: entry.scheduleId,
        vendorId: entry.vendorId,
        stallId: entry.stallId,
        date: entry.date,
        amount: amountNum,
        note: entry.note || undefined,
      });
      addToast('success', '收益录入成功');
    }
  };

  const handleQuickSaveAll = () => {
    const toSave = quickEntries.filter((e) => e.amount && !e.existingRevenue);
    const toUpdate = quickEntries.filter((e) => e.amount && e.existingRevenue && String(e.existingRevenue.amount) !== e.amount);
    let savedCount = 0;

    for (const entry of toSave) {
      const amountNum = parseFloat(entry.amount);
      if (!isNaN(amountNum) && amountNum > 0) {
        createRevenue({
          scheduleId: entry.scheduleId,
          vendorId: entry.vendorId,
          stallId: entry.stallId,
          date: entry.date,
          amount: amountNum,
          note: entry.note || undefined,
        });
        savedCount++;
      }
    }

    for (const entry of toUpdate) {
      const amountNum = parseFloat(entry.amount);
      if (!isNaN(amountNum) && amountNum > 0 && entry.existingRevenue) {
        updateRevenue(entry.existingRevenue.id, {
          amount: amountNum,
          note: entry.note || undefined,
        });
        savedCount++;
      }
    }

    addToast('success', `成功保存 ${savedCount} 条记录`);
  };

  const handleNewRevenue = () => {
    const amountNum = parseFloat(newAmount);
    if (!newVendorId) {
      addToast('error', '请选择摊主');
      return;
    }
    if (!newStallId) {
      addToast('error', '请选择摊位');
      return;
    }
    if (!newAmount || isNaN(amountNum) || amountNum <= 0) {
      addToast('error', '请输入有效的金额');
      return;
    }
    createRevenue({
      vendorId: newVendorId,
      stallId: newStallId,
      date: entryDate,
      amount: amountNum,
      note: newNote || undefined,
    });
    addToast('success', '收益录入成功');
    setNewVendorId('');
    setNewStallId('');
    setNewAmount('');
    setNewNote('');
  };

  const handleEditRevenue = (revenue: Revenue) => {
    setEditingRevenue(revenue);
    setEditAmount(String(revenue.amount));
    setEditNote(revenue.note || '');
  };

  const handleSaveEdit = () => {
    if (!editingRevenue) return;
    const amountNum = parseFloat(editAmount);
    if (!editAmount || isNaN(amountNum) || amountNum <= 0) {
      addToast('error', '请输入有效的金额');
      return;
    }
    updateRevenue(editingRevenue.id, {
      amount: amountNum,
      note: editNote || undefined,
    });
    addToast('success', '收益更新成功');
    setEditingRevenue(null);
  };

  const handleDeleteRevenue = () => {
    if (!deleteConfirm) return;
    deleteRevenue(deleteConfirm.id);
    addToast('success', '记录已删除');
    setDeleteConfirm(null);
  };

  const reportData = useMemo(() => {
    const filtered = revenues.filter((r) => {
      const d = r.date;
      return d >= reportStartDate && d <= reportEndDate;
    });

    const total = filtered.reduce((sum, r) => sum + r.amount, 0);
    const start = parseISO(reportStartDate);
    const end = parseISO(reportEndDate);
    const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
    const avg = total / days;

    const dailyMap = new Map<string, number>();
    for (const r of filtered) {
      dailyMap.set(r.date, (dailyMap.get(r.date) || 0) + r.amount);
    }

    const allDays = eachDayOfInterval({ start, end });
    const dailyData = allDays.map((d) => {
      const dateStr = formatISO(d, { representation: 'date' });
      return {
        date: dateStr,
        amount: dailyMap.get(dateStr) || 0,
      };
    });

    let maxDayAmount = 0;
    let maxDayDate = '';
    for (const d of dailyData) {
      if (d.amount > maxDayAmount) {
        maxDayAmount = d.amount;
        maxDayDate = d.date;
      }
    }

    const vendorMap2 = new Map<string, { total: number; count: number }>();
    for (const r of filtered) {
      const existing = vendorMap2.get(r.vendorId) || { total: 0, count: 0 };
      existing.total += r.amount;
      existing.count += 1;
      vendorMap2.set(r.vendorId, existing);
    }
    const vendorRanking = Array.from(vendorMap2.entries())
      .map(([id, data]) => {
        const v = vendorMap.get(id);
        return {
          vendorId: id,
          vendorName: v?.name || '未知摊主',
          total: data.total,
          count: data.count,
          avg: data.count > 0 ? data.total / data.count : 0,
        };
      })
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    const stallMap2 = new Map<string, { total: number }>();
    for (const r of filtered) {
      const existing = stallMap2.get(r.stallId) || { total: 0 };
      existing.total += r.amount;
      stallMap2.set(r.stallId, existing);
    }
    const stallTotal = Array.from(stallMap2.values()).reduce((s, v) => s + v.total, 0);
    const stallRanking = Array.from(stallMap2.entries())
      .map(([id, data]) => {
        const s = stallMap.get(id);
        return {
          stallId: id,
          stallCode: s?.code || 'A00',
          stallName: s?.name || '',
          total: data.total,
          percent: stallTotal > 0 ? (data.total / stallTotal) * 100 : 0,
        };
      })
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    return {
      total,
      avg,
      maxDayAmount,
      maxDayDate,
      count: filtered.length,
      dailyData,
      vendorRanking,
      stallRanking,
      filtered,
    };
  }, [revenues, reportStartDate, reportEndDate, vendorMap, stallMap]);

  const handleExportCSV = () => {
    if (reportData.filtered.length === 0) {
      addToast('warning', '当前范围没有数据可导出');
      return;
    }
    const headers = ['日期', '摊主', '摊位', '金额', '备注'];
    const rows = reportData.filtered.map((r) => {
      const v = vendorMap.get(r.vendorId);
      const s = stallMap.get(r.stallId);
      return [
        r.date,
        v?.name || '未知',
        s?.code || s?.name || '未知',
        r.amount.toFixed(2),
        r.note || '',
      ];
    });
    const csv = [headers, ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `收益报表_${reportStartDate}_${reportEndDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    addToast('success', '导出成功');
  };

  const renderRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-5 h-5 text-yellow-400" />;
    if (rank === 2) return <Award className="w-5 h-5 text-gray-300" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-amber-600" />;
    return <span className="w-5 h-5 flex items-center justify-center text-xs text-gray-500 font-bold">{rank}</span>;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <DollarSign className="w-8 h-8 text-primary" />
            收益管理
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            录入和分析夜市摊位的收益数据
          </p>
        </div>
        {activeTab === 'report' && (
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="w-4 h-4" />
            导出CSV
          </Button>
        )}
      </div>

      <div className="relative inline-flex p-1 rounded-xl bg-dark-card border border-dark-border">
        <div
          className={cn(
            'absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-lg transition-all duration-300 ease-out',
            'bg-gradient-to-r from-primary to-neon-orange shadow-[0_0_20px_rgba(255,107,53,0.4)]',
            activeTab === 'entry' ? 'left-1' : 'left-[calc(50%+0px)]'
          )}
        />
        <button
          onClick={() => setActiveTab('entry')}
          className={cn(
            'relative z-10 px-6 py-2 rounded-lg text-sm font-medium transition-colors duration-200',
            activeTab === 'entry' ? 'text-white' : 'text-gray-400 hover:text-white'
          )}
        >
          收益录入
        </button>
        <button
          onClick={() => setActiveTab('report')}
          className={cn(
            'relative z-10 px-6 py-2 rounded-lg text-sm font-medium transition-colors duration-200',
            activeTab === 'report' ? 'text-white' : 'text-gray-400 hover:text-white'
          )}
        >
          统计报表
        </button>
      </div>

      {activeTab === 'entry' ? (
        <div className="space-y-6">
          <Card className="hover:scale-none">
            <CardContent className="p-5">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="sm:w-64">
                  <Input
                    label="选择日期"
                    type="date"
                    value={entryDate}
                    onChange={(e) => setEntryDate(e.target.value)}
                  />
                </div>
                <div className="flex-1 flex items-end">
                  <Button variant="outline" onClick={handleQuickSaveAll}>
                    <Save className="w-4 h-4" />
                    一键保存所有
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className="hover:scale-none before:from-primary/30 before:via-neon-orange/20 before:to-neon-pink/10"
          >
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div className="space-y-2">
                  <p className="text-sm text-gray-400">当日总收益</p>
                  <p className="text-primary font-display text-5xl font-bold">
                    {settings.currencySymbol}
                    {daySummary.total.toFixed(2)}
                  </p>
                </div>
                <div className="flex-1 max-w-md space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">录入进度</span>
                    <span className="text-white font-medium">
                      {daySummary.enteredCount} / {daySummary.expectedCount}
                    </span>
                  </div>
                  <div className="h-3 rounded-full bg-dark-bg overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary to-neon-green transition-all duration-500"
                      style={{
                        width:
                          daySummary.expectedCount > 0
                            ? `${(daySummary.enteredCount / daySummary.expectedCount) * 100}%`
                            : '0%',
                      }}
                    />
                  </div>
                </div>
                <div className="text-center md:text-right">
                  <p className="text-sm text-gray-400">平均每摊位</p>
                  <p className="text-2xl font-bold text-white">
                    {settings.currencySymbol}
                    {daySummary.avg.toFixed(2)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {quickEntries.length > 0 && (
            <Card className="hover:scale-none">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-primary" />
                  当日排班快速录入
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {quickEntries.map((entry, idx) => (
                    <div
                      key={entry.scheduleId}
                      className={cn(
                        'p-4 rounded-xl border transition-all duration-200',
                        entry.existingRevenue
                          ? 'bg-success/5 border-success/30'
                          : 'bg-dark-bg/50 border-dark-border hover:border-gray-500'
                      )}
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                        <div className="flex-1 flex flex-wrap items-center gap-3">
                          {entry.existingRevenue && (
                            <Badge variant="success" size="sm" dot>
                              <Check className="w-3 h-3 mr-1" />
                              已录入
                            </Badge>
                          )}
                          <div className="flex items-center gap-2">
                            <Store className="w-4 h-4 text-neon-green" />
                            <span className="text-white font-medium">
                              {entry.stallCode}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-neon-pink" />
                            <span className="text-gray-300">
                              {entry.vendorName}
                            </span>
                          </div>
                          <Badge variant="primary" size="sm">
                            {entry.vendorCategory}
                          </Badge>
                          <Badge variant="default" size="sm">
                            {entry.timeSlot}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 lg:w-auto">
                          <div className="w-36">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="当日收益"
                              value={entry.amount}
                              onChange={(e) => {
                                const newEntries = [...quickEntries];
                                newEntries[idx].amount = e.target.value;
                                setQuickEntries(newEntries);
                              }}
                              className={cn(
                                'w-full rounded-xl bg-dark-bg border border-dark-border',
                                'px-3 py-2 text-sm text-white placeholder:text-gray-500',
                                'focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all'
                              )}
                            />
                          </div>
                          <div className="w-40">
                            <input
                              type="text"
                              placeholder="备注"
                              value={entry.note}
                              onChange={(e) => {
                                const newEntries = [...quickEntries];
                                newEntries[idx].note = e.target.value;
                                setQuickEntries(newEntries);
                              }}
                              className={cn(
                                'w-full rounded-xl bg-dark-bg border border-dark-border',
                                'px-3 py-2 text-sm text-white placeholder:text-gray-500',
                                'focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all'
                              )}
                            />
                          </div>
                          <Button
                            variant={entry.existingRevenue ? 'success' : 'primary'}
                            size="sm"
                            onClick={() => handleQuickSave(entry)}
                          >
                            <Save className="w-4 h-4" />
                            保存
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="hover:scale-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Plus className="w-5 h-5 text-neon-green" />
                手动新增录入
                <Badge variant="default" size="sm">
                  即使当天没排班也可录入
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <Select
                  label="选择摊主"
                  value={newVendorId}
                  onChange={(e) => setNewVendorId(e.target.value)}
                  options={vendors.map((v) => ({
                    value: v.id,
                    label: v.name,
                  }))}
                  placeholder="请选择摊主"
                />
                <Select
                  label="选择摊位"
                  value={newStallId}
                  onChange={(e) => setNewStallId(e.target.value)}
                  options={stalls.map((s) => ({
                    value: s.id,
                    label: `${s.code} - ${s.name}`,
                  }))}
                  placeholder="请选择摊位"
                />
                <Input
                  label="日期"
                  type="date"
                  value={entryDate}
                  onChange={(e) => setEntryDate(e.target.value)}
                />
                <Input
                  label="金额 (必填)"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="请输入金额"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  prefixIcon={DollarSign}
                />
                <Input
                  label="备注"
                  placeholder="备注（选填）"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                />
              </div>
              <div className="mt-4 flex justify-end">
                <Button variant="success" onClick={handleNewRevenue}>
                  <Plus className="w-4 h-4" />
                  新增录入
                </Button>
              </div>
            </CardContent>
          </Card>

          {dayRevenues.length > 0 && (
            <Card className="hover:scale-none">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-primary" />
                  当日收益记录 ({dayRevenues.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-dark-border">
                        <th className="text-left text-sm text-gray-400 font-medium py-3 px-2">摊主</th>
                        <th className="text-left text-sm text-gray-400 font-medium py-3 px-2">摊位</th>
                        <th className="text-right text-sm text-gray-400 font-medium py-3 px-2">金额</th>
                        <th className="text-left text-sm text-gray-400 font-medium py-3 px-2">备注</th>
                        <th className="text-right text-sm text-gray-400 font-medium py-3 px-2">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dayRevenues.map((r) => {
                        const v = vendorMap.get(r.vendorId);
                        const s = stallMap.get(r.stallId);
                        return (
                          <tr
                            key={r.id}
                            className="border-b border-dark-border/50 hover:bg-white/5 transition-colors"
                          >
                            <td className="py-3 px-2 text-white">
                              {v?.name || '未知'}
                            </td>
                            <td className="py-3 px-2 text-gray-300">
                              {s?.code || s?.name || '未知'}
                            </td>
                            <td className="py-3 px-2 text-right text-primary font-bold font-display text-lg">
                              {settings.currencySymbol}
                              {r.amount.toFixed(2)}
                            </td>
                            <td className="py-3 px-2 text-gray-400 text-sm max-w-xs truncate">
                              {r.note || '-'}
                            </td>
                            <td className="py-3 px-2">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditRevenue(r)}
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </Button>
                                <Button
                                  variant="danger"
                                  size="sm"
                                  onClick={() => setDeleteConfirm(r)}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <Card className="hover:scale-none">
            <CardContent className="p-5">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="sm:w-48">
                  <Input
                    label="开始日期"
                    type="date"
                    value={reportStartDate}
                    onChange={(e) => setReportStartDate(e.target.value)}
                  />
                </div>
                <div className="sm:w-48">
                  <Input
                    label="结束日期"
                    type="date"
                    value={reportEndDate}
                    onChange={(e) => setReportEndDate(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="hover:scale-none before:from-primary/30 before:via-primary/20 before:to-primary/10">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">总收益</p>
                    <p className="text-primary font-display text-3xl font-bold mt-2">
                      {settings.currencySymbol}
                      {reportData.total.toFixed(2)}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:scale-none before:from-neon-green/30 before:via-neon-green/20 before:to-neon-green/10">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">日均收益</p>
                    <p className="text-neon-green font-display text-3xl font-bold mt-2">
                      {settings.currencySymbol}
                      {reportData.avg.toFixed(2)}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-neon-green/20 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-neon-green" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:scale-none before:from-warning/30 before:via-warning/20 before:to-warning/10">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">最高单日</p>
                    <p className="text-warning font-display text-3xl font-bold mt-2">
                      {settings.currencySymbol}
                      {reportData.maxDayAmount.toFixed(2)}
                    </p>
                    {reportData.maxDayDate && (
                      <p className="text-xs text-gray-400 mt-1">
                        {reportData.maxDayDate}
                      </p>
                    )}
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-warning/20 flex items-center justify-center">
                    <Trophy className="w-6 h-6 text-warning" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:scale-none before:from-neon-pink/30 before:via-neon-pink/20 before:to-neon-pink/10">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">录入次数</p>
                    <p className="text-neon-pink font-display text-3xl font-bold mt-2">
                      {reportData.count}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-neon-pink/20 flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-neon-pink" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="hover:scale-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                收益趋势
              </CardTitle>
            </CardHeader>
            <CardContent>
              {reportData.dailyData.every((d) => d.amount === 0) ? (
                <div className="h-64 flex items-center justify-center">
                  <Empty
                    title="暂无数据"
                    description="请调整日期范围或先录入收益数据"
                  />
                </div>
              ) : (
                <div className="relative">
                  <svg
                    viewBox="0 0 800 280"
                    className="w-full h-[280px]"
                    onMouseLeave={() => setChartHover(null)}
                  >
                    <defs>
                      <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="rgba(255,107,53,0.4)" />
                        <stop offset="100%" stopColor="rgba(255,107,53,0)" />
                      </linearGradient>
                      <linearGradient id="lineStroke" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#ff6b35" />
                        <stop offset="100%" stopColor="#10b981" />
                      </linearGradient>
                    </defs>
                    {(function () {
                      const data = reportData.dailyData;
                      const maxAmount = Math.max(...data.map((d) => d.amount), 1);
                      const padding = { top: 30, right: 30, bottom: 40, left: 60 };
                      const chartW = 800 - padding.left - padding.right;
                      const chartH = 280 - padding.top - padding.bottom;
                      const stepX = data.length > 1 ? chartW / (data.length - 1) : 0;

                      const points = data.map((d, i) => ({
                        x: padding.left + i * stepX,
                        y: padding.top + chartH - (d.amount / maxAmount) * chartH,
                        ...d,
                      }));

                      const pathD = points
                        .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`)
                        .join(' ');

                      const areaD = `${pathD} L${points[points.length - 1].x},${padding.top + chartH} L${points[0].x},${padding.top + chartH} Z`;

                      const yTicks = 5;

                      return (
                        <g>
                          {Array.from({ length: yTicks + 1 }).map((_, i) => {
                            const y = padding.top + (chartH / yTicks) * i;
                            const value = maxAmount - (maxAmount / yTicks) * i;
                            return (
                              <g key={i}>
                                <line
                                  x1={padding.left}
                                  y1={y}
                                  x2={padding.left + chartW}
                                  y2={y}
                                  stroke="rgba(255,255,255,0.05)"
                                  strokeDasharray="4 4"
                                />
                                <text
                                  x={padding.left - 10}
                                  y={y + 4}
                                  textAnchor="end"
                                  fill="rgba(255,255,255,0.4)"
                                  fontSize="11"
                                >
                                  {settings.currencySymbol}
                                  {value.toFixed(0)}
                                </text>
                              </g>
                            );
                          })}

                          <path d={areaD} fill="url(#lineGradient)" />
                          <path
                            d={pathD}
                            fill="none"
                            stroke="url(#lineStroke)"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />

                          {points.map((p, i) => (
                            <g key={i}>
                              <circle
                                cx={p.x}
                                cy={p.y}
                                r="4"
                                fill="#1a1625"
                                stroke="#ff6b35"
                                strokeWidth="2"
                              />
                              {data.length <= 15 && (
                                <text
                                  x={p.x}
                                  y={padding.top + chartH + 20}
                                  textAnchor="middle"
                                  fill="rgba(255,255,255,0.4)"
                                  fontSize="10"
                                >
                                  {p.date.slice(5)}
                                </text>
                              )}
                              <rect
                                x={p.x - stepX / 2}
                                y={padding.top}
                                width={stepX}
                                height={chartH}
                                fill="transparent"
                                onMouseEnter={(e) => {
                                  const svg = (e.target as SVGElement).ownerSVGElement;
                                  if (svg) {
                                    const rect = svg.getBoundingClientRect();
                                    const scaleX = rect.width / 800;
                                    setChartHover({
                                      x: p.x * scaleX,
                                      y: p.y * scaleX,
                                      date: p.date,
                                      amount: p.amount,
                                    });
                                  }
                                }}
                                style={{ cursor: 'pointer' }}
                              />
                            </g>
                          ))}
                        </g>
                      );
                    })()}
                  </svg>

                  {chartHover && (
                    <div
                      className="absolute pointer-events-none z-10 px-3 py-2 rounded-lg bg-dark-card border border-primary/50 shadow-xl"
                      style={{
                        left: Math.min(Math.max(chartHover.x - 60, 0), 800 - 120),
                        top: chartHover.y - 50,
                      }}
                    >
                      <p className="text-xs text-gray-400">{chartHover.date}</p>
                      <p className="text-sm font-bold text-primary">
                        {settings.currencySymbol}
                        {chartHover.amount.toFixed(2)}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="hover:scale-none">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="w-5 h-5 text-neon-pink" />
                  摊主收益排行榜 Top 10
                </CardTitle>
              </CardHeader>
              <CardContent>
                {reportData.vendorRanking.length === 0 ? (
                  <Empty title="暂无数据" />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-dark-border">
                          <th className="text-left text-sm text-gray-400 font-medium py-2 px-2 w-12">排名</th>
                          <th className="text-left text-sm text-gray-400 font-medium py-2 px-2">摊主</th>
                          <th className="text-right text-sm text-gray-400 font-medium py-2 px-2">总收益</th>
                          <th className="text-center text-sm text-gray-400 font-medium py-2 px-2">次数</th>
                          <th className="text-right text-sm text-gray-400 font-medium py-2 px-2">平均</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportData.vendorRanking.map((item, idx) => {
                          const maxTotal = reportData.vendorRanking[0]?.total || 1;
                          const barWidth = (item.total / maxTotal) * 100;
                          return (
                            <tr
                              key={item.vendorId}
                              className="border-b border-dark-border/50 hover:bg-white/5 transition-colors"
                            >
                              <td className="py-2.5 px-2">
                                <div className="flex items-center justify-start">
                                  {renderRankIcon(idx + 1)}
                                </div>
                              </td>
                              <td className="py-2.5 px-2">
                                <div className="space-y-1">
                                  <div className="text-white font-medium">{item.vendorName}</div>
                                  <div className="h-1.5 rounded-full bg-dark-bg overflow-hidden">
                                    <div
                                      className="h-full rounded-full bg-gradient-to-r from-neon-pink to-primary transition-all duration-500"
                                      style={{ width: `${barWidth}%` }}
                                    />
                                  </div>
                                </div>
                              </td>
                              <td className="py-2.5 px-2 text-right text-primary font-bold">
                                {settings.currencySymbol}
                                {item.total.toFixed(0)}
                              </td>
                              <td className="py-2.5 px-2 text-center text-gray-300">
                                {item.count}
                              </td>
                              <td className="py-2.5 px-2 text-right text-gray-300 text-sm">
                                {settings.currencySymbol}
                                {item.avg.toFixed(0)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="hover:scale-none">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Store className="w-5 h-5 text-neon-green" />
                  摊位收益排行榜 Top 10
                </CardTitle>
              </CardHeader>
              <CardContent>
                {reportData.stallRanking.length === 0 ? (
                  <Empty title="暂无数据" />
                ) : (
                  <div className="space-y-3">
                    {reportData.stallRanking.map((item, idx) => {
                      const maxTotal = reportData.stallRanking[0]?.total || 1;
                      const barWidth = (item.total / maxTotal) * 100;
                      const circleSize = 44;
                      const strokeWidth = 4;
                      const radius = (circleSize - strokeWidth) / 2;
                      const circumference = 2 * Math.PI * radius;
                      const offset = circumference - (item.percent / 100) * circumference;

                      return (
                        <div
                          key={item.stallId}
                          className="flex items-center gap-4 p-3 rounded-xl bg-dark-bg/50 border border-dark-border"
                        >
                          <div className="flex items-center justify-center w-12">
                            {renderRankIcon(idx + 1)}
                          </div>
                          <div className="relative shrink-0">
                            <svg width={circleSize} height={circleSize}>
                              <circle
                                cx={circleSize / 2}
                                cy={circleSize / 2}
                                r={radius}
                                fill="none"
                                stroke="rgba(255,255,255,0.1)"
                                strokeWidth={strokeWidth}
                              />
                              <circle
                                cx={circleSize / 2}
                                cy={circleSize / 2}
                                r={radius}
                                fill="none"
                                stroke="url(#stallStroke)"
                                strokeWidth={strokeWidth}
                                strokeDasharray={circumference}
                                strokeDashoffset={offset}
                                strokeLinecap="round"
                                transform={`rotate(-90 ${circleSize / 2} ${circleSize / 2})`}
                              />
                              <defs>
                                <linearGradient id="stallStroke" x1="0%" y1="0%" x2="100%" y2="0%">
                                  <stop offset="0%" stopColor="#10b981" />
                                  <stop offset="100%" stopColor="#ff6b35" />
                                </linearGradient>
                              </defs>
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-xs font-bold text-white">
                                {item.percent.toFixed(0)}%
                              </span>
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-white font-medium truncate">
                                {item.stallCode} {item.stallName}
                              </span>
                              <span className="text-primary font-bold shrink-0 ml-2">
                                {settings.currencySymbol}
                                {item.total.toFixed(0)}
                              </span>
                            </div>
                            <div className="h-1.5 rounded-full bg-dark-bg overflow-hidden">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-neon-green to-primary transition-all duration-500"
                                style={{ width: `${barWidth}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {reportData.filtered.length > 0 && (
            <Card className="hover:scale-none">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-primary" />
                  收益明细 ({reportData.filtered.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-dark-border">
                        <th className="text-left text-sm text-gray-400 font-medium py-3 px-2">日期</th>
                        <th className="text-left text-sm text-gray-400 font-medium py-3 px-2">摊主</th>
                        <th className="text-left text-sm text-gray-400 font-medium py-3 px-2">摊位</th>
                        <th className="text-right text-sm text-gray-400 font-medium py-3 px-2">金额</th>
                        <th className="text-left text-sm text-gray-400 font-medium py-3 px-2">备注</th>
                        <th className="text-right text-sm text-gray-400 font-medium py-3 px-2">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.filtered
                        .sort((a, b) => b.date.localeCompare(a.date))
                        .map((r) => {
                          const v = vendorMap.get(r.vendorId);
                          const s = stallMap.get(r.stallId);
                          return (
                            <tr
                              key={r.id}
                              className="border-b border-dark-border/50 hover:bg-white/5 transition-colors"
                            >
                              <td className="py-3 px-2 text-gray-300 text-sm">
                                {r.date}
                              </td>
                              <td className="py-3 px-2 text-white">
                                {v?.name || '未知'}
                              </td>
                              <td className="py-3 px-2 text-gray-300">
                                {s?.code || s?.name || '未知'}
                              </td>
                              <td className="py-3 px-2 text-right text-primary font-bold font-display text-lg">
                                {settings.currencySymbol}
                                {r.amount.toFixed(2)}
                              </td>
                              <td className="py-3 px-2 text-gray-400 text-sm max-w-xs truncate">
                                {r.note || '-'}
                              </td>
                              <td className="py-3 px-2">
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleEditRevenue(r)}
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </Button>
                                  <Button
                                    variant="danger"
                                    size="sm"
                                    onClick={() => setDeleteConfirm(r)}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <Modal
        open={!!editingRevenue}
        onClose={() => setEditingRevenue(null)}
        title="编辑收益记录"
        description="修改收益金额和备注"
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setEditingRevenue(null)}>
              取消
            </Button>
            <Button variant="primary" onClick={handleSaveEdit}>
              保存
            </Button>
          </>
        }
      >
        <div className="space-y-4 pb-4">
          <Input
            label="金额"
            type="number"
            min="0"
            step="0.01"
            prefixIcon={DollarSign}
            value={editAmount}
            onChange={(e) => setEditAmount(e.target.value)}
          />
          <Textarea
            label="备注"
            placeholder="备注（选填）"
            value={editNote}
            onChange={(e) => setEditNote(e.target.value)}
            rows={3}
          />
        </div>
      </Modal>

      <Modal
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="确认删除"
        description="此操作不可撤销，确定要删除这条收益记录吗？"
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              取消
            </Button>
            <Button variant="danger" onClick={handleDeleteRevenue}>
              <Trash2 className="w-4 h-4" />
              确认删除
            </Button>
          </>
        }
      >
        {deleteConfirm && (
          <div className="p-4 rounded-xl bg-danger/10 border border-danger/30 mb-2">
            <div className="flex items-center justify-between">
              <span className="text-gray-300">
                {vendorMap.get(deleteConfirm.vendorId)?.name || '未知'} @{' '}
                {stallMap.get(deleteConfirm.stallId)?.code || ''}
              </span>
              <span className="text-danger font-bold font-display text-xl">
                {settings.currencySymbol}
                {deleteConfirm.amount.toFixed(2)}
              </span>
            </div>
            <div className="text-sm text-gray-400 mt-1">{deleteConfirm.date}</div>
          </div>
        )}
      </Modal>
    </div>
  );
}
