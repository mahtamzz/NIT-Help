import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { MEDIA_PATTERNS } from '@nit-help/microservice-common';
import { QueryTicketAttachmentsUseCase } from './attachments/application/use-cases/query-ticket-attachments.use-case';

@Controller()
export class MediaRpcController {
  constructor(
    private readonly queryAttachments: QueryTicketAttachmentsUseCase,
  ) {}

  @MessagePattern(MEDIA_PATTERNS.GET_TICKET_ATTACHMENTS)
  getTicketAttachments(@Payload() data: { ticketId: string }) {
    return this.queryAttachments.getByTicketId(data.ticketId);
  }

  @MessagePattern(MEDIA_PATTERNS.GET_ATTACHMENTS_COUNT_BY_TICKETS)
  getAttachmentsCountByTickets(@Payload() data: { ticketIds: string[] }) {
    return this.queryAttachments.countByTicketIds(data.ticketIds);
  }
}
