import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthContext';
import {
  UserRole,
  TicketStatus,
  TicketPriority,
  ObjectionStatus,
  TicketStatusLabelsPersian,
  TicketPriorityLabelsPersian,
  RoleLabelsPersian,
  ObjectionStatusLabelsPersian,
} from '@nit-help/shared';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, getErrorMessage } from '@/lib/api';
import {
  toPersianDigits,
  formatPersianDate,
  getStatusBadgeVariant,
  getPriorityBadgeVariant,
  getObjectionBadgeVariant,
} from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { LoadingSpinner, EmptyState } from '@/components/ui/empty-state';
import {
  ArrowRight,
  Send,
  UserCheck,
  Clock,
  Shield,
  Lock,
  Paperclip,
  Download,
  Star,
  AlertTriangle,
  History,
  Building2,
  CheckCircle2,
  RefreshCw,
  MessageSquare,
  FileText,
} from 'lucide-react';

export const TicketDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, hasRole } = useAuth();
  const queryClient = useQueryClient();

  const isStaff = hasRole(UserRole.SPECIALIST, UserRole.MANAGER, UserRole.ADMIN);
  const isManagerOrAdmin = hasRole(UserRole.MANAGER, UserRole.ADMIN);

  // States
  const [replyContent, setReplyContent] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);

  // Modals
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<TicketStatus>(TicketStatus.IN_PROGRESS);
  const [statusNote, setStatusNote] = useState('');

  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignedSpecialistId, setAssignedSpecialistId] = useState<string>('');
  const [assignNote, setAssignNote] = useState('');

  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState('');

  const [objectionModalOpen, setObjectionModalOpen] = useState(false);
  const [objectionDesc, setObjectionDesc] = useState('');

  const [reviewObjectionModalOpen, setReviewObjectionModalOpen] = useState(false);
  const [objectionReviewStatus, setObjectionReviewStatus] = useState<ObjectionStatus>(ObjectionStatus.RESOLVED);
  const [objectionReviewNote, setObjectionReviewNote] = useState('');

  const [actionError, setActionError] = useState<string | null>(null);

  // Fetch ticket details
  const { data: ticket, isLoading, error: fetchError } = useQuery({
    queryKey: ['ticket-detail', id],
    queryFn: async () => {
      const res = await api.get(`/tickets/${id}`);
      return res.data;
    },
    enabled: !!id,
  });

  // Fetch available specialists for assignment
  const { data: specialists } = useQuery({
    queryKey: ['specialists-list', ticket?.departmentId],
    queryFn: async () => {
      const res = await api.get(`/users/specialists?departmentId=${ticket.departmentId}`);
      return res.data;
    },
    enabled: isStaff && !!ticket?.departmentId,
  });

  // Mutation: Send message
  const sendMessageMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/tickets/${id}/messages`, {
        content: replyContent.trim(),
        isInternal: isInternalNote,
      });
      return res.data;
    },
    onSuccess: () => {
      setReplyContent('');
      queryClient.invalidateQueries({ queryKey: ['ticket-detail', id] });
    },
    onError: (err: any) => {
      setActionError(getErrorMessage(err));
    },
  });

  // Mutation: Update status
  const updateStatusMutation = useMutation({
    mutationFn: async () => {
      const res = await api.patch(`/tickets/${id}/status`, {
        status: newStatus,
        note: statusNote.trim() || undefined,
      });
      return res.data;
    },
    onSuccess: () => {
      setStatusModalOpen(false);
      setStatusNote('');
      queryClient.invalidateQueries({ queryKey: ['ticket-detail', id] });
    },
    onError: (err: any) => {
      setActionError(getErrorMessage(err));
    },
  });

  // Mutation: Assign specialist
  const assignMutation = useMutation({
    mutationFn: async () => {
      const res = await api.patch(`/tickets/${id}/assignment`, {
        assignedToId: assignedSpecialistId === 'unassigned' ? null : assignedSpecialistId,
        note: assignNote.trim() || undefined,
      });
      return res.data;
    },
    onSuccess: () => {
      setAssignModalOpen(false);
      setAssignNote('');
      queryClient.invalidateQueries({ queryKey: ['ticket-detail', id] });
    },
    onError: (err: any) => {
      setActionError(getErrorMessage(err));
    },
  });

  // Mutation: Submit feedback
  const feedbackMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/tickets/${id}/feedback`, {
        rating,
        comment: feedbackComment.trim() || undefined,
      });
      return res.data;
    },
    onSuccess: () => {
      setFeedbackModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['ticket-detail', id] });
    },
    onError: (err: any) => {
      setActionError(getErrorMessage(err));
    },
  });

  // Mutation: Submit objection
  const objectionMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/tickets/${id}/objections`, {
        description: objectionDesc.trim(),
      });
      return res.data;
    },
    onSuccess: () => {
      setObjectionModalOpen(false);
      setObjectionDesc('');
      queryClient.invalidateQueries({ queryKey: ['ticket-detail', id] });
    },
    onError: (err: any) => {
      setActionError(getErrorMessage(err));
    },
  });

  // Mutation: Review objection
  const reviewObjectionMutation = useMutation({
    mutationFn: async () => {
      const res = await api.patch(`/tickets/${id}/objections/review`, {
        status: objectionReviewStatus,
        resolutionNote: objectionReviewNote.trim(),
      });
      return res.data;
    },
    onSuccess: () => {
      setReviewObjectionModalOpen(false);
      setObjectionReviewNote('');
      queryClient.invalidateQueries({ queryKey: ['ticket-detail', id] });
    },
    onError: (err: any) => {
      setActionError(getErrorMessage(err));
    },
  });

  if (isLoading) return <LoadingSpinner size="lg" />;

  if (fetchError || !ticket) {
    return (
      <EmptyState
        title="تیکت یافت نشد"
        description="شما دسترسی به این تیکت ندارید یا تیکت حذف شده است."
        actionLabel="بازگشت به فهرست تیکت‌ها"
        onAction={() => window.location.href = '/tickets'}
      />
    );
  }

  const isRequester = user?.id === ticket.requesterId;
  const isResolvedOrClosed =
    ticket.status === TicketStatus.RESOLVED || ticket.status === TicketStatus.CLOSED;

  return (
    <div className="space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/tickets"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-semibold"
        >
          <ArrowRight className="h-4 w-4" />
          <span>بازگشت به فهرست تیکت‌ها</span>
        </Link>
      </div>

      {actionError && (
        <div className="p-3 text-xs rounded-lg bg-destructive/10 text-destructive border border-destructive/20 flex items-center justify-between">
          <span>{actionError}</span>
          <button onClick={() => setActionError(null)} className="text-xs font-bold mr-2">
            ×
          </button>
        </div>
      )}

      {/* Main Ticket Header Card */}
      <Card className="border-border">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-md bg-secondary text-primary border border-primary/20">
                  {ticket.ticketNumber}
                </span>
                <span
                  className={`px-3 py-0.5 rounded-full text-xs font-semibold border ${getStatusBadgeVariant(
                    ticket.status,
                  )}`}
                >
                  {TicketStatusLabelsPersian[ticket.status as keyof typeof TicketStatusLabelsPersian]}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-md text-xs font-semibold border ${getPriorityBadgeVariant(
                    ticket.priority,
                  )}`}
                >
                  اولویت {TicketPriorityLabelsPersian[ticket.priority as keyof typeof TicketPriorityLabelsPersian]}
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl font-black text-foreground mt-2">
                {ticket.subject}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-1">
                <span>ثبت شده در: {formatPersianDate(ticket.createdAt)}</span>
                <span>•</span>
                <span>آخرین بروزرسانی: {formatPersianDate(ticket.updatedAt)}</span>
              </div>
            </div>

            {/* Quick Actions Bar */}
            <div className="flex flex-wrap items-center gap-2 self-start">
              {isStaff && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setNewStatus(ticket.status);
                      setStatusModalOpen(true);
                    }}
                    className="text-xs gap-1.5"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    <span>تغییر وضعیت</span>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setAssignedSpecialistId(ticket.assignedToId || 'unassigned');
                      setAssignModalOpen(true);
                    }}
                    className="text-xs gap-1.5"
                  >
                    <UserCheck className="h-3.5 w-3.5" />
                    <span>ارجاع تیکت</span>
                  </Button>
                </>
              )}

              {isRequester && ticket.status === TicketStatus.RESOLVED && !ticket.feedback && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setFeedbackModalOpen(true)}
                  className="text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <Star className="h-3.5 w-3.5" />
                  <span>ثبت نظر و امتیاز</span>
                </Button>
              )}

              {isRequester && isResolvedOrClosed && !ticket.objection && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setObjectionModalOpen(true)}
                  className="text-xs gap-1.5 text-amber-600 border-amber-300 hover:bg-amber-50"
                >
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <span>ثبت اعتراض</span>
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grid Layout: Left Timeline (2 cols) & Right Meta Cards (1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Messages Timeline */}
        <div className="lg:col-span-2 space-y-6">
          {/* Conversation Thread */}
          <Card>
            <CardHeader className="pb-3 border-b border-border">
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-primary" />
                گفتگو و تاریخچه پیام‌ها
              </CardTitle>
            </CardHeader>

            <CardContent className="p-4 sm:p-6 space-y-4">
              {/* Message items */}
              {ticket.messages.map((m: any) => {
                const isAuthorStaff = [UserRole.SPECIALIST, UserRole.MANAGER, UserRole.ADMIN].includes(
                  m.authorRole,
                );

                return (
                  <div
                    key={m.id}
                    className={`rounded-xl p-4 border transition-all ${
                      m.isInternal
                        ? 'bg-amber-500/10 border-amber-500/30'
                        : isAuthorStaff
                        ? 'bg-secondary/40 border-primary/20'
                        : 'bg-card border-border'
                    }`}
                  >
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-border/40">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-foreground">{m.authorName}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-background border border-border text-muted-foreground">
                          {RoleLabelsPersian[m.authorRole as keyof typeof RoleLabelsPersian]}
                        </span>
                        {m.isInternal && (
                          <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-white">
                            <Lock className="h-2.5 w-2.5" />
                            یادداشت داخلی محرمانه همکاران
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-muted-foreground font-mono">
                        {formatPersianDate(m.createdAt)}
                      </span>
                    </div>

                    <p className="text-xs leading-relaxed text-foreground whitespace-pre-wrap">
                      {m.content}
                    </p>
                  </div>
                );
              })}

              {/* Reply Box */}
              {!ticket.closedAt ? (
                <div className="mt-6 pt-4 border-t border-border space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground">ارسال پاسخ جدید</span>
                    {isStaff && (
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-muted-foreground cursor-pointer flex items-center gap-1.5 select-none">
                          <input
                            type="checkbox"
                            checked={isInternalNote}
                            onChange={(e) => setIsInternalNote(e.target.checked)}
                            className="rounded border-border text-amber-600 focus:ring-amber-500 h-3.5 w-3.5"
                          />
                          <span className={isInternalNote ? 'font-bold text-amber-600' : ''}>
                            یادداشت داخلی (غیرقابل مشاهده برای دانشجو/کاربر)
                          </span>
                        </label>
                      </div>
                    )}
                  </div>

                  <Textarea
                    placeholder={
                      isInternalNote
                        ? 'متن یادداشت داخلی همکاران را اینجا وارد نمایید...'
                        : 'پاسخ خود به تیکت را اینجا تایپ کنید...'
                    }
                    rows={4}
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                  />

                  <div className="flex justify-end">
                    <Button
                      onClick={() => sendMessageMutation.mutate()}
                      disabled={!replyContent.trim() || sendMessageMutation.isPending}
                      isLoading={sendMessageMutation.isPending}
                      className={isInternalNote ? 'bg-amber-600 hover:bg-amber-700 text-white gap-2' : 'gap-2'}
                    >
                      <Send className="h-4 w-4" />
                      <span>{isInternalNote ? 'ثبت یادداشت داخلی' : 'ارسال پاسخ'}</span>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="p-3 text-xs text-center rounded-lg bg-muted text-muted-foreground">
                  این تیکت بسته شده است و امکان ارسال پیام جدید وجود ندارد.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Objections Section (if any) */}
          {ticket.objection && (
            <Card className="border-amber-500/40 bg-amber-50/10">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base text-amber-700 dark:text-amber-400 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    اعتراض ثبت شده نسبت به تیکت
                  </CardTitle>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getObjectionBadgeVariant(
                      ticket.objection.status,
                    )}`}
                  >
                    {ObjectionStatusLabelsPersian[ticket.objection.status as keyof typeof ObjectionStatusLabelsPersian]}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <div>
                  <span className="font-semibold text-foreground">متن اعتراض کاربر:</span>
                  <p className="mt-1 p-3 rounded-lg bg-background border border-border text-foreground leading-relaxed">
                    {ticket.objection.description}
                  </p>
                </div>

                {ticket.objection.resolutionNote && (
                  <div>
                    <span className="font-semibold text-foreground">نتیجه و پاسخ واحد رسیدگی:</span>
                    <p className="mt-1 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 leading-relaxed">
                      {ticket.objection.resolutionNote}
                    </p>
                  </div>
                )}

                {isStaff && ticket.objection.status === ObjectionStatus.PENDING && (
                  <div className="pt-2">
                    <Button
                      size="sm"
                      onClick={() => setReviewObjectionModalOpen(true)}
                      className="text-xs bg-amber-600 hover:bg-amber-700 text-white"
                    >
                      بررسی و پاسخ به اعتراض
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Feedback Rating Card (if any) */}
          {ticket.feedback && (
            <Card className="border-emerald-500/40 bg-emerald-50/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                  <Star className="h-4 w-4 fill-emerald-500 text-emerald-500" />
                  امتیاز رضایت‌سنجی کاربر
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                <div className="flex items-center gap-1 text-amber-500">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < ticket.feedback.rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'
                      }`}
                    />
                  ))}
                  <span className="font-bold text-foreground mr-2">
                    {toPersianDigits(ticket.feedback.rating)} از ۵
                  </span>
                </div>
                {ticket.feedback.comment && (
                  <p className="text-muted-foreground bg-background p-2.5 rounded-lg border border-border">
                    «{ticket.feedback.comment}»
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column: Meta Information & Attachments & Audit History */}
        <div className="space-y-6">
          {/* Ticket Information Card */}
          <Card>
            <CardHeader className="pb-3 border-b border-border">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                مشخصات درخواست
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3 text-xs">
              <div>
                <span className="text-muted-foreground">خدمت درخواستی:</span>
                <p className="font-semibold text-foreground mt-0.5">{ticket.serviceName}</p>
              </div>
              <div>
                <span className="text-muted-foreground">واحد مسئول:</span>
                <p className="font-semibold text-foreground mt-0.5">{ticket.departmentName}</p>
              </div>
              <div>
                <span className="text-muted-foreground">کارشناس تخصیص یافته:</span>
                <p className="font-semibold text-foreground mt-0.5">
                  {ticket.assignedToName || 'هنوز تخصیص نیافته'}
                </p>
              </div>
              <div className="pt-2 border-t border-border">
                <span className="text-muted-foreground">درخواست‌کننده:</span>
                <p className="font-semibold text-foreground mt-0.5">{ticket.requesterName}</p>
                <p className="text-[11px] text-muted-foreground">{ticket.requesterEmail}</p>
              </div>
            </CardContent>
          </Card>

          {/* Attachments Card */}
          <Card>
            <CardHeader className="pb-3 border-b border-border">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Paperclip className="h-4 w-4 text-primary" />
                فایل‌های پیوست ({toPersianDigits(ticket.attachments?.length || 0)})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-2 text-xs">
              {ticket.attachments && ticket.attachments.length > 0 ? (
                ticket.attachments.map((a: any) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-muted/40 border border-border"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Paperclip className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="truncate font-medium">{a.originalName}</span>
                    </div>
                    <a
                      href={`${import.meta.env.VITE_API_URL || 'http://localhost:4000/api'}/attachments/${a.id}/download`}
                      download
                      className="text-primary hover:text-primary/80 p-1 shrink-0"
                      title="دانلود فایل"
                    >
                      <Download className="h-4 w-4" />
                    </a>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-2">فایل پیوستی وجود ندارد</p>
              )}
            </CardContent>
          </Card>

          {/* Activity / History Timeline */}
          <Card>
            <CardHeader className="pb-3 border-b border-border">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <History className="h-4 w-4 text-primary" />
                سوابق رویدادها
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="relative border-r border-border/80 mr-2 space-y-4">
                {ticket.history?.map((h: any) => (
                  <div key={h.id} className="relative pr-4 text-xs space-y-0.5">
                    <span className="absolute -right-1.5 top-1 h-3 w-3 rounded-full bg-primary/20 border-2 border-primary" />
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-foreground">{h.actorName}</span>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {formatPersianDate(h.createdAt)}
                      </span>
                    </div>
                    <p className="text-muted-foreground text-[11px]">{h.note || h.action}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* MODAL: Change Status */}
      <Dialog open={statusModalOpen} onOpenChange={setStatusModalOpen}>
        <DialogHeader>
          <DialogTitle>تغییر وضعیت تیکت</DialogTitle>
          <DialogDescription>
            وضعیت جدید گردش کار تیکت را انتخاب نمایید.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <label className="text-xs font-bold">وضعیت جدید</label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as TicketStatus)}
              className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-xs"
            >
              {Object.values(TicketStatus).map((s) => (
                <option key={s} value={s}>
                  {TicketStatusLabelsPersian[s]}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold">توضیحات یا علت تغییر وضعیت (اختیاری)</label>
            <Textarea
              placeholder="توضیحات تکمیلی..."
              value={statusNote}
              onChange={(e) => setStatusNote(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setStatusModalOpen(false)}>
            انصراف
          </Button>
          <Button
            onClick={() => updateStatusMutation.mutate()}
            isLoading={updateStatusMutation.isPending}
          >
            ثبت تغییر وضعیت
          </Button>
        </DialogFooter>
      </Dialog>

      {/* MODAL: Assign Specialist */}
      <Dialog open={assignModalOpen} onOpenChange={setAssignModalOpen}>
        <DialogHeader>
          <DialogTitle>تخصیص / ارجاع تیکت به کارشناس</DialogTitle>
          <DialogDescription>
            کارشناس مسئول این تیکت را تعیین فرمایید.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <label className="text-xs font-bold">انتخاب کارشناس</label>
            <select
              value={assignedSpecialistId}
              onChange={(e) => setAssignedSpecialistId(e.target.value)}
              className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-xs"
            >
              <option value="unassigned">-- بدون تخصیص (در صف دپارتمان) --</option>
              {(specialists || []).map((s: any) => (
                <option key={s.id} value={s.id}>
                  {s.fullName} ({RoleLabelsPersian[s.role as keyof typeof RoleLabelsPersian]})
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold">یادداشت ارجاع (اختیاری)</label>
            <Input
              placeholder="علت ارجاع..."
              value={assignNote}
              onChange={(e) => setAssignNote(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setAssignModalOpen(false)}>
            انصراف
          </Button>
          <Button
            onClick={() => assignMutation.mutate()}
            isLoading={assignMutation.isPending}
          >
            ذخیره ارجاع
          </Button>
        </DialogFooter>
      </Dialog>

      {/* MODAL: Submit Feedback Rating */}
      <Dialog open={feedbackModalOpen} onOpenChange={setFeedbackModalOpen}>
        <DialogHeader>
          <DialogTitle>نظرسنجی و امتیاز به کیفیت پاسخ‌گویی</DialogTitle>
          <DialogDescription>
            لطفاً رضایت خود را از نحوه رسیدگی به درخواست ثبت فرمایید.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="flex items-center justify-center gap-2 py-3">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className="p-1 cursor-pointer transition-transform hover:scale-110"
              >
                <Star
                  className={`h-8 w-8 ${
                    star <= rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'
                  }`}
                />
              </button>
            ))}
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold">دیدگاه تکمیلی شما (اختیاری)</label>
            <Textarea
              placeholder="نظرات، پیشنهادات یا انتقادات خود را بنویسید..."
              value={feedbackComment}
              onChange={(e) => setFeedbackComment(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setFeedbackModalOpen(false)}>
            انصراف
          </Button>
          <Button
            onClick={() => feedbackMutation.mutate()}
            isLoading={feedbackMutation.isPending}
          >
            ثبت امتیاز
          </Button>
        </DialogFooter>
      </Dialog>

      {/* MODAL: Submit Objection */}
      <Dialog open={objectionModalOpen} onOpenChange={setObjectionModalOpen}>
        <DialogHeader>
          <DialogTitle>ثبت اعتراض نسبت به پاسخ تیکت</DialogTitle>
          <DialogDescription>
            در صورت عدم حل مشکل یا نارضایتی از پاسخ دریافتی، دلایل اعتراض خود را شرح دهید تا توسط مدیر واحد بازبینی گردد.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <label className="text-xs font-bold">شرح اعتراض <span className="text-destructive">*</span></label>
            <Textarea
              placeholder="شرح دقیق علت اعتراض و عدم پذیرش پاسخ کارشناس..."
              rows={5}
              value={objectionDesc}
              onChange={(e) => setObjectionDesc(e.target.value)}
              required
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setObjectionModalOpen(false)}>
            انصراف
          </Button>
          <Button
            onClick={() => objectionMutation.mutate()}
            isLoading={objectionMutation.isPending}
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            ارسال اعتراض
          </Button>
        </DialogFooter>
      </Dialog>

      {/* MODAL: Review Objection */}
      <Dialog open={reviewObjectionModalOpen} onOpenChange={setReviewObjectionModalOpen}>
        <DialogHeader>
          <DialogTitle>بررسی و رسیدگی به اعتراض کاربر</DialogTitle>
          <DialogDescription>
            نتیجه بررسی اعتراض درخواست‌کننده را ثبت فرمایید.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <label className="text-xs font-bold">نتیجه بازبینی</label>
            <select
              value={objectionReviewStatus}
              onChange={(e) => setObjectionReviewStatus(e.target.value as ObjectionStatus)}
              className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-xs"
            >
              <option value={ObjectionStatus.RESOLVED}>پذیرش اعتراض و بازگشایی تیکت (RESOLVED)</option>
              <option value={ObjectionStatus.REJECTED}>رد اعتراض (REJECTED)</option>
              <option value={ObjectionStatus.REVIEWING}>در حال بررسی کارشناسی (REVIEWING)</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold">توضیحات پاسخ به اعتراض <span className="text-destructive">*</span></label>
            <Textarea
              placeholder="توضیح دلایل پذیرش یا رد اعتراض جهت مشاهده کاربر..."
              rows={4}
              value={objectionReviewNote}
              onChange={(e) => setObjectionReviewNote(e.target.value)}
              required
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setReviewObjectionModalOpen(false)}>
            انصراف
          </Button>
          <Button
            onClick={() => reviewObjectionMutation.mutate()}
            isLoading={reviewObjectionMutation.isPending}
          >
            ثبت نتیجه بررسی
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
};
