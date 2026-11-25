import { TicketAttachmentRecord } from '../../domain/ticket.types';

export const TICKET_ATTACHMENTS_PORT = Symbol('TICKET_ATTACHMENTS_PORT');

export interface TicketAttachmentsPort {
  getTicketAttachments(ticketId: string): Promise<TicketAttachmentRecord[]>;

  getAttachmentsCountByTickets(
    ticketIds: string[],
  ): Promise<Record<string, number>>;
}
