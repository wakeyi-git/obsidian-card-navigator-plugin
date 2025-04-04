import { DomainEvent } from './DomainEvent';
import { DomainEventType } from './DomainEventType';

/**
 * 툴바 액션 이벤트
 */
export class ToolbarActionEvent extends DomainEvent<{ action: string }> {
  constructor(data: { action: string }) {
    super(DomainEventType.TOOLBAR_ACTION, data);
  }
} 