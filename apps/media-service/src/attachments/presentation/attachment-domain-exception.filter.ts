import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import {
  AttachmentDomainError,
  AttachmentForbiddenError,
  AttachmentNotFoundError,
  AttachmentValidationError,
  TicketContextUnavailableError,
} from '../domain/attachment.errors';

@Catch(AttachmentDomainError)
export class AttachmentDomainExceptionFilter implements ExceptionFilter {
  catch(exception: AttachmentDomainError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let statusCode = HttpStatus.BAD_REQUEST;
    let error = 'Bad Request';

    if (exception instanceof AttachmentNotFoundError) {
      statusCode = HttpStatus.NOT_FOUND;
      error = 'Not Found';
    } else if (exception instanceof AttachmentForbiddenError) {
      statusCode = HttpStatus.FORBIDDEN;
      error = 'Forbidden';
    } else if (exception instanceof AttachmentValidationError) {
      statusCode = HttpStatus.BAD_REQUEST;
      error = 'Bad Request';
    } else if (exception instanceof TicketContextUnavailableError) {
      statusCode = HttpStatus.SERVICE_UNAVAILABLE;
      error = 'Service Unavailable';
    }

    response.status(statusCode).json({
      statusCode,
      message: exception.message,
      error,
    });
  }
}
