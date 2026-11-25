import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthContext';
import { UserRole } from '@nit-help/shared';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Ticket,
  PlusCircle,
  Layers,
  Bell,
  BarChart3,
  Users,
  Building2,
  Settings2,
  ShieldAlert,
  GraduationCap,
  ChevronLeft,
  X,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, hasRole } = useAuth();

  const isStaff = hasRole(UserRole.SPECIALIST, UserRole.MANAGER, UserRole.ADMIN);
  const isManagerOrAdmin = hasRole(UserRole.MANAGER, UserRole.ADMIN);
  const isAdmin = hasRole(UserRole.ADMIN);

  const navItems = [
    {
      to: '/',
      label: 'داشبورد کاربری',
      icon: LayoutDashboard,
      show: true,
    },
    {
      to: '/tickets',
      label: isStaff ? 'کارتابل تیکت‌ها' : 'تیکت‌های من',
      icon: Ticket,
      show: true,
    },
    {
      to: '/tickets/new',
      label: 'ثبت درخواست جدید',
      icon: PlusCircle,
      show: true,
    },
    {
      to: '/services',
      label: 'میز خدمت و کاتالوگ',
      icon: Layers,
      show: true,
    },
    {
      to: '/notifications',
      label: 'مرکز اعلان‌ها',
      icon: Bell,
      show: true,
    },
    {
      to: '/admin/reports',
      label: 'گزارش‌ها و تحلیل آماری',
      icon: BarChart3,
      show: isManagerOrAdmin,
    },
    {
      to: '/admin/users',
      label: 'مدیریت کاربران',
      icon: Users,
      show: isAdmin,
    },
    {
      to: '/admin/departments',
      label: 'مدیریت دپارتمان‌ها',
      icon: Building2,
      show: isAdmin,
    },
    {
      to: '/admin/services',
      label: 'تنظیمات خدمات',
      icon: Settings2,
      show: isAdmin,
    },
    {
      to: '/admin/audit',
      label: 'لاگ‌های امنیتی',
      icon: ShieldAlert,
      show: isAdmin,
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={cn(
          'fixed inset-y-0 right-0 z-50 flex w-68 flex-col border-l border-border bg-card transition-transform duration-200 ease-in-out lg:static lg:translate-x-0',
          isOpen ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        {/* Brand header */}
        <div className="flex h-16 items-center justify-between px-5 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div>
              <span className="font-black text-lg text-primary tracking-tight">NIT-Help</span>
              <p className="text-[11px] text-muted-foreground font-medium">سامانه یکپارچه میز خدمت</p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded-md text-muted-foreground hover:bg-muted lg:hidden"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Navigation items */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <div className="px-3 pb-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            منوی اصلی سامانه
          </div>
          {navItems
            .filter((item) => item.show)
            .map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={onClose}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all group',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-xs font-semibold'
                      : 'text-muted-foreground hover:bg-secondary hover:text-secondary-foreground',
                  )
                }
              >
                <item.icon className="h-4 w-4 shrink-0 transition-transform group-hover:scale-105" />
                <span className="truncate">{item.label}</span>
              </NavLink>
            ))}
        </div>

        {/* University Info Footer */}
        <div className="p-4 border-t border-border bg-muted/30">
          <div className="text-xs text-muted-foreground text-center">
            دانشگاه صنعتی نوشیروانی بابل
            <div className="text-[10px] opacity-75 mt-0.5">نسخه ۱.۰ (MVP تولیدی)</div>
          </div>
        </div>
      </aside>
    </>
  );
};

