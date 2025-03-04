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
  applySearch(cards: ICard[]): ICard[];
  
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
  applyComplexSearch(query: string, cards: Card[]): Card[];

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
  
  constructor(presetService: IPresetService, cardService: ICardService, modeService: IModeService) {
    this.presetService = presetService;
    this.cardService = cardService;
    this.modeService = modeService;
  }
  
  initialize(): void {
    // 기본 검색 설정
    this.currentSearch = new FilenameSearch();
  }
  
  reset(): void {
    this.clearSearch();
    this.searchHistory = [];
  }
  
  getCurrentSearch(): ISearch | null {
    return this.currentSearch;
  }
  
  setSearch(search: ISearch): void {
    this.currentSearch = search;
  }
  
  setQuery(query: string): void {
    if (this.currentSearch) {
      this.currentSearch.setQuery(query);
    } else {
      this.currentSearch = new FilenameSearch(query);
    }
  }
  
  setSearchQuery(query: string): void {
    // 검색어가 비어있으면 검색 초기화
    if (!query) {
      this.clearSearch();
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
      this.changeSearchType('folder');
      this.setQuery(query.substring(5).trim());
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
  
  applySearch(cards: ICard[]): ICard[] {
    if (!this.currentSearch || !this.currentSearch.getQuery()) {
      return cards;
    }
    
    return this.currentSearch.search(cards);
  }
  
  clearSearch(): void {
    if (this.currentSearch) {
      this.currentSearch.setQuery('');
    }
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
      case 'frontmatter':
        this.currentSearch = new FrontmatterSearch(query, frontmatterKey || '', caseSensitive);
        break;
      default:
        this.currentSearch = new FilenameSearch(query, caseSensitive);
    }
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
  private parseSearchQuery(searchQuery: string): { type: SearchType; query: string; frontmatterKey?: string } {
    // 기본값은 파일명 검색
    let type: SearchType = 'filename';
    let query = searchQuery.trim();
    let frontmatterKey: string | undefined = undefined;
    
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
      type = 'folder';
      query = query.substring(5);
    }
    // 프론트매터 검색: key:value 또는 "key:value"
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
   * 복합 검색 실행
   * @param query 복합 검색어 (파이프로 구분)
   * @param cards 검색할 카드 목록
   * @returns 검색 결과 카드 목록
   */
  applyComplexSearch(query: string, cards: Card[]): Card[] {
    if (!query || query.trim() === '') {
      return cards;
    }

    // 파이프로 구분된 검색어 처리
    const parts = query.split('|').map(part => part.trim()).filter(part => part);
    if (parts.length === 0) {
      return cards;
    }

    let filteredCards = [...cards];

    // 각 검색 파트 적용
    for (const part of parts) {
      const { type, query: parsedQuery, frontmatterKey } = this.parseSearchQuery(part);
      
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
        default:
          tempSearch = new FilenameSearch(parsedQuery);
      }

      // 현재 검색의 대소문자 구분 설정 적용
      if (this.currentSearch) {
        tempSearch.setCaseSensitive(this.currentSearch.isCaseSensitive());
      }

      // 검색 적용
      filteredCards = tempSearch.search(filteredCards) as Card[];
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
} 