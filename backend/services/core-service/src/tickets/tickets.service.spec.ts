import { EVENT_PATTERNS } from '@nit-help/microservice-common';
import { TicketPriority, TicketStatus, UserRole } from '@nit-help/shared';
import { TicketAttachmentsPort } from './application/ports/ticket-attachments.port';
import { TicketEventPublisherPort } from './application/ports/ticket-event-publisher.port';
import { TicketRepositoryPort } from './application/ports/ticket-repository.port';
import { UserDirectoryPort } from './application/ports/user-directory.port';
import { GetTicketDetailUseCase } from './application/use-cases/get-ticket-detail.use-case';
import { ListTicketsUseCase } from './application/use-cases/list-tickets.use-case';
import { UpdateTicketStatusUseCase } from './application/use-cases/update-ticket-status.use-case';
import { TicketForbiddenError } from './domain/ticket.errors';
import { TicketActorContext } from './domain/ticket.types';

describe('Ticket Use Cases (Clean Architecture Application Layer)', () => {
  const mockTicketRepo: jest.Mocked<TicketRepositoryPort> = {
    findActiveServiceWithDepartment: jest.fn(),
    findLatestTicketNumberByPrefix: jest.fn(),
    createTicketWithInitialActivity: jest.fn(),
    findTickets: jest.fn(),
    findTicketDetailsById: jest.fn(),
    findTicketForMutation: jest.fn(),
    updateStatusWithHistory: jest.fn(),
    findDepartmentById: jest.fn(),
    assignTicketWithHistory: jest.fn(),
    addMessageWithOptionalTransition: jest.fn(),
    createFeedback: jest.fn(),
    createObjectionWithHistory: jest.fn(),
    reviewObjectionWithHistory: jest.fn(),
    getTicketAccessContext: jest.fn(),
    exportAnalyticsSeed: jest.fn(),
  };

  const mockUserDirectory: jest.Mocked<UserDirectoryPort> = {
    resolveUsersByIds: jest.fn(),
    getFreshUserById: jest.fn(),
  };

  const mockAttachmentsPort: jest.Mocked<TicketAttachmentsPort> = {
    getTicketAttachments: jest.fn(),
    getAttachmentsCountByTickets: jest.fn(),
  };

  const mockEventPublisher: jest.Mocked<TicketEventPublisherPort> = {
    publish: jest.fn(),
  };

  const studentActor: TicketActorContext = {
    id: 'student-1',
    email: 'ali@nit.ac.ir',
    username: 'student',
    fullName: 'علی اکبری',
    role: UserRole.STUDENT,
    departmentId: null,
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('scopes ListTicketsUseCase to requesterId for Student role', async () => {
    const listUseCase = new ListTicketsUseCase(
      mockTicketRepo,
      mockUserDirectory,
      mockAttachmentsPort,
    );
    mockTicketRepo.findTickets.mockResolvedValue({ total: 0, items: [] });
    mockUserDirectory.resolveUsersByIds.mockResolvedValue(new Map());
    mockAttachmentsPort.getAttachmentsCountByTickets.mockResolvedValue({});

    await listUseCase.execute(studentActor, {});

    expect(mockTicketRepo.findTickets).toHaveBeenCalledWith(
      expect.objectContaining({
        scopeRole: UserRole.STUDENT,
        scopeUserId: 'student-1',
      }),
    );
  });

  it('throws TicketForbiddenError when a student requests another student ticket', async () => {
    const detailUseCase = new GetTicketDetailUseCase(
      mockTicketRepo,
      mockUserDirectory,
      mockAttachmentsPort,
    );

    mockTicketRepo.findTicketDetailsById.mockResolvedValue({
      ticket: {
        id: 't-123',
        ticketNumber: 'NIT-20261107-1001',
        subject: 'اینترنت',
        description: 'قطع است',
        requesterId: 'student-2',
        serviceId: 'srv-1',
        departmentId: 'dept-1',
        assignedToId: null,
        status: TicketStatus.NEW,
        priority: TicketPriority.NORMAL,
        resolvedAt: null,
        closedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        service: { id: 'srv-1', name: 'اینترنت' },
        department: { id: 'dept-1', name: 'فاوا', code: 'IT', managerId: null },
        history: [],
      },
      messages: [],
      internalMessageIds: [],
    });

    await expect(detailUseCase.execute('t-123', studentActor)).rejects.toThrow(
      TicketForbiddenError,
    );
  });

  it('filters out internal notes AND attachments linked to internal messages', async () => {
    const detailUseCase = new GetTicketDetailUseCase(
      mockTicketRepo,
      mockUserDirectory,
      mockAttachmentsPort,
    );

    mockTicketRepo.findTicketDetailsById.mockResolvedValue({
      ticket: {
        id: 't-123',
        ticketNumber: 'NIT-20261107-1001',
        subject: 'اینترنت',
        description: 'قطع است',
        requesterId: 'student-1',
        serviceId: 'srv-1',
        departmentId: 'dept-1',
        assignedToId: null,
        status: TicketStatus.IN_PROGRESS,
        priority: TicketPriority.NORMAL,
        resolvedAt: null,
        closedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        service: { id: 'srv-1', name: 'اینترنت' },
        department: { id: 'dept-1', name: 'فاوا', code: 'IT', managerId: null },
        history: [],
        feedback: null,
        objection: null,
      },
      messages: [
        {
          id: 'm-1',
          ticketId: 't-123',
          authorId: 'student-1',
          content: 'سلام قطع است',
          isInternal: false,
          createdAt: new Date(),
        },
      ],
      internalMessageIds: ['m-internal'],
    });

    mockAttachmentsPort.getTicketAttachments.mockResolvedValue([
      {
        id: 'att-public',
        ticketId: 't-123',
        messageId: 'm-1',
        uploadedById: 'student-1',
        originalName: 'public.png',
        storageKey: 'public.png',
        mimeType: 'image/png',
        size: 100,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'att-secret',
        ticketId: 't-123',
        messageId: 'm-internal',
        uploadedById: 'spec-1',
        originalName: 'secret.png',
        storageKey: 'secret.png',
        mimeType: 'image/png',
        size: 200,
        createdAt: new Date().toISOString(),
      },
    ]);

    mockUserDirectory.resolveUsersByIds.mockResolvedValue(
      new Map([
        [
          'student-1',
          {
            id: 'student-1',
            fullName: 'علی اکبری',
            email: 'ali@nit.ac.ir',
            username: 'student',
            role: UserRole.STUDENT,
            departmentId: null,
            isActive: true,
          },
        ],
      ]),
    );

    const detail = await detailUseCase.execute('t-123', studentActor);

    expect(mockTicketRepo.findTicketDetailsById).toHaveBeenCalledWith(
      't-123',
      false,
    );
    expect(detail.attachments).toHaveLength(1);
    expect(detail.attachments[0].id).toBe('att-public');
  });

  it('updates ticket status via repository port and publishes domain event', async () => {
    const updateStatusUseCase = new UpdateTicketStatusUseCase(
      mockTicketRepo,
      mockEventPublisher,
    );

    const specialistActor: TicketActorContext = {
      id: 'spec-1',
      email: 'spec@nit.ac.ir',
      username: 'it_spec',
      fullName: 'کارشناس',
      role: UserRole.SPECIALIST,
      departmentId: 'dept-1',
    };

    const now = new Date();
    mockTicketRepo.findTicketForMutation.mockResolvedValue({
      id: 't-1',
      ticketNumber: 'NIT-20261107-1001',
      subject: 'اینترنت',
      description: 'desc',
      requesterId: 'student-1',
      serviceId: 'srv-1',
      departmentId: 'dept-1',
      assignedToId: 'spec-1',
      status: TicketStatus.NEW,
      priority: TicketPriority.NORMAL,
      resolvedAt: null,
      closedAt: null,
      createdAt: now,
      updatedAt: now,
      service: { id: 'srv-1', name: 'اینترنت' },
      department: { id: 'dept-1', name: 'فاوا', code: 'IT', managerId: 'mgr-1' },
    });

    mockTicketRepo.updateStatusWithHistory.mockResolvedValue({
      id: 't-1',
      ticketNumber: 'NIT-20261107-1001',
      subject: 'اینترنت',
      description: 'desc',
      requesterId: 'student-1',
      serviceId: 'srv-1',
      departmentId: 'dept-1',
      assignedToId: 'spec-1',
      status: TicketStatus.IN_PROGRESS,
      priority: TicketPriority.NORMAL,
      resolvedAt: null,
      closedAt: null,
      createdAt: now,
      updatedAt: now,
    });

    const result = await updateStatusUseCase.execute('t-1', specialistActor, {
      status: TicketStatus.IN_PROGRESS,
      note: 'در حال بررسی توسط کارشناس',
    });

    expect(result.status).toBe(TicketStatus.IN_PROGRESS);
    expect(mockTicketRepo.updateStatusWithHistory).toHaveBeenCalledTimes(1);
    expect(mockEventPublisher.publish).toHaveBeenCalledWith(
      EVENT_PATTERNS.TICKET_STATUS_CHANGED,
      expect.objectContaining({
        oldStatus: TicketStatus.NEW,
        newStatus: TicketStatus.IN_PROGRESS,
      }),
    );
  });
});
