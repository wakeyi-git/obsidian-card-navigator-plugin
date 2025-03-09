import { App, TFile } from 'obsidian';
import { ICard } from '../domain/card/Card';
import { ISearch, SearchType, SearchScope, ISearchCardSetSourceState } from '../domain/search/Search';
import { SearchFactory } from '../domain/search/SearchFactory';
import { FilenameSearch } from '../domain/search/FilenameSearch';
import { ContentSearch } from '../domain/search/ContentSearch';
import { TagSearch } from '../domain/search/TagSearch';
import { FrontmatterSearch } from '../domain/search/FrontmatterSearch';
import { FolderSearch } from '../domain/search/FolderSearch';
import { Card } from '../domain/card/Card';
import { IPresetService } from './PresetService';
import { ICardService } from './CardService';
import { ICardSetService } from './CardSetService';
import { DateSearch } from '../domain/search/DateSearch';
import { RegexSearch } from '../domain/search/RegexSearch';
import { PathSearch } from '../domain/search/PathSearch';
import { ICardNavigatorService } from './CardNavigatorService';
import { CardNavigatorSettings } from '../main';
import { CardSetSourceType, CardSetType, ICardSetSource } from '../domain/cardset/CardSet';

/**
 * 검색 및 필터 서비스 인터페이스
 * 검색 및 필터링 관리를 위한 인터페이스입니다.
 */
export interface ISearchService {
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
   * 검색 타입 설정
   * @param searchType 검색 타입
   * @param frontmatterKey 프론트매터 키 (검색 타입이 frontmatter인 경우)
   */
  setSearchType(searchType: SearchType, frontmatterKey?: string): void;
  
  /**
   * 대소문자 구분 설정
   * @param caseSensitive 대소문자 구분 여부
   */
  setCaseSensitive(caseSensitive: boolean): void;
  
  /**
   * 검색 적용
   * @param cards 카드 목록
   * @returns 검색된 카드 목록
   */
  applySearch(cards: ICard[]): Promise<ICard[]>;
  
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
  
  /**
   * 서비스 초기화
   */
  initialize(): void;
  
  /**
   * 설정 초기화
   */
  reset(): void;

  /**
   * 복합 검색 실행
   * @param query 복합 검색어 (스페이스로 구분)
   * @param cards 검색할 카드 목록
   * @returns 검색 결과 카드 목록
   */
  applyComplexSearch(query: string, cards: ICard[]): Promise<ICard[]>;

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

  /**
   * 검색 결과에서 검색어 강조 정보 가져오기
   * @param card 카드
   * @returns 강조 정보 (검색어, 위치 등)
   */
  getHighlightInfo(card: ICard): { text: string, positions: number[] }[];

  /**
   * 검색 모드 여부 확인
   * @returns 검색 모드 여부
   */
  isSearchCardSetSource(): boolean;
  
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
   * 검색 쿼리 가져오기
   * @returns 검색 쿼리
   */
  getQuery(): string;
  
  /**
   * 검색 타입 가져오기
   * @returns 검색 타입
   */
  getSearchType(): SearchType;
  
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
   * 이전 모드 정보 설정
   * @param cardSetSourceType 이전 모드 타입
   * @param cardSet 이전 카드 세트
   * @param cardSetType 이전 카드 세트 타입
   */
  setPreviousCardSetSourceInfo(
    cardSetSourceType: CardSetSourceType,
    cardSet: string | null,
    cardSetType: CardSetType
  ): void;
  
  /**
   * 이전 모드 가져오기
   * @returns 이전 모드 타입
   */
  getPreviousCardSetSource(): CardSetSourceType;
  
  /**
   * 모드 변경 이벤트 처리
   * @param cardSetSourceType 변경된 모드 타입
   */
  onCardSetSourceChanged(cardSetSourceType: CardSetSourceType): void;
  
  /**
   * 검색 소스 가져오기
   * @returns 검색 소스
   */
  getSearchSource(): ICardSetSource;
  
  /**
   * 프론트매터 키 설정
   * @param key 프론트매터 키
   */
  setFrontmatterKey(key: string): void;

  /**
   * 검색 범위에 따른 프론트매터 값 목록 가져오기
   * @param key 프론트매터 키
   * @param searchScope 검색 범위 ('all' 또는 'current')
   * @param currentCards 현재 표시 중인 카드 목록
   * @returns 프론트매터 값 목록
   */
  getScopedFrontmatterValues(key: string, searchScope: SearchScope, currentCards: ICard[]): Promise<string[]>;

  /**
   * 검색 모드로 전환
   * @param query 검색 쿼리
   * @param searchType 검색 타입
   * @param caseSensitive 대소문자 구분 여부
   * @param frontmatterKey 프론트매터 키 (검색 타입이 frontmatter인 경우)
   */
  enterSearchCardSetSource(query: string, searchType?: SearchType, caseSensitive?: boolean, frontmatterKey?: string): void;
  
  /**
   * 검색 모드 종료
   * 이전 모드로 돌아갑니다.
   */
  exitSearchCardSetSource(): void;

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
 * 검색 및 필터 서비스 구현
 * 검색 및 필터링 관리를 위한 서비스입니다.
 */
export class SearchService implements ISearchService {
  private currentSearch: ISearch | null = null;
  private searchHistory: string[] = [];
  private readonly MAX_HISTORY_SIZE = 10;
  private presetService: IPresetService;
  private cardService: ICardService;
  private cardSetService: ICardSetService;
  private isInSearchCardSetSource = false;
  private searchScope: SearchScope = 'current';
  private preSearchCards: ICard[] = [];
  private cardNavigatorService: ICardNavigatorService;
  private app: App;
  
  // 검색 모드 상태
  private searchCardSetSourceState: ISearchCardSetSourceState = {
    query: '',
    searchType: 'filename',
    caseSensitive: false,
    frontmatterKey: undefined,
    searchScope: 'current',
    preSearchCards: [],
    previousCardSetSource: 'folder',
    previousCardSet: null,
    previousCardSetType: 'active'
  };
  
