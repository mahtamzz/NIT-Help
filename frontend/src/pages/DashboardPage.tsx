import React from 'react';
import { useAuth } from '@/features/auth/AuthContext';
import { UserRole, TicketStatusLabelsPersian, TicketPriorityLabelsPersian, TicketStatus } from '@nit-help/shared';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toPersianDigits, formatPersianDate, getStatusBadgeVariant, getPriorityBadgeVariant } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingSpinner, EmptyState } from '@/components/ui/empty-state';
import {
  Ticket,
  Clock,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  Users,
  Building2,
  TrendingUp,
  Activity,
  ArrowUpRight,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';

export const DashboardPage: React.FC = () => {
  const { user, hasRole } = useAuth();

  const isStaff = hasRole(UserRole.SPECIALIST, UserRole.MANAGER, UserRole.ADMIN);
  const isManagerOrAdmin = hasRole(UserRole.MANAGER, UserRole.ADMIN);

  // 1. Fetch tickets list for recent activity
  const { data: ticketsData, isLoading: isLoadingTickets } = useQuery({
    queryKey: ['dashboard-tickets'],
    queryFn: async () => {
      const res = await api.get('/tickets?limit=5&sortBy=createdAt&sortOrder=desc');
      return res.data;
    },
  });

  // 2. Fetch reports/metrics if staff or manager/admin
  const { data: overviewData, isLoading: isLoadingOverview } = useQuery({
    queryKey: ['dashboard-overview'],
    queryFn: async () => {
      const res = await api.get('/reports/overview');
      return res.data;
    },
    enabled: isManagerOrAdmin,
  });

  // 3. Fetch specialists workload if manager or admin
  const { data: specialistsData } = useQuery({
    queryKey: ['dashboard-specialists'],
    queryFn: async () => {
      const res = await api.get('/reports/specialists');
      return res.data;
    },
    enabled: isManagerOrAdmin,
  });

  const recentTickets = ticketsData?.data || [];
  const totalUserTickets = ticketsData?.total || 0;

  // Pie chart colors
  const STATUS_COLORS: Record<string, string> = {
    NEW: '#3b82f6',
    ASSIGNED: '#6366f1',
    IN_PROGRESS: '#f59e0b',
    WAITING_FOR_REQUESTER: '#a855f7',
    RESOLVED: '#10b981',
    CLOSED: '#64748b',
  };

  const PRIORITY_COLORS: Record<string, string> = {
    LOW: '#94a3b8',
    NORMAL: '#0ea5e9',
    HIGH: '#f97316',
    URGENT: '#ef4444',
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl bg-gradient-to-l from-primary/10 via-primary/5 to-transparent border border-primary/20 p-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-foreground">
            سلام، {user?.fullName} 👋
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isManagerOrAdmin
              ? 'گزارش عملکرد واحدها، آمارهای لحظه‌ای و نظارت بر جریان تیکت‌ها'
              : 'به سامانه یکپارچه پشتیبانی و میز خدمت دانشگاه خوش آمدید'}
          </p>
        </div>
        <Link to="/tickets/new">
          <Button size="lg" className="shadow-md flex items-center gap-2">
            <PlusCircle className="h-5 w-5" />
            <span>ثبت تیکت جدید</span>
          </Button>
        </Link>
      </div>

      {/* KPI Cards */}
      {isManagerOrAdmin ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-semibold">کل تیکت‌ها</p>
                <h3 className="text-2xl font-black text-foreground mt-1">
                  {toPersianDigits(overviewData?.totalTickets ?? '—')}
                </h3>
              </div>
              <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 flex items-center justify-center">
                <Ticket className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-semibold">تیکت‌های در جریان</p>
                <h3 className="text-2xl font-black text-amber-600 mt-1">
                  {toPersianDigits(overviewData?.openTickets ?? '—')}
                </h3>
              </div>
              <div className="h-12 w-12 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/50 flex items-center justify-center">
                <Clock className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-semibold">تیکت‌های حل شده</p>
                <h3 className="text-2xl font-black text-emerald-600 mt-1">
                  {toPersianDigits(overviewData?.resolvedTickets ?? '—')}
                </h3>
              </div>
              <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-semibold">میانگین زمان پاسخ‌دهی</p>
                <h3 className="text-2xl font-black text-primary mt-1">
                  {toPersianDigits(overviewData?.averageResolutionHours ?? '—')}{' '}
                  <span className="text-xs font-normal text-muted-foreground">ساعت</span>
                </h3>
              </div>
              <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <TrendingUp className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-semibold">کل درخواست‌های من</p>
                <h3 className="text-2xl font-black text-foreground mt-1">
                  {toPersianDigits(totalUserTickets)}
                </h3>
              </div>
              <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 flex items-center justify-center">
                <Ticket className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-semibold">در حال رسیدگی</p>
                <h3 className="text-2xl font-black text-amber-600 mt-1">
                  {toPersianDigits(
                    recentTickets.filter((t: any) =>
                      [TicketStatus.NEW, TicketStatus.ASSIGNED, TicketStatus.IN_PROGRESS].includes(t.status),
                    ).length,
                  )}
                </h3>
              </div>
              <div className="h-12 w-12 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/50 flex items-center justify-center">
                <Clock className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-semibold">پاسخ داده شده / حل شده</p>
                <h3 className="text-2xl font-black text-emerald-600 mt-1">
                  {toPersianDigits(
                    recentTickets.filter((t: any) =>
                      [TicketStatus.RESOLVED, TicketStatus.CLOSED].includes(t.status),
                    ).length,
                  )}
                </h3>
              </div>
              <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Visual Charts (For Managers / Admins) */}
      {isManagerOrAdmin && overviewData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Status Breakdown */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                توزیع تیکت‌ها بر اساس وضعیت
              </CardTitle>
              <CardDescription>بررسی فراوانی درخواست‌ها در مراحل مختلف گردش کار</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={overviewData.ticketsByStatus.map((s: any) => ({
                      name: TicketStatusLabelsPersian[s.status as keyof typeof TicketStatusLabelsPersian] || s.status,
                      count: s.count,
                    }))}
                  >
                    <XAxis dataKey="name" fontSize={11} tickLine={false} />
                    <YAxis allowDecimals={false} fontSize={11} tickLine={false} />
                    <Tooltip
                      formatter={(val: any) => [toPersianDigits(val), 'تعداد']}
                      contentStyle={{ direction: 'rtl', borderRadius: '8px' }}
                    />
                    <Bar dataKey="count" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Department Breakdown */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                توزیع درخواست‌ها بر اساس دپارتمان
              </CardTitle>
              <CardDescription>فراوانی تیکت‌های ارجاع شده به هر یک از واحدهای دانشگاه</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={overviewData.ticketsByDepartment}
                      dataKey="count"
                      nameKey="departmentName"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, percent }: any) =>
                        `${name}: ${toPersianDigits((percent * 100).toFixed(0))}%`
                      }
                      labelLine={false}
                    >
                      {overviewData.ticketsByDepartment.map((entry: any, index: number) => {
                        const colors = ['#173b63', '#087e8b', '#d99128', '#16845b', '#dc4444'];
                        return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                      })}
                    </Pie>
                    <Tooltip
                      formatter={(val: any) => [toPersianDigits(val), 'تعداد تیکت']}
                      contentStyle={{ direction: 'rtl', borderRadius: '8px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent Tickets Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base">تیکت‌های اخیر</CardTitle>
            <CardDescription>آخرین درخواست‌های ثبت شده و وضعیت رسیدگی به آن‌ها</CardDescription>
          </div>
          <Link to="/tickets">
            <Button variant="outline" size="sm" className="gap-1 text-xs">
              <span>مشاهده همه</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </CardHeader>

        <CardContent className="p-0">
          {isLoadingTickets ? (
            <LoadingSpinner />
          ) : recentTickets.length === 0 ? (
            <EmptyState
              title="تیکتی یافت نشد"
              description="تاکنون درخواستی ثبت نشده است."
              actionLabel="ثبت اولین تیکت"
              onAction={() => window.location.href = '/tickets/new'}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-muted/50 text-muted-foreground border-b border-border">
                  <tr>
                    <th className="py-3 px-4 font-semibold">شماره پیگیری</th>
                    <th className="py-3 px-4 font-semibold">موضوع</th>
                    <th className="py-3 px-4 font-semibold">خدمت / واحد</th>
                    {isStaff && <th className="py-3 px-4 font-semibold">درخواست‌کننده</th>}
                    <th className="py-3 px-4 font-semibold">اولویت</th>
                    <th className="py-3 px-4 font-semibold">وضعیت</th>
                    <th className="py-3 px-4 font-semibold">تاریخ ثبت</th>
                    <th className="py-3 px-4 font-semibold">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {recentTickets.map((t: any) => (
                    <tr key={t.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-primary">
                        {t.ticketNumber}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-foreground max-w-xs truncate">
                        {t.subject}
                      </td>
                      <td className="py-3.5 px-4 text-muted-foreground">
                        <div>{t.serviceName}</div>
                        <div className="text-[10px] opacity-75">{t.departmentName}</div>
                      </td>
                      {isStaff && (
                        <td className="py-3.5 px-4 text-muted-foreground">
                          {t.requesterName}
                        </td>
                      )}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-semibold border ${getPriorityBadgeVariant(
                            t.priority,
                          )}`}
                        >
                          {TicketPriorityLabelsPersian[t.priority as keyof typeof TicketPriorityLabelsPersian]}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
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
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <Link to={`/tickets/${t.id}`}>
                          <Button variant="secondary" size="sm" className="h-7 px-2.5 text-xs">
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
        </CardContent>
      </Card>
    </div>
  );
};

