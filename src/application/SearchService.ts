import { App, TFile } from 'obsidian';
import { ICard } from '../domain/card/Card';
import { ISearch, Search, SearchType, SearchScope } from '../domain/search/Search';
import { TagSearch } from '../domain/search/TagSearch';
import { FrontmatterSearch } from '../domain/search/FrontmatterSearch';
import { ContentSearch } from '../domain/search/ContentSearch';
import { FileSearch } from '../domain/search/FileSearch';
import { DateSearch } from '../domain/search/DateSearch';
import { TitleSearch } from '../domain/search/TitleSearch';
import { ComplexSearch } from '../domain/search/ComplexSearch';
import { SearchHistory } from '../domain/search/SearchHistory';
import { SearchFactory } from '../domain/search/SearchFactory';
import { SearchHighlightInfo } from '../domain/search/SearchHighlightInfo';
import { FolderSearch } from '../domain/search/FolderSearch';
import { RegexSearch } from '../domain/search/RegexSearch';
import { PathSearch } from '../domain/search/PathSearch';
import { ICardNavigatorService } from './CardNavigatorService';
import { CardNavigatorSettings } from '../main';
import { CardSetSourceType, CardSetType, ICardSetSource, ICardSetState } from '../domain/cardset/CardSet';
import { EventEmitter } from 'events';
import { 
  ISearchService, 
  ISearchManager, 
  ISearchQueryManager, 
  ISearchApplier, 
  ISearchHistoryManager, 
  ISearchScopeManager, 
  ISearchMetadataProvider, 
  ISearchCardSetSourceManager, 
  IPreviousCardSetSourceManager, 
  ISearchSourceManager,
  ISearchCardSetSourceState
} from '../domain/search/SearchInterfaces';
import { IPresetService } from './PresetService';
import { ICardService } from './CardService';
import { ICardSetService } from './CardSetService';

// ISearchService 인터페이스를 내보냅니다.
export type { ISearchService };

/**
 * 검색 서비스 구현 클래스
 * 검색 및 필터링 관리를 위한 서비스입니다.
 */
export class SearchService implements ISearchService {
  private currentSearch: ISearch | null = null;
  private searchHistory: string[] = [];
  private readonly MAX_HISTORY_SIZE = 10;
  private presetService: IPresetService;
  private cardService: ICardService;
  private cardSetService: ICardSetService | null;
  private isInSearchCardSetSource = false;
  private searchScope: SearchScope = 'current';
  private preSearchCards: ICard[] = [];
  private cardNavigatorService: ICardNavigatorService | null;
  private app: App | null = null;
  
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
  
  constructor(
    presetService: IPresetService, 
    cardService: ICardService, 
    cardSetService: ICardSetService | null = null, 
    cardNavigatorService: ICardNavigatorService | null = null
  ) {
    this.presetService = presetService;
    this.cardService = cardService;
    this.cardSetService = cardSetService;
    this.cardNavigatorService = cardNavigatorService;
    
    // 검색 기록 로드
    this.loadSearchHistory();
  }
  
