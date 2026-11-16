import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole, TicketStatus, TicketPriority } from '@prisma/client';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getOverview(user: any, departmentId?: string) {
    const isManager = user.role === UserRole.MANAGER;
    const isAdmin = user.role === UserRole.ADMIN;

    if (!isManager && !isAdmin) {
      throw new ForbiddenException('شما دسترسی به گزارش‌ها و آمار سامانه را ندارید');
    }

    const targetDeptId = isManager ? user.departmentId : departmentId;
    const where: any = {};
    if (targetDeptId) {
      where.departmentId = targetDeptId;
    }

    // Counts
    const [
      totalTickets,
      newTickets,
      assignedTickets,
      inProgressTickets,
      waitingTickets,
      resolvedTickets,
      closedTickets,
      lowPriority,
      normalPriority,
      highPriority,
      urgentPriority,
      departments,
      allResolvedWithTimes,
      allRecentTickets,
    ] = await Promise.all([
      this.prisma.ticket.count({ where }),
      this.prisma.ticket.count({ where: { ...where, status: TicketStatus.NEW } }),
      this.prisma.ticket.count({ where: { ...where, status: TicketStatus.ASSIGNED } }),
      this.prisma.ticket.count({ where: { ...where, status: TicketStatus.IN_PROGRESS } }),
      this.prisma.ticket.count({ where: { ...where, status: TicketStatus.WAITING_FOR_REQUESTER } }),
      this.prisma.ticket.count({ where: { ...where, status: TicketStatus.RESOLVED } }),
      this.prisma.ticket.count({ where: { ...where, status: TicketStatus.CLOSED } }),
      this.prisma.ticket.count({ where: { ...where, priority: TicketPriority.LOW } }),
      this.prisma.ticket.count({ where: { ...where, priority: TicketPriority.NORMAL } }),
      this.prisma.ticket.count({ where: { ...where, priority: TicketPriority.HIGH } }),
      this.prisma.ticket.count({ where: { ...where, priority: TicketPriority.URGENT } }),
      this.prisma.department.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          _count: {
            select: { tickets: true },
          },
        },
      }),
      this.prisma.ticket.findMany({
        where: { ...where, status: { in: [TicketStatus.RESOLVED, TicketStatus.CLOSED] }, resolvedAt: { not: null } },
        select: { createdAt: true, resolvedAt: true },
      }),
      this.prisma.ticket.findMany({
        where,
        take: 100,
        select: { createdAt: true },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    // Average resolution time
    let averageResolutionHours = 0;
    if (allResolvedWithTimes.length > 0) {
      const totalHours = allResolvedWithTimes.reduce((acc, curr) => {
        if (curr.resolvedAt) {
          const diffMs = curr.resolvedAt.getTime() - curr.createdAt.getTime();
          return acc + diffMs / (1000 * 60 * 60);
        }
        return acc;
      }, 0);
      averageResolutionHours = Math.round((totalHours / allResolvedWithTimes.length) * 10) / 10;
    }

    // Tickets over time (group by day: YYYY-MM-DD)
    const timelineMap = new Map<string, number>();
    allRecentTickets.forEach((t) => {
      const dateKey = t.createdAt.toISOString().split('T')[0];
      timelineMap.set(dateKey, (timelineMap.get(dateKey) || 0) + 1);
    });

    const ticketsOverTime = Array.from(timelineMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      totalTickets,
      openTickets: newTickets + assignedTickets + inProgressTickets + waitingTickets,
      inProgressTickets,
      waitingForRequesterTickets: waitingTickets,
      resolvedTickets,
      closedTickets,
      overdueTickets: 0,
      averageResolutionHours,
      ticketsByStatus: [
        { status: TicketStatus.NEW, count: newTickets },
        { status: TicketStatus.ASSIGNED, count: assignedTickets },
        { status: TicketStatus.IN_PROGRESS, count: inProgressTickets },
        { status: TicketStatus.WAITING_FOR_REQUESTER, count: waitingTickets },
        { status: TicketStatus.RESOLVED, count: resolvedTickets },
        { status: TicketStatus.CLOSED, count: closedTickets },
      ],
      ticketsByPriority: [
        { priority: TicketPriority.LOW, count: lowPriority },
        { priority: TicketPriority.NORMAL, count: normalPriority },
        { priority: TicketPriority.HIGH, count: highPriority },
        { priority: TicketPriority.URGENT, count: urgentPriority },
      ],
      ticketsByDepartment: departments.map((d) => ({
        departmentName: d.name,
        count: d._count.tickets,
      })),
      ticketsOverTime,
    };
  }

  async getSpecialistsWorkload(user: any, departmentId?: string) {
    const isManager = user.role === UserRole.MANAGER;
    const isAdmin = user.role === UserRole.ADMIN;

    if (!isManager && !isAdmin) {
      throw new ForbiddenException('شما دسترسی به این گزارش را ندارید');
    }

    const targetDeptId = isManager ? user.departmentId : departmentId;
    const whereUser: any = {
      role: { in: [UserRole.SPECIALIST, UserRole.MANAGER] },
      isActive: true,
    };
    if (targetDeptId) {
      whereUser.departmentId = targetDeptId;
    }

    const specialists = await this.prisma.user.findMany({
      where: whereUser,
      include: {
        department: { select: { name: true } },
        assignedTickets: {
          select: { status: true },
        },
      },
    });

    return specialists.map((s) => {
      const assigned = s.assignedTickets.length;
      const open = s.assignedTickets.filter((t) =>
        t.status === TicketStatus.NEW ||
        t.status === TicketStatus.ASSIGNED ||
        t.status === TicketStatus.IN_PROGRESS ||
        t.status === TicketStatus.WAITING_FOR_REQUESTER,
      ).length;
      const resolved = s.assignedTickets.filter((t) =>
        t.status === TicketStatus.RESOLVED || t.status === TicketStatus.CLOSED,
      ).length;

      return {
        id: s.id,
        fullName: s.fullName,
        departmentName: s.department?.name || 'نامشخص',
        totalAssigned: assigned,
        activeTickets: open,
        resolvedTickets: resolved,
      };
    });
  }
}

