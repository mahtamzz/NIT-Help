import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import {
  createHealthController,
  EventBusModule,
  GatewayAuthGuard,
  RolesGuard,
} from '@nit-help/microservice-common';
import { AttachmentsModule } from './attachments/attachments.module';
import { MediaRpcController } from './media-rpc.controller';
import { PrismaModule } from './prisma/prisma.module';

const HealthController = createHealthController('media');

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    EventBusModule,
    AttachmentsModule,
  ],
  controllers: [HealthController, MediaRpcController],
  providers: [
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
export class AppModule { }
