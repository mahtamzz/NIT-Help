import { Test, TestingModule } from '@nestjs/testing';
import { TicketsService } from './tickets.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { UserRole, TicketStatus, TicketPriority } from '@prisma/client';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

describe('TicketsService', () => {
  let service: TicketsService;
  let prisma: PrismaService;
  let notifications: NotificationsService;

  const mockPrismaService = {
    ticket: {
      count: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    ticketMessage: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    ticketHistory: {
      create: jest.fn(),
    },
    service: {
      findUnique: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    notification: {
      create: jest.fn(),
    },
  };

  const mockNotificationsService = {
    createNotification: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TicketsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: NotificationsService, useValue: mockNotificationsService },
      ],
    }).compile();

    service = module.get<TicketsService>(TicketsService);
    prisma = module.get<PrismaService>(PrismaService);
    notifications = module.get<NotificationsService>(NotificationsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Ticket Scoping and Privacy', () => {
    it('should restrict Student to only their own tickets', async () => {
      const studentUser = { id: 'student-1', role: UserRole.STUDENT };
      mockPrismaService.ticket.count.mockResolvedValue(1);
      mockPrismaService.ticket.findMany.mockResolvedValue([]);

      await service.findAll(studentUser, {});

      expect(mockPrismaService.ticket.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            requesterId: 'student-1',
          }),
        }),
      );
    });

    it('should NOT allow a student to view another student ticket', async () => {
      const studentUser = { id: 'student-1', role: UserRole.STUDENT };
      mockPrismaService.ticket.findUnique.mockResolvedValue({
        id: 't-123',
        requesterId: 'student-2', // Different student
        service: {},
        department: {},
        assignedTo: {},
        history: [],
        attachments: [],
      });

      await expect(service.findOne('t-123', studentUser)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should strictly filter out internal notes when requester views ticket details', async () => {
      const studentUser = { id: 'student-1', role: UserRole.STUDENT };
      mockPrismaService.ticket.findUnique.mockResolvedValue({
        id: 't-123',
        ticketNumber: 'NIT-20261107-1001',
        subject: 'اینترنت',
        description: 'قطع است',
        requesterId: 'student-1',
        requester: { id: 'student-1', fullName: 'علی', email: 'ali@nit.ac.ir' },
        service: { name: 'اینترنت' },
        department: { name: 'فناوری اطلاعات' },
        assignedTo: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        history: [],
        attachments: [],
      });

      mockPrismaService.ticketMessage.findMany.mockResolvedValue([
        {
          id: 'm-1',
          ticketId: 't-123',
          authorId: 'student-1',
          author: { fullName: 'علی', role: UserRole.STUDENT },
          content: 'سلام قطع است',
          isInternal: false,
          createdAt: new Date(),
          attachments: [],
        },
      ]);

      await service.findOne('t-123', studentUser);

      // Verify message query includes isInternal: false filter
      expect(mockPrismaService.ticketMessage.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { ticketId: 't-123', isInternal: false },
        }),
      );
    });
  });

  describe('Ticket Status Updates', () => {
    it('should allow specialist to update status to IN_PROGRESS and log history', async () => {
      const specialistUser = {
        id: 'spec-1',
        fullName: 'کارشناس',
        role: UserRole.SPECIALIST,
        departmentId: 'dept-1',
      };
      mockPrismaService.ticket.findUnique.mockResolvedValue({
        id: 't-1',
        status: TicketStatus.NEW,
        requesterId: 'student-1',
        requester: { id: 'student-1' },
        assignedToId: 'spec-1',
        departmentId: 'dept-1',
      });
      mockPrismaService.ticket.update.mockResolvedValue({
        id: 't-1',
        status: TicketStatus.IN_PROGRESS,
      });

      const result = await service.updateStatus('t-1', specialistUser, {
        status: TicketStatus.IN_PROGRESS,
        note: 'در حال بررسی توسط کارشناس',
      });

      expect(result.status).toBe(TicketStatus.IN_PROGRESS);
      expect(mockPrismaService.ticketHistory.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            ticketId: 't-1',
            actorId: 'spec-1',
            action: 'STATUS_CHANGED',
            oldValue: TicketStatus.NEW,
            newValue: TicketStatus.IN_PROGRESS,
          }),
        }),
      );
    });
  });
});

