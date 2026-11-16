import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, getErrorMessage } from '@/lib/api';
import { UserRole, RoleLabelsPersian } from '@nit-help/shared';
import { toPersianDigits, formatPersianDate } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { LoadingSpinner, EmptyState } from '@/components/ui/empty-state';
import {
  Users,
  PlusCircle,
  Search,
  CheckCircle,
  XCircle,
  Edit,
  Shield,
  Building2,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';

export const UsersManagementPage: React.FC = () => {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [page, setPage] = useState(1);

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);

  // Form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.STUDENT);
  const [departmentId, setDepartmentId] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);

  // Fetch departments
  const { data: departments } = useQuery({
    queryKey: ['admin-departments'],
    queryFn: async () => {
      const res = await api.get('/departments');
      return res.data;
    },
  });

  // Fetch users
  const { data: usersData, isLoading } = useQuery({
    queryKey: ['admin-users', page, search, roleFilter, deptFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('page', String(page));
      params.append('limit', '15');
      if (search) params.append('search', search);
      if (roleFilter) params.append('role', roleFilter);
      if (deptFilter) params.append('departmentId', deptFilter);

      const res = await api.get(`/users?${params.toString()}`);
      return res.data;
    },
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/users', {
        fullName: fullName.trim(),
        email: email.trim(),
        username: username.trim(),
        password,
        role,
        departmentId: departmentId || null,
      });
      return res.data;
    },
    onSuccess: () => {
      setCreateModalOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (err: any) => {
      setFormError(getErrorMessage(err));
    },
  });

  // Edit user mutation
  const editUserMutation = useMutation({
    mutationFn: async () => {
      const res = await api.patch(`/users/${editingUser.id}`, {
        fullName: fullName.trim(),
        email: email.trim(),
        role,
        departmentId: departmentId || null,
        password: password.trim() ? password.trim() : undefined,
      });
      return res.data;
    },
    onSuccess: () => {
      setEditModalOpen(false);
      setEditingUser(null);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (err: any) => {
      setFormError(getErrorMessage(err));
    },
  });

  // Toggle status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: async (userId: string) => {
      await api.patch(`/users/${userId}/status`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });

  const resetForm = () => {
    setFullName('');
    setEmail('');
    setUsername('');
    setPassword('');
    setRole(UserRole.STUDENT);
    setDepartmentId('');
    setFormError(null);
  };

  const openEditModal = (u: any) => {
    setEditingUser(u);
    setFullName(u.fullName);
    setEmail(u.email);
    setUsername(u.username);
    setPassword('');
    setRole(u.role);
    setDepartmentId(u.departmentId || '');
    setFormError(null);
    setEditModalOpen(true);
  };

  const users = usersData?.data || [];
  const total = usersData?.total || 0;
  const totalPages = usersData?.totalPages || 1;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-foreground flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            مدیریت کاربران و دسترسی‌ها
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            تعریف، ویرایش، تخصیص نقش‌ها، دپارتمان‌ها و تعیین وضعیت حساب‌های کاربری
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
          <span>افزودن کاربر جدید</span>
        </Button>
      </div>

      {/* Filters Bar */}
      <Card>
        <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Input
              type="text"
              placeholder="جستجو در نام، نام کاربری یا ایمیل..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pr-9"
            />
            <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
            className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-xs"
          >
            <option value="">همه نقش‌ها</option>
            {Object.values(UserRole).map((r) => (
              <option key={r} value={r}>
                {RoleLabelsPersian[r]}
              </option>
            ))}
          </select>

          <select
            value={deptFilter}
            onChange={(e) => {
              setDeptFilter(e.target.value);
              setPage(1);
            }}
            className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-xs"
          >
            <option value="">همه دپارتمان‌ها</option>
            {(departments || []).map((d: any) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <LoadingSpinner />
          ) : users.length === 0 ? (
            <EmptyState
              icon={Users}
              title="کاربری یافت نشد"
              description="با معیارهای جستجوی فعلی کاربری پیدا نشد."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-muted/50 text-muted-foreground border-b border-border">
                  <tr>
                    <th className="py-3 px-4 font-semibold">نام و نام خانوادگی</th>
                    <th className="py-3 px-4 font-semibold">ایمیل دانشگاهی</th>
                    <th className="py-3 px-4 font-semibold">نام کاربری</th>
                    <th className="py-3 px-4 font-semibold">نقش سازمانی</th>
                    <th className="py-3 px-4 font-semibold">دپارتمان</th>
                    <th className="py-3 px-4 font-semibold">وضعیت</th>
                    <th className="py-3 px-4 font-semibold text-center">اقدامات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {users.map((u: any) => (
                    <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-foreground">
                        {u.fullName}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-muted-foreground">
                        {u.email}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-foreground">
                        {u.username}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-secondary text-primary border border-primary/20">
                          {RoleLabelsPersian[u.role as keyof typeof RoleLabelsPersian]}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-muted-foreground">
                        {u.departmentName || '—'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                            u.isActive
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {u.isActive ? (
                            <>
                              <CheckCircle className="h-3 w-3" />
                              فعال
                            </>
                          ) : (
                            <>
                              <XCircle className="h-3 w-3" />
                              غیرفعال
                            </>
                          )}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => openEditModal(u)}
                            className="h-7 px-2.5 text-xs gap-1"
                          >
                            <Edit className="h-3 w-3" />
                            <span>ویرایش</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleStatusMutation.mutate(u.id)}
                            className={`h-7 px-2.5 text-xs ${
                              u.isActive
                                ? 'text-rose-600 hover:bg-rose-50 hover:border-rose-200'
                                : 'text-emerald-600 hover:bg-emerald-50 hover:border-emerald-200'
                            }`}
                          >
                            {u.isActive ? 'غیرفعال‌سازی' : 'فعال‌سازی'}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-border text-xs text-muted-foreground">
              <div>
                نمایش صفحه {toPersianDigits(page)} از {toPersianDigits(totalPages)} (مجموع {toPersianDigits(total)} کاربر)
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="gap-1 h-8 px-2.5"
                >
                  <ChevronRight className="h-4 w-4" />
                  <span>قبلی</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="gap-1 h-8 px-2.5"
                >
                  <span>بعدی</span>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* CREATE USER MODAL */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogHeader>
          <DialogTitle>افزودن حساب کاربری جدید</DialogTitle>
          <DialogDescription>اطلاعات کاربری و نقش فرد را در سامانه مشخص فرمایید.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {formError && (
            <div className="p-3 text-xs rounded-lg bg-destructive/10 text-destructive border border-destructive/20">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold">نام و نام خانوادگی *</label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold">ایمیل دانشگاهی *</label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold">نام کاربری *</label>
              <Input value={username} onChange={(e) => setUsername(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold">رمز عبور اولیه *</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="حداقل ۶ نویسه"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold">نقش سازمانی *</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-xs"
              >
                {Object.values(UserRole).map((r) => (
                  <option key={r} value={r}>
                    {RoleLabelsPersian[r]}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold">دپارتمان (برای کادر اداری و کارشناسان)</label>
              <select
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-xs"
              >
                <option value="">بدون دپارتمان</option>
                {(departments || []).map((d: any) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setCreateModalOpen(false)}>
            انصراف
          </Button>
          <Button
            onClick={() => createUserMutation.mutate()}
            isLoading={createUserMutation.isPending}
          >
            ایجاد حساب کاربری
          </Button>
        </DialogFooter>
      </Dialog>

      {/* EDIT USER MODAL */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogHeader>
          <DialogTitle>ویرایش مشخصات کاربر</DialogTitle>
          <DialogDescription>
            تغییر نام، نقش، دپارتمان یا ریست کردن رمز عبور کاربر
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {formError && (
            <div className="p-3 text-xs rounded-lg bg-destructive/10 text-destructive border border-destructive/20">
              {formError}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold">نام و نام خانوادگی</label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold">ایمیل دانشگاهی</label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold">نقش سازمانی</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-xs"
              >
                {Object.values(UserRole).map((r) => (
                  <option key={r} value={r}>
                    {RoleLabelsPersian[r]}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold">دپارتمان</label>
              <select
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-xs"
              >
                <option value="">بدون دپارتمان</option>
                {(departments || []).map((d: any) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-border">
            <label className="text-xs font-bold">رمز عبور جدید (تنها در صورت تمایل به تغییر وارد کنید)</label>
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setEditModalOpen(false)}>
            انصراف
          </Button>
          <Button
            onClick={() => editUserMutation.mutate()}
            isLoading={editUserMutation.isPending}
          >
            ذخیره تغییرات
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
};

