import React, { useState } from 'react';
import { useAuth } from '@/features/auth/AuthContext';
import { useTheme } from '@/hooks/useTheme';
import { RoleLabelsPersian } from '@nit-help/shared';
import { toPersianDigits } from '@/lib/utils';
import {
  Menu,
  Bell,
  Sun,
  Moon,
  LogOut,
  User as UserIcon,
  CheckCircle,
  ExternalLink,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface NavbarProps {
  onToggleSidebar: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [showNotifications, setShowNotifications] = useState(false);

  // Poll or fetch notifications
  const { data: notifData } = useQuery({
    queryKey: ['notifications-navbar'],
    queryFn: async () => {
      const res = await api.get('/notifications?limit=5');
      return res.data;
    },
    refetchInterval: 30000,
  });

  const unreadCount = notifData?.unreadCount || 0;
  const recentNotifications = notifData?.data || [];

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-border bg-card/80 backdrop-blur-md px-4 sm:px-6">
      {/* Left side (RTL Start): Mobile Hamburger & Breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="rounded-lg p-2 text-muted-foreground hover:bg-muted lg:hidden"
          title="منوی ناوبری"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="hidden sm:flex items-center gap-2 text-sm">
          <span className="font-bold text-foreground">میز خدمت الکترونیکی</span>
          {user?.departmentName && (
            <>
              <span className="text-muted-foreground">/</span>
              <span className="text-muted-foreground">{user.departmentName}</span>
            </>
          )}
        </div>
      </div>

      {/* Right side: Actions & User Menu */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
          title={theme === 'dark' ? 'حالت روز' : 'حالت شب'}
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
            title="اعلان‌ها"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-white shadow-xs">
                {toPersianDigits(unreadCount)}
              </span>
            )}
          </button>

          {showNotifications && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowNotifications(false)}
              />
              <div className="absolute left-0 mt-2 z-50 w-80 sm:w-96 rounded-xl border border-border bg-card p-3 shadow-xl animate-in zoom-in-95">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-border">
                  <span className="text-xs font-bold text-foreground">اعلان‌های اخیر</span>
                  <Link
                    to="/notifications"
                    onClick={() => setShowNotifications(false)}
                    className="text-xs text-primary hover:underline flex items-center gap-1"
                  >
                    مشاهده همه
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>

                <div className="max-h-72 overflow-y-auto space-y-2">
                  {recentNotifications.length === 0 ? (
                    <div className="py-6 text-center text-xs text-muted-foreground">
                      هیچ اعلان جدیدی وجود ندارد
                    </div>
                  ) : (
                    recentNotifications.map((n: any) => (
                      <div
                        key={n.id}
                        className="p-2.5 rounded-lg border border-border/50 bg-background/50 text-xs space-y-1 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center justify-between font-semibold text-foreground">
                          <span>{n.title}</span>
                          {!n.isRead && (
                            <span className="h-2 w-2 rounded-full bg-primary" />
                          )}
                        </div>
                        <p className="text-muted-foreground text-[11px] leading-relaxed">
                          {n.message}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* User Profile Info */}
        <div className="flex items-center gap-2 border-r border-border pr-2 sm:pr-3 mr-1">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-primary font-bold text-sm">
            {user?.fullName?.charAt(0) || <UserIcon className="h-4 w-4" />}
          </div>
          <div className="hidden md:flex flex-col text-right">
            <span className="text-xs font-bold text-foreground leading-tight">
              {user?.fullName}
            </span>
            <span className="text-[11px] text-muted-foreground font-medium">
              {user?.role ? RoleLabelsPersian[user.role] : ''}
            </span>
          </div>

          <button
            onClick={() => logout()}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors cursor-pointer mr-1"
            title="خروج از سامانه"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

