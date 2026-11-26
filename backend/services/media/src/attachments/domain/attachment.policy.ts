import {
  AuthenticatedUser,
  TicketAccessContextResponse,
} from '@nit-help/microservice-common';
import { UserRole } from '@nit-help/shared';
import * as path from 'path';
import {
  AttachmentForbiddenError,
  AttachmentNotFoundError,
} from './attachment.errors';

export class AttachmentPolicy {
  static assertTicketAccess(
    ctx: TicketAccessContextResponse,
    user: Pick<AuthenticatedUser, 'id' | 'role' | 'departmentId'>,
  ): void {
    if (!ctx?.exists) {
      throw new AttachmentNotFoundError('تیکت مرتبط با پیوست یافت نشد');
    }

    if (user.role === UserRole.STUDENT || user.role === UserRole.FACULTY) {
      if (ctx.requesterId !== user.id || ctx.messageIsInternal) {
        throw new AttachmentForbiddenError('شما دسترسی به این فایل ندارید');
      }
    } else if (user.role === UserRole.SPECIALIST) {
      if (ctx.assignedToId !== user.id && ctx.departmentId !== user.departmentId) {
        throw new AttachmentForbiddenError('شما دسترسی به فایل‌های این دپارتمان ندارید');
      }
    } else if (user.role === UserRole.MANAGER) {
      if (ctx.departmentId && ctx.departmentId !== user.departmentId) {
        throw new AttachmentForbiddenError('شما دسترسی به فایل‌های این دپارتمان ندارید');
      }
    }
  }

  static buildStorageKey(originalName: string): string {
    const ext = path.extname(originalName).toLowerCase();
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}${ext}`;
  }

  static decodeOriginalFilename(rawOriginalName: string): string {
    return Buffer.from(rawOriginalName, 'latin1').toString('utf8');
  }
}
