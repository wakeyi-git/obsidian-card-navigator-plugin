import { DomainEvent } from '@/domain/events/DomainEvent';

export interface IEventDispatcher {
  dispatch(event: DomainEvent): void;
} 