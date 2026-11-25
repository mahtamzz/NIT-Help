import { AuthenticatedUser } from '@nit-help/microservice-common';
import { AttachmentNotFoundError } from '../../domain/attachment.errors';
import { AttachmentPolicy } from '../../domain/attachment.policy';
import { StorageDownloadTarget } from '../../domain/attachment.types';
import { AttachmentRepositoryPort } from '../ports/attachment-repository.port';
import { StoragePort } from '../ports/storage.port';
import { TicketAccessPort } from '../ports/ticket-access.port';

export interface DownloadedAttachmentResult {
  target: StorageDownloadTarget;
  originalName: string;
  mimeType: string;
}

export class DownloadAttachmentUseCase {
  constructor(
    private readonly attachmentRepository: AttachmentRepositoryPort,
    private readonly storagePort: StoragePort,
    private readonly ticketAccessPort: TicketAccessPort,
  ) {}

  async execute(
    attachmentId: string,
    user: AuthenticatedUser,
  ): Promise<DownloadedAttachmentResult> {
    const attachment = await this.attachmentRepository.findById(attachmentId);
    if (!attachment) {
      throw new AttachmentNotFoundError('فایل پیوست یافت نشد');
    }

    const ctx = await this.ticketAccessPort.getTicketAccessContext(
      attachment.ticketId,
      attachment.messageId,
    );
    AttachmentPolicy.assertTicketAccess(ctx, user);

    const target = await this.storagePort.getDownloadTarget(attachment.storageKey);
    if (!target) {
      throw new AttachmentNotFoundError('فایل فیزیکی روی سرور یافت نشد');
    }

    return {
      target,
      originalName: attachment.originalName,
      mimeType: attachment.mimeType,
    };
  }
}
