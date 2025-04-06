import { DomainEventType, EventDataType } from './DomainEventType';
import { ICard } from '../models/Card';
import { IPreset } from '../models/Preset';
import { TFile } from 'obsidian';
import { ILayoutConfig } from '../models/LayoutConfig';
import { ICardSet } from '../models/CardSet';

/**
 * 이벤트 데이터 타입
 */
export type EventData = 
  | ICard
  | IPreset
  | TFile
  | ICardSet
  | null
  | void
  | { expiredCount: number; currentSize: number }
  | { key: string; currentSize: number }
  | { previousSize: number; currentSize: number }
  | { sourceCard: ICard; targetCard: ICard }
  | { viewType: string }
  | { action: string }
  | { width: number; height: number; layoutConfig: ILayoutConfig }
  | { file: TFile; link: string }
  | { file: TFile; content: string }
  | { files: TFile[]; links: string }
  | { files: TFile[]; contents: string };

/**
 * 도메인 이벤트 인터페이스
 * - 모든 도메인 이벤트가 구현해야 하는 인터페이스
 * @template T 이벤트 타입
 */
export interface IDomainEvent<T extends DomainEventType> {
  /**
   * 이벤트 이름
   */
  readonly eventName: T;

  /**
   * 이벤트 발생 시간
   */
  readonly timestamp: number;

  /**
   * 이벤트 데이터
   */
  readonly data: T extends keyof EventDataType ? EventDataType[T] : never;

  /**
   * 이벤트 미리보기 정보 반환
   * @returns 이벤트 미리보기 정보
   */
  preview(): Record<string, unknown>;
}

/**
 * 도메인 이벤트 기본 클래스
 * - 모든 도메인 이벤트의 기본 구현체
 * @template T 이벤트 타입
 */
export class DomainEvent<T extends DomainEventType> implements IDomainEvent<T> {
  constructor(
    public readonly eventName: T,
    public readonly data: T extends keyof EventDataType ? EventDataType[T] : never,
    public readonly timestamp: number = Date.now()
  ) {}

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
    return new DomainEvent(this.eventName, this.data, this.timestamp);
  }

  /**
   * 이벤트 미리보기 정보 반환
   * @returns 이벤트 미리보기 정보
   */
  preview(): Record<string, unknown> {
    return {
      eventName: this.eventName,
      data: this.data,
      timestamp: this.timestamp
    };
  }
}

/**
 * 이벤트 메타데이터 인터페이스
 */
export interface IEventMetadata {
  source?: string;
  target?: string;
  context?: Record<string, unknown>;
  error?: Error;
}

/**
 * 이벤트 핸들러 인터페이스
 */
export interface IEventHandler<T extends DomainEvent<DomainEventType>> {
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
  subscribe<T extends DomainEventType>(eventName: T, callback: (event: DomainEvent<T>) => void): void;

  /**
   * 이벤트 구독 해제
   * @param eventName 이벤트 이름
   * @param callback 콜백 함수
   */
  unsubscribe<T extends DomainEventType>(eventName: T, callback: (event: DomainEvent<T>) => void): void;

  /**
   * 이벤트 발송
   * @param event 이벤트 객체
   */
  dispatch<T extends DomainEventType>(event: DomainEvent<T>): void;
} 