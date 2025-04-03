/**
 * 성능 모니터링 서비스 인터페이스
 */
export interface IPerformanceMonitor {
  /**
   * 성능 측정 시작
   * @param label 측정 레이블
   */
  startMeasure(label: string): void;

  /**
   * 성능 측정 종료
   * @param label 측정 레이블
   */
  endMeasure(label: string): void;

  /**
   * 메모리 사용량 로깅
   */
  logMemoryUsage(): void;

  /**
   * 성능 메트릭 초기화
   */
  clearMetrics(): void;
} 