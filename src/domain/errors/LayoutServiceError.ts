/**
 * 레이아웃 서비스 에러 클래스
 */
export class LayoutServiceError extends Error {
  constructor(
    message: string,
    public readonly layoutType?: string,
    public readonly viewportSize?: { width: number; height: number },
    public readonly cardCount?: number,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'LayoutServiceError';
  }

  /**
   * 에러 정보를 문자열로 변환
   */
  toString(): string {
    const details = [
      this.message,
      this.layoutType && `레이아웃 타입: ${this.layoutType}`,
      this.viewportSize && `뷰포트 크기: ${this.viewportSize.width}x${this.viewportSize.height}`,
      this.cardCount && `카드 수: ${this.cardCount}`,
      this.cause && `원인: ${this.cause.message}`
    ].filter(Boolean);

    return details.join('\n');
  }
} 