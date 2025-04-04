import { Subject, Subscription } from 'rxjs';
import { DomainEvent } from './DomainEvent';

/**
 * 이벤트 버스 클래스
 */
export class EventBus {
  private static instance: EventBus;
  private eventSubject = new Subject<DomainEvent<any>>();

  private constructor() {}

  /**
   * EventBus 싱글톤 인스턴스 반환
   */
  static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  /**
   * 이벤트 발행
   * @param event 발행할 이벤트
   */
  dispatch<T>(event: DomainEvent<T>): void {
    this.eventSubject.next(event);
  }

  /**
   * 이벤트 구독
   * @param callback 이벤트 처리 콜백 함수
   * @returns 구독 객체
   */
  subscribe<T>(callback: (event: DomainEvent<T>) => void): Subscription {
    return this.eventSubject.subscribe(callback);
  }

  /**
   * 이벤트 버스 정리
   */
  cleanup(): void {
    this.eventSubject.complete();
  }
} 