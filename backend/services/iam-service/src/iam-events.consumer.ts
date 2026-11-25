import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import {
  DepartmentSyncPayload,
  DomainEvent,
  EVENT_PATTERNS,
  EventBusService,
  RMQ_QUEUES,
} from '@nit-help/microservice-common';
import { PrismaService } from './prisma/prisma.service';

@Injectable()
export class IamEventsConsumer implements OnModuleInit {
  private readonly logger = new Logger(IamEventsConsumer.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: EventBusService,
  ) {}

  async onModuleInit() {
    await this.eventBus.subscribe(
      RMQ_QUEUES.IAM,
      ['department.*'],
      async (event: DomainEvent<DepartmentSyncPayload>) => {
        if (
          event.eventType === EVENT_PATTERNS.DEPARTMENT_CREATED ||
          event.eventType === EVENT_PATTERNS.DEPARTMENT_UPDATED
        ) {
          const dept = event.payload;
          if (!dept?.id) return;
          await this.prisma.departmentReplica.upsert({
            where: { id: dept.id },
            update: {
              name: dept.name,
              code: dept.code,
              isActive: dept.isActive ?? true,
            },
            create: {
              id: dept.id,
              name: dept.name,
              code: dept.code,
              isActive: dept.isActive ?? true,
            },
          });
          this.logger.debug(`Synced department replica ${dept.id} (${dept.name})`);
        }
      },
    );
  }
}
