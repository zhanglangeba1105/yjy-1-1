import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  UserPlus,
  Edit2,
  Trash2,
  Calendar,
  AlertTriangle,
  X,
  Plus,
  Phone,
  Tag as TagIcon,
} from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useAppStore } from '@/store';
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  Button,
  Input,
  Select,
  Badge,
  Tag,
  Modal,
  Empty,
} from '@/components/ui';
import type { Vendor, VendorStatus } from '@/types';
import { cn } from '@/lib/utils';

type StatusFilter = 'all' | VendorStatus;

const STATUS_OPTIONS = [
  { value: 'all', label: '全部' },
  { value: 'normal', label: '正常' },
  { value: 'leave', label: '请假' },
  { value: 'disabled', label: '禁用' },
] as const;

const STATUS_LABEL_MAP: Record<VendorStatus, string> = {
  normal: '正常',
  leave: '请假',
  disabled: '禁用',
};

const STATUS_BADGE_MAP: Record<VendorStatus, 'success' | 'warning' | 'danger'> = {
  normal: 'success',
  leave: 'warning',
  disabled: 'danger',
};

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

function getTagVariantFromCategory(category: string): 'primary' | 'success' | 'danger' | 'warning' | 'info' | 'pink' | 'purple' | 'teal' {
  const c = category.toLowerCase();
  if (c.includes('面') || c.includes('粉')) return 'pink';
  if (c.includes('烤') || c.includes('肉')) return 'danger';
  if (c.includes('奶茶') || c.includes('茶') || c.includes('饮')) return 'primary';
  if (c.includes('炸') || c.includes('串') || c.includes('小吃')) return 'warning';
  if (c.includes('海鲜')) return 'info';
  if (c.includes('寿司') || c.includes('日料')) return 'purple';
  if (c.includes('火锅')) return 'teal';
  return 'success';
}

interface VendorFormData {
  name: string;
  phone: string;
  category: string;
  status: VendorStatus;
  unavailableDates: string[];
}

type VendorFormErrors = Partial<Record<keyof VendorFormData, string>>;

const INITIAL_FORM_DATA: VendorFormData = {
  name: '',
  phone: '',
  category: '',
  status: 'normal',
  unavailableDates: [],
};

