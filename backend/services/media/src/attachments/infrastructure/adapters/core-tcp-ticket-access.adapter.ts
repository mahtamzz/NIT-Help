import { Inject, Injectable, Optional } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  CORE_PATTERNS,
  TicketAccessContextResponse,
} from '@nit-help/microservice-common';
import { catchError, firstValueFrom, throwError, timeout } from 'rxjs';
import { TicketAccessPort } from '../../application/ports/ticket-access.port';
import { TicketContextUnavailableError } from '../../domain/attachment.errors';

@Injectable()
export class CoreTcpTicketAccessAdapter implements TicketAccessPort {
  constructor(
    @Optional() @Inject('CORE_CLIENT') private readonly coreClient?: ClientProxy,
  ) {}

  async getTicketAccessContext(
    ticketId: string,
    messageId?: string | null,
  ): Promise<TicketAccessContextResponse> {
    if (!this.coreClient) {
      throw new TicketContextUnavailableError(
        'امکان اعتبارسنجی دسترسی تیکت در سرویس هسته وجود ندارد',
      );
    }

    return firstValueFrom(
      this.coreClient
        .send<TicketAccessContextResponse>(CORE_PATTERNS.GET_TICKET_ACCESS_CONTEXT, {
          ticketId,
          messageId: messageId || null,
        })
        .pipe(
          timeout(2000),
          catchError(() =>
            throwError(
              () =>
                new TicketContextUnavailableError(
                  'امکان اعتبارسنجی دسترسی تیکت در سرویس هسته وجود ندارد',
                ),
            ),
          ),
        ),
    );
  }
}
