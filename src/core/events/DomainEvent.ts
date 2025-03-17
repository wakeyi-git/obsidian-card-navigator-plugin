import { EventType, IEventPayloads } from './EventTypes';

/**
 * 도메인 이벤트 클래스
 */
export class DomainEvent<T extends keyof IEventPayloads> {
  /**
   * 이벤트 타입
   */
  readonly type: T;

  /**
   * 이벤트 페이로드
   */
  readonly payload: IEventPayloads[T];

  /**
   * 생성자
   * @param type 이벤트 타입
   * @param payload 이벤트 페이로드
   */
  constructor(type: T, payload: Omit<IEventPayloads[T], 'timestamp'> & { timestamp?: number }) {
    this.type = type;
    this.payload = {
      ...payload,
      timestamp: payload.timestamp || Date.now(),
    } as IEventPayloads[T];
  }

  /**
   * 이벤트 문자열 표현
   */
  toString(): string {
    return `DomainEvent(${this.type}): ${JSON.stringify(this.payload)}`;
  }
}

/**
 * 이벤트 핸들러 타입
 */
export type EventHandler<T extends keyof IEventPayloads> = (event: DomainEvent<T>) => void | Promise<void>;

/**
 * 이벤트 구독 정보
 */
export interface IEventSubscription {
  /**
   * 구독 해제 함수
   */
  unsubscribe: () => void;
}

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
  publish<T extends keyof IEventPayloads>(
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
  subscribe<T extends keyof IEventPayloads>(
    type: T,
    handler: EventHandler<T>
  ): IEventSubscription;

  /**
   * 모든 이벤트 구독 해제
   */
  unsubscribeAll(): void;
} 