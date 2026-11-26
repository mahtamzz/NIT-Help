import { Inject, Injectable, Logger, OnModuleInit, Optional } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { CORE_PATTERNS, IAM_PATTERNS } from '@nit-help/microservice-common';
import { TicketPriority, TicketStatus, UserRole } from '.prisma/ops-client';
import { catchError, firstValueFrom, of, timeout } from 'rxjs';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProjectionSyncService implements OnModuleInit {
  private readonly logger = new Logger(ProjectionSyncService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Optional() @Inject('CORE_CLIENT') private readonly coreClient?: ClientProxy,
    @Optional() @Inject('IAM_CLIENT') private readonly iamClient?: ClientProxy,
  ) {}

  async onModuleInit() {
    if (process.env.DISABLE_PROJECTION_SYNC === 'true') {
      return;
    }
    // Non-blocking startup sync so seeded data populates CQRS projections
    setTimeout(() => {
      this.syncAll().catch((err) =>
        this.logger.warn(`Startup projection sync skipped: ${err?.message || err}`),
      );
    }, 1500);
  }

  async syncAll(): Promise<void> {
    await Promise.all([this.syncCoreSeed(), this.syncUsersSeed()]);
  }

  private async syncCoreSeed(): Promise<void> {
    if (!this.coreClient) return;

    const seed = await firstValueFrom(
      this.coreClient.send<{ departments: any[]; tickets: any[] }>(
        CORE_PATTERNS.EXPORT_ANALYTICS_SEED,
        {},
      ).pipe(
        timeout(1500),
        catchError(() => of(null)),
      ),
    );

    if (!seed) return;

    for (const d of seed.departments || []) {
      await this.prisma.departmentAnalytics.upsert({
        where: { departmentId: d.departmentId },
        update: {
          name: d.name,
          code: d.code,
          isActive: d.isActive,
        },
        create: {
          departmentId: d.departmentId,
          name: d.name,
          code: d.code,
          isActive: d.isActive,
        },
      });
    }

    for (const t of seed.tickets || []) {
      await this.prisma.ticketAnalytics.upsert({
        where: { ticketId: t.ticketId },
        update: {
          ticketNumber: t.ticketNumber,
          departmentId: t.departmentId,
          departmentName: t.departmentName,
          serviceId: t.serviceId,
          assignedToId: t.assignedToId,
          status: t.status as TicketStatus,
          priority: t.priority as TicketPriority,
          resolvedAt: t.resolvedAt ? new Date(t.resolvedAt) : null,
          closedAt: t.closedAt ? new Date(t.closedAt) : null,
          updatedAt: new Date(t.updatedAt),
        },
        create: {
          ticketId: t.ticketId,
          ticketNumber: t.ticketNumber,
          departmentId: t.departmentId,
          departmentName: t.departmentName,
          serviceId: t.serviceId,
          assignedToId: t.assignedToId,
          status: t.status as TicketStatus,
          priority: t.priority as TicketPriority,
          createdAt: new Date(t.createdAt),
          resolvedAt: t.resolvedAt ? new Date(t.resolvedAt) : null,
          closedAt: t.closedAt ? new Date(t.closedAt) : null,
          updatedAt: new Date(t.updatedAt),
        },
      });
    }
  }

  private async syncUsersSeed(): Promise<void> {
    if (!this.iamClient) return;

    const users = await firstValueFrom(
      this.iamClient.send<any[]>(IAM_PATTERNS.EXPORT_USERS, {}).pipe(
        timeout(1500),
        catchError(() => of(null)),
      ),
    );

    if (!users) return;

    for (const u of users) {
      await this.prisma.userAnalytics.upsert({
        where: { userId: u.id },
        update: {
          fullName: u.fullName,
          email: u.email,
          role: u.role as UserRole,
          departmentId: u.departmentId ?? null,
          departmentName: u.departmentName ?? null,
          isActive: u.isActive ?? true,
        },
        create: {
          userId: u.id,
          fullName: u.fullName,
          email: u.email,
          role: u.role as UserRole,
          departmentId: u.departmentId ?? null,
          departmentName: u.departmentName ?? null,
          isActive: u.isActive ?? true,
        },
      });
    }
  }
}
