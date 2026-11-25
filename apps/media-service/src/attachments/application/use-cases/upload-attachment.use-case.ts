import { AuthenticatedUser, EVENT_PATTERNS } from '@nit-help/microservice-common';
import { AttachmentValidationError } from '../../domain/attachment.errors';
import { AttachmentPolicy } from '../../domain/attachment.policy';
import { AttachmentRepositoryPort } from '../ports/attachment-repository.port';
import { MediaEventPublisherPort } from '../ports/media-event-publisher.port';
import { StoragePort } from '../ports/storage.port';
import { TicketAccessPort } from '../ports/ticket-access.port';

export interface UploadAttachmentFileInput {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

export class UploadAttachmentUseCase {
  constructor(
    private readonly attachmentRepository: AttachmentRepositoryPort,
    private readonly storagePort: StoragePort,
    private readonly ticketAccessPort: TicketAccessPort,
    private readonly eventPublisher: MediaEventPublisherPort,
  ) {}

  async execute(
    file: UploadAttachmentFileInput,
    user: AuthenticatedUser,
    ticketId: string,
    messageId?: string,
  ) {
    if (!ticketId) {
      throw new AttachmentValidationError('شناسه تیکت الزامی است');
    }

    const ctx = await this.ticketAccessPort.getTicketAccessContext(
      ticketId,
      messageId || null,
    );
    AttachmentPolicy.assertTicketAccess(ctx, user);

    const storageKey = AttachmentPolicy.buildStorageKey(file.originalname);
    const originalName = AttachmentPolicy.decodeOriginalFilename(file.originalname);

    await this.storagePort.save(storageKey, file.buffer);

    let attachment;
    try {
      attachment = await this.attachmentRepository.create({
        ticketId,
        messageId: messageId || null,
        uploadedById: user.id,
        originalName,
        storageKey,
        mimeType: file.mimetype,
        size: file.size,
      });
    } catch (error) {
      await this.storagePort.delete(storageKey).catch(() => undefined);
      throw error;
    }

    await this.eventPublisher.publish(EVENT_PATTERNS.ATTACHMENT_UPLOADED, {
      attachmentId: attachment.id,
      ticketId,
      messageId: attachment.messageId,
      uploadedById: user.id,
      originalName: attachment.originalName,
      size: attachment.size,
      mimeType: attachment.mimeType,
      actor: user,
    });

    return attachment;
  }
}
