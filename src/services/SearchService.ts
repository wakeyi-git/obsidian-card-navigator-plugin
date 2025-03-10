import { ISearchSuggestion, ISearchSuggestionProvider, SearchType } from '../domain/search/Search';
import { IObsidianApp } from '../domain/obsidian/ObsidianInterfaces';
import { DomainEventBus } from '../domain/events/DomainEventBus';
import { EventType } from '../domain/events/EventTypes';

/**
 * 검색 서비스 클래스
 * 검색 관련 애플리케이션 유스케이스를 구현합니다.
 */
export class SearchService {
  /**
   * 검색 제안 제공자
   */
  private suggestionProvider: ISearchSuggestionProvider;
  
  /**
   * Obsidian 앱 어댑터
   */
  private obsidianApp: IObsidianApp;
  
  /**
   * 이벤트 버스
   */
  private eventBus: DomainEventBus;
  
  /**
   * 현재 검색어
   */
  private currentQuery: string = '';
  
  /**
   * 현재 검색 타입
   */
  private currentSearchType: SearchType = 'filename';
  
  /**
   * 대소문자 구분 여부
   */
  private caseSensitive: boolean = false;
  
  /**
   * 생성자
   * @param suggestionProvider 검색 제안 제공자
   * @param obsidianApp Obsidian 앱 어댑터
   */
  constructor(suggestionProvider: ISearchSuggestionProvider, obsidianApp: IObsidianApp) {
    this.suggestionProvider = suggestionProvider;
    this.obsidianApp = obsidianApp;
    this.eventBus = DomainEventBus.getInstance();
    
    // 이벤트 리스너 등록
    this.registerEventListeners();
  }
  
  /**
   * 이벤트 리스너 등록
   */
  private registerEventListeners(): void {
    // 검색 변경 이벤트 리스너
    this.eventBus.on(EventType.SEARCH_CHANGED, (data) => {
      this.currentQuery = data.query;
      this.currentSearchType = data.searchType;
      this.caseSensitive = data.caseSensitive;
    });
  }
  
  /**
   * 검색 수행
   * @param query 검색어
   * @param searchType 검색 타입
   * @param caseSensitive 대소문자 구분 여부
   * @returns 검색 결과
   */
  async search(query: string, searchType: SearchType, caseSensitive: boolean = false): Promise<any[]> {
    // 검색 상태 업데이트
    this.currentQuery = query;
    this.currentSearchType = searchType;
    this.caseSensitive = caseSensitive;
    
    // 검색 변경 이벤트 발생
    this.eventBus.emit(EventType.SEARCH_CHANGED, {
      query,
      searchType,
      caseSensitive
    });
    
    // 검색 로직 구현
    // 이 부분은 실제 검색 로직에 따라 달라질 수 있습니다.
    
    return [];
  }
  
  /**
   * 검색어 제안 가져오기
   * @param input 입력 텍스트
   * @returns 검색어 제안 목록
   */
  async getSuggestionsForInput(input: string): Promise<ISearchSuggestion[]> {
    // 입력이 비어있는 경우 검색 타입 제안 반환
    if (!input) {
      return this.suggestionProvider.getSearchTypeSuggestions();
    }
    
    // 검색 타입 접두사 확인
    const searchTypeMatch = this.getSearchTypeFromInput(input);
    if (searchTypeMatch) {
      const { searchType, partialQuery } = searchTypeMatch;
      return this.suggestionProvider.getQuerySuggestions(searchType, partialQuery);
    }
    
    // 기본 검색 타입으로 제안 가져오기
    return this.suggestionProvider.getQuerySuggestions(this.currentSearchType, input);
  }
  
  /**
   * 입력에서 검색 타입 추출
   * @param input 입력 텍스트
   * @returns 검색 타입과 부분 검색어
   */
  private getSearchTypeFromInput(input: string): { searchType: SearchType, partialQuery: string } | null {
    // 검색 타입 접두사 패턴
    const patterns = [
      { prefix: 'path:', type: 'path' as SearchType },
      { prefix: 'file:', type: 'file' as SearchType },
      { prefix: 'tag:', type: 'tag' as SearchType },
      { prefix: 'content:', type: 'content' as SearchType },
      { prefix: 'create:', type: 'create' as SearchType },
      { prefix: 'modify:', type: 'modify' as SearchType }
    ];
    
    // 접두사 확인
    for (const pattern of patterns) {
      if (input.startsWith(pattern.prefix)) {
        const partialQuery = input.substring(pattern.prefix.length);
        return { searchType: pattern.type, partialQuery };
      }
    }
    
    // 프론트매터 검색 패턴 확인
    const frontmatterMatch = input.match(/\[([^\]]*)\]/);
    if (frontmatterMatch) {
      const key = frontmatterMatch[1];
      const restInput = input.substring(frontmatterMatch[0].length).trim();
      
      return {
        searchType: 'frontmatter' as SearchType,
        partialQuery: key
      };
    }
    
    return null;
  }
  
  /**
   * 현재 검색어 가져오기
   * @returns 현재 검색어
   */
  getCurrentQuery(): string {
    return this.currentQuery;
  }
  
  /**
   * 현재 검색 타입 가져오기
   * @returns 현재 검색 타입
   */
  getCurrentSearchType(): SearchType {
    return this.currentSearchType;
  }
  
  /**
   * 대소문자 구분 여부 가져오기
   * @returns 대소문자 구분 여부
   */
  isCaseSensitive(): boolean {
    return this.caseSensitive;
  }
  
  /**
   * 검색 상태 설정
   * @param query 검색어
   * @param searchType 검색 타입
   * @param caseSensitive 대소문자 구분 여부
   */
  setSearchState(query: string, searchType: SearchType, caseSensitive: boolean): void {
    this.currentQuery = query;
    this.currentSearchType = searchType;
    this.caseSensitive = caseSensitive;
    
    // 검색 변경 이벤트 발생
    this.eventBus.emit(EventType.SEARCH_CHANGED, {
      query,
      searchType,
      caseSensitive
    });
  }
} 