import React, { useState } from 'react';
import { useAuth } from '@/features/auth/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { GraduationCap, Lock, User, KeyRound, AlertCircle, ShieldCheck } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await login(usernameOrEmail, password);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'نام کاربری یا رمز عبور اشتباه است، یا حساب کاربری غیرفعال می‌باشد.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = async (u: string, p: string) => {
    setUsernameOrEmail(u);
    setPassword(p);
    setError(null);
    setIsLoading(true);
    try {
      await login(u, p);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.message || 'خطا در ورود آزمایشی');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md mb-2">
            <GraduationCap className="h-9 w-9" />
          </div>
          <h1 className="text-2xl font-black text-primary tracking-tight">سامانه NIT-Help</h1>
          <p className="text-sm text-muted-foreground">
            میز خدمت و تیکتینگ متمرکز دانشگاه صنعتی نوشیروانی بابل
          </p>
        </div>

        {/* Login Card */}
        <Card className="shadow-lg border-border">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl">ورود به حساب کاربری</CardTitle>
            <CardDescription>
              شناسه دانشگاهی یا پست الکترونیک خود را جهت ورود وارد کنید
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 text-xs rounded-lg bg-destructive/10 text-destructive border border-destructive/20">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">نام کاربری یا ایمیل</label>
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="مثال: student یا admin@nit.ac.ir"
                    value={usernameOrEmail}
                    onChange={(e) => setUsernameOrEmail(e.target.value)}
                    required
                    className="pr-9"
                  />
                  <User className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">رمز عبور</label>
                <div className="relative">
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pr-9"
                  />
                  <Lock className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>

              <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
                ورود به سامانه
              </Button>
            </form>

            {/* Quick Demo Access Bar */}
            <div className="pt-4 border-t border-border">
              <div className="text-xs font-bold text-muted-foreground mb-2 flex items-center gap-1.5 justify-center">
                <ShieldCheck className="h-3.5 w-3.5 text-accent-foreground" />
                ورود سریع با نقش‌های آزمایشی
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickLogin('student', 'Student@123456')}
                  disabled={isLoading}
                  className="text-xs justify-start px-2.5"
                >
                  🎓 دانشجو
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickLogin('faculty', 'Faculty@123456')}
                  disabled={isLoading}
                  className="text-xs justify-start px-2.5"
                >
                  👨‍🏫 استاد / کارمند
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickLogin('it_spec', 'Specialist@123456')}
                  disabled={isLoading}
                  className="text-xs justify-start px-2.5"
                >
                  🛠️ کارشناس IT
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickLogin('it_manager', 'Manager@123456')}
                  disabled={isLoading}
                  className="text-xs justify-start px-2.5"
                >
                  🏢 مدیر واحد IT
                </Button>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => handleQuickLogin('admin', 'Admin@123456')}
                disabled={isLoading}
                className="w-full mt-2 text-xs font-bold text-primary"
              >
                👑 مدیر ارشد سامانه (Admin)
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Security badge footer */}
        <p className="text-center text-xs text-muted-foreground flex items-center justify-center gap-1">
          <KeyRound className="h-3.5 w-3.5" />
          سامانه امن با توکن‌های رمزنگاری شده و نشست‌های حفاظت شده
        </p>
      </div>
    </div>
  );
};

