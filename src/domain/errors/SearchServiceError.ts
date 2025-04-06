import { SearchScope } from '../models/SearchResult';

/**
 * 검색 서비스 에러 클래스
 */
export class SearchServiceError extends Error {
  constructor(
    message: string,
    public readonly query?: string,
    public readonly scope?: SearchScope,
    public readonly operation?: 'search' | 'filter' | 'highlight',
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'SearchServiceError';
  }

  /**
   * 에러 정보를 문자열로 변환
   */
  toString(): string {
    const details = [
      this.message,
      this.query && `검색어: ${this.query}`,
      this.scope && `범위: ${this.scope}`,
      this.operation && `작업: ${this.operation}`,
      this.cause && `원인: ${this.cause.message}`
    ].filter(Boolean);

    return details.join('\n');
  }
} 