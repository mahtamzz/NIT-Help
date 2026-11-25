import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import {
  createHealthController,
  EventBusModule,
  GatewayAuthGuard,
  RolesGuard,
} from '@nit-help/microservice-common';
import { ClientsGlobalModule } from './clients/clients.module';
import { CoreEventsConsumer } from './core-events.consumer';
import { CoreRpcController } from './core-rpc.controller';
import { DepartmentsModule } from './departments/departments.module';
import { PrismaModule } from './prisma/prisma.module';
import { ServicesModule } from './services/services.module';
import { TicketsModule } from './tickets/tickets.module';

const HealthController = createHealthController('core-service');

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    EventBusModule,
    ClientsGlobalModule,
    DepartmentsModule,
    ServicesModule,
    TicketsModule,
  ],
  controllers: [HealthController, CoreRpcController],
  providers: [
    CoreEventsConsumer,
    {
      provide: APP_GUARD,
      useClass: GatewayAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
