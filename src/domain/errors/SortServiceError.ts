/**
 * 정렬 서비스 오류 클래스
 */
export class SortServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SortServiceError';
  }
} 