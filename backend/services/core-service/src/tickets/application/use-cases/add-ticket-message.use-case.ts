import { EVENT_PATTERNS } from '@nit-help/microservice-common';
import { TicketStatus } from '@nit-help/shared';
import { TicketNotFoundError } from '../../domain/ticket.errors';
import { TicketPolicy } from '../../domain/ticket.policy';
import { TicketActorContext } from '../../domain/ticket.types';
import { TicketEventPublisherPort } from '../ports/ticket-event-publisher.port';
import { TicketRepositoryPort } from '../ports/ticket-repository.port';
import { toTicketEventSnapshot } from '../ticket-snapshot.mapper';

export class AddTicketMessageUseCase {
  constructor(
    private readonly ticketRepository: TicketRepositoryPort,
    private readonly eventPublisher: TicketEventPublisherPort,
  ) {}

  async execute(
    ticketId: string,
    user: TicketActorContext,
    command: { content: string; isInternal?: boolean },
  ) {
    const ticket = await this.ticketRepository.findTicketForMutation(ticketId);
    if (!ticket) {
      throw new TicketNotFoundError('تیکت یافت نشد');
    }

    const { isRequester, isInternal } = TicketPolicy.resolveMessageCreation(
      ticket,
      user,
      command.isInternal,
    );

    const shouldTransition =
      isRequester && ticket.status === TicketStatus.WAITING_FOR_REQUESTER;

    const { message, updatedTicket } =
      await this.ticketRepository.addMessageWithOptionalTransition({
        ticketId,
        authorId: user.id,
        content: command.content.trim(),
        isInternal,
        transitionToInProgressFrom: shouldTransition
          ? TicketStatus.WAITING_FOR_REQUESTER
          : undefined,
        transitionNote:
          'پاسخ کاربر ارسال شد و تیکت به وضعیت در حال بررسی تغییر یافت',
      });

    const latestTicket = updatedTicket || ticket;

    await this.eventPublisher.publish(EVENT_PATTERNS.TICKET_MESSAGE_CREATED, {
      ticket: toTicketEventSnapshot(
        latestTicket,
        ticket.service.name,
        ticket.department,
      ),
      messageId: message.id,
      isInternal,
      statusTransitionedFrom: shouldTransition
        ? TicketStatus.WAITING_FOR_REQUESTER
        : undefined,
      actor: user,
    });

    return {
      id: message.id,
      ticketId: message.ticketId,
      authorId: message.authorId,
      authorName: user.fullName,
      authorRole: user.role,
      content: message.content,
      isInternal: message.isInternal,
      createdAt: message.createdAt.toISOString(),
    };
  }
}
