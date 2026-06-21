import { useState, useMemo } from 'react';
import { useAppStore } from '@/store';
import {
  Card,
  CardContent,
  Button,
  Input,
  Select,
  Modal,
  Badge,
  Tag,
  Empty,
} from '@/components/ui';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  MapPin,
  Grid3X3,
  AlertTriangle,
} from 'lucide-react';
import type { Stall, StallStatus } from '@/types';
import { cn } from '@/lib/utils';

const STATUS_OPTIONS = [
  { value: 'all', label: '全部状态' },
  { value: 'available', label: '可用' },
  { value: 'maintenance', label: '维修中' },
  { value: 'disabled', label: '停用' },
];

const STATUS_LABELS: Record<StallStatus, string> = {
  available: '可用',
  maintenance: '维修中',
  disabled: '停用',
};

const STATUS_VARIANTS: Record<StallStatus, 'success' | 'warning' | 'danger'> = {
  available: 'success',
  maintenance: 'warning',
  disabled: 'danger',
};

const ZONE_PRESETS = [
  { value: 'A区', label: 'A区' },
  { value: 'B区', label: 'B区' },
  { value: 'C区', label: 'C区' },
  { value: 'D区', label: 'D区' },
  { value: '入口处', label: '入口处' },
  { value: '美食街', label: '美食街' },
];

const TAG_COLORS: Array<'primary' | 'success' | 'danger' | 'warning' | 'info' | 'pink' | 'purple' | 'teal'> = [
  'primary', 'success', 'warning', 'info', 'pink', 'purple', 'teal',
];

