import { DomainEvent } from '../events/DomainEvent';
import { DomainEventType } from '../events/DomainEventType';
import { Subscription } from 'rxjs';

/**
 * 이벤트 핸들러 인터페이스
 */
export interface IEventHandler<T extends DomainEvent<any>> {
  /**
   * 이벤트 처리
   * @param event 이벤트
   */
  handle(event: T): Promise<void> | void;
}

/**
 * 이벤트 디스패처 인터페이스
 * - 이벤트 발송 및 구독 관리
 * - 이벤트 핸들러 등록 및 해제
 */
export interface IEventDispatcher {
  /**
   * 초기화
   */
  initialize(): void;

  /**
   * 초기화 여부 확인
   * @returns 초기화 여부
   */
  isInitialized(): boolean;

  /**
   * 정리
   */
  cleanup(): void;

  /**
   * 이벤트를 발행합니다.
   * @param eventName 이벤트 이름
   * @param data 이벤트 데이터
   */
  publish<T extends DomainEventType>(eventName: T, data: any): void;

  /**
   * 이벤트를 구독합니다.
   * @param eventName 이벤트 이름
   * @param handler 이벤트 핸들러
   * @returns 구독 객체
   */
  subscribe<T extends DomainEventType>(eventName: T, handler: (event: DomainEvent<T>) => void | Promise<void>): Subscription;

  /**
   * 이벤트 발송
   * @param event 이벤트 객체
   */
  dispatch<T extends DomainEventType>(event: DomainEvent<T>): void;

  /**
   * 이벤트 핸들러 등록
   * @param eventName 이벤트 이름
   * @param handler 이벤트 핸들러
   * @returns 구독 객체
   */
  registerHandler<T extends DomainEventType>(eventName: T, handler: IEventHandler<DomainEvent<T>>): Subscription;

  /**
   * 이벤트 핸들러 해제
   * @param eventName 이벤트 이름
   * @param handler 이벤트 핸들러
   */
  unregisterHandler<T extends DomainEventType>(eventName: T, handler: IEventHandler<DomainEvent<T>>): void;

  /**
   * 이벤트 핸들러 목록 조회
   * @param eventName 이벤트 이름
   * @returns 이벤트 핸들러 목록
   */
  getHandlers<T extends DomainEventType>(eventName: T): Set<IEventHandler<DomainEvent<T>>>;

  /**
   * 이벤트 핸들러 수 조회
   * @param eventName 이벤트 이름
   * @returns 이벤트 핸들러 수
   */
  getHandlerCount(eventName: string): number;

  /**
   * 이벤트 핸들러 존재 여부 확인
   * @param eventName 이벤트 이름
   * @returns 이벤트 핸들러 존재 여부
   */
  hasHandlers(eventName: string): boolean;

  /**
   * 이벤트 핸들러 목록 초기화
   * @param eventName 이벤트 이름
   */
  clearHandlers(eventName: string): void;

  /**
   * 모든 이벤트 핸들러 목록 초기화
   */
  clearAllHandlers(): void;
} 