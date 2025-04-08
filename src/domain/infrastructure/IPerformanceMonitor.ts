/**
 * 성능 모니터링 서비스 인터페이스
 */
export interface IPerformanceMonitor {
  /**
   * 성능 측정 시작
   * @param name 측정 이름
   * @returns 성능 측정기
   */
  startTimer(name: string): {
    /**
     * 성능 측정 중지
     */
    stop(): void;
  };

  /**
   * 성능 측정
   * @param name 측정 이름
   * @param callback 측정할 함수
   * @returns 측정 결과
   */
  measure<T>(name: string, callback: () => T): T;

  /**
   * 성능 측정 (비동기)
   * @param name 측정 이름
   * @param callback 측정할 함수
   * @returns 측정 결과
   */
  measureAsync<T>(name: string, callback: () => Promise<T>): Promise<T>;

  /**
   * 성능 측정 결과 조회
   * @param name 측정 이름
   * @returns 측정 결과
   */
  getMeasurement(name: string): {
    /**
     * 측정 횟수
     */
    count: number;

    /**
     * 평균 실행 시간 (ms)
     */
    average: number;

    /**
     * 최소 실행 시간 (ms)
     */
    min: number;

    /**
     * 최대 실행 시간 (ms)
     */
    max: number;

    /**
     * 총 실행 시간 (ms)
     */
    total: number;
  };

  /**
   * 모든 성능 측정 결과 조회
   * @returns 모든 측정 결과
   */
  getAllMeasurements(): Record<string, {
    /**
     * 측정 횟수
     */
    count: number;

    /**
     * 평균 실행 시간 (ms)
     */
    average: number;

    /**
     * 최소 실행 시간 (ms)
     */
    min: number;

    /**
     * 최대 실행 시간 (ms)
     */
    max: number;

    /**
     * 총 실행 시간 (ms)
     */
    total: number;
  }>;

  /**
   * 성능 측정 결과 초기화
   * @param name 측정 이름
   */
  clearMeasurement(name: string): void;

  /**
   * 모든 성능 측정 결과 초기화
   */
  clearAllMeasurements(): void;

  /**
   * 메모리 사용량 로깅
   */
  logMemoryUsage(): void;

  /**
   * 성능 메트릭 초기화
   */
  clearMetrics(): void;
} 