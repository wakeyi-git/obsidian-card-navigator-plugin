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
  private readonly handlers: Map<string, Set<IDomainEventHandler<any>>> = new Map();
  private readonly eventQueue: DomainEvent[] = [];
  private isProcessing = false;
  private readonly loggingService: LoggingService;
  private readonly executionStats: Map<string, {
    lastExecutionTime: number;
    successCount: number;
    failureCount: number;
    totalExecutionTime: number;
  }> = new Map();

  constructor(loggingService: LoggingService) {
    this.loggingService = loggingService;
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
    if (!this.handlers.has(eventName)) {
      this.handlers.set(eventName, new Set());
    }

    const handlers = this.handlers.get(eventName)!;
    if (!handlers.has(handler)) {
      handlers.add(handler);
      this.loggingService.debug(`[CardNavigator] 이벤트 핸들러 등록: ${eventName}`);
    } else {
      this.loggingService.debug(`[CardNavigator] 이벤트 핸들러 중복 등록 방지: ${eventName}`);
    }
  }

  /**
   * 이벤트 핸들러를 등록합니다 (이벤트 이름으로).
   */
  registerHandler(eventName: string, handler: IDomainEventHandler<any>): void {
    this.validateHandler(handler);

    if (!this.handlers.has(eventName)) {
      this.handlers.set(eventName, new Set());
    }

    const handlers = this.handlers.get(eventName)!;
    if (!handlers.has(handler)) {
      handlers.add(handler);
      this.loggingService.debug(`[CardNavigator] 이벤트 핸들러 등록: ${eventName}`);
    } else {
      this.loggingService.debug(`[CardNavigator] 이벤트 핸들러 중복 등록 방지: ${eventName}`);
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
      handlers.delete(handler);
      this.loggingService.debug(`[CardNavigator] 이벤트 핸들러 해제: ${eventName}`);
    }
  }

  /**
   * 이벤트 핸들러를 제거합니다 (이벤트 이름으로).
   */
  unregisterHandler(eventName: string, handler: IDomainEventHandler<any>): void {
    const handlers = this.handlers.get(eventName);
    if (handlers) {
      handlers.delete(handler);
      this.loggingService.debug(`[CardNavigator] 이벤트 핸들러 해제: ${eventName}`);
    }
  }

  /**
   * 이벤트를 발생시킵니다.
   * @param event 이벤트
   */
  public async dispatch(event: DomainEvent): Promise<void> {
    this.eventQueue.push(event);
    if (!this.isProcessing) {
      await this.processEventQueue();
    }
  }

  /**
   * 이벤트 큐를 처리합니다.
   */
  private async processEventQueue(): Promise<void> {
    if (this.isProcessing || this.eventQueue.length === 0) {
      return;
    }

    this.isProcessing = true;
    try {
      while (this.eventQueue.length > 0) {
        const event = this.eventQueue.shift()!;
        await this.processEvent(event);
      }
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * 이벤트를 처리합니다.
   * @param event 이벤트
   */
  private async processEvent(event: DomainEvent): Promise<void> {
    const eventName = event.constructor.name;
    const handlers = this.handlers.get(eventName) || new Set();
    
    if (handlers.size === 0) {
      this.loggingService.debug(`[CardNavigator] 등록된 핸들러 없음: ${eventName}`);
      return;
    }

    const startTime = performance.now();
    this.loggingService.debug(`[CardNavigator] 이벤트 처리 시작: ${eventName} (핸들러: ${handlers.size}개)`);

    try {
      await Promise.all(
        Array.from(handlers).map(async (handler) => {
          try {
            const handlerStartTime = performance.now();
            await handler.handle(event);
            const handlerEndTime = performance.now();
            const executionTime = handlerEndTime - handlerStartTime;
            
            this.updateExecutionStats(eventName, executionTime, true);
            this.loggingService.debug(
              `[CardNavigator] 핸들러 실행 완료: ${eventName} (소요 시간: ${executionTime.toFixed(2)}ms)`
            );
          } catch (error) {
            this.updateExecutionStats(eventName, 0, false);
            this.loggingService.error(`[CardNavigator] 핸들러 실행 실패: ${eventName}`, error);
            throw error;
          }
        })
      );
    } finally {
      const endTime = performance.now();
      this.loggingService.debug(
        `[CardNavigator] 이벤트 처리 완료: ${eventName} (총 소요 시간: ${(endTime - startTime).toFixed(2)}ms)`
      );
    }
  }

  /**
   * 실행 통계를 업데이트합니다.
   */
  private updateExecutionStats(
    eventName: string,
    executionTime: number,
    success: boolean
  ): void {
    const stats = this.executionStats.get(eventName) || {
      lastExecutionTime: 0,
      successCount: 0,
      failureCount: 0,
      totalExecutionTime: 0
    };

    stats.lastExecutionTime = executionTime;
    if (success) {
      stats.successCount++;
    } else {
      stats.failureCount++;
    }
    stats.totalExecutionTime += executionTime;

    this.executionStats.set(eventName, stats);
  }

  /**
   * 모든 이벤트 핸들러를 제거합니다.
   */
  cleanup(): void {
    const totalHandlers = Array.from(this.handlers.values())
      .reduce((sum, set) => sum + set.size, 0);
    
    this.handlers.clear();
    
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
      handlersByEvent[eventName] = handlerSet.size;
    }

    const executionStats: Record<string, {
      lastExecutionTime: number;
      successCount: number;
      failureCount: number;
      averageExecutionTime: number;
    }> = {};
    // 실행 통계 계산 로직 추가

    return {
      totalHandlers: Array.from(this.handlers.values())
        .reduce((sum, set) => sum + set.size, 0),
      handlersByEvent,
      executionStats
    };
  }
} 