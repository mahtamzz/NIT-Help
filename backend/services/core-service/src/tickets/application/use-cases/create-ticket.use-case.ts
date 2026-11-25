import { EVENT_PATTERNS } from '@nit-help/microservice-common';
import { TicketPriority } from '@nit-help/shared';
import { TicketValidationError } from '../../domain/ticket.errors';
import { TicketPolicy } from '../../domain/ticket.policy';
import { TicketActorContext } from '../../domain/ticket.types';
import { TicketEventPublisherPort } from '../ports/ticket-event-publisher.port';
import { TicketRepositoryPort } from '../ports/ticket-repository.port';
import { toTicketEventSnapshot } from '../ticket-snapshot.mapper';

export interface CreateTicketCommand {
  serviceId: string;
  subject: string;
  description: string;
  priority?: TicketPriority;
}

export class CreateTicketUseCase {
  constructor(
    private readonly ticketRepository: TicketRepositoryPort,
    private readonly eventPublisher: TicketEventPublisherPort,
  ) {}

  async execute(requester: TicketActorContext, command: CreateTicketCommand) {
    const service = await this.ticketRepository.findActiveServiceWithDepartment(
      command.serviceId,
    );

    if (!service || !service.isActive) {
      throw new TicketValidationError('خدمت انتخابی معتبر نیست یا غیرفعال شده است');
    }

    const datePrefix = TicketPolicy.formatDatePrefix();
    const latestNumber =
      await this.ticketRepository.findLatestTicketNumberByPrefix(datePrefix);
    const ticketNumber = TicketPolicy.nextTicketNumber(latestNumber, datePrefix);
    const priority =
      command.priority || service.defaultPriority || TicketPriority.NORMAL;

    const ticket = await this.ticketRepository.createTicketWithInitialActivity({
      ticketNumber,
      subject: command.subject.trim(),
      description: command.description.trim(),
      requesterId: requester.id,
      serviceId: service.id,
      departmentId: service.departmentId,
      priority,
      initialHistoryNote: 'تیکت جدید توسط درخواست‌کننده در سامانه ثبت شد',
    });

    await this.eventPublisher.publish(EVENT_PATTERNS.TICKET_CREATED, {
      ticket: toTicketEventSnapshot(ticket, service.name, service.department),
      actor: requester,
    });

    return {
      ...ticket,
      requester: {
        id: requester.id,
        fullName: requester.fullName,
        email: requester.email,
      },
    };
  }
}
