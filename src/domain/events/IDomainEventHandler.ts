import { DomainEvent } from './DomainEvent';

/**
 * 도메인 이벤트 핸들러 인터페이스
 */
export interface IDomainEventHandler<T extends DomainEvent> {
  /**
   * 이벤트 처리
   */
  handle(event: T): Promise<void>;
} 