export enum UserRole {
  STUDENT = 'STUDENT',
  FACULTY = 'FACULTY',
  SPECIALIST = 'SPECIALIST',
  MANAGER = 'MANAGER',
  ADMIN = 'ADMIN',
}

export enum TicketStatus {
  NEW = 'NEW',
  ASSIGNED = 'ASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  WAITING_FOR_REQUESTER = 'WAITING_FOR_REQUESTER',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
}

export enum TicketPriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum ObjectionStatus {
  PENDING = 'PENDING',
  REVIEWING = 'REVIEWING',
  RESOLVED = 'RESOLVED',
  REJECTED = 'REJECTED',
}

export enum NotificationType {
  TICKET_CREATED = 'TICKET_CREATED',
  TICKET_ASSIGNED = 'TICKET_ASSIGNED',
  TICKET_REASSIGNED = 'TICKET_REASSIGNED',
  STATUS_CHANGED = 'STATUS_CHANGED',
  MESSAGE_RECEIVED = 'MESSAGE_RECEIVED',
  INFO_REQUESTED = 'INFO_REQUESTED',
  TICKET_RESOLVED = 'TICKET_RESOLVED',
  OBJECTION_SUBMITTED = 'OBJECTION_SUBMITTED',
  OBJECTION_ANSWERED = 'OBJECTION_ANSWERED',
}

export enum AuditAction {
  USER_CREATE = 'USER_CREATE',
  USER_UPDATE = 'USER_UPDATE',
  USER_DEACTIVATE = 'USER_DEACTIVATE',
  ROLE_ASSIGN = 'ROLE_ASSIGN',
  DEPARTMENT_CREATE = 'DEPARTMENT_CREATE',
  DEPARTMENT_UPDATE = 'DEPARTMENT_UPDATE',
  SERVICE_CREATE = 'SERVICE_CREATE',
  SERVICE_UPDATE = 'SERVICE_UPDATE',
  TICKET_STATUS_CHANGE = 'TICKET_STATUS_CHANGE',
  TICKET_ASSIGNMENT = 'TICKET_ASSIGNMENT',
  TICKET_DELETE = 'TICKET_DELETE',
}

export const RoleLabelsPersian: Record<UserRole, string> = {
  [UserRole.STUDENT]: 'دانشجو',
  [UserRole.FACULTY]: 'استاد / کارمند',
  [UserRole.SPECIALIST]: 'کارشناس پاسخگو',
  [UserRole.MANAGER]: 'مدیر واحد / گروه',
  [UserRole.ADMIN]: 'مدیر ارشد سامانه',
};

export const TicketStatusLabelsPersian: Record<TicketStatus, string> = {
  [TicketStatus.NEW]: 'جدید',
  [TicketStatus.ASSIGNED]: 'ارجاع شده',
  [TicketStatus.IN_PROGRESS]: 'در حال بررسی',
  [TicketStatus.WAITING_FOR_REQUESTER]: 'در انتظار پاسخ کاربر',
  [TicketStatus.RESOLVED]: 'پاسخ داده شده / حل شده',
  [TicketStatus.CLOSED]: 'بسته شده',
};

export const TicketPriorityLabelsPersian: Record<TicketPriority, string> = {
  [TicketPriority.LOW]: 'کم',
  [TicketPriority.NORMAL]: 'عادی',
  [TicketPriority.HIGH]: 'بالا',
  [TicketPriority.URGENT]: 'فوری / اضطراری',
};

export const ObjectionStatusLabelsPersian: Record<ObjectionStatus, string> = {
  [ObjectionStatus.PENDING]: 'در انتظار بررسی',
  [ObjectionStatus.REVIEWING]: 'در حال بازبینی',
  [ObjectionStatus.RESOLVED]: 'پذیرفته شده',
  [ObjectionStatus.REJECTED]: 'رد شده',
};

