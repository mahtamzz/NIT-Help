import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, getErrorMessage } from '@/lib/api';
import { toPersianDigits, formatPersianDate } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { LoadingSpinner, EmptyState } from '@/components/ui/empty-state';
import { Building2, PlusCircle, Edit, Users, Layers, Ticket, CheckCircle, XCircle } from 'lucide-react';

export const DepartmentsManagementPage: React.FC = () => {
  const queryClient = useQueryClient();

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<any | null>(null);

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [managerId, setManagerId] = useState<string>('');
  const [isActive, setIsActive] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);

  // Fetch departments
  const { data: departments, isLoading } = useQuery({
    queryKey: ['departments-list'],
    queryFn: async () => {
      const res = await api.get('/departments');
      return res.data;
    },
  });

  // Fetch specialists for manager dropdown
  const { data: specialists } = useQuery({
    queryKey: ['admin-specialists-dropdown'],
    queryFn: async () => {
      const res = await api.get('/users/specialists');
      return res.data;
    },
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/departments', {
        name: name.trim(),
        code: code.trim(),
        description: description.trim() || undefined,
        managerId: managerId || null,
      });
      return res.data;
    },
    onSuccess: () => {
      setCreateModalOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['departments-list'] });
    },
    onError: (err: any) => {
      setFormError(getErrorMessage(err));
    },
  });

  // Edit mutation
  const editMutation = useMutation({
    mutationFn: async () => {
      const res = await api.patch(`/departments/${editingDept.id}`, {
        name: name.trim(),
        description: description.trim() || undefined,
        managerId: managerId || null,
        isActive,
      });
      return res.data;
    },
    onSuccess: () => {
      setEditModalOpen(false);
      setEditingDept(null);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['departments-list'] });
    },
    onError: (err: any) => {
      setFormError(getErrorMessage(err));
    },
  });

  const resetForm = () => {
    setName('');
    setCode('');
    setDescription('');
    setManagerId('');
    setIsActive(true);
    setFormError(null);
  };

  const openEdit = (d: any) => {
    setEditingDept(d);
    setName(d.name);
    setCode(d.code);
    setDescription(d.description || '');
    setManagerId(d.managerId || '');
    setIsActive(d.isActive);
    setFormError(null);
    setEditModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-foreground flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" />
            مدیریت دپارتمان‌ها و واحدهای دانشگاه
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            پیکربندی واحدهای سازمانی، مدیران مسئول و نظارت بر حجم خدمات هر واحد
          </p>
        </div>

        <Button
          onClick={() => {
            resetForm();
            setCreateModalOpen(true);
          }}
          className="gap-2 shadow-xs"
        >
          <PlusCircle className="h-4 w-4" />
          <span>افزودن دپارتمان جدید</span>
        </Button>
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : (departments || []).length === 0 ? (
        <EmptyState title="دپارتمانی یافت نشد" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {departments.map((d: any) => (
            <Card key={d.id} className="flex flex-col justify-between hover:shadow-md transition-shadow">
              <CardHeader className="p-5 pb-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-secondary text-primary border border-primary/20">
                    {d.code}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                      d.isActive
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}
                  >
                    {d.isActive ? 'فعال' : 'غیرفعال'}
                  </span>
                </div>
                <CardTitle className="text-base font-bold text-foreground">
                  {d.name}
                </CardTitle>
                <p className="text-xs text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
                  {d.description || 'بدون شرح'}
                </p>
              </CardHeader>

              <CardContent className="p-5 pt-0 space-y-2.5 text-xs">
                <div className="pt-2 border-t border-border flex items-center justify-between text-muted-foreground">
                  <span>مدیر واحد:</span>
                  <span className="font-semibold text-foreground">
                    {d.managerName || 'تعیین نشده'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 text-center">
                  <div className="p-2 rounded-lg bg-muted/40 border border-border">
                    <span className="text-[10px] text-muted-foreground block">کارشناسان</span>
                    <span className="font-black text-foreground text-sm">
                      {toPersianDigits(d.membersCount || 0)}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-muted/40 border border-border">
                    <span className="text-[10px] text-muted-foreground block">خدمات</span>
                    <span className="font-black text-foreground text-sm">
                      {toPersianDigits(d.servicesCount || 0)}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-muted/40 border border-border">
                    <span className="text-[10px] text-muted-foreground block">تیکت‌ها</span>
                    <span className="font-black text-primary text-sm">
                      {toPersianDigits(d.openTicketsCount || 0)}
                    </span>
                  </div>
                </div>

                <div className="pt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEdit(d)}
                    className="w-full text-xs gap-1.5"
                  >
                    <Edit className="h-3 w-3" />
                    <span>ویرایش مشخصات</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* CREATE MODAL */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogHeader>
          <DialogTitle>افزودن دپارتمان سازمانی جدید</DialogTitle>
          <DialogDescription>مشخصات واحد و کد شناسایی آن را تعیین فرمایید.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {formError && (
            <div className="p-3 text-xs rounded-lg bg-destructive/10 text-destructive border border-destructive/20">
              {formError}
            </div>
          )}
          <div className="space-y-1.5">
            <label className="text-xs font-bold">نام دپارتمان *</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold">کد یکتا (انگلیسی) *</label>
            <Input
              placeholder="مثال: IT یا EDU"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold">مدیر دپارتمان</label>
            <select
              value={managerId}
              onChange={(e) => setManagerId(e.target.value)}
              className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-xs"
            >
              <option value="">-- بدون مدیر انتخابی --</option>
              {(specialists || []).map((s: any) => (
                <option key={s.id} value={s.id}>
                  {s.fullName} ({s.departmentName || 'بدون دپارتمان'})
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold">شرح فعالیت‌های واحد</label>
            <Textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setCreateModalOpen(false)}>
            انصراف
          </Button>
          <Button
            onClick={() => createMutation.mutate()}
            isLoading={createMutation.isPending}
          >
            ایجاد دپارتمان
          </Button>
        </DialogFooter>
      </Dialog>

      {/* EDIT MODAL */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogHeader>
          <DialogTitle>ویرایش مشخصات دپارتمان</DialogTitle>
          <DialogDescription>تغییر نام، مدیر مسئول یا وضعیت فعال دپارتمان</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {formError && (
            <div className="p-3 text-xs rounded-lg bg-destructive/10 text-destructive border border-destructive/20">
              {formError}
            </div>
          )}
          <div className="space-y-1.5">
            <label className="text-xs font-bold">نام دپارتمان</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold">مدیر دپارتمان</label>
            <select
              value={managerId}
              onChange={(e) => setManagerId(e.target.value)}
              className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-xs"
            >
              <option value="">-- بدون مدیر انتخابی --</option>
              {(specialists || []).map((s: any) => (
                <option key={s.id} value={s.id}>
                  {s.fullName}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold">شرح واحد</label>
            <Textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="pt-2">
            <label className="text-xs font-bold flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="rounded border-border"
              />
              <span>دپارتمان فعال و قابل پذیرش تیکت است</span>
            </label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setEditModalOpen(false)}>
            انصراف
          </Button>
          <Button
            onClick={() => editMutation.mutate()}
            isLoading={editMutation.isPending}
          >
            ذخیره تغییرات
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
};

