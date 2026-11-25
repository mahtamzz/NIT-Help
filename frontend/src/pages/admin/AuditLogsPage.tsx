import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatPersianDate } from '@/lib/utils';
import { RoleLabelsPersian } from '@nit-help/shared';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { LoadingSpinner, EmptyState } from '@/components/ui/empty-state';
import { ShieldAlert, Clock, User, Shield } from 'lucide-react';

export const AuditLogsPage: React.FC = () => {
  const { data: logs, isLoading } = useQuery({
    queryKey: ['admin-audit-logs'],
    queryFn: async () => {
      const res = await api.get('/audit?limit=100');
      return res.data;
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-foreground flex items-center gap-2">
          <ShieldAlert className="h-6 w-6 text-primary" />
          لاگ‌های نظارتی و رویدادهای امنیتی سامانه
        </h1>
        <p className="mt-1 text-xs text-muted-foreground">
          ثبت تغییرات ساختاری، عملیات مدیریتی، لاگین‌ها و رویدادهای حساس جهت انطباق و حسابرسی
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <LoadingSpinner />
          ) : (logs || []).length === 0 ? (
            <EmptyState
              icon={Shield}
              title="هیچ رویدادی ثبت نشده است"
              description="تاکنون لاگ امنیتی جدیدی ثبت نگردیده است."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-muted/50 text-muted-foreground border-b border-border">
                  <tr>
                    <th className="py-3 px-4 font-semibold">کاربر اقدام‌کننده</th>
                    <th className="py-3 px-4 font-semibold">نقش سازمانی</th>
                    <th className="py-3 px-4 font-semibold">عملیات</th>
                    <th className="py-3 px-4 font-semibold">نوع موجودیت</th>
                    <th className="py-3 px-4 font-semibold">شناسه موجودیت</th>
                    <th className="py-3 px-4 font-semibold">زمان رویداد</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {logs.map((log: any) => (
                    <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-foreground">
                        <div>{log.actorName}</div>
                        <div className="text-[10px] text-muted-foreground font-mono">
                          {log.actorEmail}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-secondary text-primary">
                          {RoleLabelsPersian[log.actorRole as keyof typeof RoleLabelsPersian] || log.actorRole}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-primary">
                        {log.action}
                      </td>
                      <td className="py-3.5 px-4 text-muted-foreground">
                        {log.entityType}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-muted-foreground truncate max-w-[120px]">
                        {log.entityId}
                      </td>
                      <td className="py-3.5 px-4 text-muted-foreground whitespace-nowrap">
                        {formatPersianDate(log.createdAt)}
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

