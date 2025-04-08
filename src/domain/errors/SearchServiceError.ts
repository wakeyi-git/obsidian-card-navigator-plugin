import { ISearchCriteria } from '../models/Search';

/**
 * 검색 서비스 에러 클래스
 */
export class SearchServiceError extends Error {
  constructor(
    message: string,
    public readonly criteria?: ISearchCriteria,
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
      this.criteria?.query && `검색어: ${this.criteria.query}`,
      this.criteria?.scope && `범위: ${this.criteria.scope}`,
      this.criteria?.caseSensitive && `대소문자 구분: ${this.criteria.caseSensitive}`,
      this.criteria?.useRegex && `정규식 사용: ${this.criteria.useRegex}`,
      this.criteria?.wholeWord && `전체 단어 일치: ${this.criteria.wholeWord}`,
      this.operation && `작업: ${this.operation}`,
      this.cause && `원인: ${this.cause.message}`
    ].filter(Boolean);

    return details.join('\n');
  }
} 