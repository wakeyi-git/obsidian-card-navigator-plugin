import { App, TFile } from 'obsidian';
import { ICard } from '../domain/card/index';
import { SearchType, SearchScope } from '../domain/search/index';
import { CardSetSourceType, CardSetType } from '../domain/cardset/index';
import { ICardService } from './CardService';
import { IExtendedCardSetSource } from './CardSetService';

// 검색 필드 인터페이스
export interface ISearchField {
  /**
   * 검색 타입
   */
  type: SearchType;
  
  /**
   * 검색어
   */
  query: string;
  
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

// 검색 제안 인터페이스
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

// 검색 카드셋 소스 상태 인터페이스
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

// 검색 인터페이스
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
 * 검색 서비스 인터페이스
 * 검색 관련 기능을 제공합니다.
 */
export interface ISearchService {
  /**
   * 검색 생성
   * @param query 검색어
   * @param type 검색 타입
   * @param caseSensitive 대소문자 구분 여부
   * @param frontmatterKey 프론트매터 키 (frontmatter 타입인 경우)
   * @returns 검색 객체
   */
  createSearch(query: string, type: SearchType, caseSensitive: boolean, frontmatterKey?: string): ISearch;
  
  /**
   * 다중 필드 검색 생성
   * @param searchFields 검색 필드 목록
   * @param caseSensitive 대소문자 구분 여부
   * @returns 검색 객체
   */
  createMultiFieldSearch(searchFields: ISearchField[], caseSensitive: boolean): ISearch;
  
  /**
   * 검색 실행
   * @param search 검색 객체
   * @param cards 검색할 카드 목록
   * @returns 검색 결과 카드 목록
   */
  executeSearch(search: ISearch, cards: ICard[]): Promise<ICard[]>;
  
  /**
   * 검색 제안 가져오기
   * @param query 검색어
   * @returns 검색 제안 목록
   */
  getSearchSuggestions(query: string): Promise<ISearchSuggestion[]>;
  
  /**
   * 검색 카드셋 소스 상태 생성
   * @param query 검색어
   * @param searchType 검색 타입
   * @param caseSensitive 대소문자 구분 여부
   * @param frontmatterKey 프론트매터 키 (검색 타입이 frontmatter인 경우)
   * @param searchScope 검색 범위
   * @param searchFields 검색 필드 목록
   * @param preSearchCards 검색 전 카드 목록
   * @param previousCardSetSource 이전 카드셋 소스 타입
   * @param previousCardSet 이전 카드셋
   * @param previousCardSetType 이전 카드셋 타입
   * @returns 검색 카드셋 소스 상태
   */
  createSearchCardSetSourceState(
    query: string,
    searchType: SearchType,
    caseSensitive: boolean,
    frontmatterKey: string | undefined,
    searchScope: SearchScope,
    searchFields: ISearchField[] | undefined,
    preSearchCards: ICard[],
    previousCardSetSource: CardSetSourceType,
    previousCardSet: string | null,
    previousCardSetType: CardSetType
  ): ISearchCardSetSourceState;

  /**
   * 검색 소스 가져오기
   * @returns 검색 소스
   */
  getSearchSource(): IExtendedCardSetSource;

  /**
   * 검색 소스 설정
   * @param query 검색 쿼리
   * @param searchType 검색 타입
   * @param caseSensitive 대소문자 구분 여부
   * @param frontmatterKey 프론트매터 키
   */
  configureSearchSource(query: string, searchType?: SearchType, caseSensitive?: boolean, frontmatterKey?: string): void;
}

/**
 * 검색 클래스
 * ISearch 인터페이스를 구현합니다.
 */
class Search implements ISearch {
  private type: SearchType;
  private query: string;
  private caseSensitive: boolean;
  private frontmatterKey?: string;
  private searchFields: ISearchField[];
  private app: App;
  private cardService: ICardService;
  
  constructor(
    app: App,
    cardService: ICardService,
    type: SearchType,
    query: string,
    caseSensitive: boolean,
    frontmatterKey?: string,
    searchFields?: ISearchField[]
  ) {
    this.app = app;
    this.cardService = cardService;
    this.type = type;
    this.query = query;
    this.caseSensitive = caseSensitive;
    this.frontmatterKey = frontmatterKey;
    
    // 검색 필드 설정
    if (searchFields && searchFields.length > 0) {
      this.searchFields = searchFields;
    } else {
      // 단일 필드 검색인 경우 검색 필드 생성
      this.searchFields = [{
        type: type,
        query: query,
        frontmatterKey: frontmatterKey
      }];
    }
  }
  
  /**
   * 검색 타입 가져오기
   * @returns 검색 타입
   */
  getType(): SearchType {
    return this.type;
  }
  
