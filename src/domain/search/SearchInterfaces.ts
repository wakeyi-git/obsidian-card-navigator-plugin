import { ICard } from '../card/Card';
import { CardSetSourceType, CardSetType, ICardSetSource } from '../cardset/CardSet';
import { ISearch, SearchType, SearchScope } from './Search';

/**
 * 검색 관리 인터페이스
 * 검색 객체 관리 기능을 제공합니다.
 */
export interface ISearchManager {
  /**
   * 현재 검색 가져오기
   * @returns 현재 검색
   */
  getCurrentSearch(): ISearch | null;
  
  /**
   * 검색 설정 
   * @param search 설정할 검색
   */
  setSearch(search: ISearch): void;
  
  /**
   * 검색 초기화
   */
  clearSearch(): void;
  
  /**
   * 검색 타입 변경
   * @param type 변경할 검색 타입
   * @param frontmatterKey 프론트매터 키 (frontmatter 타입인 경우)
   */
  changeSearchType(type: SearchType, frontmatterKey?: string): void;
  
  /**
   * 검색 타입 설정
   * @param searchType 검색 타입
   * @param frontmatterKey 프론트매터 키 (검색 타입이 frontmatter인 경우)
   */
  setSearchType(searchType: SearchType, frontmatterKey?: string): void;
  
  /**
   * 검색 타입 가져오기
   * @returns 검색 타입
   */
  getSearchType(): SearchType;
}

/**
 * 검색 쿼리 관리 인터페이스
 * 검색 쿼리 관련 기능을 제공합니다.
 */
export interface ISearchQueryManager {
  /**
   * 검색어 설정
   * @param query 검색어
   */
  setQuery(query: string): void;
  
  /**
   * 검색어 설정 (검색 타입 자동 선택)
   * @param query 검색어
   */
  setSearchQuery(query: string): void;
  
  /**
   * 대소문자 구분 설정
   * @param caseSensitive 대소문자 구분 여부
   */
  setCaseSensitive(caseSensitive: boolean): void;
  
  /**
   * 검색 쿼리 가져오기
   * @returns 검색 쿼리
   */
  getQuery(): string;
  
  /**
   * 대소문자 구분 여부 가져오기
   * @returns 대소문자 구분 여부
   */
  isCaseSensitive(): boolean;
  
  /**
   * 프론트매터 키 가져오기
   * @returns 프론트매터 키
   */
  getFrontmatterKey(): string | undefined;
  
  /**
   * 프론트매터 키 설정
   * @param key 프론트매터 키
   */
  setFrontmatterKey(key: string): void;
}

/**
 * 검색 적용 인터페이스
 * 검색 적용 관련 기능을 제공합니다.
 */
export interface ISearchApplier {
  /**
   * 검색 적용
   * @param cards 카드 목록
   * @returns 검색된 카드 목록
   */
  applySearch(cards: ICard[]): Promise<ICard[]>;
  
  /**
   * 복합 검색 실행
   * @param query 복합 검색어 (스페이스로 구분)
   * @param cards 검색할 카드 목록
   * @returns 검색 결과 카드 목록
   */
  applyComplexSearch(query: string, cards: ICard[]): Promise<ICard[]>;
  
  /**
   * 검색 결과 파일 목록 가져오기
   * @param query 검색 쿼리
   * @param searchType 검색 타입
   * @param caseSensitive 대소문자 구분 여부
   * @param frontmatterKey 프론트매터 키
   * @returns 파일 경로 목록
   */
  getFilesForSearch(
    query: string, 
    searchType: SearchType, 
    caseSensitive: boolean, 
    frontmatterKey?: string
  ): Promise<string[]>;
  
  /**
   * 검색 결과에서 검색어 강조 정보 가져오기
   * @param card 카드
   * @returns 강조 정보 (검색어, 위치 등)
   */
  getHighlightInfo(card: ICard): { text: string, positions: number[] }[];
}

/**
 * 검색 기록 관리 인터페이스
 * 검색 기록 관련 기능을 제공합니다.
 */
export interface ISearchHistoryManager {
  /**
   * 검색 기록 저장
   * @param query 검색어
   */
  saveSearchHistory(query: string): void;
  
  /**
   * 검색 기록 가져오기
   * @returns 검색 기록 목록
   */
  getSearchHistory(): string[];
  
  /**
   * 검색 기록 삭제
   */
  clearSearchHistory(): void;
}

/**
 * 검색 범위 관리 인터페이스
 * 검색 범위 관련 기능을 제공합니다.
 */
export interface ISearchScopeManager {
  /**
   * 검색 범위 설정
   * @param scopeType 검색 범위 타입 ('all' | 'current')
   */
  setSearchScope(scopeType: SearchScope): void;
  
  /**
   * 현재 검색 범위 가져오기
   * @returns 검색 범위 타입
   */
  getSearchScope(): SearchScope;
  
  /**
   * 검색 범위에 따른 프론트매터 값 목록 가져오기
   * @param key 프론트매터 키
   * @param searchScope 검색 범위 ('all' 또는 'current')
   * @param currentCards 현재 표시 중인 카드 목록
   * @returns 프론트매터 값 목록
   */
  getScopedFrontmatterValues(key: string, searchScope: SearchScope, currentCards: ICard[]): Promise<string[]>;
  
  /**
   * 검색 범위에 따른 태그 목록 가져오기
   * @param searchScope 검색 범위 ('all' 또는 'current')
   * @param currentCards 현재 표시 중인 카드 목록
   * @returns 태그 목록
   */
  getScopedTags(searchScope: SearchScope, currentCards: ICard[]): Promise<string[]>;
  
