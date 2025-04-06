import { SearchScope } from './SearchResult';
import { ICard } from './Card';

/**
 * 검색 설정 인터페이스
 */
export interface ISearchConfig {
  /**
   * 검색 범위
   */
  scope: SearchScope;

  /**
   * 대소문자 구분 여부
   */
  caseSensitive: boolean;

  /**
   * 정규식 사용 여부
   */
  useRegex: boolean;

  /**
   * 검색 필드
   */
  fields: {
    /**
     * 파일명 검색 여부
     */
    filename: boolean;

    /**
     * 내용 검색 여부
     */
    content: boolean;

    /**
     * 태그 검색 여부
     */
    tags: boolean;

    /**
     * 프론트매터 검색 여부
     */
    frontmatter: boolean;
  };

  /**
   * 실시간 검색
   */
  realtimeSearch: boolean;

  /**
   * 검색 결과 제한
   */
  resultLimit: number;

  /**
   * 현재 파일 경로
   */
  currentFilePath: string;
}

/**
 * 기본 검색 설정
 */
export const DEFAULT_SEARCH_CONFIG: ISearchConfig = {
  scope: SearchScope.ALL,
  caseSensitive: false,
  useRegex: false,
  fields: {
    filename: true,
    content: true,
    tags: true,
    frontmatter: true
  },
  realtimeSearch: true,
  resultLimit: 100,
  currentFilePath: ''
}; 