  /**
   * 검색어 가져오기
   * @returns 검색어
   */
  getQuery(): string {
    return this.query;
  }
  
  /**
   * 대소문자 구분 여부 가져오기
   * @returns 대소문자 구분 여부
   */
  isCaseSensitive(): boolean {
    return this.caseSensitive;
  }
  
  /**
   * 검색 필드 목록 가져오기
   * @returns 검색 필드 목록
   */
  getSearchFields(): ISearchField[] {
    return this.searchFields;
  }
  
  /**
   * 카드가 검색 조건과 일치하는지 확인
   * @param card 확인할 카드
   * @returns 일치 여부
   */
  async match(card: ICard): Promise<boolean> {
    // 다중 필드 검색인 경우 각 필드별로 검색
    if (this.searchFields.length > 1) {
      for (const field of this.searchFields) {
        const fieldSearch = new Search(
          this.app,
          this.cardService,
          field.type,
          field.query,
          this.caseSensitive,
          field.frontmatterKey
        );
        
        const matches = await fieldSearch.match(card);
        if (matches) {
          return true;
        }
      }
      
      return false;
    }
    
    // 단일 필드 검색
    switch (this.type) {
      case 'filename':
        return this.matchFilename(card);
        
      case 'content':
        return this.matchContent(card);
        
      case 'tag':
        return this.matchTag(card);
        
      case 'path':
        return this.matchPath(card);
        
      case 'frontmatter':
        return this.matchFrontmatter(card);
        
      case 'create':
        return this.matchCreated(card);
        
      case 'modify':
        return this.matchModified(card);
        
      case 'regex':
        return this.matchRegex(card);
        
      case 'folder':
        return this.matchFolder(card);
        
      case 'title':
        return this.matchTitle(card);
        
      case 'file':
        return this.matchFile(card);
        
      case 'complex':
        return this.matchComplex(card);
        
      case 'date':
        return this.matchDate(card);
        
      default:
        return false;
    }
  }
  
  /**
   * 파일명 일치 여부 확인
   * @param card 확인할 카드
   * @returns 일치 여부
   */
  private matchFilename(card: ICard): boolean {
    const filename = card.title;
    const query = this.caseSensitive ? this.query : this.query.toLowerCase();
    
    return this.caseSensitive
      ? filename.includes(query)
      : filename.toLowerCase().includes(query);
  }
  
  /**
   * 내용 일치 여부 확인
   * @param card 확인할 카드
   * @returns 일치 여부
   */
  private matchContent(card: ICard): boolean {
    const content = card.content;
    const query = this.caseSensitive ? this.query : this.query.toLowerCase();
    
    return this.caseSensitive
      ? content.includes(query)
      : content.toLowerCase().includes(query);
  }
  
