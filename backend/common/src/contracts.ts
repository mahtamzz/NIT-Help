import {
  NotificationType,
  ObjectionStatus,
  TicketPriority,
  TicketStatus,
  UserRole,
} from '@nit-help/shared';

export interface AuthenticatedUser {
  id: string;
  email: string;
  username: string;
  fullName: string;
  role: UserRole;
  departmentId: string | null;
  departmentName?: string | null;
}

export function encodeUserContext(user: AuthenticatedUser): string {
  return Buffer.from(JSON.stringify(user), 'utf8').toString('base64url');
}

export function decodeUserContext(raw: string): AuthenticatedUser | null {
  try {
    const parsed = JSON.parse(Buffer.from(raw, 'base64url').toString('utf8'));
    if (!parsed?.id || !parsed?.role) {
      return null;
    }
    return parsed as AuthenticatedUser;
  } catch {
    return null;
  }
}

export interface DomainEvent<T = Record<string, any>> {
  eventId: string;
  eventType: string;
  occurredAt: string;
  payload: T;
}

export interface TicketAccessContextRequest {
  ticketId: string;
  messageId?: string | null;
}

export interface TicketAccessContextResponse {
  exists: boolean;
  ticketId: string;
  requesterId?: string;
  departmentId?: string;
  assignedToId?: string | null;
  messageIsInternal?: boolean;
}

export interface UserSyncPayload {
  id: string;
  fullName: string;
  email: string;
  username: string;
  role: UserRole;
  departmentId: string | null;
  departmentName?: string | null;
  isActive: boolean;
  actorId?: string;
}

export interface DepartmentSyncPayload {
  id: string;
  name: string;
  code: string;
  managerId: string | null;
  isActive: boolean;
  actorId?: string;
}

export interface TicketEventSnapshot {
  id: string;
  ticketNumber: string;
  subject: string;
  status: TicketStatus;
  priority: TicketPriority;
  requesterId: string;
  serviceId: string;
  serviceName: string;
  departmentId: string;
  departmentName: string;
  departmentManagerId: string | null;
  assignedToId: string | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  closedAt: string | null;
}

export interface TicketCreatedEventPayload {
  ticket: TicketEventSnapshot;
  actor: AuthenticatedUser;
}

export interface TicketStatusChangedEventPayload {
  ticket: TicketEventSnapshot;
  oldStatus: TicketStatus;
  newStatus: TicketStatus;
  note?: string;
  actor: AuthenticatedUser;
}

export interface TicketAssignedEventPayload {
  ticket: TicketEventSnapshot;
  oldAssigneeId: string | null;
  oldAssigneeName: string;
  newAssigneeId: string | null;
  newAssigneeName: string;
  note?: string;
  actor: AuthenticatedUser;
}

export interface TicketMessageCreatedEventPayload {
  ticket: TicketEventSnapshot;
  messageId: string;
  isInternal: boolean;
  statusTransitionedFrom?: TicketStatus;
  actor: AuthenticatedUser;
}

export interface TicketFeedbackSubmittedEventPayload {
  ticketId: string;
  ticketNumber: string;
  rating: number;
  actor: AuthenticatedUser;
}

export interface TicketObjectionSubmittedEventPayload {
  ticket: TicketEventSnapshot;
  objectionId: string;
  actor: AuthenticatedUser;
}

export interface TicketObjectionReviewedEventPayload {
  ticket: TicketEventSnapshot;
  objectionStatus: ObjectionStatus;
  resolutionNote: string;
  actor: AuthenticatedUser;
}

export interface AttachmentUploadedEventPayload {
  attachmentId: string;
  ticketId: string;
  messageId: string | null;
  uploadedById: string;
  originalName: string;
  size: number;
  mimeType: string;
}

export interface NotificationCreateInput {
  recipientId: string;
  ticketId?: string;
  type: NotificationType;
  title: string;
  message: string;
}
