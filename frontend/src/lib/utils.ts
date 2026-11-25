import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { TicketStatus, TicketPriority, ObjectionStatus } from '@nit-help/shared';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function toPersianDigits(n: number | string | null | undefined): string {
  if (n === null || n === undefined) return '';
  const str = String(n);
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return str.replace(/[0-9]/g, (w) => persianDigits[+w]);
}

export function formatPersianDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return dateStr;
  }
}

export function formatPersianDateShort(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    }).format(d);
  } catch {
    return dateStr;
  }
}

export function getStatusBadgeVariant(status: TicketStatus) {
  switch (status) {
    case TicketStatus.NEW:
      return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900';
    case TicketStatus.ASSIGNED:
      return 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-900';
    case TicketStatus.IN_PROGRESS:
      return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900';
    case TicketStatus.WAITING_FOR_REQUESTER:
      return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-900';
    case TicketStatus.RESOLVED:
      return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900';
    case TicketStatus.CLOSED:
      return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
}

export function getPriorityBadgeVariant(priority: TicketPriority) {
  switch (priority) {
    case TicketPriority.LOW:
      return 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800';
    case TicketPriority.NORMAL:
      return 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-900';
    case TicketPriority.HIGH:
      return 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-900';
    case TicketPriority.URGENT:
      return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900 animate-pulse';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
}

export function getObjectionBadgeVariant(status: ObjectionStatus) {
  switch (status) {
    case ObjectionStatus.PENDING:
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case ObjectionStatus.REVIEWING:
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case ObjectionStatus.RESOLVED:
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case ObjectionStatus.REJECTED:
      return 'bg-rose-50 text-rose-700 border-rose-200';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
}

