import { DomainEvent, DomainEventType, IEventDispatcher, IEventHandler } from './DomainEvent';
import { IErrorHandler } from '@/domain/interfaces/infrastructure/IErrorHandler';
import { ILoggingService } from '@/domain/interfaces/infrastructure/ILoggingService';
import { EventError, EventErrorType } from '../errors/EventError';
import { Container } from '@/infrastructure/di/Container';

/**
 * 도메인 이벤트 디스패처 클래스
 * - 싱글톤 패턴으로 구현
 * - 이벤트 발행 및 구독 관리
 */
export class DomainEventDispatcher implements IEventDispatcher {
  private static instance: DomainEventDispatcher;
  private readonly handlers: Map<DomainEventType, Set<IEventHandler<DomainEvent>>>;
  private readonly errorHandler: IErrorHandler;
  private readonly logger: ILoggingService;

  private constructor(
    errorHandler: IErrorHandler,
    logger: ILoggingService
  ) {
    this.handlers = new Map();
    this.errorHandler = errorHandler;
    this.logger = logger;
  }

  /**
   * DomainEventDispatcher 인스턴스 가져오기
   */
  public static getInstance(): DomainEventDispatcher {
    if (!DomainEventDispatcher.instance) {
      const container = Container.getInstance();
      DomainEventDispatcher.instance = new DomainEventDispatcher(
        container.resolve('IErrorHandler'),
        container.resolve('ILoggingService')
      );
    }
    return DomainEventDispatcher.instance;
  }

  /**
   * 이벤트 발행
   */
  public async dispatch<T extends DomainEvent>(event: T): Promise<void> {
    try {
      const handlers = this.handlers.get(event.type) || new Set();
      
      // 이벤트 처리 시작 로깅
      this.logger.debug(`[Event] Dispatching ${event.toString()}`);
      
      // 모든 핸들러 실행
      const promises = Array.from(handlers).map(handler =>
        this.executeHandler(handler, event)
      );
      
      await Promise.all(promises);
      
      // 이벤트 처리 완료 로깅
      this.logger.debug(`[Event] Completed ${event.toString()}`);
    } catch (error) {
      const eventError = new EventError(
        '이벤트 발행 중 오류가 발생했습니다',
        event.type,
        'dispatch' as EventErrorType,
        { event: event.toString() },
        error as Error
      );
      this.errorHandler.handleError(eventError, 'DomainEventDispatcher.dispatch');
      throw eventError;
    }
  }

  /**
   * 이벤트 핸들러 등록
   */
  public subscribe<T extends DomainEvent>(
    eventType: DomainEventType,
    handler: IEventHandler<T>
  ): void {
    try {
      if (!this.handlers.has(eventType)) {
        this.handlers.set(eventType, new Set());
      }
      this.handlers.get(eventType)!.add(handler as IEventHandler<DomainEvent>);
      this.logger.debug(`[Event] Subscribed to ${eventType}`);
    } catch (error) {
      const eventError = new EventError(
        '이벤트 핸들러 등록 중 오류가 발생했습니다',
        eventType,
        'subscribe' as EventErrorType,
        { handler: handler.toString() },
        error as Error
      );
      this.errorHandler.handleError(eventError, 'DomainEventDispatcher.subscribe');
      throw eventError;
    }
  }

  /**
   * 이벤트 핸들러 해제
   */
  public unsubscribe<T extends DomainEvent>(
    eventType: DomainEventType,
    handler: IEventHandler<T>
  ): void {
    try {
      const handlers = this.handlers.get(eventType);
      if (handlers) {
        handlers.delete(handler as IEventHandler<DomainEvent>);
        this.logger.debug(`[Event] Unsubscribed from ${eventType}`);
      }
    } catch (error) {
      const eventError = new EventError(
        '이벤트 핸들러 해제 중 오류가 발생했습니다',
        eventType,
        'unsubscribe' as EventErrorType,
        { handler: handler.toString() },
        error as Error
      );
      this.errorHandler.handleError(eventError, 'DomainEventDispatcher.unsubscribe');
      throw eventError;
    }
  }

  /**
   * 모든 이벤트 핸들러 해제
   */
  public clear(): void {
    try {
      this.handlers.clear();
      this.logger.debug('[Event] All handlers cleared');
    } catch (error) {
      const eventError = new EventError(
        '이벤트 핸들러 초기화 중 오류가 발생했습니다',
        'CLEAR',
        'validation' as EventErrorType,
        {},
        error as Error
      );
      this.errorHandler.handleError(eventError, 'DomainEventDispatcher.clear');
      throw eventError;
    }
  }

  /**
   * 이벤트 핸들러 실행
   */
  private async executeHandler(
    handler: IEventHandler<DomainEvent>,
    event: DomainEvent
  ): Promise<void> {
    try {
      const result = handler.handle(event);
      if (result instanceof Promise) {
        await result;
      }
    } catch (error) {
      const eventError = new EventError(
        '이벤트 핸들러 실행 중 오류가 발생했습니다',
        event.type,
        'handle' as EventErrorType,
        { event: event.toString() },
        error as Error
      );
      this.errorHandler.handleError(eventError, 'DomainEventDispatcher.executeHandler');
      throw eventError;
    }
  }
} 