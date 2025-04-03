import { DomainEvent, DomainEventType } from './DomainEvent';

/**
 * 툴바 액션 이벤트
 */
export class ToolbarActionEvent extends DomainEvent {
  constructor(public readonly action: string) {
    super('toolbar.action' as DomainEventType);
  }
} 