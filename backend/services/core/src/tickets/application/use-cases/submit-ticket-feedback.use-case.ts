import { EVENT_PATTERNS } from '@nit-help/microservice-common';
import { TicketNotFoundError } from '../../domain/ticket.errors';
import { TicketPolicy } from '../../domain/ticket.policy';
import { TicketActorContext } from '../../domain/ticket.types';
import { TicketEventPublisherPort } from '../ports/ticket-event-publisher.port';
import { TicketRepositoryPort } from '../ports/ticket-repository.port';

export class SubmitTicketFeedbackUseCase {
  constructor(
    private readonly ticketRepository: TicketRepositoryPort,
    private readonly eventPublisher: TicketEventPublisherPort,
  ) {}

  async execute(
    ticketId: string,
    user: TicketActorContext,
    command: { rating: number; comment?: string },
  ) {
    const ticket = await this.ticketRepository.findTicketForMutation(ticketId);
    if (!ticket) {
      throw new TicketNotFoundError('تیکت یافت نشد');
    }

    TicketPolicy.assertCanSubmitFeedback(ticket, user);

    const feedback = await this.ticketRepository.createFeedback({
      ticketId,
      requesterId: user.id,
      rating: TicketPolicy.clampRating(command.rating),
      comment: command.comment?.trim(),
    });

    await this.eventPublisher.publish(EVENT_PATTERNS.TICKET_FEEDBACK_SUBMITTED, {
      ticketId: ticket.id,
      ticketNumber: ticket.ticketNumber,
      rating: feedback.rating,
      actor: user,
    });

    return feedback;
  }
}
