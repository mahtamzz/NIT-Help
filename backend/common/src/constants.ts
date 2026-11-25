export const GATEWAY_HEADERS = {
  USER_CONTEXT: 'x-user-context',
  GATEWAY_SECRET: 'x-gateway-secret',
} as const;

export const DEFAULT_GATEWAY_SECRET = 'nit_help_gateway_internal_secret_2026!';
export const DEFAULT_JWT_ACCESS_SECRET = 'nit_help_jwt_access_super_secret_key_2026_secure!';
export const DEFAULT_JWT_REFRESH_SECRET = 'nit_help_jwt_refresh_super_secret_key_2026_secure!';

export const RMQ_EXCHANGE = 'nit_help.events';

export const RMQ_QUEUES = {
  CORE: 'nit_help.core.events',
  OPS: 'nit_help.ops.events',
  IAM: 'nit_help.iam.events',
} as const;

export const IAM_PATTERNS = {
  GET_USER_BY_ID: 'iam.user.get_by_id',
  GET_USERS_BY_IDS: 'iam.user.get_by_ids',
  GET_USERS_BY_DEPARTMENT: 'iam.user.get_users_by_department',
  GET_SPECIALISTS: 'iam.user.get_specialists',
  EXPORT_USERS: 'iam.user.export_all',
} as const;

export const CORE_PATTERNS = {
  GET_TICKET_ACCESS_CONTEXT: 'core.ticket.get_access_context',
  GET_DEPARTMENT_BY_ID: 'core.department.get_by_id',
  EXPORT_ANALYTICS_SEED: 'core.analytics.export_seed',
} as const;

export const MEDIA_PATTERNS = {
  GET_TICKET_ATTACHMENTS: 'media.attachments.get_by_ticket',
  GET_ATTACHMENTS_COUNT_BY_TICKETS: 'media.attachments.count_by_tickets',
} as const;

export const EVENT_PATTERNS = {
  USER_CREATED: 'user.created',
  USER_UPDATED: 'user.updated',
  USER_STATUS_CHANGED: 'user.status_changed',
  AUTH_LOGGED_IN: 'auth.logged_in',
  DEPARTMENT_CREATED: 'department.created',
  DEPARTMENT_UPDATED: 'department.updated',
  SERVICE_CATEGORY_CREATED: 'service_category.created',
  SERVICE_CATEGORY_UPDATED: 'service_category.updated',
  SERVICE_CREATED: 'service.created',
  SERVICE_UPDATED: 'service.updated',
  TICKET_CREATED: 'ticket.created',
  TICKET_STATUS_CHANGED: 'ticket.status_changed',
  TICKET_ASSIGNED: 'ticket.assigned',
  TICKET_MESSAGE_CREATED: 'ticket.message_created',
  TICKET_FEEDBACK_SUBMITTED: 'ticket.feedback_submitted',
  TICKET_OBJECTION_SUBMITTED: 'ticket.objection_submitted',
  TICKET_OBJECTION_REVIEWED: 'ticket.objection_reviewed',
  ATTACHMENT_UPLOADED: 'attachment.uploaded',
} as const;
