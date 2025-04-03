/**
 * 카드셋 에러 클래스
 */
export class CardSetError extends Error {
  constructor(
    message: string,
    public readonly cardSetId?: string,
    public readonly type?: 'folder' | 'tag' | 'link',
    public readonly operation?: 'create' | 'update' | 'delete' | 'load' | 'filter' | 'sort',
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'CardSetError';
  }

  /**
   * 에러 정보를 문자열로 변환
   */
  toString(): string {
    const details = [
      this.message,
      this.cardSetId && `카드셋 ID: ${this.cardSetId}`,
      this.type && `타입: ${this.type}`,
      this.operation && `작업: ${this.operation}`,
      this.cause && `원인: ${this.cause.message}`
    ].filter(Boolean);

    return details.join('\n');
  }
} 