import { IDomainEventHandler } from './IDomainEventHandler';
import { LoggingService } from '@/infrastructure/services/LoggingService';
import { DomainEvent } from './DomainEvent';

/**
 * 이벤트 디스패처
 * 도메인 이벤트를 처리하는 핸들러를 등록하고 이벤트를 디스패치하는 클래스
 */
export class EventDispatcher {
  private _handlers: Map<string, IDomainEventHandler<any>[]> = new Map();
  private _loggingService: LoggingService;

  constructor(loggingService: LoggingService) {
    this._loggingService = loggingService;
  }

  /**
   * 이벤트 핸들러 등록
   * @param eventType 이벤트 타입
   * @param handler 이벤트 핸들러
   */
  register<T extends DomainEvent>(eventType: new (...args: any[]) => T, handler: IDomainEventHandler<T>): void {
    const eventName = eventType.name;
    if (!this._handlers.has(eventName)) {
      this._handlers.set(eventName, []);
    }
    this._handlers.get(eventName)?.push(handler);
    this._loggingService.debug(`이벤트 핸들러 등록: ${eventName}`);
  }

  /**
   * 이벤트 핸들러 해제
   * @param eventType 이벤트 타입
   * @param handler 이벤트 핸들러
   */
  unregister<T extends DomainEvent>(eventType: new (...args: any[]) => T, handler: IDomainEventHandler<T>): void {
    const eventName = eventType.name;
    const handlers = this._handlers.get(eventName);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index !== -1) {
        handlers.splice(index, 1);
        this._loggingService.debug(`이벤트 핸들러 해제: ${eventName}`);
      }
    }
  }

  /**
   * 이벤트 디스패치
   * @param event 이벤트 객체
   */
  async dispatch<T extends DomainEvent>(event: T): Promise<void> {
    const eventName = event.constructor.name;
    const handlers = this._handlers.get(eventName);
    if (handlers) {
      this._loggingService.debug(`이벤트 디스패치 시작: ${eventName}`);
      const startTime = performance.now();

      try {
        await Promise.all(handlers.map(handler => handler.handle(event)));
        const endTime = performance.now();
        this._loggingService.debug(`이벤트 디스패치 완료: ${eventName}, 소요 시간: ${endTime - startTime}ms`);
      } catch (error) {
        this._loggingService.error(`이벤트 디스패치 실패: ${eventName}`, error);
        throw error;
      }
    }
  }

  /**
   * 모든 이벤트 핸들러 해제
   */
  clear(): void {
    this._handlers.clear();
    this._loggingService.debug('모든 이벤트 핸들러 해제');
  }
} 