import { IDomainEvent } from './DomainEvent';

/**
 * 이벤트 저장소 인터페이스
 */
export interface IEventStore {
  /**
   * 이벤트를 저장합니다.
   */
  save(event: IDomainEvent): Promise<void>;

  /**
   * 특정 ID의 이벤트를 조회합니다.
   */
  findById(eventId: string): Promise<IDomainEvent | null>;

  /**
   * 특정 시간 범위의 이벤트들을 조회합니다.
   */
  findByDateRange(startDate: Date, endDate: Date): Promise<IDomainEvent[]>;

  /**
   * 모든 이벤트를 조회합니다.
   */
  findAll(): Promise<IDomainEvent[]>;

  /**
   * 마지막으로 저장된 이벤트를 조회합니다.
   */
  findLastEvent(): Promise<IDomainEvent | null>;

  /**
   * 모든 이벤트를 조회합니다.
   */
  getEvents(): Promise<IDomainEvent[]>;

  /**
   * 특정 타입의 이벤트를 조회합니다.
   */
  getEventsByType(type: string): Promise<IDomainEvent[]>;

  /**
   * 모든 이벤트를 삭제합니다.
   */
  deleteAll(): Promise<void>;
} 