import { AttachmentEntity } from '../../domain/attachment.types';

export const ATTACHMENT_REPOSITORY = Symbol('ATTACHMENT_REPOSITORY');

export interface AttachmentRepositoryPort {
  create(input: {
    ticketId: string;
    messageId: string | null;
    uploadedById: string;
    originalName: string;
    storageKey: string;
    mimeType: string;
    size: number;
  }): Promise<AttachmentEntity>;

  findById(id: string): Promise<AttachmentEntity | null>;

  findByTicketId(ticketId: string): Promise<AttachmentEntity[]>;

  countByTicketIds(ticketIds: string[]): Promise<Record<string, number>>;
}
