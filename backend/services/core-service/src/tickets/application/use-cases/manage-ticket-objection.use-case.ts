import { EVENT_PATTERNS } from '@nit-help/microservice-common';
import { ObjectionStatus } from '@nit-help/shared';
import { TicketNotFoundError } from '../../domain/ticket.errors';
import { TicketPolicy } from '../../domain/ticket.policy';
import { TicketActorContext } from '../../domain/ticket.types';
import { TicketEventPublisherPort } from '../ports/ticket-event-publisher.port';
import { TicketRepositoryPort } from '../ports/ticket-repository.port';
import { toTicketEventSnapshot } from '../ticket-snapshot.mapper';

export class ManageTicketObjectionUseCase {
  constructor(
    private readonly ticketRepository: TicketRepositoryPort,
    private readonly eventPublisher: TicketEventPublisherPort,
  ) {}

  async submit(
    ticketId: string,
    user: TicketActorContext,
    command: { description: string },
  ) {
    const ticket = await this.ticketRepository.findTicketForMutation(ticketId);
    if (!ticket) {
      throw new TicketNotFoundError('تیکت یافت نشد');
    }

    TicketPolicy.assertCanSubmitObjection(ticket, user);

    const objection = await this.ticketRepository.createObjectionWithHistory({
      ticketId,
      requesterId: user.id,
      description: command.description.trim(),
      historyNote: 'درخواست‌کننده نسبت به نتیجه تیکت اعتراض ثبت کرد',
    });

    await this.eventPublisher.publish(EVENT_PATTERNS.TICKET_OBJECTION_SUBMITTED, {
      ticket: toTicketEventSnapshot(ticket, ticket.service.name, ticket.department),
      objectionId: objection.id,
      actor: user,
    });

    return objection;
  }

  async review(
    ticketId: string,
    user: TicketActorContext,
    command: { status: ObjectionStatus; resolutionNote: string },
  ) {
    TicketPolicy.assertCanReviewObjection(user);

    const ticket = await this.ticketRepository.findTicketForMutation(ticketId);
    if (!ticket || !ticket.objection) {
      throw new TicketNotFoundError('اعتراضی برای این تیکت یافت نشد');
    }

    const { objection, updatedTicket } =
      await this.ticketRepository.reviewObjectionWithHistory({
        ticketId,
        actorId: user.id,
        status: command.status,
        resolutionNote: command.resolutionNote.trim(),
        reopenTicket: command.status === ObjectionStatus.RESOLVED,
      });

    const latestTicket = updatedTicket || ticket;

    await this.eventPublisher.publish(EVENT_PATTERNS.TICKET_OBJECTION_REVIEWED, {
      ticket: toTicketEventSnapshot(
        latestTicket,
        ticket.service.name,
        ticket.department,
      ),
      objectionStatus: command.status,
      resolutionNote: command.resolutionNote.trim(),
      actor: user,
    });

    return objection;
  }
}
