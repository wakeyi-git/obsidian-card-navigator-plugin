/**
 * 분석 서비스 인터페이스
 * - 사용자 행동과 성능 데이터 수집 및 분석 담당
 */
export interface IAnalyticsService {
  /**
   * 이벤트를 기록합니다.
   * @param name 이벤트 이름
   * @param properties 이벤트 속성
   */
  trackEvent(name: string, properties?: Record<string, any>): void;

  /**
   * 특정 기간 동안의 이벤트를 조회합니다.
   * @param startTime 시작 시간
   * @param endTime 종료 시간
   * @returns 이벤트 목록
   */
  getEvents(startTime: number, endTime: number): Array<{
    name: string;
    timestamp: number;
    properties?: Record<string, any>;
  }>;

  /**
   * 특정 이벤트의 발생 횟수를 반환합니다.
   * @param name 이벤트 이름
   * @returns 발생 횟수
   */
  getEventCount(name: string): number;

  /**
   * 모든 이벤트 데이터를 초기화합니다.
   */
  reset(): void;

  /**
   * 이벤트 데이터를 내보냅니다.
   * @returns 이벤트 데이터 JSON 문자열
   */
  exportData(): string;
} 