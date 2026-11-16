import React, { useState } from 'react';
import { useAuth } from '@/features/auth/AuthContext';
import {
  UserRole,
  TicketStatus,
  TicketPriority,
  TicketStatusLabelsPersian,
  TicketPriorityLabelsPersian,
} from '@nit-help/shared';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import {
  toPersianDigits,
  formatPersianDate,
  getStatusBadgeVariant,
  getPriorityBadgeVariant,
} from '@/lib/utils';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoadingSpinner, EmptyState } from '@/components/ui/empty-state';
import {
  Search,
  Filter,
  PlusCircle,
  RotateCcw,
  ChevronRight,
  ChevronLeft,
  ArrowUpDown,
  Ticket,
} from 'lucide-react';

export const TicketsPage: React.FC = () => {
  const { user, hasRole } = useAuth();
  const isStaff = hasRole(UserRole.SPECIALIST, UserRole.MANAGER, UserRole.ADMIN);

  // Filter and pagination state
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('');
  const [priority, setPriority] = useState<string>('');
  const [departmentId, setDepartmentId] = useState<string>('');
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Fetch departments for filter dropdown
  const { data: departments } = useQuery({
    queryKey: ['filter-departments'],
    queryFn: async () => {
      const res = await api.get('/departments');
      return res.data;
    },
  });

  // Fetch tickets query
  const { data: ticketsData, isLoading } = useQuery({
    queryKey: ['tickets-list', page, search, status, priority, departmentId, sortBy, sortOrder],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('page', String(page));
      params.append('limit', '15');
      if (search) params.append('search', search);
      if (status) params.append('status', status);
      if (priority) params.append('priority', priority);
      if (departmentId) params.append('departmentId', departmentId);
      params.append('sortBy', sortBy);
      params.append('sortOrder', sortOrder);

      const res = await api.get(`/tickets?${params.toString()}`);
      return res.data;
    },
  });

  const tickets = ticketsData?.data || [];
  const total = ticketsData?.total || 0;
  const totalPages = ticketsData?.totalPages || 1;

  const handleResetFilters = () => {
    setSearch('');
    setStatus('');
    setPriority('');
    setDepartmentId('');
    setPage(1);
    setSortBy('createdAt');
    setSortOrder('desc');
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-foreground">
            {isStaff ? 'کارتابل مدیریت و پیگیری تیکت‌ها' : 'تیکت‌های من'}
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            {isStaff
              ? 'بررسی، تخصیص، پاسخ‌گویی و مدیریت گردش کار درخواست‌های دانشگاه'
              : 'مشاهده سوابق و وضعیت پاسخ به درخواست‌های ثبت شده'}
          </p>
        </div>

        <Link to="/tickets/new">
          <Button className="gap-2 shadow-xs">
            <PlusCircle className="h-4 w-4" />
            <span>ثبت تیکت جدید</span>
          </Button>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Search Input */}
            <div className="relative">
              <Input
                type="text"
                placeholder="جستجو در شناسه یا موضوع..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pr-9"
              />
              <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>

            {/* Status Filter */}
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">همه وضعیت‌ها</option>
              {Object.values(TicketStatus).map((s) => (
                <option key={s} value={s}>
                  {TicketStatusLabelsPersian[s]}
                </option>
              ))}
            </select>

            {/* Priority Filter */}
            <select
              value={priority}
              onChange={(e) => {
                setPriority(e.target.value);
                setPage(1);
              }}
              className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">همه اولویت‌ها</option>
              {Object.values(TicketPriority).map((p) => (
                <option key={p} value={p}>
                  {TicketPriorityLabelsPersian[p]}
                </option>
              ))}
            </select>

            {/* Department Filter (if staff) */}
            {isStaff ? (
              <select
                value={departmentId}
                onChange={(e) => {
                  setDepartmentId(e.target.value);
                  setPage(1);
                }}
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">همه دپارتمان‌ها</option>
                {(departments || []).map((d: any) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            ) : (
              <Button
                variant="outline"
                size="md"
                onClick={handleResetFilters}
                className="gap-2 text-xs"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>حذف فیلترها</span>
              </Button>
            )}
          </div>

          {isStaff && (
            <div className="flex justify-end pt-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="gap-1.5 text-xs text-muted-foreground"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>بازنشانی فیلترها</span>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tickets Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <LoadingSpinner />
          ) : tickets.length === 0 ? (
            <EmptyState
              icon={Ticket}
              title="تیکتی یافت نشد"
              description="با معیارهای جستجوی فعلی هیچ تیکتی ثبت نشده است."
              actionLabel="ثبت تیکت جدید"
              onAction={() => window.location.href = '/tickets/new'}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-muted/50 text-muted-foreground border-b border-border">
                  <tr>
                    <th className="py-3 px-4 font-semibold cursor-pointer" onClick={() => handleSort('ticketNumber')}>
                      <div className="flex items-center gap-1">
                        <span>شماره پیگیری</span>
                        <ArrowUpDown className="h-3 w-3 opacity-60" />
                      </div>
                    </th>
                    <th className="py-3 px-4 font-semibold">موضوع</th>
                    <th className="py-3 px-4 font-semibold">خدمت / واحد</th>
                    {isStaff && <th className="py-3 px-4 font-semibold">درخواست‌کننده</th>}
                    <th className="py-3 px-4 font-semibold">کارشناس مسئول</th>
                    <th className="py-3 px-4 font-semibold">اولویت</th>
                    <th className="py-3 px-4 font-semibold">وضعیت</th>
                    <th className="py-3 px-4 font-semibold cursor-pointer" onClick={() => handleSort('createdAt')}>
                      <div className="flex items-center gap-1">
                        <span>تاریخ ثبت</span>
                        <ArrowUpDown className="h-3 w-3 opacity-60" />
                      </div>
                    </th>
                    <th className="py-3 px-4 font-semibold text-center">اقدام</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {tickets.map((t: any) => (
                    <tr key={t.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-primary whitespace-nowrap">
                        <Link to={`/tickets/${t.id}`} className="hover:underline">
                          {t.ticketNumber}
                        </Link>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-foreground max-w-xs truncate">
                        <Link to={`/tickets/${t.id}`} className="hover:text-primary transition-colors">
                          {t.subject}
                        </Link>
                      </td>
                      <td className="py-3.5 px-4 text-muted-foreground">
                        <div className="font-medium text-foreground">{t.serviceName}</div>
                        <div className="text-[10px] opacity-75">{t.departmentName}</div>
                      </td>
                      {isStaff && (
                        <td className="py-3.5 px-4 text-foreground whitespace-nowrap">
                          {t.requesterName}
                        </td>
                      )}
                      <td className="py-3.5 px-4 text-muted-foreground whitespace-nowrap">
                        {t.assignedToName ? (
                          <span className="font-medium text-foreground">{t.assignedToName}</span>
                        ) : (
                          <span className="text-muted-foreground/60 italic">در صف تخصیص</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-semibold border ${getPriorityBadgeVariant(
                            t.priority,
                          )}`}
                        >
                          {TicketPriorityLabelsPersian[t.priority as keyof typeof TicketPriorityLabelsPersian]}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${getStatusBadgeVariant(
                            t.status,
                          )}`}
                        >
                          {TicketStatusLabelsPersian[t.status as keyof typeof TicketStatusLabelsPersian]}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-muted-foreground whitespace-nowrap">
                        {formatPersianDate(t.createdAt)}
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <Link to={`/tickets/${t.id}`}>
                          <Button variant="secondary" size="sm" className="h-7 px-3 text-xs">
                            مشاهده
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-border text-xs text-muted-foreground">
              <div>
                نمایش صفحه {toPersianDigits(page)} از {toPersianDigits(totalPages)} (مجموع {toPersianDigits(total)} تیکت)
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
    </div>
  );
};

