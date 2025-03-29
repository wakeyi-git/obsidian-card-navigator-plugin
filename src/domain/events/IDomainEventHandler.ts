import { IDomainEvent } from './DomainEvent';

/**
 * 도메인 이벤트 핸들러 인터페이스
 */
export interface IDomainEventHandler<T extends IDomainEvent> {
  /**
   * 이벤트를 처리합니다.
   */
  handle(event: T): Promise<void>;
} 