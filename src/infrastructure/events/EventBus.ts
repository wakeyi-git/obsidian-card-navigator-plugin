import { DomainEvent, IEventDispatcher } from '../../domain/events/DomainEvent';
import { DomainEventType } from '../../domain/events/DomainEventType';
import { Subject, Subscription } from 'rxjs';
import { IEventHandler } from '../../domain/infrastructure/IEventDispatcher';

/**
 * 이벤트 버스 클래스
 * - 이벤트 발송 및 구독 관리
 */
export class EventBus implements IEventDispatcher {
  private initialized = false;
  private subjects: Map<DomainEventType, Subject<DomainEvent<any>>> = new Map();
  private handlers: Map<DomainEventType, Set<IEventHandler<DomainEvent<any>>>> = new Map();

  /**
   * 초기화
   */
  initialize(): void {
    if (this.initialized) {
      return;
    }
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
    this.subjects.forEach(subject => subject.complete());
    this.subjects.clear();
    this.handlers.clear();
    this.initialized = false;
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
   * 이벤트 구독
   * @param eventName 이벤트 이름
   * @param callback 콜백 함수
   * @returns 구독 객체
   */
  subscribe<T extends DomainEventType>(eventName: T, callback: (event: DomainEvent<T>) => void | Promise<void>): Subscription {
    if (!this.subjects.has(eventName)) {
      this.subjects.set(eventName, new Subject<DomainEvent<T>>());
    }
    return this.subjects.get(eventName)?.subscribe(callback) as Subscription;
  }

  /**
   * 이벤트 구독 해제
   * @param eventName 이벤트 이름
   * @param callback 콜백 함수
   */
  unsubscribe<T extends DomainEventType>(eventName: T, callback: (event: DomainEvent<T>) => void): void {
    const subject = this.subjects.get(eventName);
    if (subject) {
      subject.unsubscribe();
      this.subjects.delete(eventName);
    }
  }

  /**
   * 이벤트 발송
   * @param event 이벤트 객체
   */
  dispatch<T extends DomainEventType>(event: DomainEvent<T>): void {
    const subject = this.subjects.get(event.eventName);
    if (subject) {
      subject.next(event);
    }

    const handlers = this.handlers.get(event.eventName);
    if (handlers) {
      handlers.forEach(handler => handler.handle(event));
    }
  }

  /**
   * 이벤트 핸들러 등록
   * @param eventName 이벤트 이름
   * @param handler 이벤트 핸들러
   * @returns 구독 객체
   */
  registerHandler<T extends DomainEventType>(eventName: T, handler: IEventHandler<DomainEvent<T>>): Subscription {
    if (!this.handlers.has(eventName)) {
      this.handlers.set(eventName, new Set());
    }
    this.handlers.get(eventName)?.add(handler);

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
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.handlers.delete(eventName);
      }
    }
  }

  /**
   * 이벤트 핸들러 목록 조회
   * @param eventName 이벤트 이름
   * @returns 이벤트 핸들러 목록
   */
  getHandlers<T extends DomainEventType>(eventName: T): Set<IEventHandler<DomainEvent<T>>> {
    return this.handlers.get(eventName) as Set<IEventHandler<DomainEvent<T>>> || new Set();
  }

  /**
   * 이벤트 핸들러 수 조회
   * @param eventName 이벤트 이름
   * @returns 이벤트 핸들러 수
   */
  getHandlerCount(eventName: string): number {
    return this.handlers.get(eventName as DomainEventType)?.size || 0;
  }

  /**
   * 이벤트 핸들러 존재 여부 확인
   * @param eventName 이벤트 이름
   * @returns 이벤트 핸들러 존재 여부
   */
  hasHandlers(eventName: string): boolean {
    return this.getHandlerCount(eventName) > 0;
  }

  /**
   * 이벤트 핸들러 목록 초기화
   * @param eventName 이벤트 이름
   */
  clearHandlers(eventName: string): void {
    this.handlers.delete(eventName as DomainEventType);
  }

  /**
   * 모든 이벤트 핸들러 목록 초기화
   */
  clearAllHandlers(): void {
    this.handlers.clear();
  }
} 