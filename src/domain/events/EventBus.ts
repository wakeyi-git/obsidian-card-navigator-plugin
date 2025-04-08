import { DomainEvent, IEventHandler, IEventDispatcher } from './DomainEvent';
import { DomainEventType } from './DomainEventType';
import { Subscription } from 'rxjs';

/**
 * 이벤트 버스 구현체
 */
export class EventBus implements IEventDispatcher {
  private static instance: EventBus;
  private handlers: Map<string, Set<IEventHandler<DomainEvent<DomainEventType>>>> = new Map();
  private initialized: boolean = false;

  private constructor() {}

  /**
   * 싱글톤 인스턴스 반환
   */
  public static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  /**
   * 초기화
   */
  initialize(): void {
    this.initialized = true;
  }

  /**
   * 초기화 여부 확인
   * @returns 초기화 여부
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * 정리
   */
  cleanup(): void {
    this.handlers.clear();
    this.initialized = false;
  }

  /**
   * 이벤트 구독
   * @param eventName 이벤트 이름
   * @param callback 콜백 함수
   */
  subscribe<T extends DomainEventType>(eventName: T, callback: (event: DomainEvent<T>) => void | Promise<void>): Subscription {
    if (!this.handlers.has(eventName)) {
      this.handlers.set(eventName, new Set());
    }

    const handler: IEventHandler<DomainEvent<DomainEventType>> = {
      handle: async (event: DomainEvent<DomainEventType>) => {
        callback(event as unknown as DomainEvent<T>);
      }
    };

    this.handlers.get(eventName)?.add(handler);

    return new Subscription(() => {
      this.unsubscribe(eventName, callback);
    });
  }

  /**
   * 이벤트 구독 해제
   * @param eventName 이벤트 이름
   * @param callback 콜백 함수
   */
  unsubscribe<T extends DomainEventType>(eventName: T, callback: (event: DomainEvent<T>) => void): void {
    const handlers = this.handlers.get(eventName);
    if (!handlers) return;

    for (const handler of handlers) {
      if ((handler.handle as unknown as (event: DomainEvent<T>) => void) === callback) {
        handlers.delete(handler);
        break;
      }
    }
  }

  /**
   * 이벤트 발송
   * @param event 이벤트 객체
   */
  dispatch<T extends DomainEventType>(event: DomainEvent<T>): void {
    const handlers = this.handlers.get(event.eventName);
    if (!handlers) return;

    for (const handler of handlers) {
      handler.handle(event as unknown as DomainEvent<DomainEventType>);
    }
  }

  /**
   * 이벤트를 발행합니다.
   * @param eventName 이벤트 이름
   * @param data 이벤트 데이터
   */
  publish<T extends DomainEventType>(eventName: T, data: any): void {
    const event = new DomainEvent(eventName, data);
    this.dispatch(event);
  }

  /**
   * 이벤트 핸들러 등록
   * @param eventName 이벤트 이름
   * @param handler 이벤트 핸들러
   */
  registerHandler<T extends DomainEventType>(eventName: T, handler: IEventHandler<DomainEvent<T>>): Subscription {
    if (!this.handlers.has(eventName)) {
      this.handlers.set(eventName, new Set());
    }

    this.handlers.get(eventName)?.add(handler as IEventHandler<DomainEvent<DomainEventType>>);

    return new Subscription(() => {
      this.unregisterHandler(eventName, handler);
    });
  }

  /**
   * 이벤트 핸들러 해제
   * @param eventName 이벤트 이름
   * @param handler 이벤트 핸들러
   */
  unregisterHandler<T extends DomainEventType>(eventName: T, handler: IEventHandler<DomainEvent<T>>): void {
    const handlers = this.handlers.get(eventName);
    if (!handlers) return;

    handlers.delete(handler as IEventHandler<DomainEvent<DomainEventType>>);
  }

  /**
   * 이벤트 핸들러 목록 조회
   * @param eventName 이벤트 이름
   * @returns 이벤트 핸들러 목록
   */
  getHandlers<T extends DomainEventType>(eventName: T): Set<IEventHandler<DomainEvent<T>>> {
    return (this.handlers.get(eventName) || new Set()) as Set<IEventHandler<DomainEvent<T>>>;
  }

  /**
   * 이벤트 핸들러 수 조회
   * @param eventName 이벤트 이름
   * @returns 이벤트 핸들러 수
   */
  getHandlerCount(eventName: string): number {
    return this.handlers.get(eventName)?.size || 0;
  }

  /**
   * 이벤트 핸들러 존재 여부 확인
   * @param eventName 이벤트 이름
   * @returns 이벤트 핸들러 존재 여부
   */
  hasHandlers(eventName: string): boolean {
    return this.handlers.has(eventName) && (this.handlers.get(eventName)?.size || 0) > 0;
  }

  /**
   * 이벤트 핸들러 목록 초기화
   * @param eventName 이벤트 이름
   */
  clearHandlers(eventName: string): void {
    this.handlers.delete(eventName);
  }

  /**
   * 모든 이벤트 핸들러 목록 초기화
   */
  clearAllHandlers(): void {
    this.handlers.clear();
  }
} 