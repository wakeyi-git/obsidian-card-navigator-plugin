/**
 * 도메인 오류 기본 클래스
 * 모든 도메인 관련 오류의 기본 클래스입니다.
 */
export class DomainError extends Error {
  /**
   * 생성자
   * @param message 오류 메시지
   */
  constructor(message: string) {
    super(message);
    this.name = 'DomainError';
  }
}

/**
 * 카드 관련 오류 클래스
 */
export class CardError extends DomainError {
  /**
   * 생성자
   * @param message 오류 메시지
   */
  constructor(message: string) {
    super(message);
    this.name = 'CardError';
  }
}

/**
 * 카드셋 관련 오류 클래스
 */
export class CardSetError extends DomainError {
  /**
   * 생성자
   * @param message 오류 메시지
   */
  constructor(message: string) {
    super(message);
    this.name = 'CardSetError';
  }
}

/**
 * 검색 관련 오류 클래스
 */
export class SearchError extends DomainError {
  /**
   * 생성자
   * @param message 오류 메시지
   */
  constructor(message: string) {
    super(message);
    this.name = 'SearchError';
  }
}

/**
 * 레이아웃 관련 오류 클래스
 */
export class LayoutError extends DomainError {
  /**
   * 생성자
   * @param message 오류 메시지
   */
  constructor(message: string) {
    super(message);
    this.name = 'LayoutError';
  }
}

/**
 * 초기화 관련 오류 클래스
 */
export class InitializationError extends DomainError {
  /**
   * 생성자
   * @param message 오류 메시지
   */
  constructor(message: string) {
    super(message);
    this.name = 'InitializationError';
  }
}

/**
 * 설정 관련 오류 클래스
 */
export class SettingsError extends DomainError {
  /**
   * 생성자
   * @param message 오류 메시지
   */
  constructor(message: string) {
    super(message);
    this.name = 'SettingsError';
  }
} 