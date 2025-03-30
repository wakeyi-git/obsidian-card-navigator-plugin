/**
 * 레이아웃 서비스 에러 클래스
 */
export class LayoutServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LayoutServiceError';
  }
} 