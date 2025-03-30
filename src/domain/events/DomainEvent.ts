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

  /**
   * 이벤트 타입
   */
  type: string;
}

/**
 * 도메인 이벤트 기본 클래스
 */
export abstract class DomainEvent {
  /**
   * 이벤트 발생 시간
   */
  public readonly timestamp: number;

  /**
   * 생성자
   * @param type 이벤트 타입
   */
  constructor(public readonly type: string) {
    this.timestamp = Date.now();
  }
}

/**
 * 카드셋 이벤트
 */
export class CardSetCreatedEvent extends DomainEvent {
  constructor(public readonly cardSet: any) {
    super("CardSetCreated");
  }
}

export class CardSetUpdatedEvent extends DomainEvent {
  constructor(public readonly cardSet: any) {
    super("CardSetUpdated");
  }
}

export class CardSetDeletedEvent extends DomainEvent {
  constructor(public readonly cardSetId: string) {
    super("CardSetDeleted");
  }
}

/**
 * 카드 이벤트
 */
export class CardCreatedEvent extends DomainEvent {
  constructor(public readonly card: any) {
    super("CardCreated");
  }
}

export class CardUpdatedEvent extends DomainEvent {
  constructor(public readonly card: any) {
    super("CardUpdated");
  }
}

export class CardDeletedEvent extends DomainEvent {
  constructor(public readonly cardId: string) {
    super("CardDeleted");
  }
}

/**
 * 카드 포커스 이벤트
 */
export class CardFocusedEvent extends DomainEvent {
  constructor(public readonly card: any) {
    super("CardFocused");
  }
}

export class CardBlurredEvent extends DomainEvent {
  constructor() {
    super("CardBlurred");
  }
}

/**
 * 프리셋 이벤트
 */
export class PresetCreatedEvent extends DomainEvent {
  constructor(public readonly preset: any) {
    super("PresetCreated");
  }
}

export class PresetUpdatedEvent extends DomainEvent {
  constructor(public readonly preset: any) {
    super("PresetUpdated");
  }
}

export class PresetDeletedEvent extends DomainEvent {
  constructor(public readonly presetId: string) {
    super("PresetDeleted");
  }
}

/**
 * 도메인 이벤트 핸들러 인터페이스
 */
export interface IDomainEventHandler<T extends DomainEvent> {
  handle(event: T): Promise<void>;
}

/**
 * 도메인 이벤트 디스패처 인터페이스
 */
export interface IDomainEventDispatcher {
  register<T extends DomainEvent>(
    eventType: string,
    handler: IDomainEventHandler<T>
  ): void;
  dispatch(event: DomainEvent): void;
} 