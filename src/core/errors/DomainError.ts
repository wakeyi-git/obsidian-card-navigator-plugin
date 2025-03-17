import { ErrorCode, IErrorPayloads } from './ErrorTypes';

/**
 * 도메인 에러 클래스
 */
export class DomainError<T extends keyof IErrorPayloads> extends Error {
  /**
   * 에러 코드
   */
  readonly code: T;

  /**
   * 에러 페이로드
   */
  readonly payload: IErrorPayloads[T];

  /**
   * 생성자
   * @param code 에러 코드
   * @param payload 에러 페이로드
   */
  constructor(code: T, payload: Omit<IErrorPayloads[T], 'timestamp' | 'source'> & { timestamp?: number; source?: string }) {
    super();
    this.code = code;
    this.payload = {
      ...payload,
      timestamp: payload.timestamp || Date.now(),
      source: payload.source || 'system'
    } as IErrorPayloads[T];
  }

  /**
   * 에러를 문자열로 변환
   */
  toString(): string {
    return `DomainError(${this.code}): ${JSON.stringify(this.payload)}`;
  }
}

/**
 * 에러 핸들러 타입
 */
export type ErrorHandler<T extends keyof IErrorPayloads> = (error: DomainError<T>) => void | Promise<void>;

/**
 * 에러 구독 정보
 */
export interface IErrorSubscription {
  /**
   * 구독 해제 함수
   */
  unsubscribe: () => void;
}

/**
 * 에러 버스 인터페이스
 */
export interface IErrorBus {
  /**
   * 에러 발행
   * @param code 에러 코드
   * @param payload 에러 페이로드
   * @param source 에러 소스
   */
  publish<T extends keyof IErrorPayloads>(
    code: T,
    payload: Omit<IErrorPayloads[T], 'timestamp' | 'source'>,
    source?: string
  ): Promise<void>;

  /**
   * 에러 구독
   * @param code 에러 코드
   * @param handler 에러 핸들러
   * @returns 구독 정보
   */
  subscribe<T extends keyof IErrorPayloads>(
    code: T,
    handler: ErrorHandler<T>
  ): IErrorSubscription;

  /**
   * 모든 에러 구독 해제
   */
  unsubscribeAll(): void;
}

/**
 * 카드 관련 오류 클래스
 */
export class CardError extends DomainError<typeof ErrorCode.CARD_ERROR> {
  /**
   * 생성자
   * @param message 오류 메시지
   */
  constructor(cardId: string) {
    super(ErrorCode.CARD_ERROR, { cardId });
  }
}

/**
 * 카드셋 관련 오류 클래스
 */
export class CardSetError extends DomainError<typeof ErrorCode.CARD_SET_ERROR> {
  /**
   * 생성자
   * @param message 오류 메시지
   */
  constructor(cardSetId: string) {
    super(ErrorCode.CARD_SET_ERROR, { cardSetId });
  }
}

/**
 * 검색 관련 오류 클래스
 */
export class SearchError extends DomainError<typeof ErrorCode.SEARCH_ERROR> {
  /**
   * 생성자
   * @param message 오류 메시지
   */
  constructor(query: string) {
    super(ErrorCode.SEARCH_ERROR, { query });
  }
}

/**
 * 레이아웃 관련 오류 클래스
 */
export class LayoutError extends DomainError<typeof ErrorCode.LAYOUT_ERROR> {
  /**
   * 생성자
   * @param message 오류 메시지
   */
  constructor(layout: string) {
    super(ErrorCode.LAYOUT_ERROR, { layout });
  }
}

/**
 * 초기화 관련 오류 클래스
 */
export class InitializationError extends DomainError<typeof ErrorCode.INITIALIZATION_ERROR> {
  /**
   * 생성자
   * @param message 오류 메시지
   */
  constructor(component: string) {
    super(ErrorCode.INITIALIZATION_ERROR, { component });
  }
}

/**
 * 설정 관련 오류 클래스
 */
export class SettingsError extends DomainError<typeof ErrorCode.SETTINGS_ERROR> {
  /**
   * 생성자
   * @param message 오류 메시지
   */
  constructor(setting: string) {
    super(ErrorCode.SETTINGS_ERROR, { setting });
  }
}

/**
 * 카드 리스트 관련 오류 클래스
 */
export class CardListError extends DomainError<typeof ErrorCode.CARD_LIST_ERROR> {
  /**
   * 생성자
   * @param message 오류 메시지
   */
  constructor(filter?: string) {
    super(ErrorCode.CARD_LIST_ERROR, { filter });
  }
} 