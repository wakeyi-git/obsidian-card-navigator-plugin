/**
 * 컨테이너 에러 타입
 */
export type ContainerErrorType = 'register' | 'unregister' | 'resolve' | 'clear';

/**
 * 컨테이너 에러 클래스
 */
export class ContainerError extends Error {
  constructor(
    message: string,
    public readonly token: string,
    public readonly errorType: ContainerErrorType,
    public readonly metadata: Record<string, any> = {},
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'ContainerError';
  }

  /**
   * 에러 정보를 문자열로 변환
   */
  toString(): string {
    const details = [
      this.message,
      `서비스: ${this.token}`,
      `에러 타입: ${this.errorType}`,
      Object.keys(this.metadata).length > 0 && `메타데이터: ${JSON.stringify(this.metadata)}`,
      this.cause && `원인: ${this.cause.message}`
    ].filter(Boolean);

    return details.join('\n');
  }
} 