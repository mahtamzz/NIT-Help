import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import {
  AuthenticatedUser,
  DomainEvent,
  EVENT_PATTERNS,
  EventBusService,
  RMQ_QUEUES,
  TicketEventSnapshot,
} from '@nit-help/microservice-common';
import {
  NotificationType,
  TicketPriority,
  TicketStatus,
  UserRole,
} from '.prisma/ops-client';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OpsEventsConsumer implements OnModuleInit {
  private readonly logger = new Logger(OpsEventsConsumer.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: EventBusService,
    private readonly notificationsService: NotificationsService,
    private readonly auditService: AuditService,
  ) {}

  async onModuleInit() {
    await this.eventBus.subscribe(RMQ_QUEUES.OPS, ['#'], (event) =>
      this.handleEvent(event),
    );
  }

  private isStaff(role?: string): boolean {
    return (
      role === UserRole.SPECIALIST ||
      role === UserRole.MANAGER ||
      role === UserRole.ADMIN
    );
  }

  private async upsertTicketProjection(ticket: TicketEventSnapshot) {
    await this.prisma.ticketAnalytics.upsert({
      where: { ticketId: ticket.id },
      update: {
        ticketNumber: ticket.ticketNumber,
        departmentId: ticket.departmentId,
        departmentName: ticket.departmentName,
        serviceId: ticket.serviceId,
        assignedToId: ticket.assignedToId,
        status: ticket.status as TicketStatus,
        priority: ticket.priority as TicketPriority,
        resolvedAt: ticket.resolvedAt ? new Date(ticket.resolvedAt) : null,
        closedAt: ticket.closedAt ? new Date(ticket.closedAt) : null,
        updatedAt: new Date(ticket.updatedAt),
      },
      create: {
        ticketId: ticket.id,
        ticketNumber: ticket.ticketNumber,
        departmentId: ticket.departmentId,
        departmentName: ticket.departmentName,
        serviceId: ticket.serviceId,
        assignedToId: ticket.assignedToId,
        status: ticket.status as TicketStatus,
        priority: ticket.priority as TicketPriority,
        createdAt: new Date(ticket.createdAt),
        resolvedAt: ticket.resolvedAt ? new Date(ticket.resolvedAt) : null,
        closedAt: ticket.closedAt ? new Date(ticket.closedAt) : null,
        updatedAt: new Date(ticket.updatedAt),
      },
    });
  }

  private async recordAudit(
    actor: Partial<AuthenticatedUser> | undefined,
    action: string,
    entityType: string,
    entityId: string,
    metadata?: Record<string, any>,
  ) {
    if (!actor?.id) return;
    await this.auditService.logAction({
      actorId: actor.id,
      actorName: actor.fullName || actor.username || 'کاربر سیستم',
      actorEmail: actor.email || '',
      actorRole: (actor.role as UserRole) || UserRole.ADMIN,
      action,
      entityType,
      entityId,
      metadata,
    });
  }

  async handleEvent(event: DomainEvent<any>): Promise<void> {
    if (!event?.eventId || !event?.eventType) {
      return;
    }

    const alreadyProcessed = await this.prisma.processedEvent.findUnique({
      where: { eventId: event.eventId },
    });
    if (alreadyProcessed) {
      return;
    }

    const p = event.payload || {};

    switch (event.eventType) {
      case EVENT_PATTERNS.TICKET_CREATED: {
        const ticket: TicketEventSnapshot = p.ticket;
        await this.upsertTicketProjection(ticket);

        if (ticket.departmentManagerId) {
          await this.notificationsService.createNotification({
            recipientId: ticket.departmentManagerId,
            ticketId: ticket.id,
            type: NotificationType.TICKET_CREATED,
            title: 'تیکت جدید دریافت شد',
            message: `تیکت جدید ${ticket.ticketNumber} با موضوع "${ticket.subject}" در واحد شما ثبت گردید.`,
          });
        }

        await this.notificationsService.createNotification({
          recipientId: ticket.requesterId,
          ticketId: ticket.id,
          type: NotificationType.TICKET_CREATED,
          title: 'ثبت موفق درخواست',
          message: `درخواست شما با شماره پیگیری ${ticket.ticketNumber} با موفقیت ثبت شد و در صف بررسی قرار گرفت.`,
        });

        await this.recordAudit(p.actor, 'TICKET_CREATED', 'Ticket', ticket.id, {
          ticketNumber: ticket.ticketNumber,
          serviceId: ticket.serviceId,
        });
        break;
      }

      case EVENT_PATTERNS.TICKET_STATUS_CHANGED: {
        const ticket: TicketEventSnapshot = p.ticket;
        await this.upsertTicketProjection(ticket);

        if (this.isStaff(p.actor?.role) && ticket.requesterId !== p.actor?.id) {
          await this.notificationsService.createNotification({
            recipientId: ticket.requesterId,
            ticketId: ticket.id,
            type:
              p.newStatus === TicketStatus.RESOLVED
                ? NotificationType.TICKET_RESOLVED
                : NotificationType.STATUS_CHANGED,
            title:
              p.newStatus === TicketStatus.RESOLVED
                ? 'تیکت شما حل شد'
                : 'تغییر وضعیت تیکت',
            message: `وضعیت تیکت ${ticket.ticketNumber} به حالت "${p.newStatus}" تغییر یافت.`,
          });
        }

        await this.recordAudit(p.actor, 'TICKET_STATUS_CHANGE', 'Ticket', ticket.id, {
          oldStatus: p.oldStatus,
          newStatus: p.newStatus,
          note: p.note,
        });
        break;
      }

      case EVENT_PATTERNS.TICKET_ASSIGNED: {
        const ticket: TicketEventSnapshot = p.ticket;
        await this.upsertTicketProjection(ticket);

        if (p.newAssigneeId && p.newAssigneeId !== p.actor?.id) {
          await this.notificationsService.createNotification({
            recipientId: p.newAssigneeId,
            ticketId: ticket.id,
            type: NotificationType.TICKET_ASSIGNED,
            title: 'ارجاع تیکت جدید به شما',
            message: `تیکت ${ticket.ticketNumber} با موضوع "${ticket.subject}" به شما ارجاع داده شد.`,
          });
        }

        await this.recordAudit(p.actor, 'TICKET_ASSIGNMENT', 'Ticket', ticket.id, {
          oldAssigneeId: p.oldAssigneeId,
          newAssigneeId: p.newAssigneeId,
        });
        break;
      }

      case EVENT_PATTERNS.TICKET_MESSAGE_CREATED: {
        const ticket: TicketEventSnapshot = p.ticket;
        await this.upsertTicketProjection(ticket);

        if (!p.isInternal) {
          if (this.isStaff(p.actor?.role) && ticket.requesterId !== p.actor?.id) {
            await this.notificationsService.createNotification({
              recipientId: ticket.requesterId,
              ticketId: ticket.id,
              type: NotificationType.MESSAGE_RECEIVED,
              title: 'پاسخ جدید در تیکت',
              message: `${p.actor?.fullName || 'کارشناس'} به تیکت شماره ${ticket.ticketNumber} پاسخ داد.`,
            });
          } else if (
            p.actor?.id === ticket.requesterId &&
            ticket.assignedToId
          ) {
            await this.notificationsService.createNotification({
              recipientId: ticket.assignedToId,
              ticketId: ticket.id,
              type: NotificationType.MESSAGE_RECEIVED,
              title: 'پیام جدید از کاربر',
              message: `کاربر ${p.actor?.fullName || ''} در تیکت ${ticket.ticketNumber} پیام جدیدی ارسال کرد.`,
            });
          }
        }
        break;
      }

      case EVENT_PATTERNS.TICKET_FEEDBACK_SUBMITTED: {
        await this.recordAudit(p.actor, 'TICKET_FEEDBACK', 'Ticket', p.ticketId, {
          ticketNumber: p.ticketNumber,
          rating: p.rating,
        });
        break;
      }

      case EVENT_PATTERNS.TICKET_OBJECTION_SUBMITTED: {
        const ticket: TicketEventSnapshot = p.ticket;
        if (ticket.departmentManagerId) {
          await this.notificationsService.createNotification({
            recipientId: ticket.departmentManagerId,
            ticketId: ticket.id,
            type: NotificationType.OBJECTION_SUBMITTED,
            title: 'ثبت اعتراض جدید',
            message: `درخواست‌کننده تیکت ${ticket.ticketNumber} نسبت به نتیجه اعتراض ثبت کرد.`,
          });
        }
        await this.recordAudit(p.actor, 'OBJECTION_SUBMITTED', 'TicketObjection', p.objectionId, {
          ticketId: ticket.id,
        });
        break;
      }

      case EVENT_PATTERNS.TICKET_OBJECTION_REVIEWED: {
        const ticket: TicketEventSnapshot = p.ticket;
        await this.upsertTicketProjection(ticket);
        await this.notificationsService.createNotification({
          recipientId: ticket.requesterId,
          ticketId: ticket.id,
          type: NotificationType.OBJECTION_ANSWERED,
          title: 'پاسخ به اعتراض شما',
          message: `اعتراض شما در تیکت ${ticket.ticketNumber} بررسی شد: ${p.resolutionNote}`,
        });
        await this.recordAudit(p.actor, 'OBJECTION_REVIEWED', 'Ticket', ticket.id, {
          status: p.objectionStatus,
        });
        break;
      }

      case EVENT_PATTERNS.USER_CREATED:
      case EVENT_PATTERNS.USER_UPDATED:
      case EVENT_PATTERNS.USER_STATUS_CHANGED: {
        if (p.id) {
          await this.prisma.userAnalytics.upsert({
            where: { userId: p.id },
            update: {
              fullName: p.fullName,
              email: p.email,
              role: p.role as UserRole,
              departmentId: p.departmentId ?? null,
              departmentName: p.departmentName ?? null,
              isActive: p.isActive ?? true,
            },
            create: {
              userId: p.id,
              fullName: p.fullName,
              email: p.email,
              role: p.role as UserRole,
              departmentId: p.departmentId ?? null,
              departmentName: p.departmentName ?? null,
              isActive: p.isActive ?? true,
            },
          });
        }
        const actionMap: Record<string, string> = {
          [EVENT_PATTERNS.USER_CREATED]: 'USER_CREATE',
          [EVENT_PATTERNS.USER_UPDATED]: 'USER_UPDATE',
          [EVENT_PATTERNS.USER_STATUS_CHANGED]: 'USER_DEACTIVATE',
        };
        await this.recordAudit(p.actor, actionMap[event.eventType], 'User', p.id, {
          email: p.email,
          role: p.role,
          isActive: p.isActive,
        });
        break;
      }

      case EVENT_PATTERNS.AUTH_LOGGED_IN: {
        await this.recordAudit(
          {
            id: p.userId,
            fullName: p.fullName,
            email: p.email,
            role: p.role,
          },
          'USER_LOGIN',
          'User',
          p.userId,
        );
        break;
      }

      case EVENT_PATTERNS.DEPARTMENT_CREATED:
      case EVENT_PATTERNS.DEPARTMENT_UPDATED: {
        if (p.id) {
          await this.prisma.departmentAnalytics.upsert({
            where: { departmentId: p.id },
            update: {
              name: p.name,
              code: p.code,
              isActive: p.isActive ?? true,
            },
            create: {
              departmentId: p.id,
              name: p.name,
              code: p.code,
              isActive: p.isActive ?? true,
            },
          });
        }
        await this.recordAudit(
          p.actor,
          event.eventType === EVENT_PATTERNS.DEPARTMENT_CREATED
            ? 'DEPARTMENT_CREATE'
            : 'DEPARTMENT_UPDATE',
          'Department',
          p.id,
          { name: p.name, code: p.code },
        );
        break;
      }

      case EVENT_PATTERNS.SERVICE_CATEGORY_CREATED:
      case EVENT_PATTERNS.SERVICE_CATEGORY_UPDATED: {
        await this.recordAudit(
          p.actor,
          event.eventType === EVENT_PATTERNS.SERVICE_CATEGORY_CREATED
            ? 'SERVICE_CATEGORY_CREATE'
            : 'SERVICE_CATEGORY_UPDATE',
          'ServiceCategory',
          p.category?.id || '',
          { name: p.category?.name },
        );
        break;
      }

      case EVENT_PATTERNS.SERVICE_CREATED:
      case EVENT_PATTERNS.SERVICE_UPDATED: {
        await this.recordAudit(
          p.actor,
          event.eventType === EVENT_PATTERNS.SERVICE_CREATED
            ? 'SERVICE_CREATE'
            : 'SERVICE_UPDATE',
          'Service',
          p.service?.id || '',
          { name: p.service?.name },
        );
        break;
      }

      case EVENT_PATTERNS.ATTACHMENT_UPLOADED: {
        await this.recordAudit(p.actor, 'ATTACHMENT_UPLOADED', 'TicketAttachment', p.attachmentId, {
          ticketId: p.ticketId,
          originalName: p.originalName,
          size: p.size,
        });
        break;
      }

      default:
        this.logger.debug(`Unhandled event type: ${event.eventType}`);
    }

    await this.prisma.processedEvent.create({
      data: {
        eventId: event.eventId,
        eventType: event.eventType,
      },
    });
  }
}
