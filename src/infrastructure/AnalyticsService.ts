import { IAnalyticsService } from '@/domain/infrastructure/IAnalyticsService';
import { ILoggingService } from '@/domain/infrastructure/ILoggingService';
import { Container } from '@/infrastructure/di/Container';

interface AnalyticsEvent {
  name: string;
  timestamp: number;
  properties?: Record<string, any>;
}

export class AnalyticsService implements IAnalyticsService {
  private static instance: AnalyticsService;
  private events: AnalyticsEvent[];

  private constructor(
    private readonly loggingService: ILoggingService
  ) {
    this.events = [];
  }

  static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      const container = Container.getInstance();
      AnalyticsService.instance = new AnalyticsService(
        container.resolve('ILoggingService')
      );
    }
    return AnalyticsService.instance;
  }

  /**
   * 이벤트를 기록합니다.
   * @param name 이벤트 이름
   * @param properties 이벤트 속성
   */
  public trackEvent(name: string, properties?: Record<string, any>): void {
    const event: AnalyticsEvent = {
      name,
      timestamp: Date.now(),
      properties,
    };

    this.events.push(event);
    this.loggingService.debug(`[Analytics] ${name}`, properties);
  }

  /**
   * 특정 기간 동안의 이벤트를 조회합니다.
   * @param startTime 시작 시간
   * @param endTime 종료 시간
   * @returns 이벤트 목록
   */
  public getEvents(
    startTime: number,
    endTime: number
  ): AnalyticsEvent[] {
    return this.events.filter(
      (event) =>
        event.timestamp >= startTime && event.timestamp <= endTime
    );
  }

  /**
   * 특정 이벤트의 발생 횟수를 반환합니다.
   * @param name 이벤트 이름
   * @returns 발생 횟수
   */
  public getEventCount(name: string): number {
    return this.events.filter((event) => event.name === name).length;
  }

  /**
   * 모든 이벤트 데이터를 초기화합니다.
   */
  public reset(): void {
    this.events = [];
  }

  /**
   * 이벤트 데이터를 내보냅니다.
   * @returns 이벤트 데이터 JSON 문자열
   */
  public exportData(): string {
    return JSON.stringify(this.events, null, 2);
  }
} 