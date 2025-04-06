import { IPerformanceMonitor } from '@/domain/infrastructure/IPerformanceMonitor';
import { ILoggingService } from '@/domain/infrastructure/ILoggingService';
import { IErrorHandler } from '@/domain/infrastructure/IErrorHandler';
import { Container } from './di/Container';

/**
 * 성능 모니터링 서비스 구현체
 */
export class PerformanceMonitor implements IPerformanceMonitor {
  private static instance: PerformanceMonitor;
  private measurements: Map<string, {
    count: number;
    total: number;
    min: number;
    max: number;
  }> = new Map();
  private timers: Map<string, number> = new Map();
  private logger: ILoggingService;
  private errorHandler: IErrorHandler;

  private constructor() {
    this.logger = Container.getInstance().resolve<ILoggingService>('ILoggingService');
    this.errorHandler = Container.getInstance().resolve<IErrorHandler>('IErrorHandler');
  }

  /**
   * 싱글톤 인스턴스 반환
   */
  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * 성능 측정 시작
   */
  public startTimer(name: string): { stop: () => void } {
    const startTime = performance.now();
    this.timers.set(name, startTime);
    return {
      stop: () => {
        const endTime = performance.now();
        const duration = endTime - startTime;
        this.recordMeasurement(name, duration);
      }
    };
  }

  /**
   * 성능 측정
   */
  public measure<T>(name: string, callback: () => T): T {
    const timer = this.startTimer(name);
    try {
      return callback();
    } finally {
      timer.stop();
    }
  }

  /**
   * 성능 측정 (비동기)
   */
  public async measureAsync<T>(name: string, callback: () => Promise<T>): Promise<T> {
    const timer = this.startTimer(name);
    try {
      return await callback();
    } finally {
      timer.stop();
    }
  }

  /**
   * 성능 측정 결과 조회
   */
  public getMeasurement(name: string): {
    count: number;
    average: number;
    min: number;
    max: number;
    total: number;
  } {
    const measurement = this.measurements.get(name);
    if (!measurement) {
      return {
        count: 0,
        average: 0,
        min: 0,
        max: 0,
        total: 0
      };
    }

    return {
      count: measurement.count,
      average: measurement.total / measurement.count,
      min: measurement.min,
      max: measurement.max,
      total: measurement.total
    };
  }

  /**
   * 모든 성능 측정 결과 조회
   */
  public getAllMeasurements(): Record<string, {
    count: number;
    average: number;
    min: number;
    max: number;
    total: number;
  }> {
    const result: Record<string, {
      count: number;
      average: number;
      min: number;
      max: number;
      total: number;
    }> = {};

    for (const [name, measurement] of this.measurements) {
      result[name] = {
        count: measurement.count,
        average: measurement.total / measurement.count,
        min: measurement.min,
        max: measurement.max,
        total: measurement.total
      };
    }

    return result;
  }

  /**
   * 성능 측정 결과 초기화
   */
  public clearMeasurement(name: string): void {
    this.measurements.delete(name);
  }

  /**
   * 모든 성능 측정 결과 초기화
   */
  public clearAllMeasurements(): void {
    this.measurements.clear();
  }

  /**
   * 메모리 사용량 로깅
   */
  public logMemoryUsage(): void {
    const performance = window.performance as any;
    if (performance?.memory) {
      const memory = performance.memory;
      this.logger.debug(`[Memory] 
        Used: ${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB
        Total: ${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)}MB
        Limit: ${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)}MB
      `);
    }
  }

  /**
   * 성능 메트릭 초기화
   */
  public clearMetrics(): void {
    this.measurements.clear();
    this.timers.clear();
    this.logger.debug('[Performance] 메트릭 초기화');
  }

  /**
   * 성능 측정 기록
   */
  private recordMeasurement(name: string, duration: number): void {
    const measurement = this.measurements.get(name) || {
      count: 0,
      total: 0,
      min: Infinity,
      max: -Infinity
    };

    measurement.count++;
    measurement.total += duration;
    measurement.min = Math.min(measurement.min, duration);
    measurement.max = Math.max(measurement.max, duration);

    this.measurements.set(name, measurement);
  }
} 