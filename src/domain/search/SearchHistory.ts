/**
 * 검색 기록 인터페이스
 * 검색 기록 관리 기능을 정의합니다.
 */
export interface ISearchHistory {
  /**
   * 검색 기록 추가
   * @param query 검색어
   */
  addQuery(query: string): void;
  
  /**
   * 검색 기록 가져오기
   * @returns 검색 기록 목록
   */
  getQueries(): string[];
  
  /**
   * 검색 기록 초기화
   */
  clear(): void;
} 