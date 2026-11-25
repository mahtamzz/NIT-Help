export class TicketDomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class TicketNotFoundError extends TicketDomainError {}

export class TicketForbiddenError extends TicketDomainError {}

export class TicketValidationError extends TicketDomainError {}
