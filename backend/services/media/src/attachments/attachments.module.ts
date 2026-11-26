import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import {
  ATTACHMENT_REPOSITORY,
  AttachmentRepositoryPort,
} from './application/ports/attachment-repository.port';
import {
  MEDIA_EVENT_PUBLISHER,
  MediaEventPublisherPort,
} from './application/ports/media-event-publisher.port';
import { STORAGE_PORT, StoragePort } from './application/ports/storage.port';
import {
  TICKET_ACCESS_PORT,
  TicketAccessPort,
} from './application/ports/ticket-access.port';
import { DownloadAttachmentUseCase } from './application/use-cases/download-attachment.use-case';
import { QueryTicketAttachmentsUseCase } from './application/use-cases/query-ticket-attachments.use-case';
import { UploadAttachmentUseCase } from './application/use-cases/upload-attachment.use-case';
import { CoreTcpTicketAccessAdapter } from './infrastructure/adapters/core-tcp-ticket-access.adapter';
import { RabbitMqMediaEventPublisher } from './infrastructure/adapters/rabbitmq-media-event-publisher.adapter';
import { PrismaAttachmentRepository } from './infrastructure/persistence/prisma-attachment.repository';
import { LocalDiskStorageAdapter } from './infrastructure/storage/local-disk-storage.adapter';
import { AttachmentsController } from './presentation/attachments.controller';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'CORE_CLIENT',
        transport: Transport.TCP,
        options: {
          host: process.env.CORE_TCP_HOST || '127.0.0.1',
          port: Number(process.env.CORE_TCP_PORT || 4102),
        },
      },
    ]),
  ],
  controllers: [AttachmentsController],
  providers: [
    { provide: STORAGE_PORT, useClass: LocalDiskStorageAdapter },
    { provide: ATTACHMENT_REPOSITORY, useClass: PrismaAttachmentRepository },
    { provide: TICKET_ACCESS_PORT, useClass: CoreTcpTicketAccessAdapter },
    { provide: MEDIA_EVENT_PUBLISHER, useClass: RabbitMqMediaEventPublisher },
    {
      provide: UploadAttachmentUseCase,
      useFactory: (
        repo: AttachmentRepositoryPort,
        storage: StoragePort,
        ticketAccess: TicketAccessPort,
        events: MediaEventPublisherPort,
      ) => new UploadAttachmentUseCase(repo, storage, ticketAccess, events),
      inject: [
        ATTACHMENT_REPOSITORY,
        STORAGE_PORT,
        TICKET_ACCESS_PORT,
        MEDIA_EVENT_PUBLISHER,
      ],
    },
    {
      provide: DownloadAttachmentUseCase,
      useFactory: (
        repo: AttachmentRepositoryPort,
        storage: StoragePort,
        ticketAccess: TicketAccessPort,
      ) => new DownloadAttachmentUseCase(repo, storage, ticketAccess),
      inject: [ATTACHMENT_REPOSITORY, STORAGE_PORT, TICKET_ACCESS_PORT],
    },
    {
      provide: QueryTicketAttachmentsUseCase,
      useFactory: (repo: AttachmentRepositoryPort) =>
        new QueryTicketAttachmentsUseCase(repo),
      inject: [ATTACHMENT_REPOSITORY],
    },
  ],
  exports: [QueryTicketAttachmentsUseCase],
})
export class AttachmentsModule {}
