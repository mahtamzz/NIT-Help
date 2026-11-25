import { Injectable } from '@nestjs/common';
import { UserDirectoryService } from '../../../clients/user-directory.service';
import { TicketAttachmentsPort } from '../../application/ports/ticket-attachments.port';
import { TicketAttachmentRecord } from '../../domain/ticket.types';

@Injectable()
export class TicketAttachmentsAdapter implements TicketAttachmentsPort {
  constructor(private readonly userDirectory: UserDirectoryService) {}

  getTicketAttachments(ticketId: string): Promise<TicketAttachmentRecord[]> {
    return this.userDirectory.getTicketAttachments(ticketId);
  }

  getAttachmentsCountByTickets(
    ticketIds: string[],
  ): Promise<Record<string, number>> {
    return this.userDirectory.getAttachmentsCountByTickets(ticketIds);
  }
}
