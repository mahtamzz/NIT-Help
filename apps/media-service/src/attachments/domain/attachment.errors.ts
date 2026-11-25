export class AttachmentDomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class AttachmentNotFoundError extends AttachmentDomainError {}

export class AttachmentForbiddenError extends AttachmentDomainError {}

export class AttachmentValidationError extends AttachmentDomainError {}

export class TicketContextUnavailableError extends AttachmentDomainError {}
