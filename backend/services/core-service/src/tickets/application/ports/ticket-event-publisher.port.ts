export const TICKET_EVENT_PUBLISHER = Symbol('TICKET_EVENT_PUBLISHER');

export interface TicketEventPublisherPort {
  publish<T = Record<string, any>>(eventType: string, payload: T): Promise<void>;
}