  // 필터 설정
  private filters: {
    // 향후 필터 설정 추가
  } = {};
  
  constructor(presetService: IPresetService, cardService: ICardService, cardSetService: ICardSetService, cardNavigatorService: ICardNavigatorService) {
    this.presetService = presetService;
    this.cardService = cardService;
    this.cardSetService = cardSetService;
    this.cardNavigatorService = cardNavigatorService;
    this.app = cardNavigatorService.getApp();
    
    // 검색 기록 로드
    this.loadSearchHistory();
  }
  
  /**
   * 초기화
   * 검색 서비스를 초기화합니다.
   */
  initialize(): void {
    // 기본 검색 설정
    this.currentSearch = new FilenameSearch(this.app);
    this.isInSearchCardSetSource = false;
    
    // 설정에서 기본 검색 범위 가져오기
    if (this.cardNavigatorService) {
      try {
        this.cardNavigatorService.getSettings().then((settings: CardNavigatorSettings) => {
          if (settings && settings.defaultSearchScope) {
            this.searchScope = settings.defaultSearchScope;
          } else {
            this.searchScope = 'current';
          }
        }).catch((_err: Error) => {
          // 설정을 가져오는 중 오류가 발생하면 기본값 사용
          this.searchScope = 'current';
        });
      } catch (_error) {
        // 예외 발생 시 기본값 사용
        this.searchScope = 'current';
      }
    } else {
      this.searchScope = 'current';
    }
    
    this.preSearchCards = [];
  }
  
  /**
   * 초기화
   * 검색 서비스를 초기 상태로 되돌립니다.
   */
  reset(): void {
    this.clearSearch();
    this.searchHistory = [];
    this.isInSearchCardSetSource = false;
    
    // 설정에서 기본 검색 범위 가져오기
    if (this.cardNavigatorService) {
      try {
        this.cardNavigatorService.getSettings().then((settings: CardNavigatorSettings) => {
          if (settings && settings.defaultSearchScope) {
            this.searchScope = settings.defaultSearchScope;
          } else {
            this.searchScope = 'current';
          }
        }).catch((_err: Error) => {
          // 설정을 가져오는 중 오류가 발생하면 기본값 사용
          this.searchScope = 'current';
        });
      } catch (_error) {
        // 예외 발생 시 기본값 사용
        this.searchScope = 'current';
      }
    } else {
      this.searchScope = 'current';
    }
    
    this.preSearchCards = [];
  }
  
  getCurrentSearch(): ISearch | null {
    return this.currentSearch;
  }
  
  setSearch(search: ISearch): void {
    this.currentSearch = search;
    this.isInSearchCardSetSource = !!search && !!search.getQuery();
  }
  
  setQuery(query: string): void {
    this.searchCardSetSourceState.query = query;
    
    if (this.currentSearch) {
      this.currentSearch.setQuery(query);
    }
    
    this.isInSearchCardSetSource = !!query;
  }
  
