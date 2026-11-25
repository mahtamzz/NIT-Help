import { UserRole } from '@nit-help/shared';
import { TicketNotFoundError } from '../../domain/ticket.errors';
import { TicketPolicy } from '../../domain/ticket.policy';
import { TicketActorContext } from '../../domain/ticket.types';
import { TicketAttachmentsPort } from '../ports/ticket-attachments.port';
import { TicketRepositoryPort } from '../ports/ticket-repository.port';
import { UserDirectoryPort } from '../ports/user-directory.port';

export class GetTicketDetailUseCase {
  constructor(
    private readonly ticketRepository: TicketRepositoryPort,
    private readonly userDirectory: UserDirectoryPort,
    private readonly attachmentsPort: TicketAttachmentsPort,
  ) {}

  async execute(ticketId: string, user: TicketActorContext) {
    const isStaff = TicketPolicy.isStaffRole(user.role);

    const result = await this.ticketRepository.findTicketDetailsById(
      ticketId,
      isStaff,
    );

    if (!result) {
      throw new TicketNotFoundError('تیکت مورد نظر یافت نشد');
    }

    const { ticket, messages, internalMessageIds } = result;
    TicketPolicy.assertCanViewTicket(ticket, user);

    const rawAttachments = await this.attachmentsPort.getTicketAttachments(ticketId);
    const visibleAttachments = TicketPolicy.filterVisibleAttachments(
      rawAttachments,
      isStaff,
      new Set(internalMessageIds),
    );

    const history = ticket.history || [];
    const userIds = [
      ticket.requesterId,
      ticket.assignedToId,
      ticket.objection?.requesterId,
      ...messages.map((m) => m.authorId),
      ...history.map((h) => h.actorId),
      ...visibleAttachments.map((a) => a.uploadedById),
    ];
    const userMap = await this.userDirectory.resolveUsersByIds(userIds);

    const attachmentsByMessage = new Map<string, any[]>();
    const formattedAttachments = visibleAttachments.map((a) => {
      const item = {
        ...a,
        uploaderName: userMap.get(a.uploadedById)?.fullName || 'کاربر',
      };
      if (a.messageId) {
        const list = attachmentsByMessage.get(a.messageId) || [];
        list.push(item);
        attachmentsByMessage.set(a.messageId, list);
      }
      return item;
    });

    const requester = userMap.get(ticket.requesterId);
    const assignee = ticket.assignedToId ? userMap.get(ticket.assignedToId) : null;

    return {
      id: ticket.id,
      ticketNumber: ticket.ticketNumber,
      subject: ticket.subject,
      description: ticket.description,
      status: ticket.status,
      priority: ticket.priority,
      requesterId: ticket.requesterId,
      requesterName: requester?.fullName || 'کاربر سامانه',
      requesterEmail: requester?.email || '',
      requesterUsername: requester?.username || '',
      serviceId: ticket.serviceId,
      serviceName: ticket.service.name,
      departmentId: ticket.departmentId,
      departmentName: ticket.department.name,
      assignedToId: ticket.assignedToId,
      assignedToName: assignee?.fullName || null,
      createdAt: ticket.createdAt.toISOString(),
      updatedAt: ticket.updatedAt.toISOString(),
      resolvedAt: ticket.resolvedAt?.toISOString() || null,
      closedAt: ticket.closedAt?.toISOString() || null,
      messages: messages.map((m) => {
        const author = userMap.get(m.authorId);
        return {
          id: m.id,
          ticketId: m.ticketId,
          authorId: m.authorId,
          authorName: author?.fullName || 'کاربر',
          authorRole: author?.role || UserRole.STUDENT,
          content: m.content,
          isInternal: m.isInternal,
          createdAt: m.createdAt.toISOString(),
          attachments: attachmentsByMessage.get(m.id) || [],
        };
      }),
      attachments: formattedAttachments,
      history: history.map((h) => {
        const actor = userMap.get(h.actorId);
        return {
          id: h.id,
          ticketId: h.ticketId,
          actorId: h.actorId,
          actorName: actor?.fullName || 'کاربر',
          actorRole: actor?.role || UserRole.STUDENT,
          action: h.action,
          oldValue: h.oldValue,
          newValue: h.newValue,
          note: h.note,
          createdAt: h.createdAt.toISOString(),
        };
      }),
      feedback: ticket.feedback
        ? {
            id: ticket.feedback.id,
            ticketId: ticket.feedback.ticketId,
            requesterId: ticket.feedback.requesterId,
            rating: ticket.feedback.rating,
            comment: ticket.feedback.comment,
            createdAt: ticket.feedback.createdAt.toISOString(),
          }
        : null,
      objection: ticket.objection
        ? {
            id: ticket.objection.id,
            ticketId: ticket.objection.ticketId,
            requesterId: ticket.objection.requesterId,
            requesterName:
              userMap.get(ticket.objection.requesterId)?.fullName ||
              requester?.fullName ||
              '',
            description: ticket.objection.description,
            status: ticket.objection.status,
            resolutionNote: ticket.objection.resolutionNote,
            createdAt: ticket.objection.createdAt.toISOString(),
            updatedAt: ticket.objection.updatedAt.toISOString(),
          }
        : null,
    };
  }
}
