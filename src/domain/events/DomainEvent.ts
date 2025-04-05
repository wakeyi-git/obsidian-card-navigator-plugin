import { DomainEventType } from './DomainEventType';
import { v4 as uuidv4 } from 'uuid';

/**
 * 도메인 이벤트 인터페이스
 * - 모든 도메인 이벤트가 구현해야 하는 인터페이스
 * @template T 이벤트 데이터 타입
 */
export interface IDomainEvent<T = any> {
  /**
   * 이벤트 이름
   */
  readonly eventName: string;

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
   * 이벤트 데이터
   */
  readonly data: T;

  /**
   * 이벤트 미리보기 정보 반환
   * @returns 이벤트 미리보기 정보
   */
  preview(): Record<string, any>;
}

/**
 * 도메인 이벤트 기본 클래스
 * - 모든 도메인 이벤트의 기본 구현체
 * @template T 이벤트 데이터 타입
 */
export abstract class DomainEvent<T = any> implements IDomainEvent<T> {
  /**
   * 이벤트 발생 시간
   */
  public readonly occurredOn: Date;

  /**
   * 이벤트 ID
   */
  public readonly eventId: string;

  /**
   * 이벤트 이름
   */
  public readonly eventName: string;

  /**
   * 이벤트 타입
   */
  public readonly type: DomainEventType;

  /**
   * 이벤트 데이터
   */
  public readonly data: T;

  /**
   * 도메인 이벤트 생성자
   * @param type 이벤트 타입
   * @param data 이벤트 데이터
   */
  constructor(type: DomainEventType, data: T) {
    this.occurredOn = new Date();
    this.eventId = uuidv4();
    this.type = type;
    this.eventName = type.toString();
    this.data = data;
  }

  /**
   * 이벤트 정보를 문자열로 변환
   * @returns 문자열 형태의 이벤트 정보
   */
  toString(): string {
    return `[${this.eventName}] ${JSON.stringify(this.preview())}`;
  }

  /**
   * 이벤트 복제
   * @returns 복제된 이벤트
   */
  clone(): DomainEvent<T> {
    return Object.assign(Object.create(this), this);
  }

  /**
   * 이벤트 미리보기 정보 반환
   * @returns 이벤트 미리보기 정보
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
  /**
   * 초기화
   */
  initialize(): void;

  /**
   * 초기화 여부 확인
   * @returns 초기화 여부
   */
  isInitialized(): boolean;

  /**
   * 정리
   */
  cleanup(): void;

  /**
   * 이벤트 구독
   * @param eventName 이벤트 이름
   * @param callback 콜백 함수
   */
  subscribe<T extends IDomainEvent>(eventName: string, callback: (event: T) => void): void;

  /**
   * 이벤트 구독 해제
   * @param eventName 이벤트 이름
   * @param callback 콜백 함수
   */
  unsubscribe<T extends IDomainEvent>(eventName: string, callback: (event: T) => void): void;

  /**
   * 이벤트 발송
   * @param event 이벤트 객체
   */
  dispatch<T extends IDomainEvent>(event: T): void;
} 