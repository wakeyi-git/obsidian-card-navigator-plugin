import { IDomainEvent, IEventDispatcher } from '../../domain/events/DomainEvent';
import { IAnalyticsService } from '../../domain/infrastructure/IAnalyticsService';
import { IErrorHandler } from '../../domain/infrastructure/IErrorHandler';
import { ILoggingService } from '../../domain/infrastructure/ILoggingService';
import { IPerformanceMonitor } from '../../domain/infrastructure/IPerformanceMonitor';

/**
 * 이벤트 디스패처 서비스
 */
export class EventDispatcherService implements IEventDispatcher {
  private eventSubscribers: Map<string, Array<(event: IDomainEvent) => void>>;
  private _isInitialized: boolean = false;

  constructor(
    private readonly loggingService: ILoggingService,
    private readonly errorHandler: IErrorHandler,
    private readonly performanceMonitor: IPerformanceMonitor,
    private readonly analyticsService: IAnalyticsService
  ) {
    this.eventSubscribers = new Map();
  }

  /**
   * 초기화
   */
  initialize(): void {
    const perfMark = 'EventDispatcherService.initialize';
    this.performanceMonitor.startMeasure(perfMark);
    
    try {
      // 이미 초기화되었는지 확인
      if (this._isInitialized) {
        this.loggingService.debug('이벤트 디스패처가 이미 초기화되어 있습니다. 초기화 작업을 건너뜁니다.');
        return;
      }
      
      this.loggingService.debug('이벤트 디스패처 초기화 시작');
      
      // 구독자 맵 초기화
      this.eventSubscribers.clear();
      
      // 초기화 완료 설정
      this._isInitialized = true;
      
      this.loggingService.info('이벤트 디스패처 초기화 완료');
    } catch (error) {
      this.loggingService.error('이벤트 디스패처 초기화 실패', { error });
      this.errorHandler.handleError(error as Error, 'EventDispatcherService.initialize');
      throw error;
    } finally {
      this.performanceMonitor.endMeasure(perfMark);
    }
  }

  /**
   * 초기화 여부 확인
   * @returns 초기화 여부
   */
  isInitialized(): boolean {
    return this._isInitialized;
  }

  /**
   * 정리
   */
  cleanup(): void {
    const perfMark = 'EventDispatcherService.cleanup';
    this.performanceMonitor.startMeasure(perfMark);
    
    try {
      this.loggingService.debug('이벤트 디스패처 정리 시작');
      
      // 구독자 맵 초기화
      this.eventSubscribers.clear();
      
      // 초기화 상태 리셋
      this._isInitialized = false;
      
      this.loggingService.info('이벤트 디스패처 정리 완료');
    } catch (error) {
      this.loggingService.error('이벤트 디스패처 정리 실패', { error });
      this.errorHandler.handleError(error as Error, 'EventDispatcherService.cleanup');
      throw error;
    } finally {
      this.performanceMonitor.endMeasure(perfMark);
    }
  }

  /**
   * 이벤트 구독
   * @param eventName 이벤트 이름
   * @param callback 콜백 함수
   */
  subscribe<T extends IDomainEvent>(eventName: string, callback: (event: T) => void): void {
    const perfMark = 'EventDispatcherService.subscribe';
    this.performanceMonitor.startMeasure(perfMark);
    
    try {
      this.loggingService.debug(`이벤트 구독 시작: ${eventName}`);
      
      if (!this._isInitialized) {
        throw new Error('이벤트 디스패처가 초기화되지 않았습니다.');
      }
      
      // 해당 이벤트 유형의 구독자 목록 가져오기 (없으면 생성)
      if (!this.eventSubscribers.has(eventName)) {
        this.eventSubscribers.set(eventName, []);
      }
      
      const subscribers = this.eventSubscribers.get(eventName)!;
      
      // 이미 등록된 콜백인지 확인 (중복 방지)
      if (!subscribers.includes(callback as any)) {
        subscribers.push(callback as any);
        this.loggingService.debug(`이벤트 구독자 추가 완료: ${eventName}`, { subscriberCount: subscribers.length });
      } else {
        this.loggingService.debug(`이벤트 구독자가 이미 등록되어 있습니다: ${eventName}`);
      }
      
      this.loggingService.info(`이벤트 구독 완료: ${eventName}`, { subscriberCount: subscribers.length });
    } catch (error) {
      this.loggingService.error(`이벤트 구독 실패: ${eventName}`, { error });
      this.errorHandler.handleError(error as Error, 'EventDispatcherService.subscribe');
      throw error;
    } finally {
      this.performanceMonitor.endMeasure(perfMark);
    }
  }

