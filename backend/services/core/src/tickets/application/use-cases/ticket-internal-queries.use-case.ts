import { TicketAccessContextRequest } from '@nit-help/microservice-common';
import { TicketRepositoryPort } from '../ports/ticket-repository.port';

export class TicketInternalQueriesUseCase {
  constructor(private readonly ticketRepository: TicketRepositoryPort) {}

  getAccessContext(request: TicketAccessContextRequest) {
    return this.ticketRepository.getTicketAccessContext(
      request.ticketId,
      request.messageId,
    );
  }

  exportAnalyticsSeed() {
    return this.ticketRepository.exportAnalyticsSeed();
  }
}
