import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api, getErrorMessage } from '@/lib/api';
import { TicketPriority, TicketPriorityLabelsPersian } from '@nit-help/shared';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { LoadingSpinner } from '@/components/ui/empty-state';
import {
  Send,
  Upload,
  FileCheck,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  Paperclip,
} from 'lucide-react';

export const CreateTicketPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preSelectedServiceId = searchParams.get('serviceId');

  const [selectedServiceId, setSelectedServiceId] = useState(preSelectedServiceId || '');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TicketPriority>(TicketPriority.NORMAL);
  const [file, setFile] = useState<File | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdTicket, setCreatedTicket] = useState<any | null>(null);

  // Fetch available services
  const { data: services, isLoading: isLoadingServices } = useQuery({
    queryKey: ['available-services'],
    queryFn: async () => {
      const res = await api.get('/services');
      return res.data;
    },
  });

  // When services load, sync default priority if pre-selected
  useEffect(() => {
    if (services && selectedServiceId) {
      const found = services.find((s: any) => s.id === selectedServiceId);
      if (found && found.defaultPriority) {
        setPriority(found.defaultPriority);
      }
    }
  }, [services, selectedServiceId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedServiceId) {
      setError('لطفاً خدمت مورد نظر را انتخاب فرمایید');
      return;
    }
    if (subject.trim().length < 3) {
      setError('عنوان تیکت باید حداقل ۳ نویسه باشد');
      return;
    }
    if (description.trim().length < 10) {
      setError('شرح درخواست باید حداقل ۱۰ نویسه باشد');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      // 1. Create ticket
      const { data: ticket } = await api.post('/tickets', {
        serviceId: selectedServiceId,
        subject: subject.trim(),
        description: description.trim(),
        priority,
      });

      // 2. Upload attachment if attached
      if (file && ticket.id) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('ticketId', ticket.id);
        await api.post('/attachments/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      setCreatedTicket(ticket);
    } catch (err: any) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  if (createdTicket) {
    return (
      <div className="max-w-xl mx-auto my-8">
        <Card className="text-center p-8 border-emerald-500/30 bg-emerald-50/10">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950 mx-auto mb-4">
            <CheckCircle2 className="h-9 w-9" />
          </div>
          <CardTitle className="text-xl font-black text-foreground">
            تیکت با موفقیت ثبت شد
          </CardTitle>
          <CardDescription className="mt-2 text-sm text-muted-foreground">
            درخواست شما در گردش کار قرار گرفت و کارشناس مربوطه به زودی به آن پاسخ خواهد داد.
          </CardDescription>

          <div className="mt-6 p-4 rounded-xl bg-card border border-border inline-block min-w-[280px]">
            <p className="text-xs text-muted-foreground font-semibold">شماره پیگیری یکتا</p>
            <p className="font-mono text-2xl font-black text-primary mt-1 tracking-wider">
              {createdTicket.ticketNumber}
            </p>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to={`/tickets/${createdTicket.id}`}>
              <Button size="lg" className="w-full sm:w-auto">
                مشاهده و پیگیری تیکت
              </Button>
            </Link>
            <Link to="/tickets">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                بازگشت به فهرست تیکت‌ها
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  const selectedServiceObj = services?.find((s: any) => s.id === selectedServiceId);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back button */}
      <div>
        <Link
          to="/tickets"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-semibold"
        >
          <ArrowRight className="h-4 w-4" />
          <span>بازگشت به فهرست تیکت‌ها</span>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-black text-foreground">
            ثبت درخواست و تیکت جدید
          </CardTitle>
          <CardDescription>
            لطفاً اطلاعات درخواست خود را به طور کامل و با ذکر جزئیات وارد فرمایید.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {error && (
            <div className="flex items-center gap-2 p-3 mb-5 text-xs rounded-lg bg-destructive/10 text-destructive border border-destructive/20">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 1. Service Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">
                انتخاب خدمت مورد نظر <span className="text-destructive">*</span>
              </label>
              {isLoadingServices ? (
                <LoadingSpinner size="sm" />
              ) : (
                <select
                  value={selectedServiceId}
                  onChange={(e) => setSelectedServiceId(e.target.value)}
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  required
                >
                  <option value="">-- لطفاً خدمت مرتبط را انتخاب کنید --</option>
                  {(services || []).map((s: any) => (
                    <option key={s.id} value={s.id}>
                      {s.categoryName ? `[${s.categoryName}] ` : ''}
                      {s.name} ({s.departmentName})
                    </option>
                  ))}
                </select>
              )}
              {selectedServiceObj && (
                <p className="text-xs text-muted-foreground bg-muted/40 p-2.5 rounded-lg border border-border mt-1.5">
                  <span className="font-semibold text-foreground">توضیح خدمت: </span>
                  {selectedServiceObj.description || 'بدون توضیحات اضافی'}
                </p>
              )}
            </div>

            {/* 2. Priority Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">درجه اهمیت و اولویت</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {Object.values(TicketPriority).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all cursor-pointer text-center ${
                      priority === p
                        ? 'border-primary bg-primary/10 text-primary font-bold shadow-xs'
                        : 'border-border bg-card text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {TicketPriorityLabelsPersian[p]}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Subject */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">
                عنوان مختصر درخواست <span className="text-destructive">*</span>
              </label>
              <Input
                type="text"
                placeholder="مثال: قطعی اینترنت در دانشکده کامپیوتر"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
              />
            </div>

            {/* 4. Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">
                شرح کامل مشکل یا درخواست <span className="text-destructive">*</span>
              </label>
              <Textarea
                placeholder="لطفاً جزئیات، مکان، زمان وقوع خطا، شماره دانشجویی یا هر اطلاعات مورد نیاز کارشناس را شرح دهید..."
                rows={6}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>

            {/* 5. Attachment */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">فایل ضمیمه یا تصویر خطا (اختیاری)</label>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-muted/30 hover:bg-muted text-xs font-semibold text-foreground cursor-pointer transition-colors">
                  <Upload className="h-4 w-4 text-muted-foreground" />
                  <span>انتخاب فایل</span>
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    accept=".jpg,.jpeg,.png,.pdf,.zip,.doc,.docx,.txt"
                  />
                </label>
                {file && (
                  <div className="flex items-center gap-1.5 text-xs text-primary font-semibold truncate">
                    <Paperclip className="h-3.5 w-3.5" />
                    <span className="truncate max-w-xs">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => setFile(null)}
                      className="text-destructive hover:underline text-[11px] mr-1"
                    >
                      (حذف)
                    </button>
                  </div>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground">
                فرمت‌های مجاز: PDF, PNG, JPG, ZIP, DOCX (حداکثر ۱۰ مگابایت)
              </p>
            </div>

            {/* Submit Button */}
            <div className="pt-4 border-t border-border flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/tickets')}
                disabled={isLoading}
              >
                انصراف
              </Button>
              <Button type="submit" size="lg" isLoading={isLoading} className="gap-2">
                <Send className="h-4 w-4" />
                <span>ثبت و ارسال تیکت</span>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