export default function StallList() {
  const { stalls, createStall, updateStall, deleteStall, addToast } = useAppStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [zoneFilter, setZoneFilter] = useState('all');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingStall, setEditingStall] = useState<Stall | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [formCode, setFormCode] = useState('');
  const [formName, setFormName] = useState('');
  const [formZone, setFormZone] = useState('');
  const [formArea, setFormArea] = useState<number | ''>('');
  const [formCategories, setFormCategories] = useState<string[]>([]);
  const [categoryInput, setCategoryInput] = useState('');
  const [formStatus, setFormStatus] = useState<StallStatus>('available');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const uniqueZones = useMemo(() => {
    const zones = Array.from(new Set(stalls.map((s) => s.zone))).filter(Boolean);
    return zones;
  }, [stalls]);

  const availableCount = useMemo(
    () => stalls.filter((s) => s.status === 'available').length,
    [stalls]
  );

  const filteredStalls = useMemo(() => {
    return stalls.filter((stall) => {
      if (statusFilter !== 'all' && stall.status !== statusFilter) return false;
      if (zoneFilter !== 'all' && stall.zone !== zoneFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (
          !stall.code.toLowerCase().includes(q) &&
          !stall.name.toLowerCase().includes(q) &&
          !stall.zone.toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [stalls, statusFilter, zoneFilter, searchQuery]);

  const openCreateModal = () => {
    setEditingStall(null);
    setFormCode('');
    setFormName('');
    setFormZone('');
    setFormArea('');
    setFormCategories([]);
    setCategoryInput('');
    setFormStatus('available');
    setFormErrors({});
    setModalOpen(true);
  };

  const openEditModal = (stall: Stall) => {
    setEditingStall(stall);
    setFormCode(stall.code);
    setFormName(stall.name);
    setFormZone(stall.zone);
    setFormArea(stall.area);
    setFormCategories([...stall.suitableCategories]);
    setCategoryInput('');
    setFormStatus(stall.status);
    setFormErrors({});
    setModalOpen(true);
  };

  const handleAddCategory = () => {
    const val = categoryInput.trim();
    if (val && !formCategories.includes(val)) {
      setFormCategories([...formCategories, val]);
    }
    setCategoryInput('');
  };

  const handleCategoryKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddCategory();
    }
  };

  const removeCategory = (cat: string) => {
    setFormCategories(formCategories.filter((c) => c !== cat));
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formCode.trim()) errors.code = '请输入摊位编号';
    if (!formZone.trim()) errors.zone = '请选择或输入位置区域';
    if (formArea === '' || isNaN(Number(formArea)) || Number(formArea) <= 0) {
      errors.area = '请输入有效面积';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    if (editingStall) {
      updateStall(editingStall.id, {
        code: formCode.trim(),
        name: formName.trim(),
        zone: formZone.trim(),
        area: Number(formArea),
        suitableCategories: formCategories,
        status: formStatus,
      });
      addToast('success', `摊位 ${formCode} 已更新`);
    } else {
      createStall({
        code: formCode.trim(),
        name: formName.trim() || formCode.trim(),
        zone: formZone.trim(),
        area: Number(formArea),
        suitableCategories: formCategories,
        status: formStatus,
      });
      addToast('success', `摊位 ${formCode} 已创建`);
    }
    setModalOpen(false);
  };

  const handleDelete = (id: string) => {
    const stall = stalls.find((s) => s.id === id);
    if (stall) {
      deleteStall(id);
      addToast('success', `摊位 ${stall.code} 已删除`);
    }
    setDeleteConfirmId(null);
  };

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                <Grid3X3 className="w-7 h-7 text-primary" />
                摊位管理
              </h1>
              <p className="text-sm text-gray-400 mt-1">
                共 {stalls.length} 个摊位，{availableCount} 个可用
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索编号/名称/区域..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-dark-bg border border-dark-border text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={STATUS_OPTIONS}
                containerClassName="sm:w-36"
              />
              <Select
                value={zoneFilter}
                onChange={(e) => setZoneFilter(e.target.value)}
                options={[
                  { value: 'all', label: '全部区域' },
                  ...uniqueZones.map((z) => ({ value: z, label: z })),
                ]}
                containerClassName="sm:w-36"
              />
              <Button onClick={openCreateModal} className="whitespace-nowrap">
                <Plus className="w-4 h-4" />
                新增摊位
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {filteredStalls.length === 0 ? (
        <Card>
          <CardContent>
            <Empty
              title="暂无摊位"
              description={stalls.length === 0 ? '点击上方按钮创建第一个摊位吧' : '没有符合筛选条件的摊位'}
              action={
                stalls.length === 0 ? (
                  <Button onClick={openCreateModal}>
                    <Plus className="w-4 h-4" />
                    新增摊位
                  </Button>
                ) : null
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filteredStalls.map((stall, idx) => (
            <div
              key={stall.id}
              className={cn(
                'animate-slide-up',
                'relative rounded-2xl bg-dark-card border shadow-card-glow',
                'transition-all duration-300 ease-out',
                'hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(255,107,53,0.25),0_8px_32px_rgba(0,0,0,0.5)]',
                stall.status === 'available'
                  ? 'border-primary/30'
                  : 'border-dark-border opacity-60 grayscale',
                'flex flex-col',
                'min-h-[260px]'
              )}
              style={{ animationDelay: `${Math.min(idx * 40, 400)}ms` }}
            >
              <div className="absolute top-3 right-3 z-10">
                <Badge variant={STATUS_VARIANTS[stall.status]} size="sm" dot>
                  {STATUS_LABELS[stall.status]}
                </Badge>
              </div>

              <div className="flex flex-col items-center justify-center flex-1 px-4 pt-6 pb-3">
                <div className="text-3xl font-display text-primary mb-2 tracking-wider">
                  {stall.code}
                </div>
                <div className="text-sm font-medium text-white text-center mb-2 truncate max-w-full px-2">
                  {stall.name}
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-400 mb-3">
                  <MapPin className="w-3 h-3" />
                  <span>{stall.zone}</span>
                  <span className="mx-1">·</span>
                  <span>{stall.area}㎡</span>
                </div>
                <div className="flex flex-wrap gap-1 justify-center max-w-full px-1 min-h-[28px]">
                  {stall.suitableCategories.slice(0, 2).map((cat, i) => (
                    <Tag
                      key={cat}
                      variant={TAG_COLORS[i % TAG_COLORS.length]}
                      className="text-[10px] px-1.5 py-0.5"
                    >
                      {cat}
                    </Tag>
                  ))}
                  {stall.suitableCategories.length > 2 && (
                    <Tag variant="default" className="text-[10px] px-1.5 py-0.5">
                      +{stall.suitableCategories.length - 2}
                    </Tag>
                  )}
                </div>
              </div>

              <div className="flex gap-2 px-4 pb-4 pt-2 border-t border-dark-border/50">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openEditModal(stall)}
                  className="flex-1"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  编辑
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeleteConfirmId(stall.id)}
                  className="flex-1 text-danger hover:text-danger border border-transparent hover:border-danger/30 hover:bg-danger/10"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  删除
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingStall ? '编辑摊位' : '新增摊位'}
        description={editingStall ? '修改摊位信息' : '创建一个新的摊位'}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSubmit}>
              {editingStall ? '保存修改' : '创建摊位'}
            </Button>
          </>
        }
      >
        <div className="space-y-4 pb-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="摊位编号 *"
              value={formCode}
              onChange={(e) => setFormCode(e.target.value)}
              placeholder="如 A01"
              error={formErrors.code}
            />
            <Input
              label="摊位名称"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="如 烧烤一号位"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="位置区域 *"
              value={ZONE_PRESETS.some((z) => z.value === formZone) ? formZone : ''}
              onChange={(e) => setFormZone(e.target.value)}
              options={ZONE_PRESETS}
              placeholder="选择区域..."
              error={formErrors.zone}
            />
            <Input
              label={`或自定义输入${formZone && !ZONE_PRESETS.some((z) => z.value === formZone) ? '' : '区域'}`}
              value={ZONE_PRESETS.some((z) => z.value === formZone) ? '' : formZone}
              onChange={(e) => setFormZone(e.target.value)}
              placeholder="输入自定义区域名"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="面积 (㎡) *"
              type="number"
              min="0"
              step="0.1"
              value={formArea}
              onChange={(e) =>
                setFormArea(e.target.value === '' ? '' : Number(e.target.value))
              }
              placeholder="如 8.5"
              error={formErrors.area}
            />
            <Select
              label="状态"
              value={formStatus}
              onChange={(e) => setFormStatus(e.target.value as StallStatus)}
              options={[
                { value: 'available', label: '可用' },
                { value: 'maintenance', label: '维修中' },
                { value: 'disabled', label: '停用' },
              ]}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-300 leading-none block mb-1.5">
              适合品类
            </label>
            <div className="flex flex-wrap gap-2 mb-2 min-h-[32px]">
              {formCategories.map((cat, i) => (
                <Tag
                  key={cat}
                  variant={TAG_COLORS[i % TAG_COLORS.length]}
                  closable
                  onClose={() => removeCategory(cat)}
                >
                  {cat}
                </Tag>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={categoryInput}
                onChange={(e) => setCategoryInput(e.target.value)}
                onKeyDown={handleCategoryKeyDown}
                placeholder="输入品类后回车或逗号添加"
                containerClassName="flex-1"
              />
              <Button variant="outline" onClick={handleAddCategory}>
                添加
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-1.5">
              按回车键或逗号键快速添加品类标签
            </p>
          </div>
        </div>
      </Modal>

      <Modal
        open={deleteConfirmId !== null}
        onClose={() => setDeleteConfirmId(null)}
        title="确认删除"
        description="此操作不可撤销，删除后相关排班数据中的摊位引用将保留为无效ID。"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteConfirmId(null)}>
              取消
            </Button>
            <Button
              variant="danger"
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
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
              确定要删除这个摊位吗？
            </p>
            <p className="text-xs text-gray-400">
              摊位编号：{stalls.find((s) => s.id === deleteConfirmId)?.code}
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
