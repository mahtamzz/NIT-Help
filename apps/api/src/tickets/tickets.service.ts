import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  UserRole,
  TicketStatus,
  TicketPriority,
  ObjectionStatus,
  NotificationType,
} from '@prisma/client';

@Injectable()
export class TicketsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  private async generateTicketNumber(): Promise<string> {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const datePrefix = `NIT-${year}${month}${day}-`;

    const count = await this.prisma.ticket.count({
      where: {
        ticketNumber: {
          startsWith: datePrefix,
        },
      },
    });

    const sequence = String(count + 1001);
    return `${datePrefix}${sequence}`;
  }

  async createTicket(
    requester: any,
    data: {
      serviceId: string;
      subject: string;
      description: string;
      priority?: TicketPriority;
    },
  ) {
    const service = await this.prisma.service.findUnique({
      where: { id: data.serviceId },
      include: { department: true },
    });

    if (!service || !service.isActive) {
      throw new BadRequestException('خدمت انتخابی معتبر نیست یا غیرفعال شده است');
    }

    const ticketNumber = await this.generateTicketNumber();
    const priority = data.priority || service.defaultPriority || TicketPriority.NORMAL;

    const ticket = await this.prisma.ticket.create({
      data: {
        ticketNumber,
        subject: data.subject.trim(),
        description: data.description.trim(),
        requesterId: requester.id,
        serviceId: service.id,
        departmentId: service.departmentId,
        status: TicketStatus.NEW,
        priority,
      },
      include: {
        service: true,
        department: true,
        requester: {
          select: { id: true, fullName: true, email: true },
        },
      },
    });

    // Create initial message
    await this.prisma.ticketMessage.create({
      data: {
        ticketId: ticket.id,
        authorId: requester.id,
        content: data.description.trim(),
        isInternal: false,
      },
    });

    // Record creation event in history
    await this.prisma.ticketHistory.create({
      data: {
        ticketId: ticket.id,
        actorId: requester.id,
        action: 'TICKET_CREATED',
        newValue: TicketStatus.NEW,
        note: 'تیکت جدید توسط درخواست‌کننده در سامانه ثبت شد',
      },
    });

    // Notify Department Manager
    if (service.department.managerId) {
      await this.notificationsService.createNotification({
        recipientId: service.department.managerId,
        ticketId: ticket.id,
        type: NotificationType.TICKET_CREATED,
        title: 'تیکت جدید دریافت شد',
        message: `تیکت جدید ${ticket.ticketNumber} با موضوع "${ticket.subject}" در واحد شما ثبت گردید.`,
      });
    }

    // Confirmation notification to requester
    await this.notificationsService.createNotification({
      recipientId: requester.id,
      ticketId: ticket.id,
      type: NotificationType.TICKET_CREATED,
      title: 'ثبت موفق درخواست',
      message: `درخواست شما با شماره پیگیری ${ticket.ticketNumber} با موفقیت ثبت شد و در صف بررسی قرار گرفت.`,
    });

    return ticket;
  }

  async findAll(
    user: any,
    query: {
      page?: number;
      limit?: number;
      search?: string;
      status?: TicketStatus;
      priority?: TicketPriority;
      serviceId?: string;
      departmentId?: string;
      assignedToId?: string;
      requesterId?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    },
  ) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = {};

    // 1. Role-based scoping (Privacy & Access Control)
    if (user.role === UserRole.STUDENT || user.role === UserRole.FACULTY) {
      // Requesters can only see their own tickets
      where.requesterId = user.id;
    } else if (user.role === UserRole.SPECIALIST) {
      // Specialist sees tickets assigned to them OR unassigned in their department
      where.OR = [
        { assignedToId: user.id },
        { departmentId: user.departmentId },
      ];
    } else if (user.role === UserRole.MANAGER) {
      // Department manager sees tickets in their department
      if (user.departmentId) {
        where.departmentId = user.departmentId;
      }
    }
    // Admins see everything without restrictive base scope

    // 2. Query filters
    if (query.search) {
      const q = query.search.trim();
      const searchCondition = [
        { ticketNumber: { contains: q, mode: 'insensitive' } },
        { subject: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ];
      if (where.OR) {
        where.AND = [{ OR: where.OR }, { OR: searchCondition }];
        delete where.OR;
      } else {
        where.OR = searchCondition;
      }
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.priority) {
      where.priority = query.priority;
    }

    if (query.serviceId) {
      where.serviceId = query.serviceId;
    }

    if (query.departmentId && (user.role === UserRole.ADMIN || user.departmentId === query.departmentId)) {
      where.departmentId = query.departmentId;
    }

    if (query.assignedToId) {
      where.assignedToId = query.assignedToId === 'unassigned' ? null : query.assignedToId;
    }

    if (query.requesterId && (user.role === UserRole.ADMIN || user.role === UserRole.MANAGER)) {
      where.requesterId = query.requesterId;
    }

    const orderBy: any = {};
    const sortField = query.sortBy || 'createdAt';
    const sortDirection = query.sortOrder === 'asc' ? 'asc' : 'desc';
    orderBy[sortField] = sortDirection;

    const [total, tickets] = await Promise.all([
      this.prisma.ticket.count({ where }),
      this.prisma.ticket.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          requester: {
            select: { id: true, fullName: true, email: true },
          },
          service: {
            select: { id: true, name: true },
          },
          department: {
            select: { id: true, name: true, code: true },
          },
          assignedTo: {
            select: { id: true, fullName: true, email: true },
          },
          feedback: {
            select: { rating: true },
          },
          objection: {
            select: { status: true },
          },
          _count: {
            select: { messages: true, attachments: true },
          },
        },
      }),
    ]);

    const formatted = tickets.map((t) => ({
      id: t.id,
      ticketNumber: t.ticketNumber,
      subject: t.subject,
      description: t.description,
      status: t.status,
      priority: t.priority,
      requesterId: t.requesterId,
      requesterName: t.requester.fullName,
      requesterEmail: t.requester.email,
      serviceId: t.serviceId,
      serviceName: t.service.name,
      departmentId: t.departmentId,
      departmentName: t.department.name,
      assignedToId: t.assignedToId,
      assignedToName: t.assignedTo?.fullName || null,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
      resolvedAt: t.resolvedAt?.toISOString() || null,
      closedAt: t.closedAt?.toISOString() || null,
      feedback: t.feedback ? { rating: t.feedback.rating } : null,
      objection: t.objection ? { status: t.objection.status } : null,
      messagesCount: t._count.messages,
      attachmentsCount: t._count.attachments,
    }));

    return {
      data: formatted,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string, user: any) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id },
      include: {
        requester: {
          select: { id: true, fullName: true, email: true, username: true, role: true },
        },
        service: {
          include: { category: true },
        },
        department: true,
        assignedTo: {
          select: { id: true, fullName: true, email: true, role: true },
        },
        feedback: true,
        objection: {
          include: {
            requester: {
              select: { id: true, fullName: true },
            },
          },
        },
        history: {
          include: {
            actor: {
              select: { id: true, fullName: true, role: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        attachments: {
          include: {
            uploadedBy: {
              select: { id: true, fullName: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!ticket) {
      throw new NotFoundException('تیکت مورد نظر یافت نشد');
    }

    // Authorization & Privacy Check
    const isRequester = ticket.requesterId === user.id;
    const isStaff = [UserRole.SPECIALIST, UserRole.MANAGER, UserRole.ADMIN].includes(user.role);

    if (!isStaff && !isRequester) {
      throw new ForbiddenException('شما دسترسی مشاهده این تیکت را ندارید');
    }

    if (user.role === UserRole.SPECIALIST) {
      if (ticket.assignedToId !== user.id && ticket.departmentId !== user.departmentId) {
        throw new ForbiddenException('شما دسترسی به تیکت‌های سایر دپارتمان‌ها را ندارید');
      }
    }

    if (user.role === UserRole.MANAGER) {
      if (ticket.departmentId !== user.departmentId && user.departmentId) {
        throw new ForbiddenException('شما دسترسی به تیکت‌های این دپارتمان را ندارید');
      }
    }

    // STRICT PRIVACY RULE FOR MESSAGES:
    // If the viewer is the student/faculty (requester), NEVER return messages where isInternal === true
    const messageWhere: any = { ticketId: id };
    if (!isStaff) {
      messageWhere.isInternal = false;
    }

    const messages = await this.prisma.ticketMessage.findMany({
      where: messageWhere,
      include: {
        author: {
          select: { id: true, fullName: true, role: true },
        },
        attachments: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    return {
      id: ticket.id,
      ticketNumber: ticket.ticketNumber,
      subject: ticket.subject,
      description: ticket.description,
      status: ticket.status,
      priority: ticket.priority,
      requesterId: ticket.requesterId,
      requesterName: ticket.requester.fullName,
      requesterEmail: ticket.requester.email,
      requesterUsername: ticket.requester.username,
      serviceId: ticket.serviceId,
      serviceName: ticket.service.name,
      departmentId: ticket.departmentId,
      departmentName: ticket.department.name,
      assignedToId: ticket.assignedToId,
      assignedToName: ticket.assignedTo?.fullName || null,
      createdAt: ticket.createdAt.toISOString(),
      updatedAt: ticket.updatedAt.toISOString(),
      resolvedAt: ticket.resolvedAt?.toISOString() || null,
      closedAt: ticket.closedAt?.toISOString() || null,
      messages: messages.map((m) => ({
        id: m.id,
        ticketId: m.ticketId,
        authorId: m.authorId,
        authorName: m.author.fullName,
        authorRole: m.author.role,
        content: m.content,
        isInternal: m.isInternal,
        createdAt: m.createdAt.toISOString(),
        attachments: m.attachments,
      })),
      attachments: ticket.attachments.map((a) => ({
        id: a.id,
        ticketId: a.ticketId,
        messageId: a.messageId,
        uploadedById: a.uploadedById,
        uploaderName: a.uploadedBy.fullName,
        originalName: a.originalName,
        storageKey: a.storageKey,
        mimeType: a.mimeType,
        size: a.size,
        createdAt: a.createdAt.toISOString(),
      })),
      history: ticket.history.map((h) => ({
        id: h.id,
        ticketId: h.ticketId,
        actorId: h.actorId,
        actorName: h.actor.fullName,
        actorRole: h.actor.role,
        action: h.action,
        oldValue: h.oldValue,
        newValue: h.newValue,
        note: h.note,
        createdAt: h.createdAt.toISOString(),
      })),
      feedback: ticket.feedback
        ? {
            id: ticket.feedback.id,
            ticketId: ticket.feedback.ticketId,
            requesterId: ticket.feedback.requesterId,
            rating: ticket.feedback.rating,
            comment: ticket.feedback.comment,
            createdAt: ticket.feedback.createdAt.toISOString(),
          }
        : null,
      objection: ticket.objection
        ? {
            id: ticket.objection.id,
            ticketId: ticket.objection.ticketId,
            requesterId: ticket.objection.requesterId,
            requesterName: ticket.objection.requester.fullName,
            description: ticket.objection.description,
            status: ticket.objection.status,
            resolutionNote: ticket.objection.resolutionNote,
            createdAt: ticket.objection.createdAt.toISOString(),
            updatedAt: ticket.objection.updatedAt.toISOString(),
          }
        : null,
    };
  }

  async updateStatus(
    id: string,
    user: any,
    data: { status: TicketStatus; note?: string },
  ) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id },
      include: { requester: true, assignedTo: true, department: true },
    });

    if (!ticket) {
      throw new NotFoundException('تیکت مورد نظر یافت نشد');
    }

    const isStaff = [UserRole.SPECIALIST, UserRole.MANAGER, UserRole.ADMIN].includes(user.role);
    const isRequester = ticket.requesterId === user.id;

    // Permissions: requesters can only close their own tickets or reopen if resolved
    if (!isStaff && !isRequester) {
      throw new ForbiddenException('شما دسترسی تغییر وضعیت این تیکت را ندارید');
    }

    if (!isStaff && isRequester) {
      if (data.status !== TicketStatus.CLOSED && data.status !== TicketStatus.IN_PROGRESS) {
        throw new ForbiddenException('درخواست‌کننده فقط امکان بستن یا بازگشایی مجدد تیکت را دارد');
      }
    }

    const oldStatus = ticket.status;
    const newStatus = data.status;

    if (oldStatus === newStatus) {
      return ticket;
    }

    const updatePayload: any = {
      status: newStatus,
    };

    if (newStatus === TicketStatus.RESOLVED) {
      updatePayload.resolvedAt = new Date();
    } else if (newStatus === TicketStatus.CLOSED) {
      updatePayload.closedAt = new Date();
    }

    const updated = await this.prisma.ticket.update({
      where: { id },
      data: updatePayload,
    });

    // Record in history
    await this.prisma.ticketHistory.create({
      data: {
        ticketId: id,
        actorId: user.id,
        action: 'STATUS_CHANGED',
        oldValue: oldStatus,
        newValue: newStatus,
        note: data.note || `تغییر وضعیت تیکت از ${oldStatus} به ${newStatus}`,
      },
    });

    // Notifications
    if (isStaff && ticket.requesterId !== user.id) {
      await this.notificationsService.createNotification({
        recipientId: ticket.requesterId,
        ticketId: id,
        type:
          newStatus === TicketStatus.RESOLVED
            ? NotificationType.TICKET_RESOLVED
            : NotificationType.STATUS_CHANGED,
        title: newStatus === TicketStatus.RESOLVED ? 'تیکت شما حل شد' : 'تغییر وضعیت تیکت',
        message: `وضعیت تیکت ${ticket.ticketNumber} به حالت "${newStatus}" تغییر یافت.`,
      });
    }

    return updated;
  }

  async assignTicket(
    id: string,
    user: any,
    data: { departmentId?: string; assignedToId: string | null; note?: string },
  ) {
    const isAuthorized = [UserRole.MANAGER, UserRole.ADMIN, UserRole.SPECIALIST].includes(
      user.role,
    );
    if (!isAuthorized) {
      throw new ForbiddenException('شما مجوز ارجاع یا تغییر کارشناس تیکت را ندارید');
    }

    const ticket = await this.prisma.ticket.findUnique({
      where: { id },
      include: { assignedTo: true, department: true },
    });

    if (!ticket) {
      throw new NotFoundException('تیکت یافت نشد');
    }

    let assigneeUser: any = null;
    if (data.assignedToId) {
      assigneeUser = await this.prisma.user.findUnique({
        where: { id: data.assignedToId },
      });
      if (!assigneeUser || !assigneeUser.isActive) {
        throw new BadRequestException('کارشناس انتخاب شده معتبر یا فعال نیست');
      }
    }

    const oldAssigneeName = ticket.assignedTo?.fullName || 'بدون تخصیص';
    const newAssigneeName = assigneeUser?.fullName || 'بدون تخصیص';

    const updateData: any = {
      assignedToId: data.assignedToId,
    };

    if (data.departmentId) {
      updateData.departmentId = data.departmentId;
    }

    if (data.assignedToId && ticket.status === TicketStatus.NEW) {
      updateData.status = TicketStatus.ASSIGNED;
    }

    const updated = await this.prisma.ticket.update({
      where: { id },
      data: updateData,
    });

    // Record in history
    await this.prisma.ticketHistory.create({
      data: {
        ticketId: id,
        actorId: user.id,
        action: 'TICKET_ASSIGNED',
        oldValue: oldAssigneeName,
        newValue: newAssigneeName,
        note: data.note || `ارجاع تیکت به ${newAssigneeName}`,
      },
    });

    // Notify newly assigned specialist
    if (data.assignedToId && data.assignedToId !== user.id) {
      await this.notificationsService.createNotification({
        recipientId: data.assignedToId,
        ticketId: id,
        type: NotificationType.TICKET_ASSIGNED,
        title: 'ارجاع تیکت جدید به شما',
        message: `تیکت ${ticket.ticketNumber} با موضوع "${ticket.subject}" به شما ارجاع داده شد.`,
      });
    }

    return updated;
  }

  async addMessage(
    id: string,
    user: any,
    data: { content: string; isInternal?: boolean },
  ) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id },
      include: { requester: true, assignedTo: true },
    });

    if (!ticket) {
      throw new NotFoundException('تیکت یافت نشد');
    }

    const isRequester = ticket.requesterId === user.id;
    const isStaff = [UserRole.SPECIALIST, UserRole.MANAGER, UserRole.ADMIN].includes(user.role);

    if (!isRequester && !isStaff) {
      throw new ForbiddenException('شما دسترسی ارسال پیام در این تیکت را ندارید');
    }

    // Requesters can NEVER create internal notes
    const isInternal = isStaff ? (data.isInternal ?? false) : false;

    const message = await this.prisma.ticketMessage.create({
      data: {
        ticketId: id,
        authorId: user.id,
        content: data.content.trim(),
        isInternal,
      },
      include: {
        author: {
          select: { id: true, fullName: true, role: true },
        },
      },
    });

    // If message is from requester and status was WAITING_FOR_REQUESTER, move to IN_PROGRESS
    if (isRequester && ticket.status === TicketStatus.WAITING_FOR_REQUESTER) {
      await this.prisma.ticket.update({
        where: { id },
        data: { status: TicketStatus.IN_PROGRESS },
      });
      await this.prisma.ticketHistory.create({
        data: {
          ticketId: id,
          actorId: user.id,
          action: 'STATUS_CHANGED',
          oldValue: TicketStatus.WAITING_FOR_REQUESTER,
          newValue: TicketStatus.IN_PROGRESS,
          note: 'پاسخ کاربر ارسال شد و تیکت به وضعیت در حال بررسی تغییر یافت',
        },
      });
    }

    // Notifications (only if not internal note)
    if (!isInternal) {
      if (isStaff && ticket.requesterId !== user.id) {
        await this.notificationsService.createNotification({
          recipientId: ticket.requesterId,
          ticketId: id,
          type: NotificationType.MESSAGE_RECEIVED,
          title: 'پاسخ جدید در تیکت',
          message: `${user.fullName} به تیکت شماره ${ticket.ticketNumber} پاسخ داد.`,
        });
      } else if (isRequester && ticket.assignedToId) {
        await this.notificationsService.createNotification({
          recipientId: ticket.assignedToId,
          ticketId: id,
          type: NotificationType.MESSAGE_RECEIVED,
          title: 'پیام جدید از کاربر',
          message: `کاربر ${ticket.requester.fullName} در تیکت ${ticket.ticketNumber} پیام جدیدی ارسال کرد.`,
        });
      }
    }

    return {
      id: message.id,
      ticketId: message.ticketId,
      authorId: message.authorId,
      authorName: message.author.fullName,
      authorRole: message.author.role,
      content: message.content,
      isInternal: message.isInternal,
      createdAt: message.createdAt.toISOString(),
    };
  }

  async addFeedback(
    id: string,
    user: any,
    data: { rating: number; comment?: string },
  ) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id },
      include: { feedback: true },
    });

    if (!ticket) {
      throw new NotFoundException('تیکت یافت نشد');
    }

    if (ticket.requesterId !== user.id) {
      throw new ForbiddenException('فقط درخواست‌کننده تیکت می‌تواند نظرسنجی را تکمیل کند');
    }

    if (ticket.status !== TicketStatus.RESOLVED && ticket.status !== TicketStatus.CLOSED) {
      throw new BadRequestException('نظرسنجی تنها پس از حل یا بسته شدن تیکت امکان‌پذیر است');
    }

    if (ticket.feedback) {
      throw new BadRequestException('نظر شما قبلاً برای این تیکت ثبت شده است');
    }

    return this.prisma.ticketFeedback.create({
      data: {
        ticketId: id,
        requesterId: user.id,
        rating: Math.max(1, Math.min(5, data.rating)),
        comment: data.comment?.trim(),
      },
    });
  }

  async addObjection(
    id: string,
    user: any,
    data: { description: string },
  ) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id },
      include: { objection: true, department: true },
    });

    if (!ticket) {
      throw new NotFoundException('تیکت یافت نشد');
    }

    if (ticket.requesterId !== user.id) {
      throw new ForbiddenException('تنها درخواست‌کننده تیکت امکان ثبت اعتراض را دارد');
    }

    if (ticket.status !== TicketStatus.RESOLVED && ticket.status !== TicketStatus.CLOSED) {
      throw new BadRequestException('اعتراض فقط پس از پاسخ نهایی یا حل تیکت قابل ثبت است');
    }

    if (ticket.objection) {
      throw new BadRequestException('برای این تیکت قبلاً اعتراض ثبت شده است');
    }

    const objection = await this.prisma.ticketObjection.create({
      data: {
        ticketId: id,
        requesterId: user.id,
        description: data.description.trim(),
        status: ObjectionStatus.PENDING,
      },
    });

    // Record in history
    await this.prisma.ticketHistory.create({
      data: {
        ticketId: id,
        actorId: user.id,
        action: 'OBJECTION_SUBMITTED',
        note: 'درخواست‌کننده نسبت به نتیجه تیکت اعتراض ثبت کرد',
      },
    });

    // Notify Department Manager
    if (ticket.department.managerId) {
      await this.notificationsService.createNotification({
        recipientId: ticket.department.managerId,
        ticketId: id,
        type: NotificationType.OBJECTION_SUBMITTED,
        title: 'ثبت اعتراض جدید',
        message: `درخواست‌کننده تیکت ${ticket.ticketNumber} نسبت به نتیجه اعتراض ثبت کرد.`,
      });
    }

    return objection;
  }

  async reviewObjection(
    id: string,
    user: any,
    data: { status: ObjectionStatus; resolutionNote: string },
  ) {
    const isAuthorized = [UserRole.MANAGER, UserRole.ADMIN, UserRole.SPECIALIST].includes(
      user.role,
    );
    if (!isAuthorized) {
      throw new ForbiddenException('شما مجوز بررسی اعتراض را ندارید');
    }

    const ticket = await this.prisma.ticket.findUnique({
      where: { id },
      include: { objection: true, requester: true },
    });

    if (!ticket || !ticket.objection) {
      throw new NotFoundException('اعتراضی برای این تیکت یافت نشد');
    }

    const updatedObjection = await this.prisma.ticketObjection.update({
      where: { ticketId: id },
      data: {
        status: data.status,
        resolutionNote: data.resolutionNote.trim(),
      },
    });

    // If accepted/resolved, ticket status might move back to IN_PROGRESS
    if (data.status === ObjectionStatus.RESOLVED) {
      await this.prisma.ticket.update({
        where: { id },
        data: { status: TicketStatus.IN_PROGRESS },
      });
    }

    // Record in history
    await this.prisma.ticketHistory.create({
      data: {
        ticketId: id,
        actorId: user.id,
        action: 'OBJECTION_REVIEWED',
        newValue: data.status,
        note: data.resolutionNote.trim(),
      },
    });

    // Notify Requester
    await this.notificationsService.createNotification({
      recipientId: ticket.requesterId,
      ticketId: id,
      type: NotificationType.OBJECTION_ANSWERED,
      title: 'پاسخ به اعتراض شما',
      message: `اعتراض شما در تیکت ${ticket.ticketNumber} بررسی شد: ${data.resolutionNote}`,
    });

    return updatedObjection;
  }
}

