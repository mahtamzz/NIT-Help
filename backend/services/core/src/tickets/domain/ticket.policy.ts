import { TicketStatus, UserRole } from '@nit-help/shared';
import {
  TicketForbiddenError,
  TicketValidationError,
} from './ticket.errors';
import {
  TicketActorContext,
  TicketAttachmentRecord,
  TicketEntity,
  TicketWithRelations,
} from './ticket.types';

export class TicketPolicy {
  static isStaffRole(role: UserRole | string): boolean {
    return (
      role === UserRole.SPECIALIST ||
      role === UserRole.MANAGER ||
      role === UserRole.ADMIN
    );
  }

  static assertCanViewTicket(
    ticket: Pick<TicketEntity, 'requesterId' | 'assignedToId' | 'departmentId'>,
    user: Pick<TicketActorContext, 'id' | 'role' | 'departmentId'>,
  ): void {
    const isRequester = ticket.requesterId === user.id;
    const isStaff = this.isStaffRole(user.role);

    if (!isStaff && !isRequester) {
      throw new TicketForbiddenError('شما دسترسی مشاهده این تیکت را ندارید');
    }

    if (user.role === UserRole.SPECIALIST) {
      if (ticket.assignedToId !== user.id && ticket.departmentId !== user.departmentId) {
        throw new TicketForbiddenError('شما دسترسی به تیکت‌های سایر دپارتمان‌ها را ندارید');
      }
    }

    if (user.role === UserRole.MANAGER) {
      if (ticket.departmentId !== user.departmentId && user.departmentId) {
        throw new TicketForbiddenError('شما دسترسی به تیکت‌های این دپارتمان را ندارید');
      }
    }
  }

  static assertCanUpdateStatus(
    ticket: Pick<TicketEntity, 'requesterId'>,
    user: Pick<TicketActorContext, 'id' | 'role'>,
    newStatus: TicketStatus,
  ): void {
    const isStaff = this.isStaffRole(user.role);
    const isRequester = ticket.requesterId === user.id;

    if (!isStaff && !isRequester) {
      throw new TicketForbiddenError('شما دسترسی تغییر وضعیت این تیکت را ندارید');
    }

    if (!isStaff && isRequester) {
      if (
        newStatus !== TicketStatus.CLOSED &&
        newStatus !== TicketStatus.IN_PROGRESS
      ) {
        throw new TicketForbiddenError(
          'درخواست‌کننده فقط امکان بستن یا بازگشایی مجدد تیکت را دارد',
        );
      }
    }
  }

  static assertCanAssignTicket(user: Pick<TicketActorContext, 'role'>): void {
    if (!this.isStaffRole(user.role)) {
      throw new TicketForbiddenError('شما مجوز ارجاع یا تغییر کارشناس تیکت را ندارید');
    }
  }

  static resolveMessageCreation(
    ticket: Pick<TicketEntity, 'requesterId'>,
    user: Pick<TicketActorContext, 'id' | 'role'>,
    requestedInternal?: boolean,
  ): { isRequester: boolean; isStaff: boolean; isInternal: boolean } {
    const isRequester = ticket.requesterId === user.id;
    const isStaff = this.isStaffRole(user.role);

    if (!isRequester && !isStaff) {
      throw new TicketForbiddenError('شما دسترسی ارسال پیام در این تیکت را ندارید');
    }

    // Requesters can never create internal staff notes
    const isInternal = isStaff ? (requestedInternal ?? false) : false;
    return { isRequester, isStaff, isInternal };
  }

  static assertCanSubmitFeedback(
    ticket: Pick<TicketWithRelations, 'requesterId' | 'status' | 'feedback'>,
    user: Pick<TicketActorContext, 'id'>,
  ): void {
    if (ticket.requesterId !== user.id) {
      throw new TicketForbiddenError(
        'فقط درخواست‌کننده تیکت می‌تواند نظرسنجی را تکمیل کند',
      );
    }

    if (
      ticket.status !== TicketStatus.RESOLVED &&
      ticket.status !== TicketStatus.CLOSED
    ) {
      throw new TicketValidationError(
        'نظرسنجی تنها پس از حل یا بسته شدن تیکت امکان‌پذیر است',
      );
    }

    if (ticket.feedback) {
      throw new TicketValidationError('نظر شما قبلاً برای این تیکت ثبت شده است');
    }
  }

  static assertCanSubmitObjection(
    ticket: Pick<TicketWithRelations, 'requesterId' | 'status' | 'objection'>,
    user: Pick<TicketActorContext, 'id'>,
  ): void {
    if (ticket.requesterId !== user.id) {
      throw new TicketForbiddenError('تنها درخواست‌کننده تیکت امکان ثبت اعتراض را دارد');
    }

    if (
      ticket.status !== TicketStatus.RESOLVED &&
      ticket.status !== TicketStatus.CLOSED
    ) {
      throw new TicketValidationError(
        'اعتراض فقط پس از پاسخ نهایی یا حل تیکت قابل ثبت است',
      );
    }

    if (ticket.objection) {
      throw new TicketValidationError('برای این تیکت قبلاً اعتراض ثبت شده است');
    }
  }

  static assertCanReviewObjection(user: Pick<TicketActorContext, 'role'>): void {
    if (!this.isStaffRole(user.role)) {
      throw new TicketForbiddenError('شما مجوز بررسی اعتراض را ندارید');
    }
  }

  static filterVisibleAttachments(
    attachments: TicketAttachmentRecord[],
    isStaff: boolean,
    internalMessageIds: Set<string>,
  ): TicketAttachmentRecord[] {
    if (isStaff) {
      return attachments;
    }
    return attachments.filter(
      (a) => !a.messageId || !internalMessageIds.has(a.messageId),
    );
  }

  static formatDatePrefix(now = new Date()): string {
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `NIT-${year}${month}${day}-`;
  }

  static nextTicketNumber(
    latestTicketNumber: string | null,
    datePrefix: string,
  ): string {
    if (!latestTicketNumber || !latestTicketNumber.startsWith(datePrefix)) {
      return `${datePrefix}1001`;
    }
    const lastSeq = Number(latestTicketNumber.slice(datePrefix.length));
    const nextSeq = Number.isFinite(lastSeq) && lastSeq >= 1001 ? lastSeq + 1 : 1001;
    return `${datePrefix}${nextSeq}`;
  }

  static clampRating(rating: number): number {
    return Math.max(1, Math.min(5, rating));
  }
}
