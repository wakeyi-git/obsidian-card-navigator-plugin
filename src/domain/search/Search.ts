import { ICard } from '../card/Card';
import { CardSetSourceType, CardSetType } from '../cardset/CardSet';

/**
 * 검색 타입
 * 검색 대상을 정의합니다.
 */
export type SearchType = 'filename' | 'content' | 'tag' | 'path' | 'frontmatter' | 'create' | 'modify' | 'regex' | 'folder' | 'title' | 'file' | 'complex' | 'date';

/**
 * 검색 범위 타입
 * 검색 범위를 정의합니다.
 */
export type SearchScope = 'all' | 'current';

/**
 * 검색 필드 인터페이스
 * 다중 필드 검색을 위한 인터페이스입니다.
 */
export interface ISearchField {
  /**
   * 검색 필드 타입
   */
  type: string;
  
  /**
   * 검색어
   */
  query: string;
  
  /**
   * 검색 타입
   */
  searchType: SearchType;
  
  /**
   * 대소문자 구분 여부
   */
  caseSensitive: boolean;
  
  /**
   * 프론트매터 키 (frontmatter 타입인 경우)
   */
  frontmatterKey?: string;
  
  /**
   * 날짜 범위 (create, modify 타입인 경우)
   */
  dateRange?: {
    /**
     * 시작일
     */
    start?: string;
    
    /**
     * 종료일
     */
    end?: string;
  };
}

/**
 * 검색 제안 인터페이스
 * 검색어 자동 완성을 위한 인터페이스입니다.
 */
export interface ISearchSuggestion {
  /**
   * 제안 텍스트
   */
  text: string;
  
  /**
   * 제안 타입
   */
  type: SearchType;
  
  /**
   * 제안 설명
   */
  description?: string;
  
  /**
   * 강조 위치
   * 검색어와 일치하는 부분의 시작 인덱스와 끝 인덱스
   */
  highlightIndices?: [number, number][];
}

/**
 * 검색 제안 그룹 인터페이스
 * 검색 제안을 그룹화하기 위한 인터페이스입니다.
 */
export interface ISearchSuggestionGroup {
  /**
   * 그룹 제목
   */
  title: string;
  
  /**
   * 그룹 내 제안 목록
   */
  suggestions: ISearchSuggestion[];
}

/**
 * 검색 제안 제공자 인터페이스
 * 검색 제안을 제공하기 위한 인터페이스입니다.
 */
export interface ISearchSuggestionProvider {
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

/**
 * 검색 인터페이스
 * 검색 기능을 정의합니다.
 */
export interface ISearch {
  /**
   * 검색 타입 가져오기
   * @returns 검색 타입
   */
  getType(): SearchType;
  
  /**
   * 검색어 가져오기
   * @returns 검색어
   */
  getQuery(): string;
  
  /**
   * 대소문자 구분 여부 가져오기
   * @returns 대소문자 구분 여부
   */
  isCaseSensitive(): boolean;
  
  /**
   * 검색 필드 목록 가져오기
   * 다중 필드 검색인 경우 여러 검색 필드를 반환합니다.
   * @returns 검색 필드 목록
   */
  getSearchFields(): ISearchField[];
  
  /**
   * 카드가 검색 조건과 일치하는지 확인
   * @param card 확인할 카드
   * @returns 일치 여부
   */
  match(card: ICard): Promise<boolean>;
}

/**
 * 검색 카드 세트 상태 인터페이스
 * 검색 카드 세트의 상태를 정의합니다.
 */
export interface ISearchCardSetSourceState {
  /**
   * 검색 쿼리
   */
  query: string;
  
  /**
   * 검색 타입
   */
  searchType: SearchType;
  
  /**
   * 대소문자 구분 여부
   */
  caseSensitive: boolean;
  
  /**
   * 프론트매터 키 (검색 타입이 frontmatter인 경우)
   */
  frontmatterKey?: string;
  
  /**
   * 검색 범위
   */
  searchScope: SearchScope;
  
  /**
   * 검색 필드 목록
   * 다중 필드 검색인 경우 여러 검색 필드를 포함합니다.
   */
  searchFields?: ISearchField[];
  
  /**
   * 검색 카드 세트 전환 전 카드셋
   */
  preSearchCards: ICard[];
  
  /**
   * 검색 카드 세트 전환 전 카드 세트
   */
  previousCardSetSource: CardSetSourceType;
  
  /**
   * 검색 카드 세트 전환 전 카드 세트
   */
  previousCardSet: string | null;
  
  /**
   * 검색 카드 세트 전환 전 카드 세트 타입
   */
  previousCardSetType: CardSetType;
} 