  setSearchQuery(query: string): void {
    // 검색어가 비어있거나 스페이스만 있는 경우에도 검색 모드 유지
    if (!query || query.trim() === '') {
      // 검색어가 비어있는 경우 현재 검색 객체의 쿼리만 비우고 검색 모드 유지
      if (this.currentSearch) {
        this.currentSearch.setQuery('');
      } else {
        // 검색 객체가 없는 경우 기본 검색 객체(파일명 검색) 생성
        this.currentSearch = new FilenameSearch(this.app, query);
      }
    }
    
    // 검색 접두사 패턴 확인
    const prefixPatterns = [
      'file:', 'content:', 'tag:', 'path:', 'folder:', 
      'fm:', 'frontmatter:', 'create:', 'modify:', 'regex:'
    ];
    
    // 검색어에 여러 접두사가 있는지 확인
    let hasMultiplePrefixes = false;
    let prefixCount = 0;
    
    for (const prefix of prefixPatterns) {
      let pos = query.indexOf(prefix);
      while (pos !== -1) {
        // 접두사 앞에 공백이 있거나 문자열 시작인 경우에만 유효한 접두사로 간주
        if (pos === 0 || query[pos - 1] === ' ') {
          prefixCount++;
          if (prefixCount >= 2) {
            hasMultiplePrefixes = true;
            break;
          }
        }
        pos = query.indexOf(prefix, pos + 1);
      }
      if (hasMultiplePrefixes) break;
    }
    
    // 여러 접두사가 있는 경우 복합 검색으로 처리
    if (hasMultiplePrefixes) {
      // 복합 검색은 별도의 처리 없이 그대로 유지
      // 실제 검색은 applyComplexSearch에서 처리
      this.isInSearchCardSetSource = true;
      return;
    }
    
    // 검색 타입 자동 선택
    if (query.startsWith('file:')) {
      // 파일명 검색 - 'file:' 접두사 이후의 텍스트를 검색어로 사용
      this.changeSearchType('filename');
      
      // 접두사 이후의 텍스트 추출
      let searchQuery = query.substring(5).trim();
      
      // 큰따옴표로 묶인 검색어 처리 (따옴표 제거)
      if (searchQuery.startsWith('"') && searchQuery.endsWith('"')) {
        searchQuery = searchQuery.substring(1, searchQuery.length - 1);
      }
      
      this.setQuery(searchQuery);
    } else if (query.startsWith('content:')) {
      // 내용 검색 - 'content:' 접두사 이후의 텍스트를 검색어로 사용
      this.changeSearchType('content');
      
      // 접두사 이후의 텍스트 추출
      let searchQuery = query.substring(8).trim();
      
      // 큰따옴표로 묶인 검색어 처리 (따옴표 제거)
      if (searchQuery.startsWith('"') && searchQuery.endsWith('"')) {
        searchQuery = searchQuery.substring(1, searchQuery.length - 1);
      }
      
      this.setQuery(searchQuery);
    } else if (query.startsWith('tag:')) {
      // 태그 검색 - 'tag:' 접두사 이후의 텍스트를 검색어로 사용
      this.changeSearchType('tag');
      
      // 접두사 이후의 텍스트 추출
      let searchQuery = query.substring(4).trim();
      
      // 큰따옴표로 묶인 검색어 처리 (따옴표 제거)
      if (searchQuery.startsWith('"') && searchQuery.endsWith('"')) {
        searchQuery = searchQuery.substring(1, searchQuery.length - 1);
      }
      
      this.setQuery(searchQuery);
    } else if (query.startsWith('path:')) {
      // 경로 검색 - 'path:' 접두사 이후의 텍스트를 검색어로 사용
      this.changeSearchType('path');
      
      // 접두사 이후의 텍스트 추출
      let searchQuery = query.substring(5).trim();
      
      // 큰따옴표로 묶인 검색어 처리 (따옴표 제거)
      if (searchQuery.startsWith('"') && searchQuery.endsWith('"')) {
        searchQuery = searchQuery.substring(1, searchQuery.length - 1);
      }
      
      this.setQuery(searchQuery);
    } else if (query.startsWith('regex:')) {
      // 정규식 검색 - 'regex:' 접두사 이후의 텍스트를 검색어로 사용
      // 접두사 이후의 텍스트 추출
      let regexPattern = query.substring(6).trim();
      
      // 큰따옴표로 묶인 검색어 처리 (따옴표 제거)
      if (regexPattern.startsWith('"') && regexPattern.endsWith('"')) {
        regexPattern = regexPattern.substring(1, regexPattern.length - 1);
      }
      
      this.currentSearch = new RegexSearch(this.app, regexPattern);
      this.isInSearchCardSetSource = true;
    } else if (query.startsWith('create:')) {
      // 날짜 검색 - 'create:' 접두사 이후의 텍스트를 검색어로 사용
      let dateQuery = query.substring(7).trim();
      
      // 날짜 검색어가 비어있으면 기본값 설정
      if (!dateQuery) {
        dateQuery = 'today';
      }
      
      this.currentSearch = new DateSearch(this.app, dateQuery, 'creation', this.searchCardSetSourceState.caseSensitive);
      this.isInSearchCardSetSource = true;
    } else if (query.startsWith('modify:')) {
      // 수정일 검색 - 'modify:' 접두사 이후의 텍스트를 검색어로 사용
      let dateQuery = query.substring(7).trim();
      
      // 날짜 검색어가 비어있으면 기본값 설정
      if (!dateQuery) {
        dateQuery = 'today';
      }
      
      this.currentSearch = new DateSearch(this.app, dateQuery, 'modification', this.searchCardSetSourceState.caseSensitive);
      this.isInSearchCardSetSource = true;
    } else if (query.match(/^\[.+\]:/)) {
      // 프론트매터 검색
      const match = query.match(/^\[(.+)\]:(.*)/);
      if (match) {
        const key = match[1].trim();
        let value = match[2].trim();
        
        // 큰따옴표로 묶인 검색어 처리 (따옴표 제거)
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.substring(1, value.length - 1);
        }
        
        this.changeSearchType('frontmatter', key);
        this.setQuery(value);
      } else {
        // 기본 검색 (파일명)
        this.changeSearchType('filename');
        this.setQuery(query);
      }
    } else {
      // 기본 검색 (파일명)
      this.changeSearchType('filename');
      this.setQuery(query);
    }
    
    // 검색 기록 저장
    this.saveSearchHistory(query);
  }
  
  /**
   * 대소문자 구분 여부 설정
   * @param caseSensitive 대소문자 구분 여부
   */
  setCaseSensitive(caseSensitive: boolean): void {
    if (this.currentSearch) {
      this.currentSearch.setCaseSensitive(caseSensitive);
    }
    
    this.searchCardSetSourceState.caseSensitive = caseSensitive;
    
    console.log(`[SearchService] 대소문자 구분 설정: ${caseSensitive}`);
  }
  
  /**
   * 검색 적용
   * @param cards 카드 목록
   * @returns 검색된 카드 목록
   */
  async applySearch(cards: ICard[]): Promise<ICard[]> {
    if (!this.currentSearch) {
      return cards;
    }
    
    console.log(`[SearchService] 검색 적용: 타입=${this.currentSearch.getType()}, 쿼리='${this.currentSearch.getQuery()}'`);
    
    try {
      // 검색 범위에 따라 검색 대상 카드 결정
      let targetCards: ICard[];
      if (this.searchScope === 'all') {
        // 볼트 전체 검색
        targetCards = await this.getAllVaultCards();
      } else {
        // 현재 카드셋 내 검색
        targetCards = cards.length > 0 ? cards : this.preSearchCards;
      }
      
      // 검색 실행
      const result = this.currentSearch.search(targetCards);
      console.log(`[SearchService] 검색 결과: ${result.length}개 카드 찾음`);
      
      return result;
    } catch (error) {
      console.error(`[SearchService] 검색 적용 오류:`, error);
      return cards;
    }
  }
  
  clearSearch(): void {
    if (this.currentSearch) {
      this.currentSearch.setQuery('');
    }
    this.isInSearchCardSetSource = false;
  }
  
