import { IDomainEvent } from './DomainEvent';
import { DomainEventType } from './DomainEventType';
import { v4 as uuidv4 } from 'uuid';

/**
 * 간단한 이벤트를 위한 헬퍼 클래스
 * - IDomainEvent 인터페이스 구현을 쉽게 도와주는 유틸리티 클래스
 */
export class SimpleEvent<T = any> implements IDomainEvent<T> {
  public readonly eventName: string;
  public readonly occurredOn: Date;
  public readonly eventId: string;
  public readonly type: DomainEventType;
  public readonly data: T;

  /**
   * 간단한 이벤트 생성
   * @param eventName 이벤트 이름
   * @param type 이벤트 타입
   * @param data 이벤트 데이터
   */
  constructor(eventName: string, type: DomainEventType, data: T) {
    this.eventName = eventName;
    this.occurredOn = new Date();
    this.eventId = uuidv4();
    this.type = type;
    this.data = data;
  }

  /**
   * 이벤트 미리보기 제공
   */
  preview(): Record<string, any> {
    return {
      eventId: this.eventId,
      type: this.type,
      eventName: this.eventName,
      data: this.data,
      occurredOn: this.occurredOn
    };
  }
} 