import { TicketEventSnapshot } from '@nit-help/microservice-common';
import {
  DepartmentSummaryEntity,
  TicketEntity,
} from '../domain/ticket.types';

export function toTicketEventSnapshot(
  ticket: TicketEntity,
  serviceName: string,
  department: DepartmentSummaryEntity,
): TicketEventSnapshot {
  return {
    id: ticket.id,
    ticketNumber: ticket.ticketNumber,
    subject: ticket.subject,
    status: ticket.status,
    priority: ticket.priority,
    requesterId: ticket.requesterId,
    serviceId: ticket.serviceId,
    serviceName,
    departmentId: ticket.departmentId,
    departmentName: department?.name || '',
    departmentManagerId: department?.managerId || null,
    assignedToId: ticket.assignedToId || null,
    createdAt: ticket.createdAt.toISOString(),
    updatedAt: ticket.updatedAt.toISOString(),
    resolvedAt: ticket.resolvedAt?.toISOString() || null,
    closedAt: ticket.closedAt?.toISOString() || null,
  };
}
