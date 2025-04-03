import { IDomainEventHandler } from './IDomainEventHandler';
import { ILoggingService } from '@/domain/interfaces/infrastructure/ILoggingService';
import { IEventDispatcher } from '@/domain/interfaces/infrastructure/IEventDispatcher';
import { DomainEvent, IEventHandler } from './DomainEvent';
import { Container } from '@/infrastructure/di/Container';
import { EventError, EventErrorType } from '@/domain/errors/EventError';

/**
 * 이벤트 디스패처
 * 도메인 이벤트를 처리하는 핸들러를 등록하고 이벤트를 디스패치하는 클래스
 */
export class EventDispatcher implements IEventDispatcher {
  private static instance: EventDispatcher;
  private readonly _handlers: Map<string, IDomainEventHandler<any>[]>;
  private readonly _logger: ILoggingService;

  private constructor() {
    const container = Container.getInstance();
    this._logger = container.resolve('ILoggingService');
    this._handlers = new Map();
  }

  /**
   * 싱글톤 인스턴스 반환
   */
  public static getInstance(): EventDispatcher {
    if (!EventDispatcher.instance) {
      EventDispatcher.instance = new EventDispatcher();
    }
    return EventDispatcher.instance;
  }

  /**
   * 이벤트 핸들러 등록
   * @param eventType 이벤트 타입
   * @param handler 이벤트 핸들러
   */
  public register<T extends DomainEvent>(
    eventType: new (...args: any[]) => T,
    handler: IDomainEventHandler<T>
  ): void {
    try {
      const eventName = eventType.name;
      if (!this._handlers.has(eventName)) {
        this._handlers.set(eventName, []);
      }
      this._handlers.get(eventName)?.push(handler);
      this._logger.debug(`이벤트 핸들러 등록: ${eventName}`);
    } catch (error) {
      throw new EventError(
        '이벤트 핸들러 등록 실패',
        eventType.name,
        'subscribe',
        { handler: handler.constructor.name },
        error as Error
      );
    }
  }

  /**
   * 이벤트 핸들러 해제
   * @param eventType 이벤트 타입
   * @param handler 이벤트 핸들러
   */
  public unregister<T extends DomainEvent>(
    eventType: new (...args: any[]) => T,
    handler: IDomainEventHandler<T>
  ): void {
    try {
      const eventName = eventType.name;
      const handlers = this._handlers.get(eventName);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index !== -1) {
          handlers.splice(index, 1);
          this._logger.debug(`이벤트 핸들러 해제: ${eventName}`);
        }
      }
    } catch (error) {
      throw new EventError(
        '이벤트 핸들러 해제 실패',
        eventType.name,
        'unsubscribe',
        { handler: handler.constructor.name },
        error as Error
      );
    }
  }

  /**
   * 이벤트 핸들러 등록
   * @param eventType 이벤트 타입
   * @param handler 이벤트 핸들러
   */
  public subscribe<T extends DomainEvent>(
    eventType: new (...args: any[]) => T,
    handler: IEventHandler<T>
  ): void {
    try {
      const eventName = eventType.name;
      if (!this._handlers.has(eventName)) {
        this._handlers.set(eventName, []);
      }
      this._handlers.get(eventName)?.push(handler as IDomainEventHandler<T>);
      this._logger.debug(`이벤트 핸들러 등록: ${eventName}`);
    } catch (error) {
      throw new EventError(
        '이벤트 핸들러 등록 실패',
        eventType.name,
        'subscribe',
        { handler: handler.constructor.name },
        error as Error
      );
    }
  }

  /**
   * 이벤트 핸들러 해제
   * @param eventType 이벤트 타입
   * @param handler 이벤트 핸들러
   */
  public unsubscribe<T extends DomainEvent>(
    eventType: new (...args: any[]) => T,
    handler: IEventHandler<T>
  ): void {
    try {
      const eventName = eventType.name;
      const handlers = this._handlers.get(eventName);
      if (handlers) {
        const index = handlers.indexOf(handler as IDomainEventHandler<T>);
        if (index !== -1) {
          handlers.splice(index, 1);
          this._logger.debug(`이벤트 핸들러 해제: ${eventName}`);
        }
      }
    } catch (error) {
      throw new EventError(
        '이벤트 핸들러 해제 실패',
        eventType.name,
        'unsubscribe',
        { handler: handler.constructor.name },
        error as Error
      );
    }
  }

  /**
   * 이벤트 발송
   * @param event 이벤트
   */
  public async dispatch<T extends DomainEvent>(event: T): Promise<void> {
    try {
      const eventName = event.constructor.name;
      const handlers = this._handlers.get(eventName) || [];
      
      this._logger.debug(`이벤트 발송 시작: ${eventName}`);
      
      const promises = handlers.map(handler =>
        this.executeHandler(handler, event)
      );
      
      await Promise.all(promises);
      
      this._logger.debug(`이벤트 발송 완료: ${eventName}`);
    } catch (error) {
      throw new EventError(
        '이벤트 발송 실패',
        event.constructor.name,
        'dispatch',
        { event: event.toString() },
        error as Error
      );
    }
  }

  /**
   * 모든 이벤트 핸들러 해제
   */
  public clear(): void {
    try {
      this._handlers.clear();
      this._logger.debug('모든 이벤트 핸들러 해제');
    } catch (error) {
      throw new EventError(
        '이벤트 핸들러 초기화 실패',
        'CLEAR',
        'validation',
        {},
        error as Error
      );
    }
  }

  /**
   * 이벤트 핸들러 실행
   */
  private async executeHandler(
    handler: IDomainEventHandler<DomainEvent>,
    event: DomainEvent
  ): Promise<void> {
    try {
      await handler.handle(event);
    } catch (error) {
      throw new EventError(
        '이벤트 핸들러 실행 실패',
        event.constructor.name,
        'handle',
        { event: event.toString() },
        error as Error
      );
    }
  }
} 