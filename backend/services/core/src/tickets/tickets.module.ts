import { Module } from '@nestjs/common';
import {
  TICKET_ATTACHMENTS_PORT,
  TicketAttachmentsPort,
} from './application/ports/ticket-attachments.port';
import {
  TICKET_EVENT_PUBLISHER,
  TicketEventPublisherPort,
} from './application/ports/ticket-event-publisher.port';
import {
  TICKET_REPOSITORY,
  TicketRepositoryPort,
} from './application/ports/ticket-repository.port';
import {
  USER_DIRECTORY_PORT,
  UserDirectoryPort,
} from './application/ports/user-directory.port';
import { AddTicketMessageUseCase } from './application/use-cases/add-ticket-message.use-case';
import { AssignTicketUseCase } from './application/use-cases/assign-ticket.use-case';
import { CreateTicketUseCase } from './application/use-cases/create-ticket.use-case';
import { GetTicketDetailUseCase } from './application/use-cases/get-ticket-detail.use-case';
import { ListTicketsUseCase } from './application/use-cases/list-tickets.use-case';
import { ManageTicketObjectionUseCase } from './application/use-cases/manage-ticket-objection.use-case';
import { SubmitTicketFeedbackUseCase } from './application/use-cases/submit-ticket-feedback.use-case';
import { TicketInternalQueriesUseCase } from './application/use-cases/ticket-internal-queries.use-case';
import { UpdateTicketStatusUseCase } from './application/use-cases/update-ticket-status.use-case';
import { RabbitMqTicketEventPublisher } from './infrastructure/adapters/rabbitmq-ticket-event-publisher.adapter';
import { TicketAttachmentsAdapter } from './infrastructure/adapters/ticket-attachments.adapter';
import { UserDirectoryAdapter } from './infrastructure/adapters/user-directory.adapter';
import { PrismaTicketRepository } from './infrastructure/persistence/prisma-ticket.repository';
import { TicketsController } from './presentation/tickets.controller';

@Module({
  controllers: [TicketsController],
  providers: [
    { provide: TICKET_REPOSITORY, useClass: PrismaTicketRepository },
    { provide: USER_DIRECTORY_PORT, useClass: UserDirectoryAdapter },
    { provide: TICKET_ATTACHMENTS_PORT, useClass: TicketAttachmentsAdapter },
    { provide: TICKET_EVENT_PUBLISHER, useClass: RabbitMqTicketEventPublisher },
    {
      provide: CreateTicketUseCase,
      useFactory: (
        repo: TicketRepositoryPort,
        events: TicketEventPublisherPort,
      ) => new CreateTicketUseCase(repo, events),
      inject: [TICKET_REPOSITORY, TICKET_EVENT_PUBLISHER],
    },
    {
      provide: ListTicketsUseCase,
      useFactory: (
        repo: TicketRepositoryPort,
        users: UserDirectoryPort,
        attachments: TicketAttachmentsPort,
      ) => new ListTicketsUseCase(repo, users, attachments),
      inject: [
        TICKET_REPOSITORY,
        USER_DIRECTORY_PORT,
        TICKET_ATTACHMENTS_PORT,
      ],
    },
    {
      provide: GetTicketDetailUseCase,
      useFactory: (
        repo: TicketRepositoryPort,
        users: UserDirectoryPort,
        attachments: TicketAttachmentsPort,
      ) => new GetTicketDetailUseCase(repo, users, attachments),
      inject: [
        TICKET_REPOSITORY,
        USER_DIRECTORY_PORT,
        TICKET_ATTACHMENTS_PORT,
      ],
    },
    {
      provide: UpdateTicketStatusUseCase,
      useFactory: (
        repo: TicketRepositoryPort,
        events: TicketEventPublisherPort,
      ) => new UpdateTicketStatusUseCase(repo, events),
      inject: [TICKET_REPOSITORY, TICKET_EVENT_PUBLISHER],
    },
    {
      provide: AssignTicketUseCase,
      useFactory: (
        repo: TicketRepositoryPort,
        users: UserDirectoryPort,
        events: TicketEventPublisherPort,
      ) => new AssignTicketUseCase(repo, users, events),
      inject: [TICKET_REPOSITORY, USER_DIRECTORY_PORT, TICKET_EVENT_PUBLISHER],
    },
    {
      provide: AddTicketMessageUseCase,
      useFactory: (
        repo: TicketRepositoryPort,
        events: TicketEventPublisherPort,
      ) => new AddTicketMessageUseCase(repo, events),
      inject: [TICKET_REPOSITORY, TICKET_EVENT_PUBLISHER],
    },
    {
      provide: SubmitTicketFeedbackUseCase,
      useFactory: (
        repo: TicketRepositoryPort,
        events: TicketEventPublisherPort,
      ) => new SubmitTicketFeedbackUseCase(repo, events),
      inject: [TICKET_REPOSITORY, TICKET_EVENT_PUBLISHER],
    },
    {
      provide: ManageTicketObjectionUseCase,
      useFactory: (
        repo: TicketRepositoryPort,
        events: TicketEventPublisherPort,
      ) => new ManageTicketObjectionUseCase(repo, events),
      inject: [TICKET_REPOSITORY, TICKET_EVENT_PUBLISHER],
    },
    {
      provide: TicketInternalQueriesUseCase,
      useFactory: (repo: TicketRepositoryPort) =>
        new TicketInternalQueriesUseCase(repo),
      inject: [TICKET_REPOSITORY],
    },
  ],
  exports: [TicketInternalQueriesUseCase],
})
export class TicketsModule {}
