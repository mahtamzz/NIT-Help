import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import * as amqp from 'amqp-connection-manager';
import type { ChannelWrapper } from 'amqp-connection-manager';
import type { ConfirmChannel, ConsumeMessage } from 'amqplib';
import { randomUUID } from 'crypto';
import { RMQ_EXCHANGE } from '../constants';
import { DomainEvent } from '../contracts';

export type DomainEventHandler<T = any> = (event: DomainEvent<T>) => Promise<void>;

@Injectable()
export class EventBusService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EventBusService.name);
  private connection: amqp.AmqpConnectionManager | null = null;
  private publishChannel: ChannelWrapper | null = null;
  private consumerChannels: ChannelWrapper[] = [];

  async onModuleInit(): Promise<void> {
    if (process.env.DISABLE_EVENT_BUS === 'true') {
      this.logger.log('EventBus disabled via DISABLE_EVENT_BUS=true');
      return;
    }
    this.ensureConnection();
  }

  async onModuleDestroy(): Promise<void> {
    for (const ch of this.consumerChannels) {
      await ch.close().catch(() => undefined);
    }
    await this.publishChannel?.close().catch(() => undefined);
    await this.connection?.close().catch(() => undefined);
  }

  private ensureConnection(): amqp.AmqpConnectionManager {
    if (this.connection) {
      return this.connection;
    }

    const url = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';
    this.connection = amqp.connect([url], {
      reconnectTimeInSeconds: 5,
    });

    this.connection.on('connect', () => {
      this.logger.log(`Connected to RabbitMQ event bus (${RMQ_EXCHANGE})`);
    });

    this.connection.on('disconnect', (params) => {
      this.logger.warn(`Disconnected from RabbitMQ: ${params?.err?.message || 'unknown'}`);
    });

    this.publishChannel = this.connection.createChannel({
      json: true,
      setup: async (channel: ConfirmChannel) => {
        await channel.assertExchange(RMQ_EXCHANGE, 'topic', { durable: true });
      },
    });

    return this.connection;
  }

  async publish<T = Record<string, any>>(eventType: string, payload: T): Promise<void> {
    if (process.env.DISABLE_EVENT_BUS === 'true') {
      return;
    }

    this.ensureConnection();
    const event: DomainEvent<T> = {
      eventId: randomUUID(),
      eventType,
      occurredAt: new Date().toISOString(),
      payload,
    };

    try {
      await this.publishChannel!.publish(RMQ_EXCHANGE, eventType, event, {
        persistent: true,
        contentType: 'application/json',
        messageId: event.eventId,
        timestamp: Date.now(),
      } as any);
    } catch (error: any) {
      this.logger.error(`Failed to publish domain event "${eventType}": ${error?.message || error}`);
    }
  }

  async subscribe(
    queueName: string,
    bindingKeys: string[],
    handler: DomainEventHandler,
  ): Promise<void> {
    if (process.env.DISABLE_EVENT_BUS === 'true') {
      return;
    }

    const connection = this.ensureConnection();
    const consumerChannel = connection.createChannel({
      setup: async (channel: ConfirmChannel) => {
        await channel.assertExchange(RMQ_EXCHANGE, 'topic', { durable: true });
        await channel.assertQueue(queueName, { durable: true });
        for (const key of bindingKeys) {
          await channel.bindQueue(queueName, RMQ_EXCHANGE, key);
        }
        await channel.prefetch(10);
        await channel.consume(queueName, async (msg: ConsumeMessage | null) => {
          if (!msg) return;
          try {
            const event = JSON.parse(msg.content.toString('utf8')) as DomainEvent;
            await handler(event);
            channel.ack(msg);
          } catch (error: any) {
            this.logger.error(
              `Failed processing event from queue "${queueName}": ${error?.message || error}`,
            );
            // Acknowledge or dead-letter bad messages to avoid infinite redelivery loops
            channel.nack(msg, false, false);
          }
        });
      },
    });

    this.consumerChannels.push(consumerChannel);
  }
}