  /**
   * 초기화
   * 검색 서비스를 초기화합니다.
   */
  initialize(): void {
    try {
      // 기본 검색 설정
      if (this.app) {
        this.currentSearch = new FileSearch(this.app);
      } else {
        console.warn('[SearchService] App 객체가 설정되지 않았습니다.');
        // App이 null인 경우 currentSearch는 null로 유지
      }
      this.isInSearchCardSetSource = false;
      
      // 설정에서 기본 검색 범위 가져오기
      if (this.cardNavigatorService) {
        try {
          const settings = this.cardNavigatorService.getSettings();
          if (settings && settings.defaultSearchScope) {
            this.searchScope = settings.defaultSearchScope;
          }
        } catch (error) {
          console.warn('[SearchService] 설정을 가져오는 중 오류 발생:', error);
        }
      } else {
        console.warn('[SearchService] CardNavigatorService가 설정되지 않았습니다.');
      }
      
      // 검색 기록 로드
      this.loadSearchHistory();
    } catch (error) {
      console.error('[SearchService] 초기화 중 오류 발생:', error);
    }
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
    const settings = this.cardNavigatorService?.getSettings();
    if (settings && settings.defaultSearchScope) {
      this.searchScope = settings.defaultSearchScope;
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
  
  /**
   * 검색어 설정 (검색 타입 자동 선택)
   * @param query 검색어
   */
  setSearchQuery(query: string): void {
    try {
      console.log(`[SearchService] 검색어 설정: ${query}`);
      
      if (!query) {
        this.clearSearch();
        return;
      }
      
      // app이 null인지 확인
      if (!this.app) {
        console.error('[SearchService] App 객체가 설정되지 않았습니다.');
        // 검색 상태만 업데이트
        this.searchCardSetSourceState.query = query;
        this.isInSearchCardSetSource = true;
        return;
      }
      
      if (this.currentSearch) {
        this.currentSearch.setQuery(query);
      } else {
        // 검색 객체가 없는 경우 기본 검색 객체(파일명 검색) 생성
        this.currentSearch = new FileSearch(this.app, query);
      }
      
      this.isInSearchCardSetSource = true;
      
      // 검색 상태 업데이트
      this.searchCardSetSourceState.query = query;
    } catch (error) {
      console.error('[SearchService] 검색어 설정 중 오류 발생:', error);
    }
  }
  
  /**
   * 대소문자 구분 여부 설정
   * @param caseSensitive 대소문자 구분 여부
   */
  setCaseSensitive(caseSensitive: boolean): void {
    try {
      console.log(`[SearchService] 대소문자 구분 설정: ${caseSensitive}`);
      
      if (this.currentSearch) {
        this.currentSearch.setCaseSensitive(caseSensitive);
      }
      
      // 검색 상태 업데이트
      this.searchCardSetSourceState.caseSensitive = caseSensitive;
    } catch (error) {
      console.error('[SearchService] 대소문자 구분 설정 중 오류 발생:', error);
    }
  }
  
  /**
   * 검색 적용
   * @param cards 검색할 카드 목록
   * @returns 검색 결과 카드 목록
   */
  async applySearch(cards: ICard[]): Promise<ICard[]> {
    try {
      if (!this.currentSearch) {
        return cards;
      }

      // 검색 범위에 따라 대상 카드 결정
      let targetCards = cards;
      if (this.searchScope === 'current' && this.isInSearchCardSetSource && this.preSearchCards.length > 0) {
        targetCards = this.preSearchCards;
      }

      console.log(`[SearchService] 검색 적용: ${this.currentSearch.getType()} 타입, 쿼리: "${this.currentSearch.getQuery()}", 대상 카드: ${targetCards.length}개`);
      
      // 검색 실행
      const result = await this.currentSearch.search(targetCards);
      console.log(`[SearchService] 검색 결과: ${result.length}개 카드 찾음`);
      
      return result;
    } catch (error) {
      console.error('[SearchService] 검색 적용 오류:', error);
      return [];
    }
  }
  
  clearSearch(): void {
    if (this.currentSearch) {
      this.currentSearch.setQuery('');
    }
    this.isInSearchCardSetSource = false;
  }
  
  /**
   * 검색 타입 변경
   * @param type 검색 타입
   * @param frontmatterKey 프론트매터 키 (검색 타입이 frontmatter인 경우)
   */
  changeSearchType(type: SearchType, frontmatterKey?: string): void {
    console.log(`[SearchService] 검색 타입 변경: ${type}, 프론트매터 키: ${frontmatterKey || '없음'}`);
    
    // app이 null인지 확인
    if (!this.app) {
      console.error('[SearchService] App 객체가 설정되지 않았습니다.');
      return;
    }
    
    // 현재 쿼리 가져오기
    const query = this.currentSearch ? this.currentSearch.getQuery() : '';
    
    // 대소문자 구분 여부 가져오기
    const caseSensitive = this.currentSearch ? this.currentSearch.isCaseSensitive() : false;
    
    // 검색 타입에 따라 검색 객체 생성
    switch (type) {
      case 'filename':
        this.currentSearch = new FileSearch(this.app, query, caseSensitive);
        break;
      case 'content':
        this.currentSearch = new ContentSearch(this.app, query, caseSensitive);
        break;
      case 'tag':
        this.currentSearch = new TagSearch(this.app, query, caseSensitive);
        break;
      case 'frontmatter':
        this.currentSearch = new FrontmatterSearch(this.app, query, frontmatterKey || '', caseSensitive);
        break;
      case 'folder':
        this.currentSearch = new FolderSearch(this.app, query, caseSensitive);
        break;
      case 'path':
        this.currentSearch = new PathSearch(this.app, query, caseSensitive);
        break;
      case 'date':
        this.currentSearch = new DateSearch(this.app, query, 'creation', caseSensitive);
        break;
      case 'regex':
        this.currentSearch = new RegexSearch(this.app, query, caseSensitive);
        break;
      case 'title':
        this.currentSearch = new TitleSearch(this.app, query, caseSensitive);
        break;
      case 'file':
        this.currentSearch = new FileSearch(this.app, query, caseSensitive);
        break;
      case 'complex':
        this.currentSearch = new ComplexSearch(this.app, query, caseSensitive);
        break;
      default:
        this.currentSearch = new FileSearch(this.app, query, caseSensitive);
    }
    
    // 검색 타입 변경 시 프론트매터 키 저장
    if (type === 'frontmatter' && frontmatterKey) {
      this.searchCardSetSourceState.frontmatterKey = frontmatterKey;
    } else {
      this.searchCardSetSourceState.frontmatterKey = undefined;
    }
    
    // 검색 타입 저장
    this.searchCardSetSourceState.searchType = type;
    
    // 이벤트 발생
    this.cardNavigatorService?.notifyCardSetSourceChanged('search');
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
   * 검색 범위에 따른 프론트매터 값 목록 가져오기
   * @param key 프론트매터 키
   * @param searchScope 검색 범위 ('all' 또는 'current')
   * @param currentCards 현재 표시 중인 카드 목록
   * @returns 프론트매터 값 목록
   */
  async getScopedFrontmatterValues(key: string, searchScope: SearchScope, currentCards: ICard[]): Promise<string[]> {
    try {
      console.log(`[SearchService] 프론트매터 값 목록 가져오기: 키=${key}, 범위=${searchScope}`);
      
      // 검색 범위에 따라 대상 카드 결정
      let targetCards: ICard[] = [];
      
      if (searchScope === 'all') {
        // 전체 범위인 경우 모든 카드 가져오기
        targetCards = await this.cardService.getAllCards();
      } else {
        // 현재 범위인 경우 현재 카드 사용
        targetCards = currentCards;
      }
      
      // 프론트매터 값 추출
      const values = new Set<string>();
      
      for (const card of targetCards) {
        if (card.frontmatter && key in card.frontmatter) {
          const value = card.frontmatter[key];
          
          // 값이 배열인 경우 각 항목 추가
          if (Array.isArray(value)) {
            value.forEach(item => {
              if (item !== null && item !== undefined) {
                values.add(String(item));
              }
            });
          } else if (value !== null && value !== undefined) {
            // 단일 값인 경우 추가
            values.add(String(value));
          }
        }
      }
      
      // 정렬된 배열로 변환
      const result = Array.from(values).sort();
      console.log(`[SearchService] 프론트매터 값 ${result.length}개 찾음: ${key}`);
      
      return result;
    } catch (error) {
      console.error(`[SearchService] 프론트매터 값 목록 가져오기 오류: ${error}`);
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
   * 검색 카드셋 소스 모드로 전환
   * @param query 검색 쿼리
   * @param searchType 검색 타입
   * @param caseSensitive 대소문자 구분 여부
   * @param frontmatterKey 프론트매터 키 (검색 타입이 frontmatter인 경우)
   */
  enterSearchCardSetSource(query: string, searchType?: SearchType, caseSensitive?: boolean, frontmatterKey?: string): void {
    try {
      console.log(`[SearchService] 검색 카드셋 소스 모드 진입: ${query}, 타입: ${searchType}, 대소문자 구분: ${caseSensitive}, 프론트매터 키: ${frontmatterKey || '없음'}`);
      
      // 현재 카드 목록 저장
      const currentCards = this.cardNavigatorService?.getCurrentCards();
      
      // 검색 모드로 전환
      this.isInSearchCardSetSource = true;
      
      // 이전 모드 정보 저장
      const cardSetSourceService = this.cardSetService;
      const currentCardSetSource = cardSetSourceService?.getCurrentSourceType();
      if (currentCardSetSource && currentCardSetSource !== 'search') {
        // 타입 안전성을 위해 기본값 설정
        const safeCardSetSource: CardSetSourceType = currentCardSetSource;
        // cardSet이 undefined일 수 있으므로 null로 기본값 설정
        const cardSet = cardSetSourceService?.getCurrentCardSet() || null;
        const cardSetType: CardSetType = cardSetSourceService?.isCardSetFixed() ? 'fixed' : 'active';
        this.setPreviousCardSetSourceInfo(safeCardSetSource, cardSet, cardSetType);
      }
      
      // 검색 설정
      if (searchType) {
        this.setSearchType(searchType, frontmatterKey);
      }
      
      if (caseSensitive !== undefined) {
        this.setCaseSensitive(caseSensitive);
      }
      
      this.setQuery(query);
      
      // 검색 기록 저장
      this.saveSearchHistory(query);
      
      // 현재 카드 목록 저장
      if (currentCards && currentCards.length > 0) {
        this.setPreSearchCards(currentCards);
      }
    } catch (error) {
      console.error('[SearchService] 검색 카드셋 소스 모드 진입 중 오류 발생:', error);
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
    this.cardSetService?.restorePreviousSourceState();
    
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
   * 검색 모드 전환 전 카드셋 설정
   * @param cards 저장할 카드 목록
   */
  setPreSearchCards(cards: ICard[] | undefined): void {
    if (cards) {
      this.preSearchCards = cards;
      // 검색 상태에도 저장
      this.searchCardSetSourceState.preSearchCards = [...cards];
      console.log(`[SearchService] 검색 전 카드 ${cards.length}개 저장됨`);
    } else {
      console.warn('[SearchService] 검색 전 카드 저장 실패: 카드가 정의되지 않음');
    }
  }
  
  /**
   * 검색 모드 전환 전 카드셋 가져오기
   * @returns 저장된 카드셋
   */
  getPreSearchCards(): ICard[] {
    try {
      // 상태에서 가져오거나 기본 배열 반환
      return this.searchCardSetSourceState.preSearchCards || this.preSearchCards || [];
    } catch (error) {
      console.error('[SearchService] 검색 전 카드 가져오기 실패:', error);
      return [];
    }
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
    const cardSets = await this.cardSetService?.getCardSets();
    return cardSets?.filter(path => path.includes('/')) || [];
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
    try {
      console.log(`[SearchService] 복합 검색 적용: ${query}`);
      
      // 검색 쿼리가 없는 경우 모든 카드 반환
      if (!query) {
        return cards;
      }
      
      // app이 null인지 확인
      if (!this.app) {
        console.error('[SearchService] App 객체가 설정되지 않았습니다.');
        return cards;
      }
      
      // 검색 쿼리 파싱
      const parts = query.split(/\s+(?:AND|OR|NOT)\s+|\s*\(\s*|\s*\)\s*/).filter(Boolean);
      const operators = query.match(/\s+(?:AND|OR|NOT)\s+|\s*\(\s*|\s*\)\s*/g) || [];
      
      // 검색 결과 저장
      let result: ICard[] = [];
      
      // 단일 검색어인 경우 간단히 처리
      if (parts.length === 1 && operators.length === 0) {
        const { searchType, parsedQuery, frontmatterKey } = this.parseSearchQuery(query);
        
        // 검색 객체 생성
        let search: ISearch;
        
        // 검색 타입에 따라 검색 객체 생성
        const caseSensitive = this.searchCardSetSourceState.caseSensitive;
        
        switch (searchType) {
          case 'filename':
            search = new FileSearch(this.app, parsedQuery, caseSensitive);
            break;
          case 'content':
            search = new ContentSearch(this.app, parsedQuery, caseSensitive);
            break;
          case 'tag':
            search = new TagSearch(this.app, parsedQuery, caseSensitive);
            break;
          case 'frontmatter':
            search = new FrontmatterSearch(this.app, parsedQuery, frontmatterKey || '', caseSensitive);
            break;
          case 'folder':
            search = new FolderSearch(this.app, parsedQuery, caseSensitive);
            break;
          case 'path':
            search = new PathSearch(this.app, parsedQuery, caseSensitive);
            break;
          case 'date':
            search = new DateSearch(this.app, parsedQuery, 'creation', caseSensitive);
            break;
          case 'regex':
            search = new RegexSearch(this.app, parsedQuery, caseSensitive);
            break;
          case 'title':
            search = new TitleSearch(this.app, parsedQuery, caseSensitive);
            break;
          default:
            search = new FileSearch(this.app, parsedQuery, caseSensitive);
        }
        
        // 검색 실행
        result = await search.search(cards);
      } else {
        // 복합 검색 처리
        const complexSearch = new ComplexSearch(this.app, query, this.searchCardSetSourceState.caseSensitive);
        result = await complexSearch.search(cards);
      }
      
      console.log(`[SearchService] 복합 검색 결과: ${result.length}개 카드 찾음`);
      return result;
    } catch (error) {
      console.error('[SearchService] 복합 검색 적용 중 오류 발생:', error);
      return cards; // 오류 발생 시 원본 카드 목록 반환
    }
  }

  /**
   * 검색을 위한 파일 목록 가져오기
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
    try {
      console.log(`[SearchService] 검색을 위한 파일 목록 가져오기: ${query}, 타입: ${searchType}, 대소문자 구분: ${caseSensitive}, 프론트매터 키: ${frontmatterKey || '없음'}`);
      
      // app이 null인지 확인
      if (!this.app) {
        console.error('[SearchService] App 객체가 설정되지 않았습니다.');
        return [];
      }
      
      // 임시 검색 객체 생성
      let tempSearch: ISearch;
      
      // 검색 타입에 따라 검색 객체 생성
      switch (searchType) {
        case 'filename':
          tempSearch = new FileSearch(this.app, query, caseSensitive);
          break;
        case 'content':
          tempSearch = new ContentSearch(this.app, query, caseSensitive);
          break;
        case 'tag':
          tempSearch = new TagSearch(this.app, query, caseSensitive);
          break;
        case 'frontmatter':
          tempSearch = new FrontmatterSearch(this.app, query, frontmatterKey || '', caseSensitive);
          break;
        case 'folder':
          tempSearch = new FolderSearch(this.app, query, caseSensitive);
          break;
        case 'path':
          tempSearch = new PathSearch(this.app, query, caseSensitive);
          break;
        case 'date':
          tempSearch = new DateSearch(this.app, query, 'creation', caseSensitive);
          break;
        case 'regex':
          tempSearch = new RegexSearch(this.app, query, caseSensitive);
          break;
        case 'title':
          tempSearch = new TitleSearch(this.app, query, caseSensitive);
          break;
        case 'complex':
          tempSearch = new ComplexSearch(this.app, query, caseSensitive);
          break;
        default:
          tempSearch = new FileSearch(this.app, query, caseSensitive);
      }
      
      // 모든 카드 가져오기
      const allCards = await this.cardService.getAllCards();
      
      // 검색 실행
      const searchResults = await tempSearch.search(allCards);
      
      // 파일 경로 추출
      const filePaths = searchResults
        .filter(card => card && card.file) // card와 card.file이 null이 아닌 카드만 필터링
        .map(card => {
          // 타입 안전성을 위해 추가 확인
          if (card.file && card.file.path) {
            return card.file.path;
          }
          return '';
        })
        .filter(path => path !== ''); // 빈 경로 제거
      
      console.log(`[SearchService] 검색 결과 파일 수: ${filePaths.length}`);
      return filePaths;
    } catch (error) {
      console.error('[SearchService] 검색 파일 목록 가져오기 중 오류 발생:', error);
      return [];
    }
  }

  /**
   * 검색 소스 가져오기
   * @returns 검색 소스
   */
  getSearchSource(): ICardSetSource {
    try {
      const state = this.getSearchCardSetSourceState();
      const self = this; // 클로저에서 사용할 this 참조 저장
      
      // 검색 소스 객체 생성
      const searchSource: ICardSetSource = {
        type: 'search',
        currentCardSet: null, // 검색 소스는 카드셋을 가지지 않음
        
        // 카드셋 목록 가져오기 (검색 소스는 카드셋이 없으므로 빈 배열 반환)
        async getCardSets(): Promise<string[]> {
          return [];
        },
        
        // 카드셋 선택 (검색 소스는 카드셋을 선택할 수 없음)
        selectCardSet(cardSet: string | null, isFixed?: boolean): void {
          // 아무 작업도 하지 않음
        },
        
        // 카드셋 고정 여부 확인 (검색 소스는 항상 고정됨)
        isCardSetFixed(): boolean {
          return true;
        },
        
        // 필터 옵션 가져오기 (검색 소스는 필터 옵션이 없음)
        async getFilterOptions(): Promise<string[]> {
          return [];
        },
        
        // 파일 목록 가져오기
        async getFiles(): Promise<string[]> {
          // 검색 결과에 해당하는 파일 목록 반환
          if (self.currentSearch) {
            return await self.getFilesForSearch(
              state.query,
              state.searchType,
              state.caseSensitive,
              state.frontmatterKey
            );
          }
          return [];
        },
        
        // 카드 목록 가져오기
        async getCards(cardService: any): Promise<any[]> {
          if (self.currentSearch) {
            // 검색 범위에 따라 대상 카드 결정
            let targetCards: ICard[] = [];
            
            if (state.searchScope === 'all') {
              // 전체 범위인 경우 모든 카드 가져오기
              targetCards = await cardService.getAllCards();
            } else if (self.preSearchCards.length > 0) {
              // 현재 범위인 경우 이전 카드 사용
              targetCards = self.preSearchCards;
            } else if (self.cardNavigatorService) {
              // 이전 카드가 없는 경우 현재 카드 사용
              targetCards = self.cardNavigatorService.getCurrentCards();
            } else {
              // 모든 카드 가져오기
              targetCards = await cardService.getAllCards();
            }
            
            // 검색 실행
            return await self.currentSearch.search(targetCards);
          }
          
          return [];
        },
        
        // 설정 초기화
        reset(): void {
          // 검색 초기화
          self.clearSearch();
        },
        
        // 현재 카드셋 상태 가져오기
        getState(): ICardSetState {
          return {
            currentCardSet: null,
            isFixed: true
          };
        },
        
        // 카드셋 상태 설정하기
        setState(state: ICardSetState): void {
          // 아무 작업도 하지 않음
        }
      };
      
      return searchSource;
    } catch (error) {
      console.error('[SearchService] 검색 소스 가져오기 오류:', error);
      
      // 기본 검색 소스 반환
      return {
        type: 'search',
        currentCardSet: null,
        
        async getCardSets(): Promise<string[]> {
          return [];
        },
        
        selectCardSet(cardSet: string | null, isFixed?: boolean): void {
          // 아무 작업도 하지 않음
        },
        
        isCardSetFixed(): boolean {
          return true;
        },
        
        async getFilterOptions(): Promise<string[]> {
          return [];
        },
        
        async getFiles(): Promise<string[]> {
          return [];
        },
        
        async getCards(): Promise<any[]> {
          return [];
        },
        
        reset(): void {
          // 아무 작업도 하지 않음
        },
        
        getState(): ICardSetState {
          return {
            currentCardSet: null,
            isFixed: true
          };
        },
        
        setState(state: ICardSetState): void {
          // 아무 작업도 하지 않음
        }
      };
    }
  }
  
  /**
   * 모드 변경 이벤트 처리
   * @param cardSetSourceType 변경된 모드 타입
   */
  onCardSetSourceChanged(cardSetSourceType: CardSetSourceType): void {
    try {
      console.log(`[SearchService] 모드 변경 이벤트 처리: ${cardSetSourceType}`);
      
      // 검색 모드가 아닌 경우 검색 모드 종료
      if (cardSetSourceType !== 'search' && this.isInSearchCardSetSource) {
        this.exitSearchCardSetSource();
      }
    } catch (error) {
      console.error('[SearchService] 모드 변경 이벤트 처리 오류:', error);
    }
  }

  /**
   * 검색 소스 설정
   * @param query 검색 쿼리
   * @param searchType 검색 타입
   * @param caseSensitive 대소문자 구분 여부
   * @param frontmatterKey 프론트매터 키 (검색 타입이 frontmatter인 경우)
   */
  configureSearchSource(query: string, searchType: SearchType = 'filename', caseSensitive = false, frontmatterKey?: string): void {
    try {
      console.log(`[SearchService] 검색 소스 설정: ${query}, 타입: ${searchType}, 대소문자 구분: ${caseSensitive}, 프론트매터 키: ${frontmatterKey || '없음'}`);
      
      // app이 null인지 확인
      if (!this.app) {
        console.error('[SearchService] App 객체가 설정되지 않았습니다.');
        return;
      }
      
      // 검색 객체 생성
      let tempSearch: ISearch;
      
      // 검색 타입에 따라 검색 객체 생성
      switch (searchType) {
        case 'filename':
          tempSearch = new FileSearch(this.app, query, caseSensitive);
          break;
        case 'content':
          tempSearch = new ContentSearch(this.app, query, caseSensitive);
          break;
        case 'tag':
          tempSearch = new TagSearch(this.app, query, caseSensitive);
          break;
        case 'frontmatter':
          tempSearch = new FrontmatterSearch(this.app, query, frontmatterKey || '', caseSensitive);
          break;
        case 'folder':
          tempSearch = new FolderSearch(this.app, query, caseSensitive);
          break;
        case 'path':
          tempSearch = new PathSearch(this.app, query, caseSensitive);
          break;
        case 'date':
          tempSearch = new DateSearch(this.app, query, 'creation', caseSensitive);
          break;
        case 'regex':
          tempSearch = new RegexSearch(this.app, query, caseSensitive);
          break;
        case 'title':
          tempSearch = new TitleSearch(this.app, query, caseSensitive);
          break;
        case 'file':
          tempSearch = new FileSearch(this.app, query, caseSensitive);
          break;
        case 'complex':
          tempSearch = new ComplexSearch(this.app, query, caseSensitive);
          break;
        default:
          tempSearch = new FileSearch(this.app, query, caseSensitive);
      }
      
      // 검색 객체 설정
      this.currentSearch = tempSearch;
      
      // 검색 상태 업데이트
      this.searchCardSetSourceState.query = query;
      this.searchCardSetSourceState.searchType = searchType;
      this.searchCardSetSourceState.caseSensitive = caseSensitive;
      this.searchCardSetSourceState.frontmatterKey = frontmatterKey;
    } catch (error) {
      console.error('[SearchService] 검색 소스 설정 중 오류 발생:', error);
    }
  }

  /**
   * 검색 쿼리 파싱
   * @param query 검색 쿼리
   * @returns 파싱된 검색 정보
   */
  private parseSearchQuery(query: string): { searchType: SearchType; parsedQuery: string; frontmatterKey?: string } {
    // 기본값은 파일명 검색
    let searchType: SearchType = 'filename';
    let parsedQuery = query.trim();
    let frontmatterKey: string | undefined = undefined;
    
    // 태그 검색: #tag
    if (parsedQuery.startsWith('#')) {
      searchType = 'tag';
      parsedQuery = parsedQuery.substring(1).trim();
    }
    // 내용 검색: content:text
    else if (parsedQuery.startsWith('content:')) {
      searchType = 'content';
      parsedQuery = parsedQuery.substring(8).trim();
    }
    // 경로 검색: path:folder
    else if (parsedQuery.startsWith('path:')) {
      searchType = 'path';
      parsedQuery = parsedQuery.substring(5).trim();
    }
    // 폴더 검색: folder:name
    else if (parsedQuery.startsWith('folder:')) {
      searchType = 'folder';
      parsedQuery = parsedQuery.substring(7).trim();
    }
    // 제목 검색: title:text
    else if (parsedQuery.startsWith('title:')) {
      searchType = 'title';
      parsedQuery = parsedQuery.substring(6).trim();
    }
    // 생성일 검색: create:date
    else if (parsedQuery.startsWith('create:')) {
      searchType = 'date';
      parsedQuery = parsedQuery.substring(7).trim();
    }
    // 수정일 검색: modify:date
    else if (parsedQuery.startsWith('modify:')) {
      searchType = 'date';
      parsedQuery = parsedQuery.substring(7).trim();
    }
    // 정규식 검색: regex:pattern
    else if (parsedQuery.startsWith('regex:')) {
      searchType = 'regex';
      parsedQuery = parsedQuery.substring(6).trim();
    }
    // 프론트매터 검색: [key]:value
    else if (parsedQuery.match(/^\[.+\]:/)) {
      const match = parsedQuery.match(/^\[(.+)\]:(.*)/);
      if (match) {
        searchType = 'frontmatter';
        frontmatterKey = match[1].trim();
        parsedQuery = match[2].trim();
      }
    }
    // 프론트매터 검색: key:value
    else if (parsedQuery.includes(':')) {
      const parts = parsedQuery.split(':', 2);
      if (parts.length === 2 && parts[0].trim() !== '') {
        // 이미 처리된 특수 접두사가 아닌 경우에만 프론트매터로 처리
        const specialPrefixes = ['content', 'path', 'folder', 'title', 'create', 'modify', 'regex'];
        if (!specialPrefixes.includes(parts[0].trim())) {
          searchType = 'frontmatter';
          frontmatterKey = parts[0].trim();
          parsedQuery = parts[1].trim();
        }
      }
    }
    
    // 따옴표 제거
    if (parsedQuery.startsWith('"') && parsedQuery.endsWith('"')) {
      parsedQuery = parsedQuery.substring(1, parsedQuery.length - 1);
    }
    
    return { searchType, parsedQuery, frontmatterKey };
  }

  /**
   * 카드셋 서비스 설정
   * @param service 카드셋 서비스
   */
  setCardSetService(service: ICardSetService): void {
    this.cardSetService = service;
  }
  
  /**
   * 카드 네비게이터 서비스 설정
   * @param service 카드 네비게이터 서비스
   */
  setCardNavigatorService(service: ICardNavigatorService): void {
    this.cardNavigatorService = service;
    this.app = service.getApp();
    
    // 설정에서 기본 검색 범위 가져오기
    try {
      const settings = service.getSettings();
      if (settings && settings.defaultSearchScope) {
        this.searchScope = settings.defaultSearchScope;
      }
    } catch (error) {
      console.warn('[SearchService] 설정을 가져오는 중 오류 발생:', error);
    }
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
    try {
      console.log(`[SearchService] 이전 모드 정보 설정: ${cardSetSourceType}, 카드셋: ${cardSet || '없음'}, 타입: ${cardSetType}`);
      this.searchCardSetSourceState.previousCardSetSource = cardSetSourceType;
      this.searchCardSetSourceState.previousCardSet = cardSet;
      this.searchCardSetSourceState.previousCardSetType = cardSetType;
    } catch (error) {
      console.error('[SearchService] 이전 모드 정보 설정 중 오류 발생:', error);
    }
  }

  /**
   * 검색 타입 설정
   * @param searchType 검색 타입
   * @param frontmatterKey 프론트매터 키 (검색 타입이 frontmatter인 경우)
   */
  setSearchType(searchType: SearchType, frontmatterKey?: string): void {
    try {
      console.log(`[SearchService] 검색 타입 설정: ${searchType}, 프론트매터 키: ${frontmatterKey || '없음'}`);
      
      // app이 null인지 확인
      if (!this.app) {
        console.error('[SearchService] App 객체가 설정되지 않았습니다.');
        return;
      }
      
      // 현재 검색 객체가 있는 경우 검색 타입 변경
      if (this.currentSearch) {
        const query = this.currentSearch.getQuery();
        
        // 검색 타입에 따라 새 검색 객체 생성
        switch (searchType) {
          case 'filename':
            this.currentSearch = new FileSearch(this.app, query, this.currentSearch.isCaseSensitive());
            break;
          case 'content':
            this.currentSearch = new ContentSearch(this.app, query, this.currentSearch.isCaseSensitive());
            break;
          case 'tag':
            this.currentSearch = new TagSearch(this.app, query, this.currentSearch.isCaseSensitive());
            break;
          case 'frontmatter':
            this.currentSearch = new FrontmatterSearch(this.app, query, frontmatterKey || '', this.currentSearch.isCaseSensitive());
            break;
          case 'folder':
            this.currentSearch = new FolderSearch(this.app, query, this.currentSearch.isCaseSensitive());
            break;
          case 'path':
            this.currentSearch = new PathSearch(this.app, query, this.currentSearch.isCaseSensitive());
            break;
          case 'date':
            this.currentSearch = new DateSearch(this.app, query, 'creation', this.currentSearch.isCaseSensitive());
            break;
          case 'regex':
            this.currentSearch = new RegexSearch(this.app, query, this.currentSearch.isCaseSensitive());
            break;
          case 'title':
            this.currentSearch = new TitleSearch(this.app, query, this.currentSearch.isCaseSensitive());
            break;
          case 'complex':
            this.currentSearch = new ComplexSearch(this.app, query, this.currentSearch.isCaseSensitive());
            break;
          default:
            this.currentSearch = new FileSearch(this.app, query, this.currentSearch.isCaseSensitive());
        }
      } else {
        // 검색 객체가 없는 경우 빈 쿼리로 새 검색 객체 생성
        switch (searchType) {
          case 'filename':
            this.currentSearch = new FileSearch(this.app, '', false);
            break;
          case 'content':
            this.currentSearch = new ContentSearch(this.app, '', false);
            break;
          case 'tag':
            this.currentSearch = new TagSearch(this.app, '', false);
            break;
          case 'frontmatter':
            this.currentSearch = new FrontmatterSearch(this.app, '', frontmatterKey || '', false);
            break;
          case 'folder':
            this.currentSearch = new FolderSearch(this.app, '', false);
            break;
          case 'path':
            this.currentSearch = new PathSearch(this.app, '', false);
            break;
          case 'date':
            this.currentSearch = new DateSearch(this.app, '', 'creation', false);
            break;
          case 'regex':
            this.currentSearch = new RegexSearch(this.app, '', false);
            break;
          case 'title':
            this.currentSearch = new TitleSearch(this.app, '', false);
            break;
          case 'complex':
            this.currentSearch = new ComplexSearch(this.app, '', false);
            break;
          default:
            this.currentSearch = new FileSearch(this.app, '', false);
        }
      }
      
      // 검색 상태 업데이트
      this.searchCardSetSourceState.searchType = searchType;
      if (frontmatterKey) {
        this.searchCardSetSourceState.frontmatterKey = frontmatterKey;
      }
    } catch (error) {
      console.error('[SearchService] 검색 타입 설정 중 오류 발생:', error);
    }
  }
  
  /**
   * 검색 타입 가져오기
   * @returns 검색 타입
   */
  getSearchType(): SearchType {
    if (this.currentSearch) {
      return this.currentSearch.getType();
    }
    return this.searchCardSetSourceState.searchType || 'filename';
  }
  
  /**
   * 검색 쿼리 가져오기
   * @returns 검색 쿼리
   */
  getQuery(): string {
    if (this.currentSearch) {
      return this.currentSearch.getQuery();
    }
    return this.searchCardSetSourceState.query || '';
  }
  
  /**
   * 대소문자 구분 여부 가져오기
   * @returns 대소문자 구분 여부
   */
  isCaseSensitive(): boolean {
    if (this.currentSearch) {
      return this.currentSearch.isCaseSensitive();
    }
    return this.searchCardSetSourceState.caseSensitive || false;
  }
  
  /**
   * 프론트매터 키 가져오기
   * @returns 프론트매터 키
   */
  getFrontmatterKey(): string | undefined {
    if (this.currentSearch && this.currentSearch.getType() === 'frontmatter') {
      return (this.currentSearch as FrontmatterSearch).getFrontmatterKey();
    }
    return this.searchCardSetSourceState.frontmatterKey;
  }
  
  /**
   * 프론트매터 키 설정
   * @param key 프론트매터 키
   */
  setFrontmatterKey(key: string): void {
    try {
      console.log(`[SearchService] 프론트매터 키 설정: ${key}`);
      
      // 검색 타입이 frontmatter인 경우에만 설정
      if (this.currentSearch && this.currentSearch.getType() === 'frontmatter') {
        // 현재 검색 객체가 FrontmatterSearch인 경우 키 설정
        if (this.app) {
          const query = this.currentSearch.getQuery();
          const caseSensitive = this.currentSearch.isCaseSensitive();
          this.currentSearch = new FrontmatterSearch(this.app, query, key, caseSensitive);
        }
      }
      
      // 검색 상태 업데이트
      this.searchCardSetSourceState.frontmatterKey = key;
    } catch (error) {
      console.error('[SearchService] 프론트매터 키 설정 중 오류 발생:', error);
    }
  }

  /**
   * 검색 쿼리 설정
   * @param query 검색 쿼리
   */
  setQuery(query: string): void {
    try {
      console.log(`[SearchService] 검색 쿼리 설정: ${query}`);
      
      // app이 null인지 확인
      if (!this.app) {
        console.error('[SearchService] App 객체가 설정되지 않았습니다.');
        // 검색 상태만 업데이트
        this.searchCardSetSourceState.query = query;
        this.isInSearchCardSetSource = !!query;
        return;
      }
      
      // 현재 검색 객체가 있는 경우 쿼리 업데이트
      if (this.currentSearch) {
        this.currentSearch.setQuery(query);
      } else {
        // 검색 객체가 없는 경우 기본 검색 객체(파일명 검색) 생성
        this.currentSearch = new FileSearch(this.app, query);
      }
      
      this.isInSearchCardSetSource = !!query;
      
      // 검색 상태 업데이트
      this.searchCardSetSourceState.query = query;
    } catch (error) {
      console.error('[SearchService] 검색 쿼리 설정 중 오류 발생:', error);
    }
  }

  /**
   * 이전 모드 가져오기
   * @returns 이전 모드 타입
   */
  getPreviousCardSetSource(): CardSetSourceType {
    try {
      return this.searchCardSetSourceState.previousCardSetSource;
    } catch (error) {
      console.error('[SearchService] 이전 모드 가져오기 중 오류 발생:', error);
      return 'folder'; // 기본값으로 'folder' 반환
    }
  }

  /**
   * App 객체 설정
   * @param app Obsidian App 객체
   */
  setApp(app: App): void {
    try {
      console.log('[SearchService] App 객체 설정');
      this.app = app;
    } catch (error) {
      console.error('[SearchService] App 객체 설정 중 오류 발생:', error);
    }
  }

  /**
   * 검색 카드셋 소스 상태 가져오기
   * @returns 검색 카드셋 소스 상태
   */
  getSearchCardSetSourceState(): ISearchCardSetSourceState {
    try {
      return { ...this.searchCardSetSourceState };
    } catch (error) {
      console.error('[SearchService] 검색 카드셋 소스 상태 가져오기 오류:', error);
      // 기본 상태 반환
      return {
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
    }
  }
} 