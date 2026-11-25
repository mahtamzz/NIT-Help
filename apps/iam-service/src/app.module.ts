import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import {
  createHealthController,
  EventBusModule,
  GatewayAuthGuard,
  RolesGuard,
} from '@nit-help/microservice-common';
import { AuthModule } from './auth/auth.module';
import { IamEventsConsumer } from './iam-events.consumer';
import { IamRpcController } from './iam-rpc.controller';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';

const HealthController = createHealthController('iam-service');

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    EventBusModule,
    AuthModule,
    UsersModule,
  ],
  controllers: [HealthController, IamRpcController],
  providers: [
    IamEventsConsumer,
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