  /**
   * 검색 범위에 따른 파일명 목록 가져오기
   * @param searchScope 검색 범위 ('all' 또는 'current')
   * @param currentCards 현재 표시 중인 카드 목록
   * @returns 파일명 목록
   */
  getScopedFilenames(searchScope: SearchScope, currentCards: ICard[]): Promise<string[]>;
  
  /**
   * 검색 범위에 따른 프론트매터 키 목록 가져오기
   * @param searchScope 검색 범위 ('all' 또는 'current')
   * @param currentCards 현재 표시 중인 카드 목록
   * @returns 프론트매터 키 목록
   */
  getScopedFrontmatterKeys(searchScope: SearchScope, currentCards: ICard[]): Promise<string[]>;
}

/**
 * 메타데이터 제공 인터페이스
 * 검색에 필요한 메타데이터 제공 기능을 제공합니다.
 */
export interface ISearchMetadataProvider {
  /**
   * 프론트매터 키 목록 가져오기
   * @returns 프론트매터 키 목록
   */
  getFrontmatterKeys(): Promise<string[]>;
  
  /**
   * 폴더 경로 목록 가져오기
   * @returns 폴더 경로 목록
   */
  getFolderPaths(): Promise<string[]>;
  
  /**
   * 태그 목록 가져오기
   * @returns 태그 목록
   */
  getTags(): Promise<string[]>;
}

/**
 * 검색 카드셋 소스 관리 인터페이스
 * 검색 카드셋 소스 관련 기능을 제공합니다.
 */
export interface ISearchCardSetSourceManager {
  /**
   * 검색 카드 세트 여부 확인
   * @returns 검색 카드 세트 여부
   */
  isSearchCardSetSource(): boolean;
  
  /**
   * 검색 카드 세트로 전환
   * @param query 검색 쿼리
   * @param searchType 검색 타입
   * @param caseSensitive 대소문자 구분 여부
   * @param frontmatterKey 프론트매터 키 (검색 타입이 frontmatter인 경우)
   */
  enterSearchCardSetSource(query: string, searchType?: SearchType, caseSensitive?: boolean, frontmatterKey?: string): void;
  
  /**
   * 검색 카드 세트 종료
   * 이전 카드 세트로 돌아갑니다.
   */
  exitSearchCardSetSource(): void;
  
  /**
   * 검색 카드셋 소스 상태 가져오기
   * @returns 검색 카드셋 소스 상태
   */
  getSearchCardSetSourceState(): ISearchCardSetSourceState;
  
  /**
   * 검색 소스 가져오기
   * @returns 검색 소스
   */
  getSearchSource(): ICardSetSource;
  
  /**
   * 검색 소스 설정
   * @param query 검색 쿼리
   * @param searchType 검색 타입
   * @param caseSensitive 대소문자 구분 여부
   * @param frontmatterKey 프론트매터 키 (검색 타입이 frontmatter인 경우)
   */
  configureSearchSource(query: string, searchType?: SearchType, caseSensitive?: boolean, frontmatterKey?: string): void;
}

/**
 * 이전 카드셋 소스 관리 인터페이스
 * 이전 카드셋 소스 관련 기능을 제공합니다.
 */
export interface IPreviousCardSetSourceManager {
  /**
   * 이전 카드 세트 정보 설정
   * @param cardSetSourceType 이전 카드 세트 타입
   * @param cardSet 이전 카드 세트
   * @param cardSetType 이전 카드 세트 타입
   */
  setPreviousCardSetSourceInfo(
    cardSetSourceType: CardSetSourceType,
    cardSet: string | null,
    cardSetType: CardSetType
  ): void;
  
  /**
   * 이전 카드 세트 가져오기
   * @returns 이전 카드 세트 타입
   */
  getPreviousCardSetSource(): CardSetSourceType;
  
  /**
   * 카드 세트 변경 이벤트 처리
   * @param cardSetSourceType 변경된 카드 세트 타입
   */
  onCardSetSourceChanged(cardSetSourceType: CardSetSourceType): void;
}

/**
 * 검색 서비스 초기화 인터페이스
 * 검색 서비스 초기화 관련 기능을 제공합니다.
 */
export interface ISearchServiceInitializer {
  /**
   * 서비스 초기화
   */
  initialize(): void;
  
  /**
   * 설정 초기화
   */
  reset(): void;
}

/**
 * 검색 카드셋 소스 상태 인터페이스
 */
export interface ISearchCardSetSourceState {
  query: string;
  searchType: SearchType;
  caseSensitive: boolean;
  frontmatterKey?: string;
  searchScope: SearchScope;
  preSearchCards: ICard[];
  previousCardSetSource: CardSetSourceType;
  previousCardSet: string | null;
  previousCardSetType: CardSetType;
}

/**
 * 검색 소스 관리자 인터페이스
 */
export interface ISearchSourceManager {
  /**
   * 검색 소스 설정
   * @param query 검색 쿼리
   * @param searchType 검색 타입
   * @param caseSensitive 대소문자 구분 여부
   * @param frontmatterKey 프론트매터 키 (검색 타입이 frontmatter인 경우)
   */
  configureSearchSource(query: string, searchType?: SearchType, caseSensitive?: boolean, frontmatterKey?: string): void;
}

/**
 * 통합 검색 서비스 인터페이스
 * 모든 검색 관련 인터페이스를 통합합니다.
 */
export interface ISearchService extends 
  ISearchManager,
  ISearchQueryManager,
  ISearchApplier,
  ISearchHistoryManager,
  ISearchScopeManager,
  ISearchMetadataProvider,
  ISearchCardSetSourceManager,
  IPreviousCardSetSourceManager,
  ISearchSourceManager {
} 