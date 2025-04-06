import { IEventMetadata } from '@/domain/events/IEventMetadata';
import { DomainEventType } from './DomainEventType';

/**
 * 도메인 이벤트 인터페이스
 */
export interface IDomainEvent {
  /**
   * 이벤트 ID
   */
  readonly eventId: string;

  /**
   * 이벤트 타입
   */
  readonly type: DomainEventType;

  /**
   * 이벤트 발생 시간
   */
  readonly occurredOn: Date;

  /**
   * 이벤트 메타데이터
   */
  readonly metadata: IEventMetadata;

  /**
   * 이벤트를 문자열로 변환
   */
  toString(): string;

  /**
   * 이벤트 ID 생성
   */
  generateEventId(): string;

  /**
   * 이벤트 복제
   */
  clone(): IDomainEvent;
} 