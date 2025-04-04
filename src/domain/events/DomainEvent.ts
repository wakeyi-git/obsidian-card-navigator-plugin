import { DomainEventType } from './DomainEventType';
import { v4 as uuidv4 } from 'uuid';

/**
 * 도메인 이벤트 인터페이스
 */
export interface IDomainEvent<T = any> {
  /**
   * 이벤트 발생 시간
   */
  readonly occurredOn: Date;

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
  readonly timestamp: Date;

  /**
   * 이벤트 데이터
   */
  readonly data: T;
}

/**
 * 도메인 이벤트 기본 클래스
 */
export abstract class DomainEvent<T = any> {
  /**
   * 이벤트 생성 시간
   */
  public readonly timestamp: Date;

  /**
   * 이벤트 ID
   */
  public readonly id: string;

  /**
   * 이벤트 타입
   */
  public readonly type: DomainEventType;

  /**
   * 이벤트 데이터
   */
  public readonly data: T;

  /**
   * 생성자
   * @param type 이벤트 타입
   * @param data 이벤트 데이터
   */
  constructor(type: DomainEventType, data: T) {
    this.timestamp = new Date();
    this.id = uuidv4();
    this.type = type;
    this.data = data;
  }

  /**
   * 이벤트 데이터를 문자열로 변환
   */
  toString(): string {
    return `[${this.type}] ${JSON.stringify(this.data)}`;
  }

  /**
   * 이벤트 데이터를 복사
   */
  clone(): DomainEvent<T> {
    return Object.assign(Object.create(this), this);
  }
}

/**
 * 카드셋 이벤트
 */
export class CardSetCreatedEvent extends DomainEvent<null> {
  constructor() {
    super(DomainEventType.CARDSET_CREATED, null);
  }
}

export class CardSetUpdatedEvent extends DomainEvent<null> {
  constructor() {
    super(DomainEventType.CARDSET_UPDATED, null);
  }
}

export class CardSetDeletedEvent extends DomainEvent<null> {
  constructor() {
    super(DomainEventType.CARDSET_DELETED, null);
  }
}

/**
 * 카드 이벤트
 */
export class CardCreatedEvent extends DomainEvent<null> {
  constructor() {
    super(DomainEventType.CARD_CREATED, null);
  }
}

export class CardUpdatedEvent extends DomainEvent<null> {
  constructor() {
    super(DomainEventType.CARD_UPDATED, null);
  }
}

export class CardDeletedEvent extends DomainEvent<null> {
  constructor() {
    super(DomainEventType.CARD_DELETED, null);
  }
}

/**
 * 카드 포커스 이벤트
 */
export class CardFocusedEvent extends DomainEvent<null> {
  constructor() {
    super(DomainEventType.CARD_FOCUSED, null);
  }
}

export class CardSelectedEvent extends DomainEvent<null> {
  constructor() {
    super(DomainEventType.CARD_SELECTED, null);
  }
}

export class CardDraggedEvent extends DomainEvent<null> {
  constructor() {
    super(DomainEventType.CARD_DRAGGED, null);
  }
}

export class CardDroppedEvent extends DomainEvent<null> {
  constructor() {
    super(DomainEventType.CARD_DROPPED, null);
  }
}

/**
 * 프리셋 이벤트
 */
export class PresetCreatedEvent extends DomainEvent<null> {
  constructor() {
    super(DomainEventType.PRESET_CREATED, null);
  }
}

export class PresetUpdatedEvent extends DomainEvent<null> {
  constructor() {
    super(DomainEventType.PRESET_UPDATED, null);
  }
}

export class PresetDeletedEvent extends DomainEvent<null> {
  constructor() {
    super(DomainEventType.PRESET_DELETED, null);
  }
}

/**
 * 이벤트 메타데이터 인터페이스
 */
export interface IEventMetadata {
  source?: string;
  target?: string;
  context?: Record<string, any>;
  error?: Error;
}

/**
 * 이벤트 핸들러 인터페이스
 */
export interface IEventHandler<T extends DomainEvent> {
  handle(event: T): Promise<void> | void;
}

/**
 * 이벤트 디스패처 인터페이스
 */
export interface IEventDispatcher {
  dispatch<T extends DomainEvent>(event: T): Promise<void>;
  subscribe<T extends DomainEvent>(
    eventType: DomainEventType,
    handler: IEventHandler<T>
  ): void;
  unsubscribe<T extends DomainEvent>(
    eventType: DomainEventType,
    handler: IEventHandler<T>
  ): void;
  clear(): void;
} 