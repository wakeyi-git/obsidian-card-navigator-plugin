/**
 * 도메인 이벤트 인터페이스
 */
export interface IDomainEvent {
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
  readonly type: string;

  /**
   * 이벤트 발생 시간
   */
  readonly timestamp: Date;
}

/**
 * 도메인 이벤트 타입
 */
export type DomainEventType = 
  | 'card-set-created'
  | 'card-set-updated'
  | 'card-set-deleted'
  | 'card-created'
  | 'card-updated'
  | 'card-deleted'
  | 'card-selected'
  | 'card-focused'
  | 'card-dragged'
  | 'card-dropped'
  | 'preset-created'
  | 'preset-updated'
  | 'preset-deleted'
  | 'layout:configUpdated'
  | 'layout:modeChanged'
  | 'layout:cardWidthChanged'
  | 'layout:cardHeightChanged'
  | 'layout:cardPositionUpdated'
  | 'layout:changed'
  | 'layout:resized';

/**
 * 도메인 이벤트 기본 클래스
 */
export abstract class DomainEvent implements IDomainEvent {
  readonly eventId: string;
  readonly type: DomainEventType;
  readonly timestamp: Date;
  readonly occurredOn: Date;

  constructor(type: DomainEventType) {
    this.eventId = crypto.randomUUID();
    this.type = type;
    this.timestamp = new Date();
    this.occurredOn = new Date();
  }

  /**
   * 이벤트 데이터를 문자열로 변환
   */
  toString(): string {
    return `[${this.type}]`;
  }

  /**
   * 이벤트 데이터를 복사
   */
  clone(): DomainEvent {
    return Object.assign(Object.create(this), this);
  }
}

/**
 * 카드셋 이벤트
 */
export class CardSetCreatedEvent extends DomainEvent {
  constructor() {
    super('card-set-created');
  }
}

export class CardSetUpdatedEvent extends DomainEvent {
  constructor() {
    super('card-set-updated');
  }
}

export class CardSetDeletedEvent extends DomainEvent {
  constructor() {
    super('card-set-deleted');
  }
}

/**
 * 카드 이벤트
 */
export class CardCreatedEvent extends DomainEvent {
  constructor() {
    super('card-created');
  }
}

export class CardUpdatedEvent extends DomainEvent {
  constructor() {
    super('card-updated');
  }
}

export class CardDeletedEvent extends DomainEvent {
  constructor() {
    super('card-deleted');
  }
}

/**
 * 카드 포커스 이벤트
 */
export class CardFocusedEvent extends DomainEvent {
  constructor() {
    super('card-focused');
  }
}

export class CardSelectedEvent extends DomainEvent {
  constructor() {
    super('card-selected');
  }
}

export class CardDraggedEvent extends DomainEvent {
  constructor() {
    super('card-dragged');
  }
}

export class CardDroppedEvent extends DomainEvent {
  constructor() {
    super('card-dropped');
  }
}

/**
 * 프리셋 이벤트
 */
export class PresetCreatedEvent extends DomainEvent {
  constructor() {
    super('preset-created');
  }
}

export class PresetUpdatedEvent extends DomainEvent {
  constructor() {
    super('preset-updated');
  }
}

export class PresetDeletedEvent extends DomainEvent {
  constructor() {
    super('preset-deleted');
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