export default function VendorList() {
  const {
    vendors,
    schedules,
    createVendor,
    updateVendor,
    deleteVendor,
    addToast,
  } = useAppStore();

  const [searchKeyword, setSearchKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [formData, setFormData] = useState<VendorFormData>(INITIAL_FORM_DATA);
  const [formErrors, setFormErrors] = useState<VendorFormErrors>({});

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingVendor, setDeletingVendor] = useState<Vendor | null>(null);

  const [newDate, setNewDate] = useState('');

  const allCategories = useMemo(() => {
    const set = new Set<string>();
    vendors.forEach((v) => v.category && set.add(v.category));
    return Array.from(set);
  }, [vendors]);

  const filteredVendors = useMemo(() => {
    return vendors.filter((v) => {
      if (statusFilter !== 'all' && v.status !== statusFilter) return false;
      if (categoryFilter && v.category !== categoryFilter) return false;
      if (searchKeyword.trim()) {
        const kw = searchKeyword.trim().toLowerCase();
        const matchName = v.name.toLowerCase().includes(kw);
        const matchPhone = v.phone.includes(kw);
        const matchCategory = v.category.toLowerCase().includes(kw);
        if (!matchName && !matchPhone && !matchCategory) return false;
      }
      return true;
    });
  }, [vendors, statusFilter, statusFilter, searchKeyword]);

  const openCreateModal = () => {
    setEditingVendor(null);
    setFormData(INITIAL_FORM_DATA);
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (vendor: Vendor) => {
    setEditingVendor(vendor);
    setFormData({
      name: vendor.name,
      phone: vendor.phone,
      category: vendor.category,
      status: vendor.status,
      unavailableDates: [...vendor.unavailableDates],
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingVendor(null);
    setFormData(INITIAL_FORM_DATA);
    setFormErrors({});
    setNewDate('');
  };

  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof VendorFormData, string>> = {};
    if (!formData.name.trim()) {
      errors.name = '请输入姓名';
    }
    if (!formData.phone.trim()) {
      errors.phone = '请输入电话';
    } else if (!/^1[3-9]\d{9}$/.test(formData.phone.trim())) {
      errors.phone = '请输入正确的手机号';
    }
    if (!formData.category.trim()) {
      errors.category = '请输入主营品类';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    try {
      if (editingVendor) {
        const updated = updateVendor(editingVendor.id, {
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          category: formData.category.trim(),
          status: formData.status,
          unavailableDates: formData.unavailableDates,
        });
        if (updated) {
          addToast('success', `摊主「${updated.name}」已更新`);
        }
      } else {
        const created = createVendor({
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          category: formData.category.trim(),
          status: formData.status,
          unavailableDates: formData.unavailableDates,
        });
        addToast('success', `摊主「${created.name}」已创建`);
      }
      closeModal();
    } catch {
      addToast('error', '操作失败，请重试');
    }
  };

  const addUnavailableDate = () => {
    if (!newDate) return;
    if (formData.unavailableDates.includes(newDate)) {
      addToast('warning', '该日期已存在');
      return;
    }
    setFormData((prev) => ({
      ...prev,
      unavailableDates: [...prev.unavailableDates, newDate].sort(),
    }));
    setNewDate('');
  };

  const removeUnavailableDate = (date: string) => {
    setFormData((prev) => ({
      ...prev,
      unavailableDates: prev.unavailableDates.filter((d) => d !== date),
    }));
  };

  const openDeleteModal = (vendor: Vendor) => {
    setDeletingVendor(vendor);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = () => {
    if (!deletingVendor) return;
    const hasSchedules = schedules.some((s) => s.vendorId === deletingVendor.id);
    const deleted = deleteVendor(deletingVendor.id);
    if (deleted) {
      addToast('success', `摊主「${deletingVendor.name}」已删除`);
      if (hasSchedules) {
        addToast('warning', '该摊主关联的排班已受影响，请检查');
      }
    }
    setIsDeleteModalOpen(false);
    setDeletingVendor(null);
  };

  const vendorHasSchedules = (vendorId: string): boolean => {
    return schedules.some((s) => s.vendorId === vendorId);
  };

  return (
    <div className="space-y-6 p-6 md:p-8 animate-slide-up">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">摊主管理</h1>
          <p className="text-gray-400">共 {vendors.length} 位摊主</p>
        </div>
        <Button variant="primary" onClick={openCreateModal}>
          <UserPlus className="w-4 h-4" />
          新增摊主
        </Button>
      </div>

      <Card>
        <CardContent className="p-5">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="搜索姓名 / 电话 / 品类"
                prefixIcon={Search}
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
              />
            </div>
            <div className="w-full lg:w-48 flex-shrink-0">
              <Select
                options={STATUS_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              />
            </div>
          </div>

          {allCategories.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-sm text-gray-400 flex items-center gap-1 mr-1">
                <TagIcon className="w-4 h-4" />
                品类：
              </span>
              <Tag
                variant={categoryFilter === null ? 'primary' : 'default'}
                onClick={() => setCategoryFilter(null)}
                className="cursor-pointer"
              >
                全部
              </Tag>
              {allCategories.map((cat) => (
                <Tag
                key={cat}
                variant={categoryFilter === cat ? getTagVariantFromCategory(cat) : 'default'}
                onClick={() => setCategoryFilter(categoryFilter === cat ? null : cat)}
                className="cursor-pointer"
              >
                {getCategoryEmoji(cat)} {cat}
              </Tag>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {filteredVendors.length === 0 ? (
        <Empty
          title="暂无摊主数据"
          description={searchKeyword || statusFilter !== 'all' || categoryFilter
            ? '没有找到符合条件的摊主，请调整筛选条件'
            : '点击右上角按钮添加第一位摊主'
          }
          action={
            <Button variant="primary" onClick={openCreateModal}>
              <UserPlus className="w-4 h-4" />
              新增摊主
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredVendors.map((vendor, index) => {
        return (
          <div
            key={vendor.id}
            className={cn(
              'opacity-0 animate-slide-up',
            )}
            style={{ animationDelay: `${(index % 9) * 50 + 50}ms` }}
          >
            <Card className="h-full flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-neon-orange/20 border border-primary/30 flex items-center justify-center text-2xl">
                      {getCategoryEmoji(vendor.category)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-lg font-semibold text-white truncate">
                        {vendor.name}
                      </h3>
                    </div>
                  </div>
                  <Badge variant={STATUS_BADGE_MAP[vendor.status]} dot size="sm">
                    {STATUS_LABEL_MAP[vendor.status]}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="flex-1 pt-0 space-y-3">
                <div className="flex flex-wrap gap-1.5">
                  <Tag variant={getTagVariantFromCategory(vendor.category)}>
                    {getCategoryEmoji(vendor.category)} {vendor.category}
                  </Tag>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-gray-500 flex-shrink-0" />
                  <span className="text-gray-300">{vendor.phone}</span>
                </div>
                {vendor.unavailableDates.length > 0 && (
                  <div className="flex items-start gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
                    <div className="flex flex-wrap gap-1">
                      <span className="text-gray-400">
                        不可出摊：{vendor.unavailableDates.length} 天
                      </span>
                    </div>
                  </div>
                )}
                <div className="pt-2">
                  <p className="text-xs text-gray-500">
                  加入时间：{format(new Date(vendor.createdAt), 'yyyy-MM-dd', { locale: zhCN })}
                  </p>
                </div>
              </CardContent>

              <CardFooter className="flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openEditModal(vendor)}
                  className="flex-1"
                >
                  <Edit2 className="w-4 h-4" />
                  编辑
                </Button>
                <Link
                  to={`/schedule?vendorId=${vendor.id}`}
                  className="flex-1"
                >
                  <Button variant="ghost" size="sm" className="w-full">
                    <Calendar className="w-4 h-4" />
                    排班
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-danger hover:bg-danger/10 hover:text-danger border border-danger/30"
                  onClick={() => openDeleteModal(vendor)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </CardFooter>
            </Card>
          </div>
        );
      })}
        </div>
      )}

      <Modal
        open={isModalOpen}
        onClose={closeModal}
        title={editingVendor ? '编辑摊主' : '新增摊主'}
        description={editingVendor ? '修改摊主信息' : '添加新的摊主信息'}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={closeModal}>
              取消
            </Button>
            <Button variant="primary" onClick={handleSubmit}>
              {editingVendor ? '保存修改' : '创建摊主'}
            </Button>
          </>
        }
      >
        <div className="space-y-4 pb-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="姓名"
              placeholder="请输入摊主姓名"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              error={formErrors.name}
              containerClassName="sm:col-span-1"
            />
            <Input
              label="电话"
              placeholder="请输入手机号"
              value={formData.phone}
              onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
              error={formErrors.phone}
              prefixIcon={Phone}
              containerClassName="sm:col-span-1"
            />
          </div>
          <Input
            label="主营品类"
            placeholder="例如：烧烤 / 麻辣烫 / 奶茶"
            value={formData.category}
            onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
            error={formErrors.category}
            prefixIcon={TagIcon}
          />
          <Select
            label="状态"
            options={[
              { value: 'normal', label: '正常 - 可正常出摊' },
              { value: 'leave', label: '请假 - 暂停出摊' },
              { value: 'disabled', label: '禁用 - 已停用' },
            ]}
            value={formData.status}
            onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value as VendorStatus }))}
          />

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300 leading-none block">
              不可出摊日期
            </label>
            <div className="flex gap-2">
              <Input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                containerClassName="flex-1"
              />
              <Button variant="outline" size="md" onClick={addUnavailableDate}>
                <Plus className="w-4 h-4" />
                添加
              </Button>
            </div>
            {formData.unavailableDates.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {formData.unavailableDates.map((date) => (
                  <Tag key={date} variant="warning" closable onClose={() => removeUnavailableDate(date)}>
                    <Calendar className="w-3 h-3" />
                    {date}
                  </Tag>
                ))}
              </div>
            )}
            {formData.unavailableDates.length === 0 && (
              <p className="text-xs text-gray-500 mt-1">
                暂无不可出摊日期（可选）
              </p>
            )}
          </div>
        </div>
      </Modal>

      <Modal
        open={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeletingVendor(null);
        }}
        title="确认删除"
        description="此操作不可撤销"
        size="sm"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setIsDeleteModalOpen(false);
                setDeletingVendor(null);
              }}
            >
              取消
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              <Trash2 className="w-4 h-4" />
              确认删除
            </Button>
          </>
        }
      >
        <div className="space-y-4 pb-2">
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-danger/10 border border-danger/20">
            <div className="w-14 h-14 rounded-2xl bg-danger/20 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-7 h-7 text-danger" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-white">
                确定要删除「{deletingVendor?.name}」吗？
              </p>
              <p className="text-sm text-gray-400">
                {deletingVendor && vendorHasSchedules(deletingVendor.id)
                  ? '⚠️ 该摊主有关联排班记录，删除后相关排班将受影响'
                  : '删除后数据无法恢复'}
              </p>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
