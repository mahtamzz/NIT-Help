import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import {
  DomainEvent,
  EVENT_PATTERNS,
  EventBusService,
  RMQ_QUEUES,
  UserSyncPayload,
} from '@nit-help/microservice-common';
import { UserRole } from '.prisma/core-client';
import { PrismaService } from './prisma/prisma.service';

@Injectable()
export class CoreEventsConsumer implements OnModuleInit {
  private readonly logger = new Logger(CoreEventsConsumer.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: EventBusService,
  ) {}

  async onModuleInit() {
    await this.eventBus.subscribe(
      RMQ_QUEUES.CORE,
      ['user.*'],
      async (event: DomainEvent<UserSyncPayload>) => {
        if (
          event.eventType === EVENT_PATTERNS.USER_CREATED ||
          event.eventType === EVENT_PATTERNS.USER_UPDATED ||
          event.eventType === EVENT_PATTERNS.USER_STATUS_CHANGED
        ) {
          const u = event.payload;
          if (!u?.id) return;
          await this.prisma.userReplica.upsert({
            where: { id: u.id },
            update: {
              fullName: u.fullName,
              email: u.email,
              username: u.username,
              role: u.role as UserRole,
              departmentId: u.departmentId ?? null,
              isActive: u.isActive ?? true,
            },
            create: {
              id: u.id,
              fullName: u.fullName,
              email: u.email,
              username: u.username,
              role: u.role as UserRole,
              departmentId: u.departmentId ?? null,
              isActive: u.isActive ?? true,
            },
          });
          this.logger.debug(`Synced user replica ${u.id} (${u.username})`);
        }
      },
    );
  }
}
