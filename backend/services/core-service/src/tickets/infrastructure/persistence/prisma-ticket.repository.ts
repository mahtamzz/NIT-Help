import { Injectable } from '@nestjs/common';
import {
  ObjectionStatus,
  TicketPriority,
  TicketStatus,
  UserRole,
} from '@nit-help/shared';
import {
  TicketPriority as PrismaTicketPriority,
  TicketStatus as PrismaTicketStatus,
  UserRole as PrismaUserRole,
} from '.prisma/core-client';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  TicketListFilter,
  TicketRepositoryPort,
} from '../../application/ports/ticket-repository.port';
import {
  DepartmentSummaryEntity,
  ServiceSummaryEntity,
  TicketEntity,
  TicketFeedbackEntity,
  TicketListRow,
  TicketMessageEntity,
  TicketObjectionEntity,
  TicketWithRelations,
} from '../../domain/ticket.types';

@Injectable()
export class PrismaTicketRepository implements TicketRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  private toTicketEntity(row: any): TicketEntity {
    return {
      id: row.id,
      ticketNumber: row.ticketNumber,
      subject: row.subject,
      description: row.description,
      requesterId: row.requesterId,
      serviceId: row.serviceId,
      departmentId: row.departmentId,
      assignedToId: row.assignedToId,
      status: row.status as TicketStatus,
      priority: row.priority as TicketPriority,
      resolvedAt: row.resolvedAt ?? null,
      closedAt: row.closedAt ?? null,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  private toTicketWithRelations(row: any): TicketWithRelations {
    return {
      ...this.toTicketEntity(row),
      service: row.service
        ? {
            id: row.service.id,
            name: row.service.name,
            category: row.service.category ?? null,
          }
        : { id: row.serviceId, name: '' },
      department: row.department,
      feedback: row.feedback ?? null,
      objection: row.objection
        ? {
            ...row.objection,
            status: row.objection.status as ObjectionStatus,
          }
        : null,
      history: row.history,
    };
  }

  async findActiveServiceWithDepartment(
    serviceId: string,
  ): Promise<ServiceSummaryEntity | null> {
    const service = await this.prisma.service.findUnique({
      where: { id: serviceId },
      include: { department: true },
    });
    if (!service) return null;
    return {
      id: service.id,
      name: service.name,
      departmentId: service.departmentId,
      defaultPriority: service.defaultPriority as TicketPriority,
      isActive: service.isActive,
      department: service.department,
    };
  }

  async findLatestTicketNumberByPrefix(datePrefix: string): Promise<string | null> {
    const latest = await this.prisma.ticket.findFirst({
      where: { ticketNumber: { startsWith: datePrefix } },
      orderBy: { ticketNumber: 'desc' },
      select: { ticketNumber: true },
    });
    return latest?.ticketNumber ?? null;
  }

  async createTicketWithInitialActivity(input: {
    ticketNumber: string;
    subject: string;
    description: string;
    requesterId: string;
    serviceId: string;
    departmentId: string;
    priority: TicketPriority;
    initialHistoryNote: string;
  }): Promise<TicketWithRelations> {
    return this.prisma.$transaction(async (tx) => {
      const created = await tx.ticket.create({
        data: {
          ticketNumber: input.ticketNumber,
          subject: input.subject,
          description: input.description,
          requesterId: input.requesterId,
          serviceId: input.serviceId,
          departmentId: input.departmentId,
          status: PrismaTicketStatus.NEW,
          priority: input.priority as unknown as PrismaTicketPriority,
        },
        include: {
          service: true,
          department: true,
        },
      });

      await tx.ticketMessage.create({
        data: {
          ticketId: created.id,
          authorId: input.requesterId,
          content: input.description,
          isInternal: false,
        },
      });

      await tx.ticketHistory.create({
        data: {
          ticketId: created.id,
          actorId: input.requesterId,
          action: 'TICKET_CREATED',
          newValue: PrismaTicketStatus.NEW,
          note: input.initialHistoryNote,
        },
      });

      return this.toTicketWithRelations(created);
    });
  }

  async findTickets(filter: TicketListFilter): Promise<{
    total: number;
    items: TicketListRow[];
  }> {
    const skip = (filter.page - 1) * filter.limit;
    const where: any = {};

    if (
      filter.scopeRole === UserRole.STUDENT ||
      filter.scopeRole === UserRole.FACULTY
    ) {
      where.requesterId = filter.scopeUserId;
    } else if (filter.scopeRole === UserRole.SPECIALIST) {
      where.OR = [
        { assignedToId: filter.scopeUserId },
        { departmentId: filter.scopeDepartmentId },
      ];
    } else if (
      filter.scopeRole === UserRole.MANAGER &&
      filter.scopeDepartmentId
    ) {
      where.departmentId = filter.scopeDepartmentId;
    }

    if (filter.search) {
      const q = filter.search.trim();
      const searchCondition = [
        { ticketNumber: { contains: q, mode: 'insensitive' } },
        { subject: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ];
      if (where.OR) {
        where.AND = [{ OR: where.OR }, { OR: searchCondition }];
        delete where.OR;
      } else {
        where.OR = searchCondition;
      }
    }

    if (filter.status) where.status = filter.status;
    if (filter.priority) where.priority = filter.priority;
    if (filter.serviceId) where.serviceId = filter.serviceId;
    if (filter.departmentId) where.departmentId = filter.departmentId;
    if (filter.assignedToId) {
      where.assignedToId =
        filter.assignedToId === 'unassigned' ? null : filter.assignedToId;
    }
    if (filter.requesterId) where.requesterId = filter.requesterId;

    const orderBy: any = { [filter.sortBy]: filter.sortOrder };

    const [total, tickets] = await Promise.all([
      this.prisma.ticket.count({ where }),
      this.prisma.ticket.findMany({
        where,
        skip,
        take: filter.limit,
        orderBy,
        include: {
          service: { select: { id: true, name: true } },
          department: { select: { id: true, name: true, code: true } },
          feedback: { select: { rating: true } },
          objection: { select: { status: true } },
          _count: { select: { messages: true } },
        },
      }),
    ]);

    return {
      total,
      items: tickets.map((t) => ({
        ...this.toTicketEntity(t),
        service: t.service,
        department: t.department,
        feedback: t.feedback,
        objection: t.objection
          ? { status: t.objection.status as ObjectionStatus }
          : null,
        messagesCount: t._count.messages,
      })),
    };
  }

  async findTicketDetailsById(
    id: string,
    includeInternalMessages: boolean,
  ): Promise<{
    ticket: TicketWithRelations;
    messages: TicketMessageEntity[];
    internalMessageIds: string[];
  } | null> {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id },
      include: {
        service: { include: { category: true } },
        department: true,
        feedback: true,
        objection: true,
        history: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!ticket) {
      return null;
    }

    const messageWhere: any = { ticketId: id };
    if (!includeInternalMessages) {
      messageWhere.isInternal = false;
    }

    const messages = await this.prisma.ticketMessage.findMany({
      where: messageWhere,
      orderBy: { createdAt: 'asc' },
    });

    let internalMessageIds: string[] = [];
    if (!includeInternalMessages) {
      const internalRows = await this.prisma.ticketMessage.findMany({
        where: { ticketId: id, isInternal: true },
        select: { id: true },
      });
      internalMessageIds = internalRows.map((m) => m.id);
    }

    return {
      ticket: this.toTicketWithRelations(ticket),
      messages,
      internalMessageIds,
    };
  }

  async findTicketForMutation(id: string): Promise<TicketWithRelations | null> {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id },
      include: {
        service: true,
        department: true,
        feedback: true,
        objection: true,
      },
    });
    return ticket ? this.toTicketWithRelations(ticket) : null;
  }

  async updateStatusWithHistory(input: {
    ticketId: string;
    actorId: string;
    oldStatus: TicketStatus;
    newStatus: TicketStatus;
    resolvedAt?: Date;
    closedAt?: Date;
    note: string;
  }): Promise<TicketEntity> {
    return this.prisma.$transaction(async (tx) => {
      const data: any = { status: input.newStatus };
      if (input.resolvedAt) data.resolvedAt = input.resolvedAt;
      if (input.closedAt) data.closedAt = input.closedAt;

      const updated = await tx.ticket.update({
        where: { id: input.ticketId },
        data,
      });

      await tx.ticketHistory.create({
        data: {
          ticketId: input.ticketId,
          actorId: input.actorId,
          action: 'STATUS_CHANGED',
          oldValue: input.oldStatus,
          newValue: input.newStatus,
          note: input.note,
        },
      });

      return this.toTicketEntity(updated);
    });
  }

  async findDepartmentById(id: string): Promise<DepartmentSummaryEntity | null> {
    return this.prisma.department.findUnique({
      where: { id },
      select: { id: true, name: true, code: true, managerId: true },
    });
  }

  async assignTicketWithHistory(input: {
    ticketId: string;
    actorId: string;
    assignedToId: string | null;
    departmentId?: string;
    newStatus?: TicketStatus;
    oldAssigneeName: string;
    newAssigneeName: string;
    note: string;
  }): Promise<TicketEntity> {
    return this.prisma.$transaction(async (tx) => {
      const updateData: any = { assignedToId: input.assignedToId };
      if (input.departmentId) updateData.departmentId = input.departmentId;
      if (input.newStatus) updateData.status = input.newStatus;

      const updated = await tx.ticket.update({
        where: { id: input.ticketId },
        data: updateData,
      });

      await tx.ticketHistory.create({
        data: {
          ticketId: input.ticketId,
          actorId: input.actorId,
          action: 'TICKET_ASSIGNED',
          oldValue: input.oldAssigneeName,
          newValue: input.newAssigneeName,
          note: input.note,
        },
      });

      return this.toTicketEntity(updated);
    });
  }

  async addMessageWithOptionalTransition(input: {
    ticketId: string;
    authorId: string;
    content: string;
    isInternal: boolean;
    transitionToInProgressFrom?: TicketStatus;
    transitionNote?: string;
  }): Promise<{
    message: TicketMessageEntity;
    updatedTicket: TicketWithRelations | null;
  }> {
    return this.prisma.$transaction(async (tx) => {
      const message = await tx.ticketMessage.create({
        data: {
          ticketId: input.ticketId,
          authorId: input.authorId,
          content: input.content,
          isInternal: input.isInternal,
        },
      });

      let updatedTicket: TicketWithRelations | null = null;
      if (input.transitionToInProgressFrom) {
        const updated = await tx.ticket.update({
          where: { id: input.ticketId },
          data: { status: PrismaTicketStatus.IN_PROGRESS },
          include: { service: true, department: true },
        });
        updatedTicket = this.toTicketWithRelations(updated);

        await tx.ticketHistory.create({
          data: {
            ticketId: input.ticketId,
            actorId: input.authorId,
            action: 'STATUS_CHANGED',
            oldValue: input.transitionToInProgressFrom,
            newValue: PrismaTicketStatus.IN_PROGRESS,
            note: input.transitionNote,
          },
        });
      }

      return { message, updatedTicket };
    });
  }

  async createFeedback(input: {
    ticketId: string;
    requesterId: string;
    rating: number;
    comment?: string;
  }): Promise<TicketFeedbackEntity> {
    return this.prisma.ticketFeedback.create({
      data: {
        ticketId: input.ticketId,
        requesterId: input.requesterId,
        rating: input.rating,
        comment: input.comment,
      },
    });
  }

  async createObjectionWithHistory(input: {
    ticketId: string;
    requesterId: string;
    description: string;
    historyNote: string;
  }): Promise<TicketObjectionEntity> {
    return this.prisma.$transaction(async (tx) => {
      const objection = await tx.ticketObjection.create({
        data: {
          ticketId: input.ticketId,
          requesterId: input.requesterId,
          description: input.description,
        },
      });

      await tx.ticketHistory.create({
        data: {
          ticketId: input.ticketId,
          actorId: input.requesterId,
          action: 'OBJECTION_SUBMITTED',
          note: input.historyNote,
        },
      });

      return {
        ...objection,
        status: objection.status as ObjectionStatus,
      };
    });
  }

  async reviewObjectionWithHistory(input: {
    ticketId: string;
    actorId: string;
    status: ObjectionStatus;
    resolutionNote: string;
    reopenTicket: boolean;
  }): Promise<{
    objection: TicketObjectionEntity;
    updatedTicket: TicketWithRelations | null;
  }> {
    return this.prisma.$transaction(async (tx) => {
      const objection = await tx.ticketObjection.update({
        where: { ticketId: input.ticketId },
        data: {
          status: input.status as any,
          resolutionNote: input.resolutionNote,
        },
      });

      let updatedTicket: TicketWithRelations | null = null;
      if (input.reopenTicket) {
        const updated = await tx.ticket.update({
          where: { id: input.ticketId },
          data: { status: PrismaTicketStatus.IN_PROGRESS },
          include: { service: true, department: true },
        });
        updatedTicket = this.toTicketWithRelations(updated);
      }

      await tx.ticketHistory.create({
        data: {
          ticketId: input.ticketId,
          actorId: input.actorId,
          action: 'OBJECTION_REVIEWED',
          newValue: input.status,
          note: input.resolutionNote,
        },
      });

      return {
        objection: {
          ...objection,
          status: objection.status as ObjectionStatus,
        },
        updatedTicket,
      };
    });
  }

  async getTicketAccessContext(ticketId: string, messageId?: string | null) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
      select: {
        id: true,
        requesterId: true,
        departmentId: true,
        assignedToId: true,
      },
    });

    if (!ticket) {
      return { exists: false, ticketId };
    }

    let messageIsInternal = false;
    if (messageId) {
      const msg = await this.prisma.ticketMessage.findUnique({
        where: { id: messageId },
        select: { isInternal: true },
      });
      messageIsInternal = Boolean(msg?.isInternal);
    }

    return {
      exists: true,
      ticketId: ticket.id,
      requesterId: ticket.requesterId,
      departmentId: ticket.departmentId,
      assignedToId: ticket.assignedToId,
      messageIsInternal,
    };
  }

  async exportAnalyticsSeed() {
    const [departments, tickets] = await Promise.all([
      this.prisma.department.findMany({
        select: {
          id: true,
          name: true,
          code: true,
          isActive: true,
          updatedAt: true,
        },
      }),
      this.prisma.ticket.findMany({
        include: {
          department: { select: { name: true } },
        },
      }),
    ]);

    return {
      departments: departments.map((d) => ({
        departmentId: d.id,
        name: d.name,
        code: d.code,
        isActive: d.isActive,
        updatedAt: d.updatedAt.toISOString(),
      })),
      tickets: tickets.map((t) => ({
        ticketId: t.id,
        ticketNumber: t.ticketNumber,
        departmentId: t.departmentId,
        departmentName: t.department.name,
        serviceId: t.serviceId,
        assignedToId: t.assignedToId,
        status: t.status as TicketStatus,
        priority: t.priority as TicketPriority,
        createdAt: t.createdAt.toISOString(),
        resolvedAt: t.resolvedAt?.toISOString() || null,
        closedAt: t.closedAt?.toISOString() || null,
        updatedAt: t.updatedAt.toISOString(),
      })),
    };
  }
}
