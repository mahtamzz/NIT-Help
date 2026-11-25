import { EVENT_PATTERNS } from '@nit-help/microservice-common';
import { TicketStatus } from '@nit-help/shared';
import { TicketNotFoundError } from '../../domain/ticket.errors';
import { TicketPolicy } from '../../domain/ticket.policy';
import { TicketActorContext } from '../../domain/ticket.types';
import { TicketEventPublisherPort } from '../ports/ticket-event-publisher.port';
import { TicketRepositoryPort } from '../ports/ticket-repository.port';
import { toTicketEventSnapshot } from '../ticket-snapshot.mapper';

export class UpdateTicketStatusUseCase {
  constructor(
    private readonly ticketRepository: TicketRepositoryPort,
    private readonly eventPublisher: TicketEventPublisherPort,
  ) {}

  async execute(
    ticketId: string,
    user: TicketActorContext,
    command: { status: TicketStatus; note?: string },
  ) {
    const ticket = await this.ticketRepository.findTicketForMutation(ticketId);
    if (!ticket) {
      throw new TicketNotFoundError('تیکت مورد نظر یافت نشد');
    }

    TicketPolicy.assertCanUpdateStatus(ticket, user, command.status);

    const oldStatus = ticket.status;
    const newStatus = command.status;

    if (oldStatus === newStatus) {
      return ticket;
    }

    const updated = await this.ticketRepository.updateStatusWithHistory({
      ticketId,
      actorId: user.id,
      oldStatus,
      newStatus,
      resolvedAt: newStatus === TicketStatus.RESOLVED ? new Date() : undefined,
      closedAt: newStatus === TicketStatus.CLOSED ? new Date() : undefined,
      note: command.note || `تغییر وضعیت تیکت از ${oldStatus} به ${newStatus}`,
    });

    await this.eventPublisher.publish(EVENT_PATTERNS.TICKET_STATUS_CHANGED, {
      ticket: toTicketEventSnapshot(updated, ticket.service.name, ticket.department),
      oldStatus,
      newStatus,
      note: command.note,
      actor: user,
    });

    return updated;
  }
}