  changeSearchType(type: SearchType, frontmatterKey?: string): void {
    const query = this.currentSearch ? this.currentSearch.getQuery() : '';
    const caseSensitive = this.currentSearch ? this.currentSearch.isCaseSensitive() : false;
    
    switch (type) {
      case 'filename':
        this.currentSearch = new FilenameSearch(this.app, query, caseSensitive);
        break;
      case 'content':
        this.currentSearch = new ContentSearch(this.app, query, caseSensitive);
        break;
      case 'tag':
        this.currentSearch = new TagSearch(this.app, query, caseSensitive);
        break;
      case 'folder':
        this.currentSearch = new FolderSearch(this.app, query, caseSensitive);
        break;
      case 'path':
        this.currentSearch = new PathSearch(this.app, query, caseSensitive);
        break;
      case 'frontmatter':
        this.currentSearch = new FrontmatterSearch(this.app, query, caseSensitive, frontmatterKey);
        break;
      case 'create':
        this.currentSearch = new DateSearch(this.app, query, 'creation', caseSensitive);
        break;
      case 'modify':
        this.currentSearch = new DateSearch(this.app, query, 'modification', caseSensitive);
        break;
      case 'regex':
        this.currentSearch = new RegexSearch(this.app, query, caseSensitive);
        break;
      default:
        this.currentSearch = new FilenameSearch(this.app, query, caseSensitive);
    }
    
    this.isInSearchCardSetSource = !!query;
  }
  
  saveSearchHistory(query: string): void {
    // 중복 검색어 제거
    const index = this.searchHistory.indexOf(query);
    if (index !== -1) {
      this.searchHistory.splice(index, 1);
    }
    
    // 검색 기록 추가
    this.searchHistory.unshift(query);
    
    // 최대 개수 제한
    if (this.searchHistory.length > this.MAX_HISTORY_SIZE) {
      this.searchHistory = this.searchHistory.slice(0, this.MAX_HISTORY_SIZE);
    }
    
    // 로컬 스토리지에 저장
    try {
      localStorage.setItem('card-navigator-search-history', JSON.stringify(this.searchHistory));
    } catch (error) {
      console.error(`[SearchService] 검색 기록 저장 오류:`, error);
    }
  }
  
  getSearchHistory(): string[] {
    return this.searchHistory;
  }
  
  /**
   * 검색 기록 삭제
   */
  clearSearchHistory(): void {
    this.searchHistory = [];
  }
  
  /**
   * 검색 기록 로드
   * 로컬 스토리지에서 검색 기록을 로드합니다.
   */
  private loadSearchHistory(): void {
    try {
      const historyJson = localStorage.getItem('card-navigator-search-history');
      if (historyJson) {
        this.searchHistory = JSON.parse(historyJson);
      }
    } catch (error) {
      console.error(`[SearchService] 검색 기록 로드 오류:`, error);
      this.searchHistory = [];
    }
  }
  
  /**
   * 볼트 전체 노트를 카드로 가져오기
   * @returns 볼트 전체 노트를 변환한 카드 배열
   */
  async getAllVaultCards(): Promise<ICard[]> {
    console.log(`[SearchService] 볼트 전체 노트 가져오기`);
    
    try {
      // 카드 서비스를 통해 볼트 전체 노트를 카드로 변환
      const allCards = await this.cardService.getAllCards();
      console.log(`[SearchService] 볼트 전체 노트 ${allCards.length}개 가져옴`);
      
      return allCards;
    } catch (error) {
      console.error(`[SearchService] 볼트 전체 노트 가져오기 오류:`, error);
      return [];
    }
  }

  /**
   * 검색 범위에 따른 태그 목록 가져오기
   * @param searchScope 검색 범위 ('all' 또는 'current')
   * @param currentCards 현재 표시 중인 카드 목록
   * @returns 태그 목록
   */
  async getScopedTags(searchScope: SearchScope, currentCards: ICard[]): Promise<string[]> {
    console.log(`[SearchService] 검색 범위에 따른 태그 목록 가져오기: 범위=${searchScope}`);
    
    try {
      if (searchScope === 'all') {
        // 볼트 전체 태그 가져오기
        return await this.getTags();
      } else {
        // 현재 카드셋의 태그만 가져오기
        const cards = currentCards.length > 0 ? currentCards : this.preSearchCards;
        const tagSet = new Set<string>();
        
        for (const card of cards) {
          if (card.tags) {
            card.tags.forEach(tag => tagSet.add(tag));
          }
        }
        
        return Array.from(tagSet).sort();
      }
    } catch (error) {
      console.error(`[SearchService] 태그 목록 가져오기 오류:`, error);
      return [];
    }
  }
  
  /**
   * 검색 범위에 따른 파일명 목록 가져오기
   * @param searchScope 검색 범위 ('all' 또는 'current')
   * @param currentCards 현재 표시 중인 카드 목록
   * @returns 파일명 목록
   */
  async getScopedFilenames(searchScope: SearchScope, currentCards: ICard[]): Promise<string[]> {
    console.log(`[SearchService] 검색 범위에 따른 파일명 목록 가져오기: 범위=${searchScope}`);
    
    try {
      if (searchScope === 'all') {
        // 볼트 전체 파일명 가져오기
        const allCards = await this.getAllVaultCards();
        return allCards.map(card => card.title);
      } else {
        // 현재 카드셋의 파일명만 가져오기
        const cards = currentCards.length > 0 ? currentCards : this.preSearchCards;
        return cards.map(card => card.title);
      }
    } catch (error) {
      console.error(`[SearchService] 파일명 목록 가져오기 오류:`, error);
      return [];
    }
  }
  
  /**
   * 검색 범위에 따른 프론트매터 키 목록 가져오기
   * @param searchScope 검색 범위 ('all' 또는 'current')
   * @param currentCards 현재 표시 중인 카드 목록
   * @returns 프론트매터 키 목록
   */
  async getScopedFrontmatterKeys(searchScope: SearchScope, currentCards: ICard[]): Promise<string[]> {
    console.log(`[SearchService] 검색 범위에 따른 프론트매터 키 목록 가져오기: 범위=${searchScope}`);
    
    try {
      if (searchScope === 'all') {
        // 볼트 전체 프론트매터 키 가져오기
        return await this.getFrontmatterKeys();
      } else {
        // 현재 카드셋의 프론트매터 키만 가져오기
        const cards = currentCards.length > 0 ? currentCards : this.preSearchCards;
        const keySet = new Set<string>();
        
        for (const card of cards) {
          if (card.frontmatter) {
            Object.keys(card.frontmatter).forEach(key => keySet.add(key));
          }
        }
        
        return Array.from(keySet).sort();
      }
    } catch (error) {
      console.error(`[SearchService] 프론트매터 키 목록 가져오기 오류:`, error);
      return [];
    }
  }
  
