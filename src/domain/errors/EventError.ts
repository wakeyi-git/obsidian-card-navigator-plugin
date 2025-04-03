/**
 * 이벤트 에러 타입
 */
export type EventErrorType =
  | 'dispatch'
  | 'subscribe'
  | 'unsubscribe'
  | 'handle'
  | 'validation';

/**
 * 이벤트 에러 클래스
 */
export class EventError extends Error {
  constructor(
    message: string,
    public readonly eventType: string,
    public readonly errorType: EventErrorType,
    public readonly metadata: Record<string, any> = {},
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'EventError';
  }

  /**
   * 에러 정보를 문자열로 변환
   */
  toString(): string {
    const details = [
      this.message,
      `이벤트 타입: ${this.eventType}`,
      `에러 타입: ${this.errorType}`,
      Object.keys(this.metadata).length > 0 && `메타데이터: ${JSON.stringify(this.metadata)}`,
      this.cause && `원인: ${this.cause.message}`
    ].filter(Boolean);

    return details.join('\n');
  }
} 