  /**
   * 이벤트 구독 해제
   * @param eventName 이벤트 이름
   * @param callback 콜백 함수
   */
  unsubscribe<T extends IDomainEvent>(eventName: string, callback: (event: T) => void): void {
    const perfMark = 'EventDispatcherService.unsubscribe';
    this.performanceMonitor.startMeasure(perfMark);
    
    try {
      this.loggingService.debug(`이벤트 구독 해제 시작: ${eventName}`);
      
      if (!this._isInitialized) {
        throw new Error('이벤트 디스패처가 초기화되지 않았습니다.');
      }
      
      // 해당 이벤트에 대한 구독자가 없으면 무시
      if (!this.eventSubscribers.has(eventName)) {
        this.loggingService.debug(`이벤트 구독자가 없습니다: ${eventName}`);
        return;
      }
      
      const subscribers = this.eventSubscribers.get(eventName)!;
      const initialCount = subscribers.length;
      
      // 콜백 제거
      const newSubscribers = subscribers.filter(s => s !== callback);
      
      // 구독자 목록 업데이트
      this.eventSubscribers.set(eventName, newSubscribers);
      
      this.loggingService.info(`이벤트 구독 해제 완료: ${eventName}`, {
        removedCount: initialCount - newSubscribers.length,
        remainingCount: newSubscribers.length
      });
    } catch (error) {
      this.loggingService.error(`이벤트 구독 해제 실패: ${eventName}`, { error });
      this.errorHandler.handleError(error as Error, 'EventDispatcherService.unsubscribe');
      throw error;
    } finally {
      this.performanceMonitor.endMeasure(perfMark);
    }
  }

  /**
   * 이벤트 발송
   * @param event 이벤트 객체
   */
  dispatch<T extends IDomainEvent>(event: T): void {
    const perfMark = 'EventDispatcherService.dispatch';
    this.performanceMonitor.startMeasure(perfMark);
    
    try {
      // IDomainEvent 인터페이스에서 필요한 속성 안전하게 접근
      const eventName = 'eventName' in event ? (event as any).eventName : 
                      'type' in event ? String((event as any).type) : 
                      'Unknown Event';
      
      // 미리보기 함수 안전하게 호출
      const getPreview = () => {
        if ('preview' in event && typeof (event as any).preview === 'function') {
          return (event as any).preview();
        }
        // 미리보기 함수가 없으면 기본 데이터 형식 반환
        return {
          type: eventName,
          data: 'data' in event ? (event as any).data : undefined,
          timestamp: 'timestamp' in event ? (event as any).timestamp : new Date()
        };
      };
      
      this.loggingService.debug(`이벤트 발송 시작: ${eventName}`);
      
      // 이벤트 유형에 해당하는 구독자 목록 가져오기
      const subscribers = this.eventSubscribers.get(eventName) || [];
      
      if (subscribers.length === 0) {
        this.loggingService.debug(`이벤트 구독자 없음: ${eventName}`);
        return;
      }
      
      let successCount = 0;
      let errorCount = 0;
      
      // 모든 구독자에게 이벤트 전달
      subscribers.forEach(subscriber => {
        try {
          subscriber(event);
          successCount++;
        } catch (error) {
          // 개별 구독자의 오류가 전체 이벤트 전파를 중단하지 않도록 함
          errorCount++;
          this.loggingService.error(`이벤트 구독자 처리 실패: ${eventName}`, { 
            error,
            event: getPreview()
          });
          this.errorHandler.handleError(error as Error, `EventDispatcherService.subscriber.${eventName}`);
        }
      });
      
      // 분석 서비스 이벤트 추적 
      const analyticsData = {
        ...getPreview(),
        subscriberCount: subscribers.length,
        successCount,
        errorCount
      };
      
      this.analyticsService.trackEvent(`event_${String(eventName).toLowerCase()}`, analyticsData);
      this.loggingService.debug(`이벤트 발송 완료: ${eventName}`, { 
        subscriberCount: subscribers.length,
        successCount, 
        errorCount
      });
    } catch (error) {
      // 에러 발생 시 이벤트 정보 안전하게 로깅
      try {
        const eventInfo = 'toString' in event && typeof (event as any).toString === 'function'
          ? (event as any).toString()
          : JSON.stringify(event);
        
        this.loggingService.error(`이벤트 발송 실패: ${eventInfo}`, { error });
      } catch {
        // JSON 직렬화 실패 시 기본 오류 메시지
        this.loggingService.error('이벤트 발송 실패: 알 수 없는 이벤트', { error });
      }
      
      this.errorHandler.handleError(error as Error, 'EventDispatcherService.dispatch');
    } finally {
      this.performanceMonitor.endMeasure(perfMark);
    }
  }
} 