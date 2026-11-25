import { TicketAccessContextResponse } from '@nit-help/microservice-common';

export const TICKET_ACCESS_PORT = Symbol('TICKET_ACCESS_PORT');

export interface TicketAccessPort {
  getTicketAccessContext(
    ticketId: string,
    messageId?: string | null,
  ): Promise<TicketAccessContextResponse>;
}
