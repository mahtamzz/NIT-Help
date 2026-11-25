import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, getErrorMessage } from '@/lib/api';
import { TicketPriority, TicketPriorityLabelsPersian } from '@nit-help/shared';
import { toPersianDigits, getPriorityBadgeVariant } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { LoadingSpinner, EmptyState } from '@/components/ui/empty-state';
import { Settings2, PlusCircle, Edit, FolderPlus, Layers, Clock, Building2 } from 'lucide-react';

export const ServicesManagementPage: React.FC = () => {
  const queryClient = useQueryClient();

  // Modals
  const [createCategoryModalOpen, setCreateCategoryModalOpen] = useState(false);
  const [createServiceModalOpen, setCreateServiceModalOpen] = useState(false);
  const [editServiceModalOpen, setEditServiceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<any | null>(null);

  // Category form states
  const [categoryName, setCategoryName] = useState('');
  const [categoryDesc, setCategoryDesc] = useState('');
  const [categoryIcon, setCategoryIcon] = useState('Folder');

  // Service form states
  const [serviceName, setServiceName] = useState('');
  const [serviceDesc, setServiceDesc] = useState('');
  const [serviceCategoryId, setServiceCategoryId] = useState('');
  const [serviceDeptId, setServiceDeptId] = useState('');
  const [defaultPriority, setDefaultPriority] = useState<TicketPriority>(TicketPriority.NORMAL);
  const [targetHours, setTargetHours] = useState(24);
  const [isServiceActive, setIsServiceActive] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);

  // Fetch categories with nested services
  const { data: categories, isLoading } = useQuery({
    queryKey: ['admin-categories-services'],
    queryFn: async () => {
      const res = await api.get('/services/categories?includeInactive=true');
      return res.data;
    },
  });

  // Fetch departments for dropdown
  const { data: departments } = useQuery({
    queryKey: ['admin-dept-options'],
    queryFn: async () => {
      const res = await api.get('/departments');
      return res.data;
    },
  });

  // Create Category Mutation
  const createCategoryMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/services/categories', {
        name: categoryName.trim(),
        description: categoryDesc.trim() || undefined,
        icon: categoryIcon,
      });
      return res.data;
    },
    onSuccess: () => {
      setCreateCategoryModalOpen(false);
      setCategoryName('');
      setCategoryDesc('');
      queryClient.invalidateQueries({ queryKey: ['admin-categories-services'] });
    },
    onError: (err: any) => setFormError(getErrorMessage(err)),
  });

  // Create Service Mutation
  const createServiceMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/services', {
        name: serviceName.trim(),
        description: serviceDesc.trim() || undefined,
        categoryId: serviceCategoryId,
        departmentId: serviceDeptId,
        defaultPriority,
        targetResolutionHours: Number(targetHours),
      });
      return res.data;
    },
    onSuccess: () => {
      setCreateServiceModalOpen(false);
      resetServiceForm();
      queryClient.invalidateQueries({ queryKey: ['admin-categories-services'] });
    },
    onError: (err: any) => setFormError(getErrorMessage(err)),
  });

  // Edit Service Mutation
  const editServiceMutation = useMutation({
    mutationFn: async () => {
      const res = await api.patch(`/services/${editingService.id}`, {
        name: serviceName.trim(),
        description: serviceDesc.trim() || undefined,
        categoryId: serviceCategoryId,
        departmentId: serviceDeptId,
        defaultPriority,
        targetResolutionHours: Number(targetHours),
        isActive: isServiceActive,
      });
      return res.data;
    },
    onSuccess: () => {
      setEditServiceModalOpen(false);
      setEditingService(null);
      resetServiceForm();
      queryClient.invalidateQueries({ queryKey: ['admin-categories-services'] });
    },
    onError: (err: any) => setFormError(getErrorMessage(err)),
  });

  const resetServiceForm = () => {
    setServiceName('');
    setServiceDesc('');
    setServiceCategoryId('');
    setServiceDeptId('');
    setDefaultPriority(TicketPriority.NORMAL);
    setTargetHours(24);
    setIsServiceActive(true);
    setFormError(null);
  };

  const openEditService = (s: any) => {
    setEditingService(s);
    setServiceName(s.name);
    setServiceDesc(s.description || '');
    setServiceCategoryId(s.categoryId);
    setServiceDeptId(s.departmentId);
    setDefaultPriority(s.defaultPriority);
    setTargetHours(s.targetResolutionHours);
    setIsServiceActive(s.isActive);
    setFormError(null);
    setEditServiceModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-foreground flex items-center gap-2">
            <Settings2 className="h-6 w-6 text-primary" />
            مدیریت دسته‌بندی‌ها و خدمات میز خدمت
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            تعریف خدمات قابل ارائه به دانشجویان و پرسنل، تخصیص واحد و تنظیم زمان پاسخ‌گویی (SLA)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setFormError(null);
              setCreateCategoryModalOpen(true);
            }}
            className="gap-2 text-xs"
          >
            <FolderPlus className="h-4 w-4" />
            <span>دسته‌بندی جدید</span>
          </Button>

          <Button
            onClick={() => {
              resetServiceForm();
              setCreateServiceModalOpen(true);
            }}
            className="gap-2 text-xs shadow-xs"
          >
            <PlusCircle className="h-4 w-4" />
            <span>خدمت جدید</span>
          </Button>
        </div>
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : (categories || []).length === 0 ? (
        <EmptyState title="هیچ دسته‌بندی خدمتی ثبت نشده است" />
      ) : (
        <div className="space-y-6">
          {categories.map((c: any) => (
            <Card key={c.id}>
              <CardHeader className="p-5 pb-3 border-b border-border bg-muted/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="h-5 w-5 text-primary" />
                    <CardTitle className="text-base font-bold">{c.name}</CardTitle>
                    <span className="text-xs text-muted-foreground">
                      ({toPersianDigits(c.services?.length || 0)} خدمت)
                    </span>
                  </div>
                </div>
                {c.description && (
                  <p className="text-xs text-muted-foreground mt-1">{c.description}</p>
                )}
              </CardHeader>

              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {(c.services || []).map((s: any) => (
                    <div
                      key={s.id}
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/30 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-foreground">{s.name}</h4>
                          <span
                            className={`text-[10px] px-2 py-0.2 rounded-md border font-semibold ${getPriorityBadgeVariant(
                              s.defaultPriority,
                            )}`}
                          >
                            اولویت {TicketPriorityLabelsPersian[s.defaultPriority as keyof typeof TicketPriorityLabelsPersian]}
                          </span>
                          {!s.isActive && (
                            <span className="text-[10px] px-2 py-0.2 rounded-md bg-rose-50 text-rose-700 border border-rose-200">
                              غیرفعال
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl">
                          {s.description || 'بدون شرح'}
                        </p>
                        <div className="flex items-center gap-4 text-[11px] text-muted-foreground pt-1">
                          <span className="flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            واحد مسئول: {s.department?.name || 'نامشخص'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            هدف پاسخ‌گویی: {toPersianDigits(s.targetResolutionHours)} ساعت
                          </span>
                        </div>
                      </div>

                      <div className="self-end sm:self-center shrink-0">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => openEditService(s)}
                          className="h-7 px-3 text-xs gap-1"
                        >
                          <Edit className="h-3 w-3" />
                          <span>ویرایش</span>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* CREATE CATEGORY MODAL */}
      <Dialog open={createCategoryModalOpen} onOpenChange={setCreateCategoryModalOpen}>
        <DialogHeader>
          <DialogTitle>ایجاد دسته‌بندی جدید خدمات</DialogTitle>
          <DialogDescription>یک دسته‌بندی برای تجمیع خدمات هم‌خانواده تعریف کنید.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {formError && (
            <div className="p-3 text-xs rounded-lg bg-destructive/10 text-destructive border border-destructive/20">
              {formError}
            </div>
          )}
          <div className="space-y-1.5">
            <label className="text-xs font-bold">نام دسته‌بندی *</label>
            <Input value={categoryName} onChange={(e) => setCategoryName(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold">شرح دسته‌بندی</label>
            <Textarea
              rows={3}
              value={categoryDesc}
              onChange={(e) => setCategoryDesc(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setCreateCategoryModalOpen(false)}>
            انصراف
          </Button>
          <Button
            onClick={() => createCategoryMutation.mutate()}
            isLoading={createCategoryMutation.isPending}
          >
            ثبت دسته‌بندی
          </Button>
        </DialogFooter>
      </Dialog>

      {/* CREATE SERVICE MODAL */}
      <Dialog open={createServiceModalOpen} onOpenChange={setCreateServiceModalOpen}>
        <DialogHeader>
          <DialogTitle>افزودن خدمت جدید به میز خدمت</DialogTitle>
          <DialogDescription>مشخصات خدمت، واحد پاسخگو و سقف زمان رسیدگی را تعیین کنید.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {formError && (
            <div className="p-3 text-xs rounded-lg bg-destructive/10 text-destructive border border-destructive/20">
              {formError}
            </div>
          )}
          <div className="space-y-1.5">
            <label className="text-xs font-bold">نام خدمت *</label>
            <Input value={serviceName} onChange={(e) => setServiceName(e.target.value)} required />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold">دسته‌بندی مربوطه *</label>
              <select
                value={serviceCategoryId}
                onChange={(e) => setServiceCategoryId(e.target.value)}
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-xs"
                required
              >
                <option value="">-- انتخاب دسته‌بندی --</option>
                {(categories || []).map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold">واحد پاسخگو *</label>
              <select
                value={serviceDeptId}
                onChange={(e) => setServiceDeptId(e.target.value)}
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-xs"
                required
              >
                <option value="">-- انتخاب دپارتمان --</option>
                {(departments || []).map((d: any) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold">اولویت پیش‌فرض</label>
              <select
                value={defaultPriority}
                onChange={(e) => setDefaultPriority(e.target.value as TicketPriority)}
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-xs"
              >
                {Object.values(TicketPriority).map((p) => (
                  <option key={p} value={p}>
                    {TicketPriorityLabelsPersian[p]}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold">هدف زمان پاسخ‌دهی (ساعت کاری)</label>
              <Input
                type="number"
                min="1"
                value={targetHours}
                onChange={(e) => setTargetHours(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold">شرح و راهنمای ثبت درخواست برای کاربران</label>
            <Textarea
              rows={3}
              value={serviceDesc}
              onChange={(e) => setServiceDesc(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setCreateServiceModalOpen(false)}>
            انصراف
          </Button>
          <Button
            onClick={() => createServiceMutation.mutate()}
            isLoading={createServiceMutation.isPending}
          >
            ایجاد خدمت
          </Button>
        </DialogFooter>
      </Dialog>

      {/* EDIT SERVICE MODAL */}
      <Dialog open={editServiceModalOpen} onOpenChange={setEditServiceModalOpen}>
        <DialogHeader>
          <DialogTitle>ویرایش خدمت</DialogTitle>
          <DialogDescription>تغییر پارامترها و فعال یا غیرفعال کردن خدمت</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {formError && (
            <div className="p-3 text-xs rounded-lg bg-destructive/10 text-destructive border border-destructive/20">
              {formError}
            </div>
          )}
          <div className="space-y-1.5">
            <label className="text-xs font-bold">نام خدمت</label>
            <Input value={serviceName} onChange={(e) => setServiceName(e.target.value)} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold">دسته‌بندی</label>
              <select
                value={serviceCategoryId}
                onChange={(e) => setServiceCategoryId(e.target.value)}
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-xs"
              >
                {(categories || []).map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold">واحد پاسخگو</label>
              <select
                value={serviceDeptId}
                onChange={(e) => setServiceDeptId(e.target.value)}
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-xs"
              >
                {(departments || []).map((d: any) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold">اولویت پیش‌فرض</label>
              <select
                value={defaultPriority}
                onChange={(e) => setDefaultPriority(e.target.value as TicketPriority)}
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-xs"
              >
                {Object.values(TicketPriority).map((p) => (
                  <option key={p} value={p}>
                    {TicketPriorityLabelsPersian[p]}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold">هدف زمان پاسخ‌دهی (ساعت کاری)</label>
              <Input
                type="number"
                min="1"
                value={targetHours}
                onChange={(e) => setTargetHours(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold">شرح خدمت</label>
            <Textarea
              rows={3}
              value={serviceDesc}
              onChange={(e) => setServiceDesc(e.target.value)}
            />
          </div>

          <div className="pt-2">
            <label className="text-xs font-bold flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isServiceActive}
                onChange={(e) => setIsServiceActive(e.target.checked)}
                className="rounded border-border"
              />
              <span>خدمت فعال و در کاتالوگ قابل انتخاب باشد</span>
            </label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setEditServiceModalOpen(false)}>
            انصراف
          </Button>
          <Button
            onClick={() => editServiceMutation.mutate()}
            isLoading={editServiceMutation.isPending}
          >
            ذخیره تغییرات
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
};

