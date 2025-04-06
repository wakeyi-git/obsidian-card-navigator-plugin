import { IEventDispatcher } from '@/domain/infrastructure/IEventDispatcher';
import { DomainEvent, IEventHandler } from './DomainEvent';
import { ILoggingService } from '@/domain/infrastructure/ILoggingService';
import { Container } from '@/infrastructure/di/Container';
import { IErrorHandler } from '../infrastructure/IErrorHandler';
import { IPerformanceMonitor } from '../infrastructure/IPerformanceMonitor';
import { DomainEventType } from './DomainEventType';
import { Subscription } from 'rxjs';

/**
 * 도메인 이벤트 디스패처
 * 도메인 이벤트를 처리하는 핸들러를 등록하고 이벤트를 디스패치하는 클래스
 */
export class DomainEventDispatcher implements IEventDispatcher {
  private static instance: DomainEventDispatcher;
  private handlers: Map<string, Set<IEventHandler<DomainEvent<any>>>> = new Map();
  private initialized: boolean = false;
  private logger: ILoggingService;
  private errorHandler: IErrorHandler;
  private performanceMonitor: IPerformanceMonitor;

  private constructor() {
    this.logger = Container.getInstance().resolve<ILoggingService>('ILoggingService');
    this.errorHandler = Container.getInstance().resolve<IErrorHandler>('IErrorHandler');
    this.performanceMonitor = Container.getInstance().resolve<IPerformanceMonitor>('IPerformanceMonitor');
  }

  /**
   * 싱글톤 인스턴스 반환
   */
  public static getInstance(): DomainEventDispatcher {
    if (!DomainEventDispatcher.instance) {
      DomainEventDispatcher.instance = new DomainEventDispatcher();
    }
    return DomainEventDispatcher.instance;
  }

  /**
   * 초기화
   */
  public initialize(): void {
    if (this.initialized) {
      this.logger.warn('이벤트 디스패처가 이미 초기화되어 있습니다.');
      return;
    }

    this.logger.debug('이벤트 디스패처 초기화 시작');
    this.handlers.clear();
    this.initialized = true;
    this.logger.info('이벤트 디스패처 초기화 완료');
  }

  /**
   * 초기화 여부 확인
   */
  public isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * 정리
   */
  public cleanup(): void {
    this.logger.debug('이벤트 디스패처 정리 시작');
    this.handlers.clear();
    this.initialized = false;
    this.logger.info('이벤트 디스패처 정리 완료');
  }

  /**
   * 이벤트 구독
   */
  public subscribe<T extends DomainEventType>(eventName: T, handler: (event: DomainEvent<T>) => void | Promise<void>): Subscription {
    const timer = this.performanceMonitor.startTimer('subscribe');
    try {
      if (!this.initialized) {
        throw new Error('이벤트 디스패처가 초기화되지 않았습니다.');
      }

      const eventHandler: IEventHandler<DomainEvent<T>> = {
        handle: async (event: DomainEvent<T>) => {
          try {
            await handler(event);
          } catch (error) {
            this.errorHandler.handleError(error, `이벤트 핸들러 실행 중 오류 발생: ${eventName}`);
          }
        }
      };

      if (!this.handlers.has(eventName)) {
        this.handlers.set(eventName, new Set());
      }
      this.handlers.get(eventName)?.add(eventHandler as IEventHandler<DomainEvent<any>>);
      this.logger.debug(`이벤트 구독: ${eventName}`);

      return new Subscription(() => {
        const handlers = this.handlers.get(eventName);
        if (handlers) {
          handlers.delete(eventHandler as IEventHandler<DomainEvent<any>>);
          this.logger.debug(`이벤트 구독 해제: ${eventName}`);
        }
      });
    } catch (error) {
      this.errorHandler.handleError(error, '이벤트 구독 중 오류 발생');
      return new Subscription(() => {});
    } finally {
      timer.stop();
    }
  }

  /**
   * 이벤트 발송
   */
  public dispatch<T extends DomainEventType>(event: DomainEvent<T>): void {
    const timer = this.performanceMonitor.startTimer('dispatch');
    try {
      if (!this.initialized) {
        throw new Error('이벤트 디스패처가 초기화되지 않았습니다.');
      }

      const handlers = this.handlers.get(event.eventName);
      if (handlers) {
        for (const handler of handlers) {
          try {
            handler.handle(event as unknown as DomainEvent<any>);
          } catch (error) {
            this.errorHandler.handleError(error, `이벤트 핸들러 실행 중 오류 발생: ${event.eventName}`);
          }
        }
      }
      this.logger.debug(`이벤트 발송: ${event.eventName}`);
    } catch (error) {
      this.errorHandler.handleError(error, '이벤트 발송 중 오류 발생');
    } finally {
      timer.stop();
    }
  }

