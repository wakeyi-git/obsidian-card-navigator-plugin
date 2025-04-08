import { DomainEvent, IEventHandler, IEventDispatcher } from '@/domain/events/DomainEvent';
import { DomainEventType } from '@/domain/events/DomainEventType';
import { IAnalyticsService } from '@/domain/infrastructure/IAnalyticsService';
import { IErrorHandler } from '@/domain/infrastructure/IErrorHandler';
import { ILoggingService } from '@/domain/infrastructure/ILoggingService';
import { IPerformanceMonitor } from '@/domain/infrastructure/IPerformanceMonitor';

/**
 * 이벤트 디스패처 서비스
 */
export class EventDispatcherService implements IEventDispatcher {
  private handlers: Map<string, Set<IEventHandler<DomainEvent<DomainEventType>>>> = new Map();
  private initialized: boolean = false;

  constructor(
    private readonly loggingService: ILoggingService,
    private readonly errorHandler: IErrorHandler,
    private readonly performanceMonitor: IPerformanceMonitor,
    private readonly analyticsService: IAnalyticsService
  ) {
    this.initialized = false;
  }

  /**
   * 초기화
   */
  initialize(): void {
    const timer = this.performanceMonitor.startTimer('EventDispatcherService.initialize');
    
    try {
      // 이미 초기화되었는지 확인
      if (this.initialized) {
        this.loggingService.debug('이벤트 디스패처가 이미 초기화되어 있습니다. 초기화 작업을 건너뜁니다.');
        return;
      }
      
      this.loggingService.debug('이벤트 디스패처 초기화 시작');
      
      this.handlers.clear();
      
      this.initialized = true;
      
      this.loggingService.info('이벤트 디스패처 초기화 완료');
    } catch (error) {
      this.loggingService.error('이벤트 디스패처 초기화 실패', { error });
      this.errorHandler.handleError(error as Error, 'EventDispatcherService.initialize');
      throw error;
    } finally {
      timer.stop();
    }
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
    const timer = this.performanceMonitor.startTimer('EventDispatcherService.cleanup');
    
    try {
      this.loggingService.debug('이벤트 디스패처 정리 시작');
      
      this.handlers.clear();
      
      this.initialized = false;
      
      this.loggingService.info('이벤트 디스패처 정리 완료');
    } catch (error) {
      this.loggingService.error('이벤트 디스패처 정리 실패', { error });
      this.errorHandler.handleError(error as Error, 'EventDispatcherService.cleanup');
      throw error;
    } finally {
      timer.stop();
    }
  }

  /**
   * 이벤트 구독
   * @param eventName 이벤트 이름
   * @param callback 콜백 함수
   */
  subscribe<T extends DomainEventType>(eventName: T, callback: (event: DomainEvent<T>) => void): void {
    const timer = this.performanceMonitor.startTimer('EventDispatcherService.subscribe');
    
    try {
      this.loggingService.debug(`이벤트 구독 시작: ${eventName}`);
      
      if (!this.initialized) {
        throw new Error('이벤트 디스패처가 초기화되지 않았습니다.');
      }
      
      if (!this.handlers.has(eventName)) {
        this.handlers.set(eventName, new Set());
      }
      
      const handler: IEventHandler<DomainEvent<DomainEventType>> = {
        handle: async (event: DomainEvent<DomainEventType>) => {
          callback(event as unknown as DomainEvent<T>);
        }
      };
      
      this.handlers.get(eventName)?.add(handler);
      
      this.loggingService.info(`이벤트 구독 완료: ${eventName}`, { subscriberCount: this.handlers.get(eventName)?.size });
    } catch (error) {
      this.loggingService.error(`이벤트 구독 실패: ${eventName}`, { error });
      this.errorHandler.handleError(error as Error, 'EventDispatcherService.subscribe');
      throw error;
    } finally {
      timer.stop();
    }
  }

  /**
   * 이벤트 구독 해제
   * @param eventName 이벤트 이름
   * @param callback 콜백 함수
   */
  unsubscribe<T extends DomainEventType>(eventName: T, callback: (event: DomainEvent<T>) => void): void {
    const timer = this.performanceMonitor.startTimer('EventDispatcherService.unsubscribe');
    
    try {
      this.loggingService.debug(`이벤트 구독 해제 시작: ${eventName}`);
      
      if (!this.initialized) {
        throw new Error('이벤트 디스패처가 초기화되지 않았습니다.');
      }
      
      const handlers = this.handlers.get(eventName);
      if (!handlers) {
        this.loggingService.debug(`이벤트 구독자가 없습니다: ${eventName}`);
        return;
      }
      
      const initialCount = handlers.size;
      
      for (const handler of handlers) {
        if ((handler.handle as unknown as (event: DomainEvent<T>) => void) === callback) {
          handlers.delete(handler);
          break;
        }
      }
      
      this.loggingService.info(`이벤트 구독 해제 완료: ${eventName}`, {
        removedCount: initialCount - handlers.size,
        remainingCount: handlers.size
      });
    } catch (error) {
      this.loggingService.error(`이벤트 구독 해제 실패: ${eventName}`, { error });
      this.errorHandler.handleError(error as Error, 'EventDispatcherService.unsubscribe');
      throw error;
    } finally {
      timer.stop();
    }
  }

  /**
   * 이벤트 발송
   * @param event 이벤트 객체
   */
  async dispatch<T extends DomainEventType>(event: DomainEvent<T>): Promise<void> {
    const timer = this.performanceMonitor.startTimer('EventDispatcherService.dispatch');
    
    try {
      const eventName = event.eventName;
      
      this.loggingService.debug(`이벤트 발송 시작: ${eventName}`);
      
      const handlers = this.handlers.get(eventName);
      if (!handlers || handlers.size === 0) {
        this.loggingService.debug(`이벤트 구독자 없음: ${eventName}`);
        return;
      }
      
      let successCount = 0;
      let errorCount = 0;
      
      for (const handler of handlers) {
        try {
          await handler.handle(event as unknown as DomainEvent<DomainEventType>);
          successCount++;
        } catch (error) {
          errorCount++;
          this.loggingService.error(`이벤트 구독자 처리 실패: ${eventName}`, { 
            error,
            event: event.toString()
          });
          this.errorHandler.handleError(error as Error, `EventDispatcherService.subscriber.${eventName}`);
        }
      }
      
      const analyticsData = {
        type: eventName,
        data: event.data,
        timestamp: event.timestamp,
        subscriberCount: handlers.size,
        successCount,
        errorCount
      };
      
      this.analyticsService.trackEvent(`event_${String(eventName).toLowerCase()}`, analyticsData);
      this.loggingService.debug(`이벤트 발송 완료: ${eventName}`, { 
        subscriberCount: handlers.size,
        successCount, 
        errorCount
      });
    } catch (error) {
      // 에러 발생 시 이벤트 정보 안전하게 로깅
      try {
        const eventInfo = 'toString' in event && typeof (event as any).toString === 'function'
          ? (event as any).toString()
          : JSON.stringify(event);
        
        this.loggingService.error('이벤트 발송 실패: Unknown Event', { 
          error,
          event: eventInfo
        });
      } catch (loggingError) {
        this.loggingService.error('이벤트 발송 실패 (이벤트 정보 로깅 실패): Unknown Event', { 
          error,
          loggingError
        });
      }
      
      this.errorHandler.handleError(error as Error, 'EventDispatcherService.dispatch');
      throw error;
    } finally {
      timer.stop();
    }
  }
} 