/**
 * 도메인 이벤트 인터페이스
 */
export interface IDomainEvent {
  /**
   * 이벤트 발생 시간
   */
  occurredOn: Date;

  /**
   * 이벤트 ID
   */
  eventId: string;
}

/**
 * 도메인 이벤트 기본 클래스
 */
export abstract class DomainEvent implements IDomainEvent {
  public readonly occurredOn: Date;
  public readonly eventId: string;

  constructor() {
    this.occurredOn = new Date();
    this.eventId = crypto.randomUUID();
  }
} 