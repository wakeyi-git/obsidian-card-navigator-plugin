import { ILoggingService } from '@/domain/infrastructure/ILoggingService';

/**
 * 로그 레벨
 */
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR'
}

/**
 * 로깅 서비스 구현체
 */
export class LoggingService implements ILoggingService {
  private static instance: LoggingService;
  private _logLevel: LogLevel = LogLevel.INFO;
  private _isDebugEnabled: boolean = false;
  private _performanceMetrics: Map<string, {
    startTime: number;
    endTime?: number;
    duration?: number;
  }> = new Map();

  private constructor() {
    // 개발 모드에서는 항상 DEBUG 레벨 설정
    this.setLogLevel(LogLevel.DEBUG);
  }

  public static getInstance(): LoggingService {
    if (!LoggingService.instance) {
      LoggingService.instance = new LoggingService();
    }
    return LoggingService.instance;
  }

  /**
   * 디버그 로그 출력
   */
  public debug(message: string, ...args: any[]): void {
    if (this._isDebugEnabled) {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  }

  /**
   * 정보 로그 출력
   */
  public info(message: string, ...args: any[]): void {
    if (this._logLevel === LogLevel.INFO || this._logLevel === LogLevel.DEBUG) {
      console.info(`[INFO] ${message}`, ...args);
    }
  }

  /**
   * 경고 로그 출력
   */
  public warn(message: string, ...args: any[]): void {
    if (this._logLevel === LogLevel.WARN || this._logLevel === LogLevel.INFO || this._logLevel === LogLevel.DEBUG) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  }

  /**
   * 에러 로그 출력
   */
  public error(message: string, ...args: any[]): void {
    console.error(`[ERROR] ${message}`, ...args);
  }

  /**
   * 로그 레벨 설정
   */
  public setLogLevel(level: LogLevel): void {
    this._logLevel = level;
    this._isDebugEnabled = level === LogLevel.DEBUG;
  }

  /**
   * 디버그 모드 활성화 여부 확인
   */
  public isDebugEnabled(): boolean {
    return this._isDebugEnabled;
  }

  /**
   * 성능 측정 시작
   */
  public startMeasure(label: string): void {
    this._performanceMetrics.set(label, { startTime: performance.now() });
    this.debug(`[Performance] ${label} 측정 시작`);
  }

  /**
   * 성능 측정 종료
   */
  public endMeasure(label: string): void {
    const metric = this._performanceMetrics.get(label);
    if (metric) {
      metric.endTime = performance.now();
      metric.duration = metric.endTime - metric.startTime;
      this.debug(`[Performance] ${label}: ${metric.duration.toFixed(2)}ms`);
      this._performanceMetrics.delete(label);
    }
  }

  /**
   * 메모리 사용량 로깅
   */
  public logMemoryUsage(): void {
    const performance = window.performance as any;
    if (performance?.memory) {
      const memory = performance.memory;
      this.debug(`[Memory] 
        Used: ${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB
        Total: ${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)}MB
        Limit: ${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)}MB
      `);
    }
  }

  /**
   * 성능 메트릭 로깅
   */
  private _logPerformanceMetrics(): void {
    const performance = window.performance as any;
    if (performance?.memory) {
      const memory = performance.memory;
      this.debug('메모리 사용량:', {
        usedJSHeapSize: `${Math.round(memory.usedJSHeapSize / 1024 / 1024)}MB`,
        totalJSHeapSize: `${Math.round(memory.totalJSHeapSize / 1024 / 1024)}MB`
      });
    }
  }
} 