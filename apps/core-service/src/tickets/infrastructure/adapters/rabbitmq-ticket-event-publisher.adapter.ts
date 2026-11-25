import { Injectable } from '@nestjs/common';
import { EventBusService } from '@nit-help/microservice-common';
import { TicketEventPublisherPort } from '../../application/ports/ticket-event-publisher.port';

@Injectable()
export class RabbitMqTicketEventPublisher implements TicketEventPublisherPort {
  constructor(private readonly eventBus: EventBusService) {}

  publish<T = Record<string, any>>(eventType: string, payload: T): Promise<void> {
    return this.eventBus.publish(eventType, payload);
  }
}