  /**
   * 이벤트 핸들러 등록
   */
  public registerHandler<T extends DomainEventType>(eventName: T, handler: IEventHandler<DomainEvent<T>>): Subscription {
    const timer = this.performanceMonitor.startTimer('registerHandler');
    try {
      if (!this.initialized) {
        throw new Error('이벤트 디스패처가 초기화되지 않았습니다.');
      }

      if (!this.handlers.has(eventName)) {
        this.handlers.set(eventName, new Set());
      }
      this.handlers.get(eventName)?.add(handler as IEventHandler<DomainEvent<any>>);
      this.logger.debug(`이벤트 핸들러 등록: ${eventName}`);

      return new Subscription(() => {
        const handlers = this.handlers.get(eventName);
        if (handlers) {
          handlers.delete(handler as IEventHandler<DomainEvent<any>>);
          this.logger.debug(`이벤트 핸들러 해제: ${eventName}`);
        }
      });
    } catch (error) {
      this.errorHandler.handleError(error, '이벤트 핸들러 등록 중 오류 발생');
      return new Subscription(() => {});
    } finally {
      timer.stop();
    }
  }

  /**
   * 이벤트 핸들러 목록 조회
   */
  public getHandlers<T extends DomainEventType>(eventName: T): Set<IEventHandler<DomainEvent<T>>> {
    return (this.handlers.get(eventName) || new Set()) as Set<IEventHandler<DomainEvent<T>>>;
  }

  /**
   * 이벤트 핸들러 수 조회
   */
  public getHandlerCount(eventName: string): number {
    return this.handlers.get(eventName)?.size || 0;
  }

  /**
   * 이벤트 핸들러 존재 여부 확인
   */
  public hasHandlers(eventName: string): boolean {
    const handlers = this.handlers.get(eventName);
    return handlers !== undefined && handlers.size > 0;
  }

  /**
   * 이벤트 핸들러 목록 초기화
   */
  public clearHandlers(eventName: string): void {
    const timer = this.performanceMonitor.startTimer('clearHandlers');
    try {
      if (!this.initialized) {
        throw new Error('이벤트 디스패처가 초기화되지 않았습니다.');
      }

      this.handlers.delete(eventName);
      this.logger.debug(`이벤트 핸들러 목록 초기화: ${eventName}`);
    } catch (error) {
      this.errorHandler.handleError(error, '이벤트 핸들러 목록 초기화 중 오류 발생');
    } finally {
      timer.stop();
    }
  }

  /**
   * 모든 이벤트 핸들러 목록 초기화
   */
  public clearAllHandlers(): void {
    const timer = this.performanceMonitor.startTimer('clearAllHandlers');
    try {
      if (!this.initialized) {
        throw new Error('이벤트 디스패처가 초기화되지 않았습니다.');
      }

      this.handlers.clear();
      this.logger.debug('모든 이벤트 핸들러 목록 초기화');
    } catch (error) {
      this.errorHandler.handleError(error, '모든 이벤트 핸들러 목록 초기화 중 오류 발생');
    } finally {
      timer.stop();
    }
  }

  /**
   * 이벤트를 발행합니다.
   */
  public publish<T extends DomainEventType>(eventName: T, data: any): void {
    const timer = this.performanceMonitor.startTimer('publish');
    try {
      if (!this.initialized) {
        throw new Error('이벤트 디스패처가 초기화되지 않았습니다.');
      }

      const event = new DomainEvent(eventName, data);
      this.dispatch(event);
    } catch (error) {
      this.errorHandler.handleError(error, '이벤트 발행 중 오류 발생');
    } finally {
      timer.stop();
    }
  }

  /**
   * 이벤트 핸들러 해제
   * @param eventName 이벤트 이름
   * @param handler 이벤트 핸들러
   */
  public unregisterHandler<T extends DomainEventType>(eventName: T, handler: IEventHandler<DomainEvent<T>>): void {
    const timer = this.performanceMonitor.startTimer('unregisterHandler');
    try {
      if (!this.initialized) {
        throw new Error('이벤트 디스패처가 초기화되지 않았습니다.');
      }

      const handlers = this.handlers.get(eventName);
      if (handlers) {
        handlers.delete(handler as IEventHandler<DomainEvent<any>>);
        this.logger.debug(`이벤트 핸들러 해제: ${eventName}`);
      }
    } catch (error) {
      this.errorHandler.handleError(error, `이벤트 핸들러 해제 중 오류 발생: ${eventName}`);
    } finally {
      timer.stop();
    }
  }
} 