  /**
   * 검색 모드로 전환
   * @param query 검색 쿼리
   * @param searchType 검색 타입
   * @param caseSensitive 대소문자 구분 여부
   * @param frontmatterKey 프론트매터 키 (검색 타입이 frontmatter인 경우)
   */
  enterSearchCardSetSource(query: string, searchType?: SearchType, caseSensitive?: boolean, frontmatterKey?: string): void {
    // 현재 카드 목록 저장
    const currentCards = this.cardNavigatorService.getCurrentCards();
    
    // 검색 모드로 전환
    this.isInSearchCardSetSource = true;
    
    // 검색 모드 상태 설정
    this.setQuery(query);
    if (searchType) {
      this.setSearchType(searchType, frontmatterKey);
    }
    this.setCaseSensitive(caseSensitive || false);
    
    // 현재 카드 목록 저장
    this.setPreSearchCards(currentCards);
    
    // 이전 모드 정보 저장
    const cardSetSourceService = this.cardSetService;
    const currentCardSetSource = cardSetSourceService.getCurrentSourceType();
    if (currentCardSetSource !== 'search') {
      const cardSet = cardSetSourceService.getCurrentCardSet();
      const cardSetType: CardSetType = cardSetSourceService.isCardSetFixed() ? 'fixed' : 'active';
      this.setPreviousCardSetSourceInfo(currentCardSetSource, cardSet, cardSetType);
    }
    
    // 검색 기록 저장
    if (query) {
      this.saveSearchHistory(query);
    }
  }
  
  /**
   * 검색 모드 종료
   * 이전 모드로 돌아갑니다.
   */
  exitSearchCardSetSource(): void {
    if (!this.isInSearchCardSetSource) {
      return;
    }
    
    // 검색 모드 종료
    this.isInSearchCardSetSource = false;
    
    // 이전 모드로 복원
    this.cardSetService.restorePreviousSourceState();
    
    // 검색 설정 초기화
    this.clearSearch();
  }
  
  /**
   * 검색 모드 여부 확인
   * @returns 검색 모드 여부
   */
  isSearchCardSetSource(): boolean {
    return this.isInSearchCardSetSource;
  }
  
  /**
   * 검색 범위 설정
   * @param scopeType 검색 범위 타입 ('all' | 'current')
   */
  setSearchScope(scopeType: SearchScope): void {
    this.searchScope = scopeType;
    this.searchCardSetSourceState.searchScope = scopeType;
  }
  
  /**
   * 현재 검색 범위 가져오기
   * @returns 검색 범위 타입
   */
  getSearchScope(): SearchScope {
    return this.searchCardSetSourceState.searchScope;
  }
  
  /**
   * 검색 모드 전환 전 카드셋 저장
   * @param cards 저장할 카드셋
   */
  setPreSearchCards(cards: ICard[]): void {
    this.preSearchCards = [...cards];
    this.searchCardSetSourceState.preSearchCards = [...cards];
  }
  
  /**
   * 검색 모드 전환 전 카드셋 가져오기
   * @returns 저장된 카드셋
   */
  getPreSearchCards(): ICard[] {
    return this.searchCardSetSourceState.preSearchCards;
  }

  /**
   * 프론트매터 키 목록 가져오기
   * @returns 프론트매터 키 목록
   */
  async getFrontmatterKeys(): Promise<string[]> {
    const cards = await this.cardService.getAllCards();
    const frontmatterKeysSet = new Set<string>();
    
    // 모든 카드에서 프론트매터 키 수집
    cards.forEach(card => {
      if (card.frontmatter) {
        Object.keys(card.frontmatter).forEach(key => {
          frontmatterKeysSet.add(key);
        });
      }
    });
    
    return Array.from(frontmatterKeysSet);
  }

  /**
   * 폴더 경로 목록 가져오기
   * @returns 폴더 경로 목록
   */
  async getFolderPaths(): Promise<string[]> {
    const cardSets = await this.cardSetService.getCardSets();
    return cardSets.filter(path => path.includes('/'));
  }

  /**
   * 태그 목록 가져오기
   * @returns 태그 목록
   */
  async getTags(): Promise<string[]> {
    // @ts-ignore - Obsidian API 접근
    const app = window.app;
    if (!app) {
      return [];
    }
    
    const tagsSet = new Set<string>();
    
    // Obsidian API를 통해 모든 마크다운 파일에서 태그 수집
    const files = app.vault.getMarkdownFiles();
    files.forEach((file: any) => {
      const fileCache = app.metadataCache.getFileCache(file);
      if (fileCache && fileCache.tags) {
        fileCache.tags.forEach((tag: any) => {
          tagsSet.add(tag.tag);
        });
      }
    });
    
    return Array.from(tagsSet);
  }

