export const MEDIA_EVENT_PUBLISHER = Symbol('MEDIA_EVENT_PUBLISHER');

export interface MediaEventPublisherPort {
  publish<T = Record<string, any>>(eventType: string, payload: T): Promise<void>;
}