  /**
   * 태그 일치 여부 확인
   * @param card 확인할 카드
   * @returns 일치 여부
   */
  private matchTag(card: ICard): boolean {
    const tags = card.tags;
    const query = this.query.startsWith('#') ? this.query.substring(1) : this.query;
    const normalizedQuery = this.caseSensitive ? query : query.toLowerCase();
    
    for (const tag of tags) {
      const normalizedTag = this.caseSensitive ? tag : tag.toLowerCase();
      if (normalizedTag.includes(normalizedQuery)) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * 경로 일치 여부 확인
   * @param card 확인할 카드
   * @returns 일치 여부
   */
  private matchPath(card: ICard): boolean {
    const path = card.getPath();
    const query = this.caseSensitive ? this.query : this.query.toLowerCase();
    
    return this.caseSensitive
      ? path.includes(query)
      : path.toLowerCase().includes(query);
  }
  
  /**
   * 프론트매터 일치 여부 확인
   * @param card 확인할 카드
   * @returns 일치 여부
   */
  private matchFrontmatter(card: ICard): boolean {
    if (!card.frontmatter || !this.frontmatterKey) {
      return false;
    }
    
    const value = card.frontmatter[this.frontmatterKey];
    if (value === undefined) {
      return false;
    }
    
    const query = this.caseSensitive ? this.query : this.query.toLowerCase();
    
    // 값 타입에 따른 비교
    if (typeof value === 'string') {
      return this.caseSensitive
        ? value.includes(query)
        : value.toLowerCase().includes(query);
    } else if (Array.isArray(value)) {
      // 배열인 경우 각 항목 확인
      for (const item of value) {
        const itemStr = String(item);
        if (this.caseSensitive
          ? itemStr.includes(query)
          : itemStr.toLowerCase().includes(query)) {
          return true;
        }
      }
      return false;
    } else {
      // 그 외의 경우 문자열로 변환하여 비교
      const valueStr = String(value);
      return this.caseSensitive
        ? valueStr.includes(query)
        : valueStr.toLowerCase().includes(query);
    }
  }
  
  /**
   * 생성일 일치 여부 확인
   * @param card 확인할 카드
   * @returns 일치 여부
   */
  private matchCreated(card: ICard): boolean {
    const created = new Date(card.getCreatedTime());
    const dateStr = created.toISOString().split('T')[0]; // YYYY-MM-DD 형식
    
    return dateStr === this.query;
  }
  
  /**
   * 수정일 일치 여부 확인
   * @param card 확인할 카드
   * @returns 일치 여부
   */
  private matchModified(card: ICard): boolean {
    const modified = new Date(card.getModifiedTime());
    const dateStr = modified.toISOString().split('T')[0]; // YYYY-MM-DD 형식
    
    return dateStr === this.query;
  }
  
  /**
   * 정규식 일치 여부 확인
   * @param card 확인할 카드
   * @returns 일치 여부
   */
  private matchRegex(card: ICard): boolean {
    try {
      const regex = new RegExp(this.query, this.caseSensitive ? '' : 'i');
      
      // 파일명, 내용, 경로에서 검색
      return regex.test(card.title) || 
             regex.test(card.content) || 
             regex.test(card.getPath());
    } catch (error) {
      console.error('정규식 검색 오류:', error);
      return false;
    }
  }
  
  /**
   * 폴더 일치 여부 확인
   * @param card 확인할 카드
   * @returns 일치 여부
   */
  private matchFolder(card: ICard): boolean {
    const path = card.getPath();
    const folder = path.substring(0, path.lastIndexOf('/'));
    const query = this.caseSensitive ? this.query : this.query.toLowerCase();
    
    return this.caseSensitive
      ? folder === query || folder.startsWith(query + '/')
      : folder.toLowerCase() === query.toLowerCase() || folder.toLowerCase().startsWith(query.toLowerCase() + '/');
  }
  
  /**
   * 제목 일치 여부 확인
   * @param card 확인할 카드
   * @returns 일치 여부
   */
  private matchTitle(card: ICard): boolean {
    // 첫 번째 헤더가 있으면 헤더로, 없으면 파일명으로 검색
    const title = card.firstHeader || card.title;
    const query = this.caseSensitive ? this.query : this.query.toLowerCase();
    
    return this.caseSensitive
      ? title.includes(query)
      : title.toLowerCase().includes(query);
  }
  
  /**
   * 파일 일치 여부 확인
   * @param card 확인할 카드
   * @returns 일치 여부
   */
  private matchFile(card: ICard): boolean {
    // 파일명, 내용, 경로, 태그에서 검색
    return this.matchFilename(card) || 
           this.matchContent(card) || 
           this.matchPath(card) || 
           this.matchTag(card);
  }
  
  /**
   * 복합 검색 일치 여부 확인
   * @param card 확인할 카드
   * @returns 일치 여부
   */
  private matchComplex(card: ICard): boolean {
    // 모든 필드에서 검색
    return this.matchFilename(card) || 
           this.matchContent(card) || 
           this.matchPath(card) || 
           this.matchTag(card) || 
           this.matchTitle(card) || 
           this.matchFolder(card);
  }
  
  /**
   * 날짜 일치 여부 확인
   * @param card 확인할 카드
   * @returns 일치 여부
   */
  private matchDate(card: ICard): boolean {
    // 생성일 또는 수정일 검색
    return this.matchCreated(card) || this.matchModified(card);
  }
}

/**
 * 검색 서비스 클래스
 * 검색 관련 기능을 제공합니다.
 */
export class SearchService implements ISearchService {
  private app: App;
  private cardService: ICardService;
  private searchSource: IExtendedCardSetSource | null = null;
  private searchQuery: string = '';
  private searchType: SearchType = 'content';
  private caseSensitive: boolean = false;
  private frontmatterKey: string | undefined;
  
  /**
   * 생성자
   * @param app Obsidian App 객체
   * @param cardService 카드 서비스
   */
  constructor(app: App, cardService: ICardService) {
    this.app = app;
    this.cardService = cardService;
  }
  
  /**
   * 검색 생성
   * @param query 검색어
   * @param type 검색 타입
   * @param caseSensitive 대소문자 구분 여부
   * @param frontmatterKey 프론트매터 키 (frontmatter 타입인 경우)
   * @returns 검색 객체
   */
  createSearch(query: string, type: SearchType, caseSensitive: boolean, frontmatterKey?: string): ISearch {
    return new Search(this.app, this.cardService, type, query, caseSensitive, frontmatterKey);
  }
  
  /**
   * 다중 필드 검색 생성
   * @param searchFields 검색 필드 목록
   * @param caseSensitive 대소문자 구분 여부
   * @returns 검색 객체
   */
  createMultiFieldSearch(searchFields: ISearchField[], caseSensitive: boolean): ISearch {
    return new Search(this.app, this.cardService, 'complex', '', caseSensitive, undefined, searchFields);
  }
  
  /**
   * 검색 실행
   * @param search 검색 객체
   * @param cards 검색할 카드 목록
   * @returns 검색 결과 카드 목록
   */
  async executeSearch(search: ISearch, cards: ICard[]): Promise<ICard[]> {
    const results: ICard[] = [];
    
    for (const card of cards) {
      const matches = await search.match(card);
      if (matches) {
        results.push(card);
      }
    }
    
    return results;
  }
  
  /**
   * 검색 제안 가져오기
   * @param query 검색어
   * @returns 검색 제안 목록
   */
  async getSearchSuggestions(query: string): Promise<ISearchSuggestion[]> {
    const suggestions: ISearchSuggestion[] = [];
    
    if (!query || query.trim() === '') {
      return suggestions;
    }
    
    // 검색 타입 제안
    suggestions.push({
      text: `filename:${query}`,
      type: 'filename',
      description: '파일명으로 검색'
    });
    
    suggestions.push({
      text: `content:${query}`,
      type: 'content',
      description: '내용으로 검색'
    });
    
    suggestions.push({
      text: `tag:${query}`,
      type: 'tag',
      description: '태그로 검색'
    });
    
    return suggestions;
  }
  
  /**
   * 검색 카드셋 소스 상태 생성
   * @param query 검색어
   * @param searchType 검색 타입
   * @param caseSensitive 대소문자 구분 여부
   * @param frontmatterKey 프론트매터 키 (검색 타입이 frontmatter인 경우)
   * @param searchScope 검색 범위
   * @param searchFields 검색 필드 목록
   * @param preSearchCards 검색 전 카드 목록
   * @param previousCardSetSource 이전 카드셋 소스 타입
   * @param previousCardSet 이전 카드셋
   * @param previousCardSetType 이전 카드셋 타입
   * @returns 검색 카드셋 소스 상태
   */
  createSearchCardSetSourceState(
    query: string,
    searchType: SearchType,
    caseSensitive: boolean,
    frontmatterKey: string | undefined,
    searchScope: SearchScope,
    searchFields: ISearchField[] | undefined,
    preSearchCards: ICard[],
    previousCardSetSource: CardSetSourceType,
    previousCardSet: string | null,
    previousCardSetType: CardSetType
  ): ISearchCardSetSourceState {
    return {
      query,
      searchType,
      caseSensitive,
      frontmatterKey,
      searchScope,
      searchFields,
      preSearchCards,
      previousCardSetSource,
      previousCardSet,
      previousCardSetType
    };
  }

  /**
   * 검색 쿼리 설정
   * @param query 검색 쿼리
   */
  setSearchQuery(query: string): void {
    this.searchQuery = query;
  }
  
  /**
   * 검색 타입 설정
   * @param type 검색 타입
   */
  setSearchType(type: SearchType): void {
    this.searchType = type;
  }
  
  /**
   * 대소문자 구분 여부 설정
   * @param caseSensitive 대소문자 구분 여부
   */
  setCaseSensitive(caseSensitive: boolean): void {
    this.caseSensitive = caseSensitive;
  }
  
  /**
   * 프론트매터 키 설정
   * @param key 프론트매터 키
   */
  setFrontmatterKey(key: string): void {
    this.frontmatterKey = key;
  }
  
  /**
   * 검색 소스 가져오기
   * @returns 검색 소스
   */
  getSearchSource(): IExtendedCardSetSource {
    if (!this.searchSource) {
      throw new Error('검색 소스가 설정되지 않았습니다.');
    }
    return this.searchSource;
  }
  
  /**
   * 검색 소스 설정
   * @param searchSource 검색 소스
   */
  setSearchSource(searchSource: IExtendedCardSetSource): void {
    this.searchSource = searchSource;
  }

  /**
   * 검색 소스 설정
   * @param query 검색 쿼리
   * @param searchType 검색 타입
   * @param caseSensitive 대소문자 구분 여부
   * @param frontmatterKey 프론트매터 키
   */
  configureSearchSource(query: string, searchType?: SearchType, caseSensitive?: boolean, frontmatterKey?: string): void {
    // 검색 설정
    this.setSearchQuery(query);
    
    // 검색 타입 설정
    if (searchType) {
      this.setSearchType(searchType);
    }
    
    // 대소문자 구분 설정
    if (caseSensitive !== undefined) {
      this.setCaseSensitive(caseSensitive);
    }
    
    // 프론트매터 키 설정
    if (frontmatterKey && searchType === 'frontmatter') {
      this.setFrontmatterKey(frontmatterKey);
    }
  }
} 