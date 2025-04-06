/**
 * 카드 서비스 에러 클래스
 */
export class CardServiceError extends Error {
  constructor(
    message: string,
    public readonly cardId?: string,
    public readonly fileName?: string,
    public readonly operation?: 'create' | 'update' | 'delete' | 'load' | 'render' | 'initialize' | 'cleanup' | 'display' | 'select' | 'focus' | 'scroll' | 'updateStyle' | 'updateRenderConfig' | 'updateVisibility' | 'updateZIndex' | 'updateCache' | 'removeCache' | 'clearCache' | 'updateConfig' | 'subscribe' | 'unsubscribe' | 'requestRender',
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'CardServiceError';
  }

  /**
   * 에러 정보를 문자열로 변환
   */
  toString(): string {
    const details = [
      this.message,
      this.cardId && `카드 ID: ${this.cardId}`,
      this.fileName && `파일명: ${this.fileName}`,
      this.operation && `작업: ${this.operation}`,
      this.cause && `원인: ${this.cause.message}`
    ].filter(Boolean);

    return details.join('\n');
  }
} 