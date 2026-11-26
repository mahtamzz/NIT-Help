import { Injectable } from '@nestjs/common';
import { EventBusService } from '@nit-help/microservice-common';
import { MediaEventPublisherPort } from '../../application/ports/media-event-publisher.port';

@Injectable()
export class RabbitMqMediaEventPublisher implements MediaEventPublisherPort {
  constructor(private readonly eventBus: EventBusService) {}

  publish<T = Record<string, any>>(eventType: string, payload: T): Promise<void> {
    return this.eventBus.publish(eventType, payload);
  }
}
