/**
 * 포커스 서비스 에러
 */
export class FocusServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FocusServiceError';
  }
} 