import { DomainEvent } from './DomainEvent';
import { IDomainEventHandler } from './IDomainEventHandler';
import { LoggingService } from '@/infrastructure/services/LoggingService';

/**
 * 도메인 이벤트 디스패처 인터페이스
 */
export interface IDomainEventDispatcher {
  /**
   * 이벤트 핸들러 등록
   */
  register<T extends DomainEvent>(eventType: new () => T, handler: IDomainEventHandler<T>): void;

  /**
   * 이벤트 핸들러 등록 (이벤트 이름으로)
   */
  registerHandler(eventName: string, handler: IDomainEventHandler<any>): void;

  /**
   * 이벤트 핸들러 제거
   */
  unregister<T extends DomainEvent>(eventType: new () => T, handler: IDomainEventHandler<T>): void;

  /**
   * 이벤트 핸들러 제거 (이벤트 이름으로)
   */
  unregisterHandler(eventName: string, handler: IDomainEventHandler<any>): void;

  /**
   * 이벤트 발생
   */
  dispatch<T extends DomainEvent>(event: T): Promise<void>;

  /**
   * 모든 이벤트 핸들러 제거
   */
  cleanup(): void;

  /**
   * 현재 등록된 모든 핸들러의 상태를 반환합니다.
   */
  getDebugInfo(): {
    totalHandlers: number;
    handlersByEvent: Record<string, number>;
    executionStats: Record<string, {
      lastExecutionTime: number;
      successCount: number;
      failureCount: number;
      averageExecutionTime: number;
    }>;
  };
}

/**
 * 도메인 이벤트 디스패처
 */
export class DomainEventDispatcher implements IDomainEventDispatcher {
  private handlers: Map<string, IDomainEventHandler<any>[]> = new Map();
  private handlerExecutionStatus = new Map<string, {
    lastExecutionTime: number;
    successCount: number;
    failureCount: number;
    averageExecutionTime: number;
  }>();

  constructor(private readonly loggingService: LoggingService) {
    this.loggingService.debug('DomainEventDispatcher 초기화됨');
  }

  private eventTypeCheck<T extends DomainEvent>(eventType: new () => T): void {
    if (!(eventType.prototype instanceof DomainEvent)) {
      throw new Error('유효하지 않은 이벤트 타입입니다.');
    }
  }

  private validateHandler<T extends DomainEvent>(handler: IDomainEventHandler<T>): void {
    if (!handler || typeof handler.handle !== 'function') {
      throw new Error('유효하지 않은 핸들러입니다.');
    }
  }

  private getHandlerKey<T extends DomainEvent>(eventType: new () => T, handler: IDomainEventHandler<T>): string {
    return `${eventType.name}-${handler.handle.toString()}`;
  }

  /**
   * 이벤트 핸들러를 등록합니다.
   */
  register<T extends DomainEvent>(
    eventType: new (...args: any[]) => T,
    handler: IDomainEventHandler<T>
  ): void {
    this.eventTypeCheck(eventType);
    this.validateHandler(handler);

    const eventName = eventType.name;
    const handlerKey = this.getHandlerKey(eventType, handler);
    
    if (!this.handlers.has(eventName)) {
      this.handlers.set(eventName, []);
    }

    const handlers = this.handlers.get(eventName)!;
    const isDuplicate = handlers.some(h => this.getHandlerKey(eventType, h) === handlerKey);

    if (!isDuplicate) {
      handlers.push(handler);
      this.loggingService.debug(`이벤트 핸들러 등록: ${eventName}`);
    } else {
      this.loggingService.debug(`이벤트 핸들러 중복 등록 방지: ${eventName}`);
    }
  }

  /**
   * 이벤트 핸들러를 등록합니다 (이벤트 이름으로).
   */
  registerHandler(eventName: string, handler: IDomainEventHandler<any>): void {
    this.validateHandler(handler);

    if (!this.handlers.has(eventName)) {
      this.handlers.set(eventName, []);
    }

    const handlers = this.handlers.get(eventName)!;
    const isDuplicate = handlers.some(h => h === handler);

    if (!isDuplicate) {
      handlers.push(handler);
      this.loggingService.debug(`이벤트 핸들러 등록: ${eventName}`);
    } else {
      this.loggingService.debug(`이벤트 핸들러 중복 등록 방지: ${eventName}`);
    }
  }

  /**
   * 이벤트 핸들러를 제거합니다.
   */
  unregister<T extends DomainEvent>(
    eventType: new (...args: any[]) => T,
    handler: IDomainEventHandler<T>
  ): void {
    const eventName = eventType.name;
    const handlers = this.handlers.get(eventName);
    if (handlers) {
      const index = handlers.findIndex(h => h === handler);
      if (index !== -1) {
        handlers.splice(index, 1);
        this.loggingService.debug(`이벤트 핸들러 해제: ${eventName}`);
      }
    }
  }

