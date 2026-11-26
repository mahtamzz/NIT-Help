import { UserRole, TicketStatus, TicketPriority, ObjectionStatus, NotificationType, AuditAction } from './enums';

export interface UserSummary {
  id: string;
  fullName: string;
  email: string;
  username: string;
  role: UserRole;
  isActive: boolean;
  departmentId?: string | null;
  departmentName?: string | null;
}

export interface DepartmentSummary {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  managerId?: string | null;
  managerName?: string | null;
  isActive: boolean;
  servicesCount?: number;
  openTicketsCount?: number;
}

export interface ServiceCategorySummary {
  id: string;
  name: string;
  description?: string | null;
  icon?: string | null;
  displayOrder: number;
  isActive: boolean;
  services?: ServiceSummary[];
}

export interface ServiceSummary {
  id: string;
  name: string;
  description?: string | null;
  categoryId: string;
  categoryName?: string;
  departmentId: string;
  departmentName?: string;
  defaultPriority: TicketPriority;
  targetResolutionHours: number;
  isActive: boolean;
}

export interface TicketAttachmentSummary {
  id: string;
  ticketId: string;
  messageId?: string | null;
  uploadedById: string;
  uploaderName?: string;
  originalName: string;
  storageKey: string;
  mimeType: string;
  size: number;
}

export interface TicketMessageSummary {
  id: string;
  ticketId: string;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  content: string;
  isInternal: boolean;
  createdAt: string;
  attachments?: TicketAttachmentSummary[];
}

export interface TicketHistorySummary {
  id: string;
  ticketId: string;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  action: string;
  oldValue?: string | null;
  newValue?: string | null;
  note?: string | null;
  createdAt: string;
}

export interface TicketFeedbackSummary {
  id: string;
  ticketId: string;
  requesterId: string;
  rating: number; // 1 to 5
  comment?: string | null;
  createdAt: string;
}

export interface TicketObjectionSummary {
  id: string;
  ticketId: string;
  requesterId: string;
  requesterName?: string;
  description: string;
  status: ObjectionStatus;
  resolutionNote?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TicketSummary {
  id: string;
  ticketNumber: string;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  requesterId: string;
  requesterName: string;
  requesterEmail: string;
  serviceId: string;
  serviceName: string;
  departmentId: string;
  departmentName: string;
  assignedToId?: string | null;
  assignedToName?: string | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string | null;
  closedAt?: string | null;
  feedback?: TicketFeedbackSummary | null;
  objection?: TicketObjectionSummary | null;
  messagesCount?: number;
  attachmentsCount?: number;
}

export interface TicketDetail extends TicketSummary {
  messages: TicketMessageSummary[];
  attachments: TicketAttachmentSummary[];
  history: TicketHistorySummary[];
}

export interface NotificationSummary {
  id: string;
  recipientId: string;
  ticketId?: string | null;
  ticketNumber?: string | null;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface AuditLogSummary {
  id: string;
  actorId: string;
  actorName: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  metadata?: Record<string, any> | null;
  createdAt: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface DashboardStats {
  totalTickets: number;
  openTickets: number;
  inProgressTickets: number;
  waitingForRequesterTickets: number;
  resolvedTickets: number;
  closedTickets: number;
  overdueTickets: number;
  assignedToMeTickets?: number;
  ticketsByStatus?: { status: TicketStatus; count: number }[];
  ticketsByPriority?: { priority: TicketPriority; count: number }[];
  ticketsByDepartment?: { departmentName: string; count: number }[];
  ticketsOverTime?: { date: string; count: number }[];
  averageResolutionHours?: number;
}

