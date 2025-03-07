import { ICard } from '../domain/card/Card';
import { ISearch, SearchType } from '../domain/search/Search';
import { FilenameSearch } from '../domain/search/FilenameSearch';
import { ContentSearch } from '../domain/search/ContentSearch';
import { TagSearch } from '../domain/search/TagSearch';
import { FrontmatterSearch } from '../domain/search/FrontmatterSearch';
import { FolderSearch } from '../domain/search/FolderSearch';
import { Card } from '../domain/card/Card';
import { IPresetService } from './PresetService';
import { ICardService } from './CardService';
import { IModeService } from './ModeService';
import { DateSearch } from '../domain/search/DateSearch';
import { RegexSearch } from '../domain/search/RegexSearch';
import { PathSearch } from '../domain/search/PathSearch';

/**
 * 검색 서비스 인터페이스
 * 검색 관리를 위한 인터페이스입니다.
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
   * 서비스 초기화
   */
  initialize(): void;
  
  /**
   * 설정 초기화
   */
  reset(): void;

  /**
   * 복합 검색 실행
   * @param query 복합 검색어 (파이프로 구분)
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
  isSearchMode(): boolean;
  
  /**
   * 검색 범위 설정
   * @param scopeType 검색 범위 타입 ('all' | 'current')
   */
  setSearchScope(scopeType: 'all' | 'current'): void;
  
  /**
   * 현재 검색 범위 가져오기
   * @returns 검색 범위 타입
   */
  getSearchScope(): 'all' | 'current';
  
  /**
   * 검색 모드 전환 전 카드셋 저장
   * @param cards 저장할 카드셋
   */
  setPreSearchCards(cards: ICard[]): void;
  
  /**
   * 검색 모드 전환 전 카드셋 가져오기
   * @returns 저장된 카드셋
   */
  getPreSearchCards(): ICard[];

  /**
   * 볼트 전체 노트를 카드로 가져오기
   * @returns 볼트 전체 노트를 변환한 카드 배열
   */
  getAllVaultCards(): Promise<ICard[]>;

  /**
   * 검색 범위에 따른 태그 목록 가져오기
   * @param searchScope 검색 범위 ('all' 또는 'current')
   * @param currentCards 현재 표시 중인 카드 목록
   * @returns 태그 목록
   */
  getScopedTags(searchScope: 'all' | 'current', currentCards: ICard[]): Promise<string[]>;
  
  /**
   * 검색 범위에 따른 파일명 목록 가져오기
   * @param searchScope 검색 범위 ('all' 또는 'current')
   * @param currentCards 현재 표시 중인 카드 목록
   * @returns 파일명 목록
   */
  getScopedFilenames(searchScope: 'all' | 'current', currentCards: ICard[]): Promise<string[]>;
  
  /**
   * 검색 범위에 따른 프론트매터 키 목록 가져오기
   * @param searchScope 검색 범위 ('all' 또는 'current')
   * @param currentCards 현재 표시 중인 카드 목록
   * @returns 프론트매터 키 목록
   */
  getScopedFrontmatterKeys(searchScope: 'all' | 'current', currentCards: ICard[]): Promise<string[]>;
  
  /**
   * 검색 범위에 따른 프론트매터 값 목록 가져오기
   * @param key 프론트매터 키
   * @param searchScope 검색 범위 ('all' 또는 'current')
   * @param currentCards 현재 표시 중인 카드 목록
   * @returns 프론트매터 값 목록
   */
  getScopedFrontmatterValues(key: string, searchScope: 'all' | 'current', currentCards: ICard[]): Promise<string[]>;
}

/**
 * 검색 서비스 클래스
 * 검색 관리를 위한 클래스입니다.
 */
export class SearchService implements ISearchService {
  private currentSearch: ISearch | null = null;
  private searchHistory: string[] = [];
  private readonly MAX_HISTORY_SIZE = 10;
  private presetService: IPresetService;
  private cardService: ICardService;
  private modeService: IModeService;
  private isInSearchMode: boolean = false;
  private searchScope: 'all' | 'current' = 'current';
  private preSearchCards: ICard[] = [];
  
  constructor(presetService: IPresetService, cardService: ICardService, modeService: IModeService) {
    this.presetService = presetService;
    this.cardService = cardService;
    this.modeService = modeService;
  }
  
  initialize(): void {
    // 기본 검색 설정
    this.currentSearch = new FilenameSearch();
    this.isInSearchMode = false;
    this.searchScope = 'current';
    this.preSearchCards = [];
  }
  
