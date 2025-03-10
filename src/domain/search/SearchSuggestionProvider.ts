import { ISearchSuggestion, ISearchSuggestionProvider, SearchType } from './Search';

/**
 * 검색 제안 제공자 인터페이스
 * 검색 제안을 제공합니다.
 */
export interface ISearchSuggestionProviderImpl extends ISearchSuggestionProvider {
  /**
   * 검색 타입 제안 가져오기
   * @returns 검색 타입 제안 목록
   */
  getSearchTypeSuggestions(): ISearchSuggestion[];
  
  /**
   * 검색어 제안 가져오기
   * @param searchType 검색 타입
   * @param partialQuery 부분 검색어
   * @returns 검색어 제안 목록
   */
  getQuerySuggestions(searchType: SearchType, partialQuery: string): Promise<ISearchSuggestion[]>;
  
  /**
   * 프론트매터 키 제안 가져오기
   * @param partialKey 부분 키
   * @returns 프론트매터 키 제안 목록
   */
  getFrontmatterKeySuggestions(partialKey: string): Promise<ISearchSuggestion[]>;
  
  /**
   * 프론트매터 값 제안 가져오기
   * @param key 프론트매터 키
   * @param partialValue 부분 값
   * @returns 프론트매터 값 제안 목록
   */
  getFrontmatterValueSuggestions(key: string, partialValue: string): Promise<ISearchSuggestion[]>;
  
  /**
   * 날짜 제안 가져오기
   * @param searchType 검색 타입 ('create' 또는 'modify')
   * @param partialDate 부분 날짜
   * @returns 날짜 제안 목록
   */
  getDateSuggestions(searchType: 'create' | 'modify', partialDate: string): Promise<ISearchSuggestion[]>;
} 