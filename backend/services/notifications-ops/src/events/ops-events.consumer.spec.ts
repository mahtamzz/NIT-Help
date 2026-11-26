import { Test, TestingModule } from '@nestjs/testing';
import { EVENT_PATTERNS, EventBusService } from '@nit-help/microservice-common';
import { TicketPriority, TicketStatus, UserRole } from '@nit-help/shared';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { OpsEventsConsumer } from './ops-events.consumer';

describe('OpsEventsConsumer (Notifications & Ops Microservice)', () => {
  let consumer: OpsEventsConsumer;

  const mockPrisma = {
    processedEvent: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    ticketAnalytics: {
      upsert: jest.fn(),
    },
    departmentAnalytics: {
      upsert: jest.fn(),
    },
    userAnalytics: {
      upsert: jest.fn(),
    },
  };

  const mockEventBus = {
    subscribe: jest.fn(),
  };

  const mockNotifications = {
    createNotification: jest.fn(),
  };

  const mockAudit = {
    logAction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OpsEventsConsumer,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: EventBusService, useValue: mockEventBus },
        { provide: NotificationsService, useValue: mockNotifications },
        { provide: AuditService, useValue: mockAudit },
      ],
    }).compile();

    consumer = module.get<OpsEventsConsumer>(OpsEventsConsumer);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('processes ticket.created event into TicketAnalytics, manager & requester notifications, and AuditLog', async () => {
    mockPrisma.processedEvent.findUnique.mockResolvedValue(null);

    await consumer.handleEvent({
      eventId: 'evt-1',
      eventType: EVENT_PATTERNS.TICKET_CREATED,
      occurredAt: new Date().toISOString(),
      payload: {
        ticket: {
          id: 't-1',
          ticketNumber: 'NIT-20261125-1001',
          subject: 'تست',
          status: TicketStatus.NEW,
          priority: TicketPriority.HIGH,
          requesterId: 'stu-1',
          serviceId: 'srv-1',
          serviceName: 'اینترنت',
          departmentId: 'dept-1',
          departmentName: 'فاوا',
          departmentManagerId: 'mgr-1',
          assignedToId: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          resolvedAt: null,
          closedAt: null,
        },
        actor: {
          id: 'stu-1',
          email: 'student@nit.ac.ir',
          username: 'student',
          fullName: 'علی اکبری',
          role: UserRole.STUDENT,
          departmentId: null,
        },
      },
    });

    expect(mockPrisma.ticketAnalytics.upsert).toHaveBeenCalledTimes(1);
    expect(mockNotifications.createNotification).toHaveBeenCalledTimes(2);
    expect(mockAudit.logAction).toHaveBeenCalledTimes(1);
    expect(mockPrisma.processedEvent.create).toHaveBeenCalledWith({
      data: { eventId: 'evt-1', eventType: EVENT_PATTERNS.TICKET_CREATED },
    });
  });

  it('skips duplicate events idempotently', async () => {
    mockPrisma.processedEvent.findUnique.mockResolvedValue({ eventId: 'evt-dup' });

    await consumer.handleEvent({
      eventId: 'evt-dup',
      eventType: EVENT_PATTERNS.TICKET_CREATED,
      occurredAt: new Date().toISOString(),
      payload: {},
    });

    expect(mockPrisma.ticketAnalytics.upsert).not.toHaveBeenCalled();
    expect(mockNotifications.createNotification).not.toHaveBeenCalled();
  });

  it('never notifies requester when an internal staff note is created', async () => {
    mockPrisma.processedEvent.findUnique.mockResolvedValue(null);

    await consumer.handleEvent({
      eventId: 'evt-msg-internal',
      eventType: EVENT_PATTERNS.TICKET_MESSAGE_CREATED,
      occurredAt: new Date().toISOString(),
      payload: {
        ticket: {
          id: 't-1',
          ticketNumber: 'NIT-20261125-1001',
          subject: 'تست',
          status: TicketStatus.IN_PROGRESS,
          priority: TicketPriority.NORMAL,
          requesterId: 'stu-1',
          serviceId: 'srv-1',
          serviceName: 'اینترنت',
          departmentId: 'dept-1',
          departmentName: 'فاوا',
          departmentManagerId: 'mgr-1',
          assignedToId: 'spec-1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          resolvedAt: null,
          closedAt: null,
        },
        messageId: 'msg-1',
        isInternal: true,
        actor: {
          id: 'spec-1',
          email: 'spec@nit.ac.ir',
          username: 'it_spec',
          fullName: 'کارشناس',
          role: UserRole.SPECIALIST,
          departmentId: 'dept-1',
        },
      },
    });

    expect(mockNotifications.createNotification).not.toHaveBeenCalled();
    expect(mockPrisma.processedEvent.create).toHaveBeenCalledTimes(1);
  });
});
