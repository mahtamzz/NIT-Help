import {
  ObjectionStatus,
  TicketPriority,
  TicketStatus,
  UserRole,
} from '@nit-help/shared';
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

export const TICKET_REPOSITORY = Symbol('TICKET_REPOSITORY');

export interface TicketListFilter {
  scopeRole: UserRole;
  scopeUserId: string;
  scopeDepartmentId: string | null;
  page: number;
  limit: number;
  search?: string;
  status?: TicketStatus;
  priority?: TicketPriority;
  serviceId?: string;
  departmentId?: string;
  assignedToId?: string;
  requesterId?: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export interface TicketRepositoryPort {
  findActiveServiceWithDepartment(serviceId: string): Promise<ServiceSummaryEntity | null>;

  findLatestTicketNumberByPrefix(datePrefix: string): Promise<string | null>;

  createTicketWithInitialActivity(input: {
    ticketNumber: string;
    subject: string;
    description: string;
    requesterId: string;
    serviceId: string;
    departmentId: string;
    priority: TicketPriority;
    initialHistoryNote: string;
  }): Promise<TicketWithRelations>;

  findTickets(filter: TicketListFilter): Promise<{
    total: number;
    items: TicketListRow[];
  }>;

  findTicketDetailsById(
    id: string,
    includeInternalMessages: boolean,
  ): Promise<{
    ticket: TicketWithRelations;
    messages: TicketMessageEntity[];
    internalMessageIds: string[];
  } | null>;

  findTicketForMutation(id: string): Promise<TicketWithRelations | null>;

  updateStatusWithHistory(input: {
    ticketId: string;
    actorId: string;
    oldStatus: TicketStatus;
    newStatus: TicketStatus;
    resolvedAt?: Date;
    closedAt?: Date;
    note: string;
  }): Promise<TicketEntity>;

  findDepartmentById(id: string): Promise<DepartmentSummaryEntity | null>;

  assignTicketWithHistory(input: {
    ticketId: string;
    actorId: string;
    assignedToId: string | null;
    departmentId?: string;
    newStatus?: TicketStatus;
    oldAssigneeName: string;
    newAssigneeName: string;
    note: string;
  }): Promise<TicketEntity>;

  addMessageWithOptionalTransition(input: {
    ticketId: string;
    authorId: string;
    content: string;
    isInternal: boolean;
    transitionToInProgressFrom?: TicketStatus;
    transitionNote?: string;
  }): Promise<{
    message: TicketMessageEntity;
    updatedTicket: TicketWithRelations | null;
  }>;

  createFeedback(input: {
    ticketId: string;
    requesterId: string;
    rating: number;
    comment?: string;
  }): Promise<TicketFeedbackEntity>;

  createObjectionWithHistory(input: {
    ticketId: string;
    requesterId: string;
    description: string;
    historyNote: string;
  }): Promise<TicketObjectionEntity>;

  reviewObjectionWithHistory(input: {
    ticketId: string;
    actorId: string;
    status: ObjectionStatus;
    resolutionNote: string;
    reopenTicket: boolean;
  }): Promise<{
    objection: TicketObjectionEntity;
    updatedTicket: TicketWithRelations | null;
  }>;

  getTicketAccessContext(
    ticketId: string,
    messageId?: string | null,
  ): Promise<{
    exists: boolean;
    ticketId: string;
    requesterId?: string;
    departmentId?: string;
    assignedToId?: string | null;
    messageIsInternal?: boolean;
  }>;

  exportAnalyticsSeed(): Promise<{
    departments: Array<{
      departmentId: string;
      name: string;
      code: string;
      isActive: boolean;
    }>;
    tickets: Array<{
      ticketId: string;
      ticketNumber: string;
      departmentId: string;
      departmentName: string;
      serviceId: string;
      assignedToId: string | null;
      status: TicketStatus;
      priority: TicketPriority;
      createdAt: string;
      resolvedAt: string | null;
      closedAt: string | null;
      updatedAt: string;
    }>;
  }>;
}
