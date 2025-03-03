import { ICard } from '../domain/card/Card';
import { ISearch, SearchType } from '../domain/search/Search';
import { FilenameSearch } from '../domain/search/FilenameSearch';
import { ContentSearch } from '../domain/search/ContentSearch';
import { TagSearch } from '../domain/search/TagSearch';
import { FrontmatterSearch } from '../domain/search/FrontmatterSearch';

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
  setSearchQuery(query: string): Promise<void>;
  
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
}

/**
 * 검색 서비스 클래스
 * 검색 관리를 위한 클래스입니다.
 */
export class SearchService implements ISearchService {
  private currentSearch: ISearch | null = null;
  private searchHistory: string[] = [];
  private readonly MAX_HISTORY_SIZE = 10;
  
  constructor(initialSearch?: ISearch) {
    this.currentSearch = initialSearch || null;
  }
  
  initialize(): void {
    // 기본 검색 설정
    if (!this.currentSearch) {
      this.setSearch(new FilenameSearch(''));
    }
    
    // 검색 기록 로드
    this.loadSearchHistory();
  }
  
  reset(): void {
    this.clearSearch();
    this.initialize();
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
      // 검색 객체가 없으면 기본 검색 객체 생성
      this.currentSearch = new FilenameSearch(query);
    }
  }
  
  /**
   * 검색어 설정 (검색 타입 자동 선택)
   * @param query 검색어
   */
  async setSearchQuery(query: string): Promise<void> {
    // 검색어가 비어있으면 검색 초기화
    if (!query || query.trim() === '') {
      this.clearSearch();
      return;
    }
    
    // 검색어 형태에 따라 적절한 검색 타입 선택
    if (query.startsWith('#')) {
      // 태그 검색
      const tagQuery = query.substring(1);
      this.currentSearch = new TagSearch(tagQuery);
    } else if (query.includes(':')) {
      // 프론트매터 검색
      const [key, value] = query.split(':', 2);
      if (key && value) {
        this.currentSearch = new FrontmatterSearch(value.trim(), key.trim());
      } else {
        this.currentSearch = new ContentSearch(query);
      }
    } else {
      // 기본 검색 (파일명 검색)
      this.currentSearch = new FilenameSearch(query);
    }
    
    // 검색 기록에 추가
    this.saveSearchHistory(query);
  }
  
  setCaseSensitive(caseSensitive: boolean): void {
    if (this.currentSearch) {
      this.currentSearch.setCaseSensitive(caseSensitive);
    }
  }
  
  applySearch(cards: ICard[]): ICard[] {
    if (!this.currentSearch || !this.currentSearch.query) {
      return [...cards];
    }
    
    return this.currentSearch.apply(cards);
  }
  
  clearSearch(): void {
    if (this.currentSearch) {
      this.currentSearch.setQuery('');
    }
  }
  
  /**
   * 검색 타입 변경
   * @param type 변경할 검색 타입
   * @param frontmatterKey 프론트매터 키 (frontmatter 타입인 경우)
   */
  changeSearchType(type: SearchType, frontmatterKey?: string): void {
    const query = this.currentSearch?.query || '';
    const caseSensitive = this.currentSearch?.caseSensitive || false;
    
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
      case 'frontmatter':
        this.currentSearch = new FrontmatterSearch(query, frontmatterKey || '', caseSensitive);
        break;
      default:
        this.currentSearch = new FilenameSearch(query, caseSensitive);
    }
  }
  
  /**
   * 검색 기록 저장
   * @param query 검색어
   */
  saveSearchHistory(query: string): void {
    if (!query) return;
    
    // 중복 검색어 제거
    this.searchHistory = this.searchHistory.filter(item => item !== query);
    
    // 검색어 추가
    this.searchHistory.unshift(query);
    
    // 최대 개수 유지
    if (this.searchHistory.length > this.MAX_HISTORY_SIZE) {
      this.searchHistory = this.searchHistory.slice(0, this.MAX_HISTORY_SIZE);
    }
    
    // 검색 기록 저장
    this.saveSearchHistoryToStorage();
  }
  
  /**
   * 검색 기록 가져오기
   * @returns 검색 기록 목록
   */
  getSearchHistory(): string[] {
    return [...this.searchHistory];
  }
  
  /**
   * 검색 기록 로드
   */
  private loadSearchHistory(): void {
    // 실제 구현에서는 저장소에서 검색 기록을 로드하는 로직 추가
    // 여기서는 빈 배열로 초기화
    this.searchHistory = [];
  }
  
  /**
   * 검색 기록 저장
   */
  private saveSearchHistoryToStorage(): void {
    // 실제 구현에서는 저장소에 검색 기록을 저장하는 로직 추가
    // 여기서는 구현하지 않음
  }
} 