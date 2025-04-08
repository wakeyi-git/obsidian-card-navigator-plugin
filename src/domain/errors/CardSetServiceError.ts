/**
 * 카드셋 서비스 오류 클래스
 */
export class CardSetServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CardSetServiceError';
  }
} 