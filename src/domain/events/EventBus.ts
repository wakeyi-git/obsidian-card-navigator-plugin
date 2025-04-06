import { IDomainEvent, DomainEvent, IEventHandler, IEventDispatcher } from './DomainEvent';
import { DomainEventType, EventDataType } from './DomainEventType';

/**
 * 이벤트 버스 구현체
 */
export class EventBus implements IEventDispatcher {
  private handlers: Map<string, Set<IEventHandler<DomainEvent<DomainEventType>>>> = new Map();
  private initialized: boolean = false;

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
  subscribe<T extends DomainEventType>(eventName: T, callback: (event: DomainEvent<T>) => void): void {
    if (!this.handlers.has(eventName)) {
      this.handlers.set(eventName, new Set());
    }

    const handler: IEventHandler<DomainEvent<DomainEventType>> = {
      handle: async (event: DomainEvent<DomainEventType>) => {
        callback(event as unknown as DomainEvent<T>);
      }
    };

    this.handlers.get(eventName)?.add(handler);
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
} 