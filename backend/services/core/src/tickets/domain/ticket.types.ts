import {
  ObjectionStatus,
  TicketPriority,
  TicketStatus,
  UserRole,
} from '@nit-help/shared';

export interface TicketEntity {
  id: string;
  ticketNumber: string;
  subject: string;
  description: string;
  requesterId: string;
  serviceId: string;
  departmentId: string;
  assignedToId: string | null;
  status: TicketStatus;
  priority: TicketPriority;
  resolvedAt: Date | null;
  closedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface DepartmentSummaryEntity {
  id: string;
  name: string;
  code: string;
  managerId: string | null;
}

export interface ServiceSummaryEntity {
  id: string;
  name: string;
  departmentId: string;
  defaultPriority: TicketPriority;
  isActive: boolean;
  department: DepartmentSummaryEntity;
}

export interface TicketMessageEntity {
  id: string;
  ticketId: string;
  authorId: string;
  content: string;
  isInternal: boolean;
  createdAt: Date;
}

export interface TicketHistoryEntity {
  id: string;
  ticketId: string;
  actorId: string;
  action: string;
  oldValue: string | null;
  newValue: string | null;
  note: string | null;
  createdAt: Date;
}

export interface TicketFeedbackEntity {
  id: string;
  ticketId: string;
  requesterId: string;
  rating: number;
  comment: string | null;
  createdAt: Date;
}

export interface TicketObjectionEntity {
  id: string;
  ticketId: string;
  requesterId: string;
  description: string;
  status: ObjectionStatus;
  resolutionNote: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TicketWithRelations extends TicketEntity {
  service: {
    id: string;
    name: string;
    category?: { id: string; name: string } | null;
  };
  department: DepartmentSummaryEntity;
  feedback?: TicketFeedbackEntity | null;
  objection?: TicketObjectionEntity | null;
  history?: TicketHistoryEntity[];
}

export interface TicketListRow extends TicketEntity {
  service: { id: string; name: string };
  department: { id: string; name: string; code: string };
  feedback: { rating: number } | null;
  objection: { status: ObjectionStatus } | null;
  messagesCount: number;
}

export interface TicketAttachmentRecord {
  id: string;
  ticketId: string;
  messageId: string | null;
  uploadedById: string;
  originalName: string;
  storageKey: string;
  mimeType: string;
  size: number;
}

export interface TicketActorContext {
  id: string;
  email: string;
  username: string;
  fullName: string;
  role: UserRole;
  departmentId: string | null;
  departmentName?: string | null;
}

export interface DirectoryUserRecord {
  id: string;
  fullName: string;
  email: string;
  username: string;
  role: UserRole;
  departmentId: string | null;
  isActive: boolean;
}
