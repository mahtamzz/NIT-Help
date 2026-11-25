import { EVENT_PATTERNS } from '@nit-help/microservice-common';
import { TicketStatus } from '@nit-help/shared';
import {
  TicketNotFoundError,
  TicketValidationError,
} from '../../domain/ticket.errors';
import { TicketPolicy } from '../../domain/ticket.policy';
import { TicketActorContext } from '../../domain/ticket.types';
import { TicketEventPublisherPort } from '../ports/ticket-event-publisher.port';
import { TicketRepositoryPort } from '../ports/ticket-repository.port';
import { UserDirectoryPort } from '../ports/user-directory.port';
import { toTicketEventSnapshot } from '../ticket-snapshot.mapper';

export class AssignTicketUseCase {
  constructor(
    private readonly ticketRepository: TicketRepositoryPort,
    private readonly userDirectory: UserDirectoryPort,
    private readonly eventPublisher: TicketEventPublisherPort,
  ) {}

  async execute(
    ticketId: string,
    user: TicketActorContext,
    command: { departmentId?: string; assignedToId: string | null; note?: string },
  ) {
    TicketPolicy.assertCanAssignTicket(user);

    const ticket = await this.ticketRepository.findTicketForMutation(ticketId);
    if (!ticket) {
      throw new TicketNotFoundError('تیکت یافت نشد');
    }

    let assigneeUser = null;
    if (command.assignedToId) {
      assigneeUser = await this.userDirectory.getFreshUserById(
        command.assignedToId,
      );
      if (!assigneeUser || !assigneeUser.isActive) {
        throw new TicketValidationError('کارشناس انتخاب شده معتبر یا فعال نیست');
      }
    }

    const userMap = await this.userDirectory.resolveUsersByIds([ticket.assignedToId]);
    const oldAssigneeName =
      (ticket.assignedToId && userMap.get(ticket.assignedToId)?.fullName) ||
      'بدون تخصیص';
    const newAssigneeName = assigneeUser?.fullName || 'بدون تخصیص';

    let targetDepartment = ticket.department;
    if (command.departmentId) {
      targetDepartment =
        (await this.ticketRepository.findDepartmentById(command.departmentId)) ||
        ticket.department;
    }

    const newStatus =
      command.assignedToId && ticket.status === TicketStatus.NEW
        ? TicketStatus.ASSIGNED
        : undefined;

    const updated = await this.ticketRepository.assignTicketWithHistory({
      ticketId,
      actorId: user.id,
      assignedToId: command.assignedToId,
      departmentId: command.departmentId,
      newStatus,
      oldAssigneeName,
      newAssigneeName,
      note: command.note || `ارجاع تیکت به ${newAssigneeName}`,
    });

    await this.eventPublisher.publish(EVENT_PATTERNS.TICKET_ASSIGNED, {
      ticket: toTicketEventSnapshot(updated, ticket.service.name, targetDepartment),
      oldAssigneeId: ticket.assignedToId,
      oldAssigneeName,
      newAssigneeId: command.assignedToId,
      newAssigneeName,
      note: command.note,
      actor: user,
    });

    return updated;
  }
}