  /**
   * 검색 결과에서 검색어 강조 정보 가져오기
   * @param card 카드
   * @returns 강조 정보 (검색어, 위치 등)
   */
  getHighlightInfo(card: ICard): { text: string, positions: number[] }[] {
    if (!this.currentSearch || !this.isInSearchCardSetSource) {
      return [];
    }
    
    const query = this.currentSearch.getQuery();
    if (!query) {
      return [];
    }
    
    const type = this.currentSearch.getType();
    const caseSensitive = this.currentSearch.isCaseSensitive();
    
    // 복합 검색인 경우 각 검색어 분리
    if (query.includes('|')) {
      const complexQueries = query.split('|').map(q => q.trim()).filter(q => q);
      const results: { text: string, positions: number[] }[] = [];
      
      for (const complexQuery of complexQueries) {
        // 검색 타입과 검색어 분리
        const match = complexQuery.match(/^(\w+:|\[[^\]]+\]:)(.+)$/);
        if (match) {
          const prefix = match[1];
          const subQuery = match[2].trim();
          
          // 검색 타입에 따라 다른 필드 검색
          let textToSearch = '';
          
          if (prefix.startsWith('file:')) {
            textToSearch = card.title;
          } else if (prefix.startsWith('content:')) {
            textToSearch = card.content || '';
          } else if (prefix.startsWith('tag:')) {
            textToSearch = card.tags ? card.tags.join(' ') : '';
          } else if (prefix.startsWith('path:')) {
            textToSearch = card.path;
          } else if (prefix.startsWith('[') && prefix.endsWith(']:')) {
            // 프론트매터 검색
            const key = prefix.substring(1, prefix.length - 2);
            if (card.frontmatter && card.frontmatter[key]) {
              textToSearch = String(card.frontmatter[key]);
            }
          }
          
          // 검색어 위치 찾기
          if (textToSearch) {
            const positions = this.findPositions(textToSearch, subQuery, caseSensitive);
            if (positions.length > 0) {
              results.push({ text: subQuery, positions });
            }
          }
        }
      }
      
      return results.length > 0 ? results : [];
    }
    
    // 일반 검색인 경우
    let textToSearch = '';
    
    switch (type) {
      case 'filename':
        textToSearch = card.title;
        break;
      case 'content':
        textToSearch = card.content || '';
        break;
      case 'tag':
        textToSearch = card.tags ? card.tags.join(' ') : '';
        break;
      case 'path':
      case 'folder':
        textToSearch = card.path;
        break;
      case 'frontmatter':
        if (this.currentSearch instanceof FrontmatterSearch) {
          const key = (this.currentSearch as FrontmatterSearch).getFrontmatterKey();
          if (card.frontmatter && card.frontmatter[key]) {
            textToSearch = String(card.frontmatter[key]);
          }
        }
        break;
      default:
        textToSearch = card.content || '';
    }
    
    // 정규식 검색인지 확인
    const isRegexSearch = this.isRegexPattern(query);
    
    // 검색어 위치 찾기
    if (textToSearch) {
      if (isRegexSearch) {
        try {
          // 정규식 검색
          const flags = caseSensitive ? 'g' : 'gi';
          const regex = new RegExp(query, flags);
          const positions: number[] = [];
          
          let match;
          while ((match = regex.exec(textToSearch)) !== null) {
            positions.push(match.index);
            // 0길이 매치 방지 (무한 루프 방지)
            if (match[0].length === 0) {
              regex.lastIndex++;
            }
          }
          
          return [{ text: query, positions }];
        } catch (error) {
          console.error('정규식 검색 오류:', error);
          return [];
        }
      } else {
        // 일반 검색
        const positions = this.findPositions(textToSearch, query, caseSensitive);
        return [{ text: query, positions }];
      }
    }
    
