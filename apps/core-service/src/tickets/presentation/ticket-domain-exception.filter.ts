import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import {
  TicketDomainError,
  TicketForbiddenError,
  TicketNotFoundError,
  TicketValidationError,
} from '../domain/ticket.errors';

@Catch(TicketDomainError)
export class TicketDomainExceptionFilter implements ExceptionFilter {
  catch(exception: TicketDomainError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let statusCode = HttpStatus.BAD_REQUEST;
    let error = 'Bad Request';

    if (exception instanceof TicketNotFoundError) {
      statusCode = HttpStatus.NOT_FOUND;
      error = 'Not Found';
    } else if (exception instanceof TicketForbiddenError) {
      statusCode = HttpStatus.FORBIDDEN;
      error = 'Forbidden';
    } else if (exception instanceof TicketValidationError) {
      statusCode = HttpStatus.BAD_REQUEST;
      error = 'Bad Request';
    }

    response.status(statusCode).json({
      statusCode,
      message: exception.message,
      error,
    });
  }
}