  reset(): void {
    this.clearSearch();
    this.searchHistory = [];
    this.isInSearchMode = false;
    this.searchScope = 'current';
    this.preSearchCards = [];
  }
  
  getCurrentSearch(): ISearch | null {
    return this.currentSearch;
  }
  
  setSearch(search: ISearch): void {
    this.currentSearch = search;
    this.isInSearchMode = !!search && !!search.getQuery();
  }
  
  setQuery(query: string): void {
    if (this.currentSearch) {
      this.currentSearch.setQuery(query);
      this.isInSearchMode = !!query;
    } else {
      this.currentSearch = new FilenameSearch(query);
      this.isInSearchMode = !!query;
    }
  }
  
  setSearchQuery(query: string): void {
    // 검색어가 비어있으면 검색 초기화
    if (!query) {
      this.clearSearch();
      return;
    }
    
    // 파이프로 구분된 복합 검색인 경우
    if (query.includes('|')) {
      // 복합 검색은 별도의 처리 없이 그대로 유지
      // 실제 검색은 applyComplexSearch에서 처리
      this.isInSearchMode = true;
      return;
    }
    
    // 검색 타입 자동 선택
    if (query.startsWith('file:')) {
      // 파일명 검색
      this.changeSearchType('filename');
      this.setQuery(query.substring(5).trim());
    } else if (query.startsWith('content:')) {
      // 내용 검색
      this.changeSearchType('content');
      this.setQuery(query.substring(8).trim());
    } else if (query.startsWith('tag:')) {
      // 태그 검색
      this.changeSearchType('tag');
      this.setQuery(query.substring(4).trim());
    } else if (query.startsWith('path:')) {
      // 경로 검색
      this.changeSearchType('path');
      this.setQuery(query.substring(5).trim());
    } else if (query.startsWith('regex:')) {
      // 정규식 검색
      const regexPattern = query.substring(6).trim();
      this.currentSearch = new RegexSearch(regexPattern);
      this.isInSearchMode = true;
    } else if (query.startsWith('create:')) {
      // 생성일 검색
      const dateQuery = query.substring(7).trim();
      this.currentSearch = new DateSearch(dateQuery, 'creation');
      this.isInSearchMode = true;
    } else if (query.startsWith('modify:')) {
      // 수정일 검색
      const dateQuery = query.substring(7).trim();
      this.currentSearch = new DateSearch(dateQuery, 'modification');
      this.isInSearchMode = true;
    } else if (query.match(/^\[.+\]:/)) {
      // 프론트매터 검색
      const match = query.match(/^\[(.+)\]:(.*)/);
      if (match) {
        const key = match[1];
        const value = match[2].trim();
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
  
  setCaseSensitive(caseSensitive: boolean): void {
    if (this.currentSearch) {
      this.currentSearch.setCaseSensitive(caseSensitive);
    }
  }
  
  /**
   * 검색 적용
   * @param cards 카드 목록
   * @returns 검색된 카드 목록
   */
  async applySearch(cards: ICard[]): Promise<ICard[]> {
    if (!this.currentSearch || !this.currentSearch.getQuery()) {
      this.isInSearchMode = false;
      return Promise.resolve(cards);
    }
    
    this.isInSearchMode = true;
    
    // 검색 범위에 따라 검색 대상 결정
    let searchTargetCards: ICard[];
    
    if (this.searchScope === 'current' && this.preSearchCards.length > 0) {
      // 'current' 범위: 저장된 카드셋에서 검색
      console.log(`[SearchService] 현재 카드셋에서 검색 (${this.preSearchCards.length}개)`);
      searchTargetCards = this.preSearchCards;
    } else {
      // 'all' 범위: 볼트 전체 노트에서 검색
      console.log('[SearchService] 볼트 전체에서 검색');
      searchTargetCards = await this.getAllVaultCards();
      console.log(`[SearchService] 볼트 전체 노트 로드 완료 (${searchTargetCards.length}개)`);
    }
    
    // 검색 실행
    return this.currentSearch.search(searchTargetCards);
  }
  
  clearSearch(): void {
    if (this.currentSearch) {
      this.currentSearch.setQuery('');
    }
    this.isInSearchMode = false;
  }
  
  changeSearchType(type: SearchType, frontmatterKey?: string): void {
    const query = this.currentSearch ? this.currentSearch.getQuery() : '';
    const caseSensitive = this.currentSearch ? this.currentSearch.isCaseSensitive() : false;
    
    switch (type) {
      case 'filename':
        this.currentSearch = new FilenameSearch(query, caseSensitive);
        break;
      case 'content':
        this.currentSearch = new ContentSearch(query, caseSensitive);
        break;
      case 'tag':
        this.currentSearch = new TagSearch(query, caseSensitive);
        break;
      case 'folder':
        this.currentSearch = new FolderSearch(query, caseSensitive);
        break;
      case 'path':
        this.currentSearch = new PathSearch(query, caseSensitive);
        break;
      case 'create':
        this.currentSearch = new DateSearch(query, 'creation');
        break;
      case 'modify':
        this.currentSearch = new DateSearch(query, 'modification');
        break;
      case 'frontmatter':
        this.currentSearch = new FrontmatterSearch(query, frontmatterKey || '', caseSensitive);
        break;
      default:
        this.currentSearch = new FilenameSearch(query, caseSensitive);
    }
    
    this.isInSearchMode = !!query;
  }
  
  saveSearchHistory(query: string): void {
    if (!query || query.trim() === '') return;
    
    // 중복 검색어 제거
    this.searchHistory = this.searchHistory.filter(item => item !== query);
    
    // 최근 검색어 추가
    this.searchHistory.unshift(query);
    
    // 최대 개수 유지
    if (this.searchHistory.length > this.MAX_HISTORY_SIZE) {
      this.searchHistory = this.searchHistory.slice(0, this.MAX_HISTORY_SIZE);
    }
  }
  
  getSearchHistory(): string[] {
    return [...this.searchHistory];
  }
  
  /**
   * 검색어 구문 분석
   * @param searchQuery 검색어
   * @returns 분석된 검색 정보
   */
  private parseSearchQuery(searchQuery: string): { type: SearchType | 'regex' | 'date'; query: string; frontmatterKey?: string; dateType?: 'creation' | 'modification' } {
    // 기본값은 파일명 검색
    let type: SearchType | 'regex' | 'date' = 'filename';
    let query = searchQuery.trim();
    let frontmatterKey: string | undefined = undefined;
    let dateType: 'creation' | 'modification' | undefined = undefined;
    
    // 태그 검색: #tag
    if (query.startsWith('#')) {
      type = 'tag';
      query = query.substring(1);
    }
    // 내용 검색: content:text 또는 "content:text"
    else if (query.startsWith('content:')) {
      type = 'content';
      query = query.substring(8);
    }
    // 폴더 검색: path:folder 또는 "path:folder"
    else if (query.startsWith('path:')) {
      type = 'path';
      query = query.substring(5);
    }
    // 정규식 검색: regex:pattern
    else if (query.startsWith('regex:')) {
      type = 'regex';
      query = query.substring(6);
    }
    // 생성일 검색: create:date
    else if (query.startsWith('create:')) {
      type = 'date';
      query = query.substring(7);
      dateType = 'creation';
    }
    // 수정일 검색: modify:date
    else if (query.startsWith('modify:')) {
      type = 'date';
      query = query.substring(7);
      dateType = 'modification';
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
    
    return { type, query, frontmatterKey, dateType };
  }

  /**
   * 복합 검색 실행
   * @param query 복합 검색어 (파이프로 구분)
   * @param cards 검색할 카드 목록
   * @returns 검색 결과 카드 목록
   */
  async applyComplexSearch(query: string, cards: ICard[]): Promise<ICard[]> {
    if (!query || query.trim() === '') {
      this.isInSearchMode = false;
      return cards;
    }

    // 파이프로 구분된 검색어 처리
    const parts = query.split('|').map(part => part.trim()).filter(part => part);
    if (parts.length === 0) {
      this.isInSearchMode = false;
      return cards;
    }

    this.isInSearchMode = true;

    // 검색 범위에 따라 검색할 카드셋 결정
    let filteredCards: ICard[];
    
    if (this.searchScope === 'current' && this.preSearchCards.length > 0) {
      // 'current' 범위: 저장된 카드셋에서 검색
      console.log(`[SearchService] 복합 검색: 현재 카드셋에서 검색 (${this.preSearchCards.length}개)`);
      filteredCards = [...this.preSearchCards];
    } else {
      // 'all' 범위: 볼트 전체 노트에서 검색
      console.log('[SearchService] 복합 검색: 볼트 전체에서 검색');
      filteredCards = await this.getAllVaultCards();
      console.log(`[SearchService] 볼트 전체 노트 로드 완료 (${filteredCards.length}개)`);
    }

    // 각 검색 파트 적용
    for (const part of parts) {
      const { type, query: parsedQuery, frontmatterKey, dateType } = this.parseSearchQuery(part);
      
      // 임시 검색 객체 생성
      let tempSearch: ISearch;
      switch (type) {
        case 'filename':
          tempSearch = new FilenameSearch(parsedQuery);
          break;
        case 'content':
          tempSearch = new ContentSearch(parsedQuery);
          break;
        case 'tag':
          tempSearch = new TagSearch(parsedQuery);
          break;
        case 'frontmatter':
          tempSearch = new FrontmatterSearch(parsedQuery, frontmatterKey || '');
          break;
        case 'folder':
          tempSearch = new FolderSearch(parsedQuery);
          break;
        case 'path':
          tempSearch = new PathSearch(parsedQuery);
          break;
        case 'regex':
          tempSearch = new RegexSearch(parsedQuery);
          break;
        case 'date':
          tempSearch = new DateSearch(parsedQuery, dateType);
          break;
        default:
          tempSearch = new FilenameSearch(parsedQuery);
      }

      // 현재 검색의 대소문자 구분 설정 적용
      if (this.currentSearch) {
        tempSearch.setCaseSensitive(this.currentSearch.isCaseSensitive());
      }

      // 검색 적용
      filteredCards = tempSearch.search(filteredCards) as ICard[];
    }

    return filteredCards;
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
    const cardSets = await this.modeService.getCardSets();
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
    if (!this.currentSearch || !this.isInSearchMode) {
      return [];
    }
    
    const query = this.currentSearch.getQuery();
    if (!query) {
      return [];
    }
    
    const type = this.currentSearch.getType();
    const caseSensitive = this.currentSearch.isCaseSensitive();
    
    let textToSearch = '';
    let positions: number[] = [];
    
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
    
    // 검색어 위치 찾기
    if (textToSearch) {
      let searchText = caseSensitive ? query : query.toLowerCase();
      let targetText = caseSensitive ? textToSearch : textToSearch.toLowerCase();
      
      let pos = 0;
      while ((pos = targetText.indexOf(searchText, pos)) !== -1) {
        positions.push(pos);
        pos += searchText.length;
      }
    }
    
    return [{ text: query, positions }];
  }

  /**
   * 검색 모드 여부 확인
   * @returns 검색 모드 여부
   */
  isSearchMode(): boolean {
    return this.isInSearchMode;
  }
  
  /**
   * 검색 범위 설정
   * @param scopeType 검색 범위 타입 ('all' | 'current')
   */
  setSearchScope(scopeType: 'all' | 'current'): void {
    this.searchScope = scopeType;
  }
  
  /**
   * 현재 검색 범위 가져오기
   * @returns 검색 범위 타입
   */
  getSearchScope(): 'all' | 'current' {
    return this.searchScope;
  }
  
  /**
   * 검색 모드 전환 전 카드셋 저장
   * @param cards 저장할 카드셋
   */
  setPreSearchCards(cards: ICard[]): void {
    this.preSearchCards = cards;
  }
  
  /**
   * 검색 모드 전환 전 카드셋 가져오기
   * @returns 저장된 카드셋
   */
  getPreSearchCards(): ICard[] {
    return this.preSearchCards;
  }

  /**
   * 볼트 전체 노트를 카드로 가져오기
   * @returns 볼트 전체 노트를 변환한 카드 배열
   */
  async getAllVaultCards(): Promise<ICard[]> {
    try {
      // @ts-ignore - Obsidian API 접근
      const app = window.app;
      if (!app) {
        console.error('[SearchService] Obsidian app 객체를 찾을 수 없습니다.');
        return [];
      }
      
      // 볼트의 모든 마크다운 파일 가져오기
      const files = app.vault.getMarkdownFiles();
      console.log(`[SearchService] 볼트 전체 노트 수: ${files.length}개`);
      
      // 카드 서비스를 통해 모든 카드 가져오기
      const allCards = await this.cardService.getAllCards();
      
      return allCards;
    } catch (error) {
      console.error('[SearchService] 볼트 전체 노트 가져오기 오류:', error);
      return [];
    }
  }

  /**
   * 검색 범위에 따른 태그 목록 가져오기
   * @param searchScope 검색 범위 ('all' 또는 'current')
   * @param currentCards 현재 표시 중인 카드 목록
   * @returns 태그 목록
   */
  async getScopedTags(searchScope: 'all' | 'current', currentCards: ICard[]): Promise<string[]> {
    // 검색 범위가 현재 카드셋이고 카드가 있는 경우
    if (searchScope === 'current' && currentCards.length > 0) {
      const tagsSet = new Set<string>();
      
      // 현재 카드셋에서 태그 수집
      currentCards.forEach(card => {
        // 본문 태그 수집
        card.tags.forEach(tag => tagsSet.add(tag));
        
        // 프론트매터 태그 수집
        if (card.frontmatter) {
          if (card.frontmatter.tag) {
            if (Array.isArray(card.frontmatter.tag)) {
              card.frontmatter.tag.forEach(tag => tagsSet.add(tag));
            } else {
              tagsSet.add(String(card.frontmatter.tag));
            }
          }
          
          if (card.frontmatter.tags) {
            if (Array.isArray(card.frontmatter.tags)) {
              card.frontmatter.tags.forEach(tag => tagsSet.add(String(tag)));
            } else {
              tagsSet.add(String(card.frontmatter.tags));
            }
          }
        }
      });
      
      return Array.from(tagsSet);
    } else {
      // 전체 노트에서 태그 수집
      return this.getTags();
    }
  }
  
  /**
   * 검색 범위에 따른 파일명 목록 가져오기
   * @param searchScope 검색 범위 ('all' 또는 'current')
   * @param currentCards 현재 표시 중인 카드 목록
   * @returns 파일명 목록
   */
  async getScopedFilenames(searchScope: 'all' | 'current', currentCards: ICard[]): Promise<string[]> {
    // 검색 범위가 현재 카드셋이고 카드가 있는 경우
    if (searchScope === 'current' && currentCards.length > 0) {
      // 현재 카드셋에서 파일명 수집
      return currentCards.map(card => {
        // 경로에서 파일명만 추출
        const pathParts = card.path.split('/');
        return pathParts[pathParts.length - 1].replace('.md', '');
      });
    } else {
      // 전체 노트에서 파일명 수집
      const cards = await this.cardService.getAllCards();
      return cards.map(card => {
        const pathParts = card.path.split('/');
        return pathParts[pathParts.length - 1].replace('.md', '');
      });
    }
  }
  
  /**
   * 검색 범위에 따른 프론트매터 키 목록 가져오기
   * @param searchScope 검색 범위 ('all' 또는 'current')
   * @param currentCards 현재 표시 중인 카드 목록
   * @returns 프론트매터 키 목록
   */
  async getScopedFrontmatterKeys(searchScope: 'all' | 'current', currentCards: ICard[]): Promise<string[]> {
    // 검색 범위가 현재 카드셋이고 카드가 있는 경우
    if (searchScope === 'current' && currentCards.length > 0) {
      // 현재 카드셋에서 프론트매터 키 수집
      const keysSet = new Set<string>();
      
      currentCards.forEach(card => {
        if (card.frontmatter) {
          Object.keys(card.frontmatter).forEach(key => keysSet.add(key));
        }
      });
      
      return Array.from(keysSet);
    } else {
      // 전체 노트에서 프론트매터 키 수집
      return this.getFrontmatterKeys();
    }
  }
  
  /**
   * 검색 범위에 따른 프론트매터 값 목록 가져오기
   * @param key 프론트매터 키
   * @param searchScope 검색 범위 ('all' 또는 'current')
   * @param currentCards 현재 표시 중인 카드 목록
   * @returns 프론트매터 값 목록
   */
  async getScopedFrontmatterValues(key: string, searchScope: 'all' | 'current', currentCards: ICard[]): Promise<string[]> {
    // 특정 프론트매터 키에 대한 값 수집
    const valuesSet = new Set<string>();
    
    const cards = searchScope === 'current' && currentCards.length > 0
      ? currentCards
      : await this.cardService.getAllCards();
    
    cards.forEach(card => {
      if (card.frontmatter && card.frontmatter[key] !== undefined) {
        const value = card.frontmatter[key];
        
        if (Array.isArray(value)) {
          value.forEach(v => {
            if (typeof v === 'string' || typeof v === 'number') {
              valuesSet.add(String(v));
            }
          });
        } else if (typeof value === 'string' || typeof value === 'number') {
          valuesSet.add(String(value));
        }
      }
    });
    
    return Array.from(valuesSet);
  }
} 