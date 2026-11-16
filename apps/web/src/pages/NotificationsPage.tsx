import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatPersianDate, toPersianDigits } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingSpinner, EmptyState } from '@/components/ui/empty-state';
import { Bell, CheckCheck, Ticket, ExternalLink } from 'lucide-react';

export const NotificationsPage: React.FC = () => {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['notifications-page'],
    queryFn: async () => {
      const res = await api.get('/notifications?limit=50');
      return res.data;
    },
  });

  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.patch(`/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-page'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-navbar'] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      await api.patch('/notifications/read-all');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-page'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-navbar'] });
    },
  });

  const notifications = data?.data || [];
  const unreadCount = data?.unreadCount || 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-foreground flex items-center gap-2">
            <Bell className="h-6 w-6 text-primary" />
            مرکز اعلان‌ها و پیام‌های سیستمی
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            اطلاع‌رسانی وضعیت درخواست‌ها، ارجاع‌ها، پاسخ‌ها و رویدادهای مربوط به شما
          </p>
        </div>

        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAllReadMutation.mutate()}
            isLoading={markAllReadMutation.isPending}
            className="gap-2 text-xs"
          >
            <CheckCheck className="h-4 w-4 text-primary" />
            <span>علامت‌گذاری همه به عنوان خوانده شده</span>
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-4 sm:p-6">
          {isLoading ? (
            <LoadingSpinner />
          ) : notifications.length === 0 ? (
            <EmptyState
              icon={Bell}
              title="هیچ اعلانی ثبت نشده است"
              description="هرگونه پاسخ یا رویداد در تیکت‌های شما در این بخش نمایش داده خواهد شد."
            />
          ) : (
            <div className="space-y-3">
              {notifications.map((n: any) => (
                <div
                  key={n.id}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border transition-all ${
                    !n.isRead
                      ? 'bg-primary/5 border-primary/30 shadow-xs'
                      : 'bg-card border-border hover:bg-muted/40'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {!n.isRead && (
                        <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
                      )}
                      <h4 className="text-xs font-bold text-foreground">{n.title}</h4>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        ({formatPersianDate(n.createdAt)})
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed pr-4">
                      {n.message}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    {n.ticketId && (
                      <Link to={`/tickets/${n.ticketId}`}>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="h-8 px-3 text-xs gap-1.5"
                          onClick={() => {
                            if (!n.isRead) markReadMutation.mutate(n.id);
                          }}
                        >
                          <Ticket className="h-3.5 w-3.5" />
                          <span>مشاهده تیکت</span>
                        </Button>
                      </Link>
                    )}

                    {!n.isRead && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => markReadMutation.mutate(n.id)}
                        className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground"
                        title="علامت به عنوان خوانده شده"
                      >
                        <CheckCheck className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

