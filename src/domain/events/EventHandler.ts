import { DomainEvent, IEventHandler } from './DomainEvent';
import { DomainEventType } from './DomainEventType';

/**
 * 이벤트 핸들러 추상 클래스
 */
export abstract class EventHandler<T extends DomainEventType> implements IEventHandler<DomainEvent<T>> {
  /**
   * 이벤트 처리
   * @param event 이벤트 객체
   */
  abstract handle(event: DomainEvent<T>): Promise<void> | void;
} 