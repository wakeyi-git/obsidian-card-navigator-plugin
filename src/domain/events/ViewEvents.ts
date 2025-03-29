import { DomainEvent } from './DomainEvent';

export class ViewInitializedEvent extends DomainEvent {
  constructor() {
    super('view.initialized');
  }
} 