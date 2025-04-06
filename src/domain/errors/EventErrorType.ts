/**
 * 이벤트 에러 타입
 */
export enum EventErrorType {
  /**
   * 이벤트 발송 실패
   */
  DISPATCH = 'dispatch',

  /**
   * 이벤트 핸들러 등록 실패
   */
  SUBSCRIBE = 'subscribe',

  /**
   * 이벤트 핸들러 해제 실패
   */
  UNSUBSCRIBE = 'unsubscribe',

  /**
   * 이벤트 핸들러 실행 실패
   */
  HANDLE = 'handle',

  /**
   * 이벤트 유효성 검사 실패
   */
  VALIDATION = 'validation'
} 