/**
 * 도메인 에러 기본 클래스
 */
export class DomainError extends Error {
  constructor(
    public readonly domain: string,
    public readonly code: string,
    message: string
  ) {
    super(message);
    this.name = 'DomainError';
  }
} 