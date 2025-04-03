import { DomainEvent } from '@/domain/events/DomainEvent';
import { IDomainEventHandler } from '@/domain/events/IDomainEventHandler';
import { IEventHandler } from '@/domain/events/DomainEvent';

/**
 * 이벤트 디스패처 인터페이스
 * - 도메인 이벤트의 발행과 구독을 관리
 */
export interface IEventDispatcher {
  /**
   * 이벤트 핸들러 등록
   * @param eventType 이벤트 타입
   * @param handler 이벤트 핸들러
   */
  register<T extends DomainEvent>(
    eventType: new (...args: any[]) => T,
    handler: IDomainEventHandler<T>
  ): void;

  /**
   * 이벤트 핸들러 해제
   * @param eventType 이벤트 타입
   * @param handler 이벤트 핸들러
   */
  unregister<T extends DomainEvent>(
    eventType: new (...args: any[]) => T,
    handler: IDomainEventHandler<T>
  ): void;

  /**
   * 이벤트 발송
   * @param event 이벤트
   */
  dispatch<T extends DomainEvent>(event: T): Promise<void>;

  /**
   * 모든 이벤트 핸들러 해제
   */
  clear(): void;

  /**
   * 이벤트 핸들러 등록
   * @param eventType 이벤트 타입
   * @param handler 이벤트 핸들러
   */
  subscribe<T extends DomainEvent>(eventType: new (...args: any[]) => T, handler: IEventHandler<T>): void;

  /**
   * 이벤트 핸들러 해제
   * @param eventType 이벤트 타입
   * @param handler 이벤트 핸들러
   */
  unsubscribe<T extends DomainEvent>(eventType: new (...args: any[]) => T, handler: IEventHandler<T>): void;
} 