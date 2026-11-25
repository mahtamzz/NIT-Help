import { ForbiddenException, Injectable } from '@nestjs/common';
import { AuthenticatedUser } from '@nit-help/microservice-common';
import { TicketPriority, TicketStatus, UserRole } from '.prisma/ops-client';
import { ProjectionSyncService } from '../events/projection-sync.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectionSync: ProjectionSyncService,
  ) {}

  async getOverview(user: AuthenticatedUser, departmentId?: string) {
    const isManager = user.role === UserRole.MANAGER;
    const isAdmin = user.role === UserRole.ADMIN;

    if (!isManager && !isAdmin) {
      throw new ForbiddenException('شما دسترسی به گزارش‌ها و آمار سامانه را ندارید');
    }

    // Reconcile latest projections if Core/IAM are reachable; fallback silently to local CQRS tables
    await this.projectionSync.syncAll().catch(() => undefined);

    const targetDeptId = isManager ? user.departmentId : departmentId;
    const where: any = {};
    if (targetDeptId) {
      where.departmentId = targetDeptId;
    }

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
      departmentTicketCounts,
    ] = await Promise.all([
      this.prisma.ticketAnalytics.count({ where }),
      this.prisma.ticketAnalytics.count({ where: { ...where, status: TicketStatus.NEW } }),
      this.prisma.ticketAnalytics.count({ where: { ...where, status: TicketStatus.ASSIGNED } }),
      this.prisma.ticketAnalytics.count({ where: { ...where, status: TicketStatus.IN_PROGRESS } }),
      this.prisma.ticketAnalytics.count({
        where: { ...where, status: TicketStatus.WAITING_FOR_REQUESTER },
      }),
      this.prisma.ticketAnalytics.count({ where: { ...where, status: TicketStatus.RESOLVED } }),
      this.prisma.ticketAnalytics.count({ where: { ...where, status: TicketStatus.CLOSED } }),
      this.prisma.ticketAnalytics.count({ where: { ...where, priority: TicketPriority.LOW } }),
      this.prisma.ticketAnalytics.count({ where: { ...where, priority: TicketPriority.NORMAL } }),
      this.prisma.ticketAnalytics.count({ where: { ...where, priority: TicketPriority.HIGH } }),
      this.prisma.ticketAnalytics.count({ where: { ...where, priority: TicketPriority.URGENT } }),
      this.prisma.departmentAnalytics.findMany({ where: { isActive: true } }),
      this.prisma.ticketAnalytics.findMany({
        where: {
          ...where,
          status: { in: [TicketStatus.RESOLVED, TicketStatus.CLOSED] },
          resolvedAt: { not: null },
        },
        select: { createdAt: true, resolvedAt: true },
      }),
      this.prisma.ticketAnalytics.findMany({
        where,
        take: 100,
        select: { createdAt: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.ticketAnalytics.groupBy({
        by: ['departmentId'],
        _count: { _all: true },
      }),
    ]);

    let averageResolutionHours = 0;
    if (allResolvedWithTimes.length > 0) {
      const totalHours = allResolvedWithTimes.reduce((acc, curr) => {
        if (curr.resolvedAt) {
          const diffMs = curr.resolvedAt.getTime() - curr.createdAt.getTime();
          return acc + diffMs / (1000 * 60 * 60);
        }
        return acc;
      }, 0);
      averageResolutionHours =
        Math.round((totalHours / allResolvedWithTimes.length) * 10) / 10;
    }

    const timelineMap = new Map<string, number>();
    allRecentTickets.forEach((t) => {
      const dateKey = t.createdAt.toISOString().split('T')[0];
      timelineMap.set(dateKey, (timelineMap.get(dateKey) || 0) + 1);
    });

    const ticketsOverTime = Array.from(timelineMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const deptCountMap = new Map(
      departmentTicketCounts.map((row) => [row.departmentId, row._count._all]),
    );

    return {
      totalTickets,
      openTickets:
        newTickets + assignedTickets + inProgressTickets + waitingTickets,
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
        count: deptCountMap.get(d.departmentId) || 0,
      })),
      ticketsOverTime,
    };
  }

  async getSpecialistsWorkload(user: AuthenticatedUser, departmentId?: string) {
    const isManager = user.role === UserRole.MANAGER;
    const isAdmin = user.role === UserRole.ADMIN;

    if (!isManager && !isAdmin) {
      throw new ForbiddenException('شما دسترسی به این گزارش را ندارید');
    }

    await this.projectionSync.syncAll().catch(() => undefined);

    const targetDeptId = isManager ? user.departmentId : departmentId;
    const whereUser: any = {
      role: { in: [UserRole.SPECIALIST, UserRole.MANAGER] },
      isActive: true,
    };
    if (targetDeptId) {
      whereUser.departmentId = targetDeptId;
    }

    const [specialists, tickets] = await Promise.all([
      this.prisma.userAnalytics.findMany({ where: whereUser }),
      this.prisma.ticketAnalytics.findMany({
        where: { assignedToId: { not: null } },
        select: { assignedToId: true, status: true },
      }),
    ]);

    const ticketsByAssignee = new Map<string, TicketStatus[]>();
    for (const t of tickets) {
      if (!t.assignedToId) continue;
      const list = ticketsByAssignee.get(t.assignedToId) || [];
      list.push(t.status);
      ticketsByAssignee.set(t.assignedToId, list);
    }

    return specialists.map((s) => {
      const statuses = ticketsByAssignee.get(s.userId) || [];
      const open = statuses.filter(
        (st) =>
          st === TicketStatus.NEW ||
          st === TicketStatus.ASSIGNED ||
          st === TicketStatus.IN_PROGRESS ||
          st === TicketStatus.WAITING_FOR_REQUESTER,
      ).length;
      const resolved = statuses.filter(
        (st) => st === TicketStatus.RESOLVED || st === TicketStatus.CLOSED,
      ).length;

      return {
        id: s.userId,
        fullName: s.fullName,
        departmentName: s.departmentName || 'نامشخص',
        totalAssigned: statuses.length,
        activeTickets: open,
        resolvedTickets: resolved,
      };
    });
  }
}
