import { AttachmentRepositoryPort } from '../ports/attachment-repository.port';

export class QueryTicketAttachmentsUseCase {
  constructor(private readonly attachmentRepository: AttachmentRepositoryPort) {}

  async getByTicketId(ticketId: string) {
    return this.attachmentRepository.findByTicketId(ticketId);
  }

  async countByTicketIds(ticketIds: string[]): Promise<Record<string, number>> {
    if (!ticketIds || ticketIds.length === 0) {
      return {};
    }
    return this.attachmentRepository.countByTicketIds(ticketIds);
  }
}
