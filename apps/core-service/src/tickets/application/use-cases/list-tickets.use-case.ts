import { TicketPriority, TicketStatus, UserRole } from '@nit-help/shared';
import { TicketActorContext } from '../../domain/ticket.types';
import { TicketAttachmentsPort } from '../ports/ticket-attachments.port';
import { TicketRepositoryPort } from '../ports/ticket-repository.port';
import { UserDirectoryPort } from '../ports/user-directory.port';

export interface ListTicketsQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: TicketStatus;
  priority?: TicketPriority;
  serviceId?: string;
  departmentId?: string;
  assignedToId?: string;
  requesterId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export class ListTicketsUseCase {
  constructor(
    private readonly ticketRepository: TicketRepositoryPort,
    private readonly userDirectory: UserDirectoryPort,
    private readonly attachmentsPort: TicketAttachmentsPort,
  ) {}

  async execute(user: TicketActorContext, query: ListTicketsQuery) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 20));

    const scopedDepartmentId =
      query.departmentId &&
      (user.role === UserRole.ADMIN || user.departmentId === query.departmentId)
        ? query.departmentId
        : undefined;

    const scopedRequesterId =
      query.requesterId &&
      (user.role === UserRole.ADMIN || user.role === UserRole.MANAGER)
        ? query.requesterId
        : undefined;

    const { total, items } = await this.ticketRepository.findTickets({
      scopeRole: user.role,
      scopeUserId: user.id,
      scopeDepartmentId: user.departmentId,
      page,
      limit,
      search: query.search,
      status: query.status,
      priority: query.priority,
      serviceId: query.serviceId,
      departmentId: scopedDepartmentId,
      assignedToId: query.assignedToId,
      requesterId: scopedRequesterId,
      sortBy: query.sortBy || 'createdAt',
      sortOrder: query.sortOrder === 'asc' ? 'asc' : 'desc',
    });

    const userIds = items.flatMap((t) => [t.requesterId, t.assignedToId]);
    const [userMap, attachmentCounts] = await Promise.all([
      this.userDirectory.resolveUsersByIds(userIds),
      this.attachmentsPort.getAttachmentsCountByTickets(items.map((t) => t.id)),
    ]);

    const data = items.map((t) => {
      const requester = userMap.get(t.requesterId);
      const assignee = t.assignedToId ? userMap.get(t.assignedToId) : null;
      return {
        id: t.id,
        ticketNumber: t.ticketNumber,
        subject: t.subject,
        description: t.description,
        status: t.status,
        priority: t.priority,
        requesterId: t.requesterId,
        requesterName: requester?.fullName || 'کاربر سامانه',
        requesterEmail: requester?.email || '',
        serviceId: t.serviceId,
        serviceName: t.service.name,
        departmentId: t.departmentId,
        departmentName: t.department.name,
        assignedToId: t.assignedToId,
        assignedToName: assignee?.fullName || null,
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
        resolvedAt: t.resolvedAt?.toISOString() || null,
        closedAt: t.closedAt?.toISOString() || null,
        feedback: t.feedback ? { rating: t.feedback.rating } : null,
        objection: t.objection ? { status: t.objection.status } : null,
        messagesCount: t.messagesCount,
        attachmentsCount: attachmentCounts[t.id] || 0,
      };
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
