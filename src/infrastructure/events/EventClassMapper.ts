import { IDomainEvent } from '../../domain/events/DomainEvent';
import { CardCreatedEvent, CardUpdatedEvent, CardDeletedEvent, CardStyleChangedEvent, CardPositionChangedEvent } from '../../domain/events/CardEvents';

/**
 * 이벤트 클래스 타입
 */
type EventClassType = new (...args: any[]) => IDomainEvent;

/**
 * 이벤트 클래스 매퍼
 */
export class EventClassMapper {
  private static readonly eventMap: Map<string, EventClassType> = new Map();

  /**
   * 이벤트 클래스들을 초기화합니다.
   */
  private static initializeEventMap(): void {
    this.eventMap.set('CardCreatedEvent', CardCreatedEvent);
    this.eventMap.set('CardUpdatedEvent', CardUpdatedEvent);
    this.eventMap.set('CardDeletedEvent', CardDeletedEvent);
    this.eventMap.set('CardStyleChangedEvent', CardStyleChangedEvent);
    this.eventMap.set('CardPositionChangedEvent', CardPositionChangedEvent);
  }

  /**
   * 이벤트 타입에 해당하는 클래스를 반환합니다.
   */
  static getEventClass(eventType: string): EventClassType {
    if (this.eventMap.size === 0) {
      this.initializeEventMap();
    }

    const eventClass = this.eventMap.get(eventType);
    if (!eventClass) {
      throw new Error(`Unknown event type: ${eventType}`);
    }
    return eventClass;
  }

  /**
   * 이벤트 클래스를 등록합니다.
   */
  static registerEventClass(eventType: string, eventClass: EventClassType): void {
    this.eventMap.set(eventType, eventClass);
  }
} 