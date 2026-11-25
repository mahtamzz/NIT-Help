import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toPersianDigits } from '@/lib/utils';
import { TicketStatusLabelsPersian, TicketPriorityLabelsPersian } from '@nit-help/shared';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/empty-state';
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
  CartesianGrid,
} from 'recharts';
import {
  BarChart3,
  TrendingUp,
  Clock,
  CheckCircle2,
  Users,
  Building2,
  Calendar,
} from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const { data: overview, isLoading: isLoadingOverview } = useQuery({
    queryKey: ['admin-reports-overview'],
    queryFn: async () => {
      const res = await api.get('/reports/overview');
      return res.data;
    },
  });

  const { data: specialists, isLoading: isLoadingSpecialists } = useQuery({
    queryKey: ['admin-reports-specialists'],
    queryFn: async () => {
      const res = await api.get('/reports/specialists');
      return res.data;
    },
  });

  if (isLoadingOverview || isLoadingSpecialists) return <LoadingSpinner size="lg" />;

  const statusChartData = (overview?.ticketsByStatus || []).map((s: any) => ({
    name: TicketStatusLabelsPersian[s.status as keyof typeof TicketStatusLabelsPersian] || s.status,
    count: s.count,
  }));

  const priorityChartData = (overview?.ticketsByPriority || []).map((p: any) => ({
    name: TicketPriorityLabelsPersian[p.priority as keyof typeof TicketPriorityLabelsPersian] || p.priority,
    count: p.count,
  }));

  const deptChartData = overview?.ticketsByDepartment || [];
  const timelineData = overview?.ticketsOverTime || [];

  const PIE_COLORS = ['#173b63', '#087e8b', '#d99128', '#16845b', '#dc4444', '#6366f1'];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-foreground flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-primary" />
          گزارش‌ها و تحلیل شاخص‌های عملکردی (SLA)
        </h1>
        <p className="mt-1 text-xs text-muted-foreground">
          آمار جامع تیکت‌های دریافتی، روند زمانی، عملکرد کارشناسان و میانگین زمان حل درخواست‌ها
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-semibold">مجموع کل درخواست‌ها</p>
              <h3 className="text-2xl font-black text-foreground mt-1">
                {toPersianDigits(overview?.totalTickets || 0)}
              </h3>
            </div>
            <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <BarChart3 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-semibold">تیکت‌های در دست اقدام</p>
              <h3 className="text-2xl font-black text-amber-600 mt-1">
                {toPersianDigits(overview?.openTickets || 0)}
              </h3>
            </div>
            <div className="h-11 w-11 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950 flex items-center justify-center">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-semibold">تیکت‌های مختومه و حل شده</p>
              <h3 className="text-2xl font-black text-emerald-600 mt-1">
                {toPersianDigits(overview?.resolvedTickets || 0)}
              </h3>
            </div>
            <div className="h-11 w-11 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-semibold">میانگین زمان حل مسئله</p>
              <h3 className="text-2xl font-black text-primary mt-1">
                {toPersianDigits(overview?.averageResolutionHours || 0)}{' '}
                <span className="text-xs font-normal text-muted-foreground">ساعت</span>
              </h3>
            </div>
            <div className="h-11 w-11 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950 flex items-center justify-center">
              <TrendingUp className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tickets Over Time */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              روند ثبت درخواست‌ها در طول زمان
            </CardTitle>
            <CardDescription>نمایش فراوانی ایجاد تیکت‌ها در روزهای اخیر</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timelineData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="date" fontSize={11} tickLine={false} />
                  <YAxis allowDecimals={false} fontSize={11} tickLine={false} />
                  <Tooltip
                    formatter={(val: any) => [toPersianDigits(val), 'تعداد']}
                    contentStyle={{ direction: 'rtl', borderRadius: '8px' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="var(--color-primary)"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">توزیع وضعیت درخواست‌ها</CardTitle>
            <CardDescription>فراوانی مراحل مختلف گردش کار</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusChartData}>
                  <XAxis dataKey="name" fontSize={10} tickLine={false} />
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

        {/* Department Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">سهم هر دپارتمان از درخواست‌ها</CardTitle>
            <CardDescription>فراوانی تیکت‌ها بر مبنای واحد مسئول</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={deptChartData}
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
                    {deptChartData.map((_: any, idx: number) => (
                      <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                    ))}
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

      {/* Specialist Workload Table */}
      <Card>
        <CardHeader className="pb-3 border-b border-border">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            بار کاری و عملکرد کارشناسان واحدها
          </CardTitle>
          <CardDescription>
            بررسی حجم تیکت‌های ارجاع شده، در دست اقدام و حل شده توسط هر کارشناس
          </CardDescription>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-muted/50 text-muted-foreground border-b border-border">
                <tr>
                  <th className="py-3 px-4 font-semibold">نام کارشناس</th>
                  <th className="py-3 px-4 font-semibold">دپارتمان</th>
                  <th className="py-3 px-4 font-semibold text-center">کل ارجاعات</th>
                  <th className="py-3 px-4 font-semibold text-center">در حال پیگیری</th>
                  <th className="py-3 px-4 font-semibold text-center">پاسخ داده شده</th>
                  <th className="py-3 px-4 font-semibold text-center">نرخ تکمیل</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(specialists || []).map((s: any) => {
                  const rate =
                    s.totalAssigned > 0
                      ? Math.round((s.resolvedTickets / s.totalAssigned) * 100)
                      : 0;

                  return (
                    <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-foreground">{s.fullName}</td>
                      <td className="py-3.5 px-4 text-muted-foreground">{s.departmentName}</td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-foreground">
                        {toPersianDigits(s.totalAssigned)}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-amber-600">
                        {toPersianDigits(s.activeTickets)}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-emerald-600">
                        {toPersianDigits(s.resolvedTickets)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-bold bg-secondary text-primary">
                          {toPersianDigits(rate)}٪
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

