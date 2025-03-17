import { DomainEvent, EventHandler, IEventSubscription } from './DomainEvent';
import { EventType, IEventPayloads } from './EventTypes';

/**
 * 이벤트 버스 인터페이스
 */
export interface IEventBus {
  /**
   * 이벤트 발행
   * @param type 이벤트 타입
   * @param payload 이벤트 페이로드
   * @param source 이벤트 소스
   */
  publish<T extends EventType>(
    type: T,
    payload: Omit<IEventPayloads[T], 'timestamp' | 'source'>,
    source?: string
  ): Promise<void>;

  /**
   * 이벤트 구독
   * @param type 이벤트 타입
   * @param handler 이벤트 핸들러
   * @returns 구독 정보
   */
  subscribe<T extends EventType>(
    type: T,
    handler: EventHandler<T>
  ): IEventSubscription;

  /**
   * 이벤트 구독 해제
   * @param type 이벤트 타입
   * @param handler 이벤트 핸들러
   */
  unsubscribe<T extends EventType>(type: T, handler: EventHandler<T>): void;

  /**
   * 모든 이벤트 구독 해제
   */
  unsubscribeAll(): void;
} 