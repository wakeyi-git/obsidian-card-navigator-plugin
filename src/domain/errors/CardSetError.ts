/**
 * 카드셋 에러 클래스
 */
export class CardSetError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CardSetError';
  }

  /**
   * 에러 정보를 문자열로 변환
   */
  toString(): string {
    const details = [
      this.message,
    ].filter(Boolean);

    return details.join('\n');
  }
} 