/**
 * 검색 설정 인터페이스
 */
export interface ISearchConfig {
  readonly searchScope: 'all' | 'current';
  readonly searchFilename: boolean;
  readonly searchContent: boolean;
  readonly searchTags: boolean;
  readonly caseSensitive: boolean;
  readonly useRegex: boolean;
}

/**
 * 검색 설정 기본값
 */
export const DEFAULT_SEARCH_CONFIG: ISearchConfig = {
  searchScope: 'all',
  searchFilename: true,
  searchContent: true,
  searchTags: true,
  caseSensitive: false,
  useRegex: false
}; 