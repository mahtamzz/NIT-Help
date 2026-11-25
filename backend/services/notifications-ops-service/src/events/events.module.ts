import { Global, Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AuditModule } from '../audit/audit.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { OpsEventsConsumer } from './ops-events.consumer';
import { ProjectionSyncService } from './projection-sync.service';

@Global()
@Module({
  imports: [
    NotificationsModule,
    AuditModule,
    ClientsModule.register([
      {
        name: 'CORE_CLIENT',
        transport: Transport.TCP,
        options: {
          host: process.env.CORE_TCP_HOST || '127.0.0.1',
          port: Number(process.env.CORE_TCP_PORT || 4102),
        },
      },
      {
        name: 'IAM_CLIENT',
        transport: Transport.TCP,
        options: {
          host: process.env.IAM_TCP_HOST || '127.0.0.1',
          port: Number(process.env.IAM_TCP_PORT || 4101),
        },
      },
    ]),
  ],
  providers: [OpsEventsConsumer, ProjectionSyncService],
  exports: [ProjectionSyncService],
})
export class EventsModule {}