  /**
   * 이벤트 핸들러를 제거합니다 (이벤트 이름으로).
   */
  unregisterHandler(eventName: string, handler: IDomainEventHandler<any>): void {
    const handlers = this.handlers.get(eventName);
    if (handlers) {
      const index = handlers.findIndex(h => h === handler);
      if (index !== -1) {
        handlers.splice(index, 1);
        this.loggingService.debug(`이벤트 핸들러 해제: ${eventName}`);
      }
    }
  }

  /**
   * 이벤트를 디스패치합니다.
   */
  async dispatch<T extends DomainEvent>(event: T): Promise<void> {
    const eventName = event.constructor.name;
    const handlerSet = this.handlers.get(eventName);

    if (!handlerSet || handlerSet.length === 0) {
      this.loggingService.debug(`등록된 핸들러 없음: ${eventName}`);
      return;
    }

    this.loggingService.debug(`이벤트 처리 시작: ${eventName} (핸들러: ${handlerSet.length}개)`);

    const startTime = Date.now();
    const promises = handlerSet.map(async (handler) => {
      const handlerKey = this.getHandlerKey(event.constructor as new () => T, handler);
      const handlerStartTime = Date.now();

      try {
        await Promise.race([
          handler.handle(event),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('핸들러 실행 시간 초과')), 5000)
          )
        ]);

        const executionTime = Date.now() - handlerStartTime;
        this.updateHandlerStats(handlerKey, executionTime, true);
        this.loggingService.debug(`핸들러 실행 완료: ${eventName} (소요 시간: ${executionTime}ms)`);
      } catch (error) {
        const executionTime = Date.now() - handlerStartTime;
        this.updateHandlerStats(handlerKey, executionTime, false);
        this.loggingService.error(`핸들러 실행 실패: ${eventName}`, error);
        throw error;
      }
    });

    try {
      await Promise.all(promises);
      const totalTime = Date.now() - startTime;
      this.loggingService.debug(`이벤트 처리 완료: ${eventName} (총 소요 시간: ${totalTime}ms)`);
    } catch (error) {
      this.loggingService.error(`이벤트 처리 중 오류 발생: ${eventName}`, error);
      throw error;
    }
  }

  private updateHandlerStats(
    handlerKey: string,
    executionTime: number,
    success: boolean
  ): void {
    const stats = this.handlerExecutionStatus.get(handlerKey) || {
      lastExecutionTime: 0,
      successCount: 0,
      failureCount: 0,
      averageExecutionTime: 0
    };

    stats.lastExecutionTime = executionTime;
    if (success) {
      stats.successCount++;
    } else {
      stats.failureCount++;
    }
    stats.averageExecutionTime = (stats.averageExecutionTime * (stats.successCount + stats.failureCount - 1) + executionTime) / (stats.successCount + stats.failureCount);

    this.handlerExecutionStatus.set(handlerKey, stats);
  }

  /**
   * 모든 이벤트 핸들러를 제거합니다.
   */
  cleanup(): void {
    const totalHandlers = Array.from(this.handlers.values())
      .reduce((sum, set) => sum + set.length, 0);
    
    this.handlers.clear();
    this.handlerExecutionStatus.clear();
    
    this.loggingService.info(`이벤트 핸들러 정리 완료 (제거된 핸들러: ${totalHandlers}개)`);
  }

  /**
   * 현재 등록된 모든 핸들러의 상태를 반환합니다.
   */
  getDebugInfo(): {
    totalHandlers: number;
    handlersByEvent: Record<string, number>;
    executionStats: Record<string, {
      lastExecutionTime: number;
      successCount: number;
      failureCount: number;
      averageExecutionTime: number;
    }>;
  } {
    const handlersByEvent: Record<string, number> = {};
    for (const [eventName, handlerSet] of this.handlers.entries()) {
      handlersByEvent[eventName] = handlerSet.length;
    }

    const executionStats: Record<string, {
      lastExecutionTime: number;
      successCount: number;
      failureCount: number;
      averageExecutionTime: number;
    }> = {};
    for (const [handlerKey, stats] of this.handlerExecutionStatus.entries()) {
      executionStats[handlerKey] = { ...stats };
    }

    return {
      totalHandlers: Array.from(this.handlers.values())
        .reduce((sum, set) => sum + set.length, 0),
      handlersByEvent,
      executionStats
    };
  }
} 