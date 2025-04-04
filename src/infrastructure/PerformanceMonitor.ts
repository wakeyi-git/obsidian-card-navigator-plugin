import { App } from 'obsidian';
import { IPerformanceMonitor } from '@/domain/infrastructure/IPerformanceMonitor';
import { ILoggingService } from '@/domain/infrastructure/ILoggingService';
import { Container } from '@/infrastructure/di/Container';

/**
 * 성능 모니터링 서비스
 * - 성능 측정 및 메모리 사용량 모니터링 담당
 */
export class PerformanceMonitor implements IPerformanceMonitor {
  private static instance: PerformanceMonitor;
  private readonly logger: ILoggingService;
  private readonly app: App;
  private metrics: Map<string, {
    startTime: number;
    endTime?: number;
    duration?: number;
  }> = new Map();

  private constructor() {
    const container = Container.getInstance();
    this.app = container.resolve('App');
    this.logger = container.resolve('ILoggingService');
  }

  /**
   * PerformanceMonitor 인스턴스 가져오기
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
  public startMeasure(label: string): void {
    this.metrics.set(label, { startTime: performance.now() });
    this.logger.debug(`[Performance] ${label} 측정 시작`);
  }

  /**
   * 성능 측정 종료
   */
  public endMeasure(label: string): void {
    const metric = this.metrics.get(label);
    if (metric) {
      metric.endTime = performance.now();
      metric.duration = metric.endTime - metric.startTime;
      this.logger.debug(`[Performance] ${label}: ${metric.duration.toFixed(2)}ms`);
      this.metrics.delete(label);
    }
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
    this.metrics.clear();
    this.logger.debug('[Performance] 메트릭 초기화');
  }
} 