import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthContext';
import { UserRole } from '@nit-help/shared';
import { AppLayout } from '@/components/layout/AppLayout';
import { LoginPage } from '@/pages/LoginPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { TicketsPage } from '@/pages/TicketsPage';
import { CreateTicketPage } from '@/pages/CreateTicketPage';
import { TicketDetailPage } from '@/pages/TicketDetailPage';
import { ServicesPage } from '@/pages/ServicesPage';
import { NotificationsPage } from '@/pages/NotificationsPage';
import { UsersManagementPage } from '@/pages/admin/UsersManagementPage';
import { DepartmentsManagementPage } from '@/pages/admin/DepartmentsManagementPage';
import { ServicesManagementPage } from '@/pages/admin/ServicesManagementPage';
import { ReportsPage } from '@/pages/admin/ReportsPage';
import { AuditLogsPage } from '@/pages/admin/AuditLogsPage';
import { LoadingSpinner, EmptyState } from '@/components/ui/empty-state';
import { ShieldAlert, FileQuestion } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Protected Route Guard
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

// Role-based Access Guard
const RoleRoute: React.FC<{ allowedRoles: UserRole[]; children: React.ReactNode }> = ({
  allowedRoles,
  children,
}) => {
  const { user, hasRole } = useAuth();

  if (!user || !hasRole(...allowedRoles)) {
    return (
      <div className="max-w-md mx-auto my-12">
        <EmptyState
          icon={ShieldAlert}
          title="عدم دسترسی به این بخش"
          description="سطح دسترسی حساب کاربری شما اجازه مشاهده یا ویرایش این صفحه را نمی‌دهد."
          actionLabel="بازگشت به داشبورد"
          onAction={() => (window.location.href = '/')}
        />
      </div>
    );
  }

  return <>{children}</>;
};

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Route */}
      <Route path="/login" element={<LoginPage />} />

      {/* Authenticated Application Shell */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="tickets" element={<TicketsPage />} />
        <Route path="tickets/new" element={<CreateTicketPage />} />
        <Route path="tickets/:id" element={<TicketDetailPage />} />
        <Route path="services" element={<ServicesPage />} />
        <Route path="notifications" element={<NotificationsPage />} />

        {/* Manager & Admin Routes */}
        <Route
          path="admin/reports"
          element={
            <RoleRoute allowedRoles={[UserRole.MANAGER, UserRole.ADMIN]}>
              <ReportsPage />
            </RoleRoute>
          }
        />

        {/* Admin-only Routes */}
        <Route
          path="admin/users"
          element={
            <RoleRoute allowedRoles={[UserRole.ADMIN]}>
              <UsersManagementPage />
            </RoleRoute>
          }
        />
        <Route
          path="admin/departments"
          element={
            <RoleRoute allowedRoles={[UserRole.ADMIN]}>
              <DepartmentsManagementPage />
            </RoleRoute>
          }
        />
        <Route
          path="admin/services"
          element={
            <RoleRoute allowedRoles={[UserRole.ADMIN]}>
              <ServicesManagementPage />
            </RoleRoute>
          }
        />
        <Route
          path="admin/audit"
          element={
            <RoleRoute allowedRoles={[UserRole.ADMIN]}>
              <AuditLogsPage />
            </RoleRoute>
          }
        />

        {/* 404 Route */}
        <Route
          path="*"
          element={
            <EmptyState
              icon={FileQuestion}
              title="صفحه مورد نظر یافت نشد"
              description="آدرس وارد شده نامعتبر است یا صفحه به مکان دیگری منتقل شده است."
              actionLabel="بازگشت به صفحه اصلی"
              onAction={() => (window.location.href = '/')}
            />
          }
        />
      </Route>
    </Routes>
  );
};