    return [];
  }
  
  /**
   * 텍스트에서 검색어 위치 찾기
   * @param text 검색 대상 텍스트
   * @param query 검색어
   * @param caseSensitive 대소문자 구분 여부
   * @returns 검색어 위치 배열
   */
  private findPositions(text: string, query: string, caseSensitive: boolean): number[] {
    const positions: number[] = [];
    
    if (!text || !query) {
      return positions;
    }
    
    const searchText = caseSensitive ? query : query.toLowerCase();
    const targetText = caseSensitive ? text : text.toLowerCase();
    
    let pos = 0;
    while ((pos = targetText.indexOf(searchText, pos)) !== -1) {
      positions.push(pos);
      pos += searchText.length;
    }
    
    return positions;
  }
  
  /**
   * 정규식 패턴인지 확인
   * @param pattern 검사할 패턴
   * @returns 정규식 패턴 여부
   */
  private isRegexPattern(pattern: string): boolean {
    // 정규식 패턴 확인 (슬래시로 시작하고 끝나는지)
    if (pattern.startsWith('/') && pattern.length > 2) {
      const lastSlashIndex = pattern.lastIndexOf('/');
      return lastSlashIndex > 0 && lastSlashIndex < pattern.length - 1;
    }
    
    // 정규식 특수 문자 포함 여부 확인
    const regexSpecialChars = ['*', '+', '?', '^', '$', '\\', '.', '[', ']', '{', '}', '(', ')'];
    return regexSpecialChars.some(char => pattern.includes(char));
  }

  /**
   * 복합 검색 실행
   * @param query 복합 검색어 (스페이스로 구분)
   * @param cards 검색할 카드 목록
   * @returns 검색 결과 카드 목록
   */
  async applyComplexSearch(query: string, cards: ICard[]): Promise<ICard[]> {
    console.log(`[SearchService] 복합 검색 실행: 쿼리='${query}'`);
    
    if (!query || query.trim() === '') {
      return cards;
    }
    
    try {
      // 검색 범위에 따라 검색 대상 카드 결정
      let targetCards: ICard[];
      if (this.searchScope === 'all') {
        // 볼트 전체 검색
        targetCards = await this.getAllVaultCards();
      } else {
        // 현재 카드셋 내 검색
        targetCards = cards.length > 0 ? cards : this.preSearchCards;
      }
      
      // 검색어 분리 (공백으로 구분)
      const searchTerms = query.split(' ').filter(term => term.trim() !== '');
      
      if (searchTerms.length === 0) {
        return targetCards;
      }
      
      // 각 검색어에 대해 검색 수행
      let filteredCards = [...targetCards];
      
      for (const term of searchTerms) {
        // 검색어 분석
        const { type, query: parsedQuery, frontmatterKey } = this.parseSearchTerm(term);
        
        // 검색 객체 생성
        let search: ISearch;
        const caseSensitive = this.searchCardSetSourceState.caseSensitive;
        
        switch (type) {
          case 'filename':
            search = new FilenameSearch(this.app, parsedQuery, caseSensitive);
            break;
          case 'content':
            search = new ContentSearch(this.app, parsedQuery, caseSensitive);
            break;
          case 'tag':
            search = new TagSearch(this.app, parsedQuery, caseSensitive);
            break;
          case 'path':
            search = new PathSearch(this.app, parsedQuery, caseSensitive);
            break;
          case 'frontmatter':
            search = new FrontmatterSearch(this.app, parsedQuery, caseSensitive, frontmatterKey);
            break;
          case 'create':
            search = new DateSearch(this.app, parsedQuery, 'creation', caseSensitive);
            break;
          case 'modify':
            search = new DateSearch(this.app, parsedQuery, 'modification', caseSensitive);
            break;
          case 'regex':
            search = new RegexSearch(this.app, parsedQuery, caseSensitive);
            break;
          default:
            // 기본은 파일명 검색
            search = new FilenameSearch(this.app, parsedQuery, caseSensitive);
        }
        
        // 검색 실행
        filteredCards = search.search(filteredCards);
      }
      
      console.log(`[SearchService] 복합 검색 결과: ${filteredCards.length}개 카드 찾음`);
      return filteredCards;
    } catch (error) {
      console.error(`[SearchService] 복합 검색 오류:`, error);
      return cards;
    }
  }

  /**
   * 검색어 분석
   * @param term 검색어
   * @returns 분석된 검색 정보
   */
  private parseSearchTerm(term: string): { type: SearchType; query: string; frontmatterKey?: string } {
    // 기본값은 파일명 검색
    let type: SearchType = 'filename';
    let query = term.trim();
    let frontmatterKey: string | undefined = undefined;
    
    // 태그 검색: #tag
    if (query.startsWith('#')) {
      type = 'tag';
      query = query.substring(1).trim();
    }
    // 내용 검색: content:text
    else if (query.startsWith('content:')) {
      type = 'content';
      query = query.substring(8).trim();
    }
    // 경로 검색: path:folder
    else if (query.startsWith('path:')) {
      type = 'path';
      query = query.substring(5).trim();
    }
    // 생성일 검색: create:date
    else if (query.startsWith('create:')) {
      type = 'create';
      query = query.substring(7).trim();
    }
    // 수정일 검색: modify:date
    else if (query.startsWith('modify:')) {
      type = 'modify';
      query = query.substring(7).trim();
    }
    // 프론트매터 검색: [key]:value
    else if (query.match(/^\[.+\]:/)) {
      const match = query.match(/^\[(.+)\]:(.*)/);
      if (match) {
        type = 'frontmatter';
        frontmatterKey = match[1].trim();
        query = match[2].trim();
      }
    }
    // 프론트매터 검색: key:value
    else if (query.includes(':')) {
      const parts = query.split(':', 2);
      if (parts.length === 2 && parts[0].trim() !== '') {
        type = 'frontmatter';
        frontmatterKey = parts[0].trim();
        query = parts[1].trim();
      }
    }
    
    // 따옴표 제거
    if (query.startsWith('"') && query.endsWith('"')) {
      query = query.substring(1, query.length - 1);
    }
    
    return { type, query, frontmatterKey };
  }

  /**
   * 검색 모드 상태 가져오기
   * @returns 검색 모드 상태
   */
  getSearchCardSetSourceState(): ISearchCardSetSourceState {
    return { ...this.searchCardSetSourceState };
  }
  
  /**
   * 검색 타입 설정
   * @param searchType 검색 타입
   * @param frontmatterKey 프론트매터 키 (검색 타입이 frontmatter인 경우)
   */
  setSearchType(searchType: SearchType, frontmatterKey?: string): void {
    this.searchCardSetSourceState.searchType = searchType;
    this.searchCardSetSourceState.frontmatterKey = frontmatterKey;
    
    // 검색 객체 업데이트
    this.changeSearchType(searchType, frontmatterKey);
  }
  
  /**
   * 검색 타입 가져오기
   * @returns 검색 타입
   */
  getSearchType(): SearchType {
    return this.searchCardSetSourceState.searchType;
  }
  
  /**
   * 이전 모드 정보 설정
   * @param cardSetSourceType 이전 모드 타입
   * @param cardSet 이전 카드 세트
   * @param cardSetType 이전 카드 세트 타입
   */
  setPreviousCardSetSourceInfo(
    cardSetSourceType: CardSetSourceType,
    cardSet: string | null,
    cardSetType: CardSetType
  ): void {
    this.searchCardSetSourceState.previousCardSetSource = cardSetSourceType;
    this.searchCardSetSourceState.previousCardSet = cardSet;
    this.searchCardSetSourceState.previousCardSetType = cardSetType;
  }
  
  /**
   * 이전 모드 가져오기
   * @returns 이전 모드 타입
   */
  getPreviousCardSetSource(): CardSetSourceType {
    return this.searchCardSetSourceState.previousCardSetSource;
  }
  
  /**
   * 검색 쿼리 가져오기
   * @returns 검색 쿼리
   */
  getQuery(): string {
    return this.searchCardSetSourceState.query;
  }

  /**
   * 검색 소스 가져오기
   * @returns 검색 소스
   */
  getSearchSource(): ICardSetSource {
    // 검색 소스 객체 생성 및 반환
    const searchSource: ICardSetSource = {
      type: 'search',
      currentCardSet: null,
      
      selectCardSet(cardSet: string | null, isFixed = false): void {
        // 검색 소스에서는 카드셋 선택이 의미가 없음
        console.log('[SearchSource] 검색 소스에서는 카드셋 선택이 지원되지 않습니다.');
      },
      
      isCardSetFixed(): boolean {
        // 검색 소스는 항상 고정되지 않음
        return false;
      },
      
      async getCardSets(): Promise<string[]> {
        // 검색 소스에서는 카드셋 목록이 없음
        return [];
      },
      
      async getFilterOptions(): Promise<string[]> {
        // 검색 소스에서는 필터 옵션이 없음
        return [];
      },
      
      async getFiles(): Promise<string[]> {
        // 현재 검색 결과에 해당하는 파일 목록 반환
        const self = this as unknown as SearchService;
        if (!self.currentSearch) return [];
        
        const allCards = await self.getAllVaultCards();
        const matchedCards = await self.currentSearch.search(allCards);
        return matchedCards.map((card: ICard) => card.path);
      },
      
      async getCards(cardService: any): Promise<any[]> {
        // 현재 검색 결과에 해당하는 카드 목록 반환
        const self = this as unknown as SearchService;
        if (!self.currentSearch) return [];
        
        const allCards = await self.getAllVaultCards();
        return await self.currentSearch.search(allCards);
      },
      
      reset(): void {
        // 검색 소스 초기화
        const self = this as unknown as SearchService;
        self.clearSearch();
      }
    };
    
    // this 바인딩
    searchSource.getFiles = searchSource.getFiles.bind(this);
    searchSource.getCards = searchSource.getCards.bind(this);
    searchSource.reset = searchSource.reset.bind(this);
    
    return searchSource;
  }

  /**
   * 프론트매터 키 설정
   * @param key 프론트매터 키
   */
  setFrontmatterKey(key: string): void {
    this.searchCardSetSourceState.frontmatterKey = key;
  }

  /**
   * 모드 변경 이벤트 처리
   * @param cardSetSourceType 변경된 모드 타입
   */
  onCardSetSourceChanged(cardSetSourceType: CardSetSourceType): void {
    console.log(`[SearchService] 모드 변경 감지: ${cardSetSourceType}`);
    
    // 검색 모드에서 다른 모드로 변경된 경우 검색 상태 초기화
    if (this.isInSearchCardSetSource && cardSetSourceType !== 'search') {
      this.isInSearchCardSetSource = false;
      this.clearSearch();
    }
  }

  /**
   * 검색 범위에 따른 프론트매터 값 목록 가져오기
   * @param key 프론트매터 키
   * @param searchScope 검색 범위 ('all' 또는 'current')
   * @param currentCards 현재 표시 중인 카드 목록
   * @returns 프론트매터 값 목록
   */
  async getScopedFrontmatterValues(key: string, searchScope: SearchScope, currentCards: ICard[]): Promise<string[]> {
    console.log(`[SearchService] 검색 범위에 따른 프론트매터 값 목록 가져오기: 키=${key}, 범위=${searchScope}`);
    
    try {
      let cards: ICard[];
      
      if (searchScope === 'all') {
        // 볼트 전체 카드 가져오기
        cards = await this.getAllVaultCards();
      } else {
        // 현재 카드셋의 카드만 가져오기
        cards = currentCards.length > 0 ? currentCards : this.preSearchCards;
      }
      
      // 프론트매터 값 추출
      const valueSet = new Set<string>();
      
      for (const card of cards) {
        if (card.frontmatter && card.frontmatter[key] !== undefined) {
          const value = card.frontmatter[key];
          if (value !== null) {
            valueSet.add(String(value));
          }
        }
      }
      
      return Array.from(valueSet).sort();
    } catch (error) {
      console.error(`[SearchService] 프론트매터 값 목록 가져오기 오류:`, error);
      return [];
    }
  }

  /**
   * 대소문자 구분 여부 가져오기
   * @returns 대소문자 구분 여부
   */
  isCaseSensitive(): boolean {
    return this.currentSearch ? this.currentSearch.isCaseSensitive() : false;
  }

  /**
   * 프론트매터 키 가져오기
   * @returns 프론트매터 키
   */
  getFrontmatterKey(): string | undefined {
    if (this.currentSearch && this.currentSearch.getType() === 'frontmatter') {
      const frontmatterSearch = this.currentSearch as FrontmatterSearch;
      return frontmatterSearch.getFrontmatterKey();
    }
    return undefined;
  }

  /**
   * 검색 결과 파일 목록 가져오기
   * @param query 검색 쿼리
   * @param searchType 검색 타입
   * @param caseSensitive 대소문자 구분 여부
   * @param frontmatterKey 프론트매터 키
   * @returns 파일 경로 목록
   */
  async getFilesForSearch(
    query: string, 
    searchType: SearchType, 
    caseSensitive: boolean, 
    frontmatterKey?: string
  ): Promise<string[]> {
    console.log(`[SearchService] 검색 결과 파일 목록 가져오기: 쿼리=${query}, 타입=${searchType}, 대소문자=${caseSensitive}, 프론트매터키=${frontmatterKey}`);
    
    // 임시 검색 객체 생성
    let tempSearch: ISearch;
    
    switch (searchType) {
      case 'filename':
        tempSearch = new FilenameSearch(this.app, query, caseSensitive);
        break;
      case 'content':
        tempSearch = new ContentSearch(this.app, query, caseSensitive);
        break;
      case 'tag':
        tempSearch = new TagSearch(this.app, query, caseSensitive);
        break;
      case 'folder':
        tempSearch = new FolderSearch(this.app, query, caseSensitive);
        break;
      case 'path':
        tempSearch = new PathSearch(this.app, query, caseSensitive);
        break;
      case 'frontmatter':
        tempSearch = new FrontmatterSearch(this.app, query, caseSensitive, frontmatterKey);
        break;
      case 'create':
        tempSearch = new DateSearch(this.app, query, 'creation', caseSensitive);
        break;
      case 'modify':
        tempSearch = new DateSearch(this.app, query, 'modification', caseSensitive);
        break;
      case 'regex':
        tempSearch = new RegexSearch(this.app, query, caseSensitive);
        break;
      default:
        tempSearch = new FilenameSearch(this.app, query, caseSensitive);
    }
    
    // 모든 카드 가져오기
    const allCards = await this.getAllVaultCards();
    
    // 검색 적용
    const matchedCards = await tempSearch.search(allCards);
    
    // 파일 경로 추출
    return matchedCards.map(card => card.path);
  }
} 