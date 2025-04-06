import { DomainEvent } from './DomainEvent';
import { DomainEventType } from './DomainEventType';

/**
 * 도메인 이벤트 핸들러 인터페이스
 */
export interface IDomainEventHandler<T extends DomainEvent<DomainEventType>> {
  /**
   * 이벤트 처리
   */
  handle(event: T): Promise<void>;
} 