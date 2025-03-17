import { DomainEvent, EventHandler, IEventBus, IEventSubscription } from './DomainEvent';
import { EventType, IEventPayloads } from './EventTypes';

/**
 * 도메인 이벤트 버스 구현체
 */
export class DomainEventBus implements IEventBus {
  private static instance: DomainEventBus;
  private handlers: Map<EventType, Set<EventHandler<EventType>>> = new Map();

  /**
   * 싱글톤 인스턴스 가져오기
   */
  static getInstance(): DomainEventBus {
    if (!DomainEventBus.instance) {
      DomainEventBus.instance = new DomainEventBus();
    }
    return DomainEventBus.instance;
  }

  /**
   * 생성자
   * private으로 선언하여 외부에서 직접 인스턴스화를 방지
   */
  private constructor() {}

  /**
   * 이벤트 발행
   * @param type 이벤트 타입
   * @param payload 이벤트 페이로드
   * @param source 이벤트 소스
   */
  async publish<T extends EventType>(
    type: T,
    payload: Omit<IEventPayloads[T], 'timestamp' | 'source'>,
    source: string = 'system'
  ): Promise<void> {
    const fullPayload = {
      ...payload,
      timestamp: Date.now(),
      source
    } as IEventPayloads[T];

    const event = new DomainEvent(type, fullPayload);
    const handlers = this.handlers.get(type);

    if (handlers) {
      const promises = Array.from(handlers).map(handler => handler(event));
      await Promise.all(promises);
    }
  }

  /**
   * 이벤트 구독
   * @param type 이벤트 타입
   * @param handler 이벤트 핸들러
   * @returns 구독 정보
   */
  subscribe<T extends EventType>(
    type: T,
    handler: EventHandler<T>
  ): IEventSubscription {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }

    const handlers = this.handlers.get(type)!;
    handlers.add(handler as EventHandler<EventType>);

    return {
      unsubscribe: () => {
        handlers.delete(handler as EventHandler<EventType>);
        if (handlers.size === 0) {
          this.handlers.delete(type);
        }
      }
    };
  }

  /**
   * 이벤트 구독 해제
   * @param type 이벤트 타입
   * @param handler 이벤트 핸들러
   */
  unsubscribe<T extends EventType>(type: T, handler: EventHandler<T>): void {
    const handlers = this.handlers.get(type);
    if (handlers) {
      handlers.delete(handler as EventHandler<EventType>);
      if (handlers.size === 0) {
        this.handlers.delete(type);
      }
    }
  }

  /**
   * 모든 이벤트 구독 해제
   */
  unsubscribeAll(): void {
    this.handlers.clear();
  }
} 