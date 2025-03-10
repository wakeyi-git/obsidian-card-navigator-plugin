import { ICard } from '../../domain/card/Card';
import { ICardSet } from '../../domain/cardset/CardSet';
import { DomainEventBus } from '../../domain/events/DomainEventBus';
import { EventType } from '../../domain/events/EventTypes';
import { ISearchField, ISearchSuggestion, SearchScope, SearchType } from '../../domain/search/Search';
import { ISearchHighlightInfo } from '../../domain/search/SearchHighlightInfo';
import { ISettingsService } from '../../domain/settings/SettingsInterfaces';
import { CardSetService } from '../cardset/CardSetService';
import { ISearchHistoryService } from './SearchHistoryService';
import { ISearchSuggestionService } from './SearchSuggestionService';

/**
 * 검색 서비스 인터페이스
 */
export interface ISearchService {
  /**
   * 검색 수행
   * @param query 검색어
   * @param searchType 검색 타입
   * @param scope 검색 범위
   * @returns 검색 결과
   */
  search(query: string, searchType?: SearchType, scope?: SearchScope): Promise<ICard[]>;
  
  /**
   * 복합 검색 수행
   * @param fields 검색 필드 목록
   * @param scope 검색 범위
   * @returns 검색 결과
   */
  searchMultipleFields(fields: ISearchField[], scope?: SearchScope): Promise<ICard[]>;
  
  /**
   * 검색 제안 가져오기
   * @param query 검색어
   * @returns 검색 제안 목록
   */
  getSuggestions(query: string): Promise<ISearchSuggestion[]>;
  
  /**
   * 검색 히스토리 가져오기
   * @returns 검색 히스토리
   */
  getSearchHistory(): string[];
  
  /**
   * 검색 히스토리 초기화
   */
  clearSearchHistory(): void;
  
  /**
   * 현재 검색어 가져오기
   * @returns 현재 검색어
   */
  getCurrentQuery(): string;
  
  /**
   * 현재 검색 타입 가져오기
   * @returns 현재 검색 타입
   */
  getCurrentSearchType(): SearchType;
  
  /**
   * 검색 결과 가져오기
   * @returns 검색 결과
   */
  getSearchResults(): ICard[];
  
  /**
   * 검색 강조 정보 가져오기
   * @param cardId 카드 ID
   * @returns 검색 강조 정보
   */
  getHighlightInfo(cardId: string): ISearchHighlightInfo | undefined;
}

/**
 * 검색 서비스
 * 검색 기능을 관리합니다.
 */
export class SearchService implements ISearchService {
  private cardSetService: CardSetService;
  private settingsService: ISettingsService;
  private eventBus: DomainEventBus;
  private searchHistoryService: ISearchHistoryService;
  private searchSuggestionService: ISearchSuggestionService;
  private currentQuery: string = '';
  private currentSearchType: SearchType = 'content';
  private currentScope: SearchScope = 'current';
  private searchResults: ICard[] = [];
  private highlightInfoMap: Map<string, ISearchHighlightInfo> = new Map();
  
  /**
   * 생성자
   * @param cardSetService 카드셋 서비스
   * @param settingsService 설정 서비스
   * @param eventBus 이벤트 버스
   * @param searchHistoryService 검색 히스토리 서비스
   * @param searchSuggestionService 검색 제안 서비스
   */
  constructor(
    cardSetService: CardSetService,
    settingsService: ISettingsService,
    eventBus: DomainEventBus,
    searchHistoryService: ISearchHistoryService,
    searchSuggestionService: ISearchSuggestionService
  ) {
    this.cardSetService = cardSetService;
    this.settingsService = settingsService;
    this.eventBus = eventBus;
    this.searchHistoryService = searchHistoryService;
    this.searchSuggestionService = searchSuggestionService;
    
    // 설정에서 기본 검색 범위 가져오기
    const settings = this.settingsService.getSettings();
    this.currentScope = settings.defaultSearchScope || 'current';
  }
  
  /**
   * 검색 수행
   * @param query 검색어
   * @param searchType 검색 타입
   * @param scope 검색 범위
   * @returns 검색 결과
   */
  async search(query: string, searchType: SearchType = 'content', scope: SearchScope = this.currentScope): Promise<ICard[]> {
    if (!query) {
      this.searchResults = [];
      this.currentQuery = '';
      this.currentSearchType = 'content';
      this.highlightInfoMap.clear();
      
      // 검색 변경 이벤트 발생
      this.eventBus.emit(EventType.SEARCH_CHANGED, {
        query: '',
        searchType: 'content',
        caseSensitive: false
      });
      
      return [];
    }
    
    this.currentQuery = query;
    this.currentSearchType = searchType;
    this.currentScope = scope;
    
    // 검색 히스토리에 추가
    this.searchHistoryService.addToHistory(query);
    
    // 설정 가져오기
    const settings = this.settingsService.getSettings();
    const caseSensitive = settings.searchCaseSensitive || false;
    
    // 카드셋 가져오기
    let cardSet: ICardSet;
    if (scope === 'all') {
      // 모든 파일 대상
      const files = this.cardSetService.getVaultFiles();
      cardSet = {
        getType: () => 'all',
        getSource: () => 'vault',
        getFiles: () => files,
        getCards: () => [],
        isEmpty: () => files.length === 0
      };
    } else {
      // 현재 카드셋 대상
      cardSet = await this.cardSetService.getCurrentCardSet();
    }
    
    // 검색 로직 구현
    const files = cardSet.getFiles();
    const cards: ICard[] = [];
    this.highlightInfoMap.clear();
    
    // 파일로부터 카드 생성 및 검색
    for (const file of files) {
      const card = await this.createCardFromFile(file);
      
      // 검색 조건에 맞는지 확인
      if (this.matchesSearch(card, query, searchType, caseSensitive)) {
        cards.push(card);
        
        // 강조 정보 저장
        this.highlightInfoMap.set(card.getId(), this.createHighlightInfo(card, query, searchType, caseSensitive));
      }
    }
    
    // 검색 결과 저장
    this.searchResults = cards;
    
    // 검색 변경 이벤트 발생
    this.eventBus.emit(EventType.SEARCH_CHANGED, {
      query,
      searchType,
      caseSensitive,
      frontmatterKey: searchType === 'frontmatter' ? this.extractFrontmatterKey(query) : undefined
    });
    
    return cards;
  }
  
  /**
   * 복합 검색 수행
   * @param fields 검색 필드 목록
   * @param scope 검색 범위
   * @returns 검색 결과
   */
  async searchMultipleFields(fields: ISearchField[], scope: SearchScope = this.currentScope): Promise<ICard[]> {
    if (fields.length === 0) {
      return [];
    }
    
    // 카드셋 가져오기
    let cardSet: ICardSet;
    if (scope === 'all') {
      // 모든 파일 대상
      const files = this.cardSetService.getVaultFiles();
      cardSet = {
        getType: () => 'all',
        getSource: () => 'vault',
        getFiles: () => files,
        getCards: () => [],
        isEmpty: () => files.length === 0
      };
    } else {
      // 현재 카드셋 대상
      cardSet = await this.cardSetService.getCurrentCardSet();
    }
    
    // 설정 가져오기
    const settings = this.settingsService.getSettings();
    const caseSensitive = settings.searchCaseSensitive || false;
    
    // 검색 로직 구현
    const files = cardSet.getFiles();
    const cards: ICard[] = [];
    this.highlightInfoMap.clear();
    
    // 파일로부터 카드 생성 및 검색
    for (const file of files) {
      const card = await this.createCardFromFile(file);
      
      // 모든 필드에 대해 검색 조건 확인
      let matches = true;
      for (const field of fields) {
        if (!this.matchesSearch(card, field.query, field.type, caseSensitive, field.frontmatterKey)) {
          matches = false;
          break;
        }
      }
      
      if (matches) {
        cards.push(card);
        
        // 강조 정보 저장 (첫 번째 필드 기준)
        this.highlightInfoMap.set(card.getId(), this.createHighlightInfo(card, fields[0].query, fields[0].type, caseSensitive));
      }
    }
    
    // 검색 결과 저장
    this.searchResults = cards;
    
    // 검색 변경 이벤트 발생
    this.eventBus.emit(EventType.SEARCH_CHANGED, {
      query: fields.map(f => `${f.type}:${f.query}`).join(' '),
      searchType: 'complex',
      caseSensitive
    });
    
    return cards;
  }
  
  /**
   * 검색 제안 가져오기
   * @param query 검색어
   * @returns 검색 제안 목록
   */
  async getSuggestions(query: string): Promise<ISearchSuggestion[]> {
    return this.searchSuggestionService.getSuggestions(query);
  }
  
  /**
   * 검색 히스토리 가져오기
   * @returns 검색 히스토리
   */
  getSearchHistory(): string[] {
    return this.searchHistoryService.getHistory();
  }
  
  /**
   * 검색 히스토리 초기화
   */
  clearSearchHistory(): void {
    this.searchHistoryService.clearHistory();
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
   * 검색 결과 가져오기
   * @returns 검색 결과
   */
  getSearchResults(): ICard[] {
    return [...this.searchResults];
  }
  
  /**
   * 검색 강조 정보 가져오기
   * @param cardId 카드 ID
   * @returns 검색 강조 정보
   */
  getHighlightInfo(cardId: string): ISearchHighlightInfo | undefined {
    return this.highlightInfoMap.get(cardId);
  }
  
  /**
   * 파일로부터 카드 생성
   * @param file 파일
   * @returns 생성된 카드
   */
  private async createCardFromFile(file: any): Promise<ICard> {
    // 카드 생성 로직 구현 (CardService의 createCardFromFile 메서드와 유사)
    // 실제 구현에서는 CardService를 주입받아 사용하는 것이 좋음
    return {} as ICard; // 임시 구현
  }
  
  /**
   * 검색 조건에 맞는지 확인
   * @param card 카드
   * @param query 검색어
   * @param searchType 검색 타입
   * @param caseSensitive 대소문자 구분 여부
   * @param frontmatterKey 프론트매터 키
   * @returns 검색 조건에 맞는지 여부
   */
  private matchesSearch(
    card: ICard,
    query: string,
    searchType: SearchType,
    caseSensitive: boolean,
    frontmatterKey?: string
  ): boolean {
    // 검색 타입에 따른 검색 로직 구현
    switch (searchType) {
      case 'filename':
        return this.matchesFilename(card, query, caseSensitive);
      case 'content':
        return this.matchesContent(card, query, caseSensitive);
      case 'tag':
        return this.matchesTag(card, query, caseSensitive);
      case 'path':
        return this.matchesPath(card, query, caseSensitive);
      case 'frontmatter':
        return this.matchesFrontmatter(card, query, caseSensitive, frontmatterKey);
      case 'create':
        return this.matchesCreateDate(card, query);
      case 'modify':
        return this.matchesModifyDate(card, query);
      case 'regex':
        return this.matchesRegex(card, query, caseSensitive);
      default:
        return this.matchesContent(card, query, caseSensitive);
    }
  }
  
  /**
   * 파일명 검색
   * @param card 카드
   * @param query 검색어
   * @param caseSensitive 대소문자 구분 여부
   * @returns 검색 조건에 맞는지 여부
   */
  private matchesFilename(card: ICard, query: string, caseSensitive: boolean): boolean {
    const filename = card.title;
    return caseSensitive
      ? filename.includes(query)
      : filename.toLowerCase().includes(query.toLowerCase());
  }
  
  /**
   * 내용 검색
   * @param card 카드
   * @param query 검색어
   * @param caseSensitive 대소문자 구분 여부
   * @returns 검색 조건에 맞는지 여부
   */
  private matchesContent(card: ICard, query: string, caseSensitive: boolean): boolean {
    const content = card.content;
    return caseSensitive
      ? content.includes(query)
      : content.toLowerCase().includes(query.toLowerCase());
  }
  
  /**
   * 태그 검색
   * @param card 카드
   * @param query 검색어
   * @param caseSensitive 대소문자 구분 여부
   * @returns 검색 조건에 맞는지 여부
   */
  private matchesTag(card: ICard, query: string, caseSensitive: boolean): boolean {
    const tags = card.tags;
    if (caseSensitive) {
      return tags.some(tag => tag.includes(query));
    } else {
      const lowerQuery = query.toLowerCase();
      return tags.some(tag => tag.toLowerCase().includes(lowerQuery));
    }
  }
  
  /**
   * 경로 검색
   * @param card 카드
   * @param query 검색어
   * @param caseSensitive 대소문자 구분 여부
   * @returns 검색 조건에 맞는지 여부
   */
  private matchesPath(card: ICard, query: string, caseSensitive: boolean): boolean {
    const path = card.getPath();
    return caseSensitive
      ? path.includes(query)
      : path.toLowerCase().includes(query.toLowerCase());
  }
  
  /**
   * 프론트매터 검색
   * @param card 카드
   * @param query 검색어
   * @param caseSensitive 대소문자 구분 여부
   * @param frontmatterKey 프론트매터 키
   * @returns 검색 조건에 맞는지 여부
   */
  private matchesFrontmatter(card: ICard, query: string, caseSensitive: boolean, frontmatterKey?: string): boolean {
    if (!card.frontmatter) return false;
    
    // 프론트매터 키가 지정된 경우
    if (frontmatterKey) {
      const value = card.frontmatter[frontmatterKey];
      if (value === undefined) return false;
      
      const stringValue = String(value);
      return caseSensitive
        ? stringValue.includes(query)
        : stringValue.toLowerCase().includes(query.toLowerCase());
    }
    
    // 프론트매터 키가 지정되지 않은 경우 모든 프론트매터 검색
    for (const key in card.frontmatter) {
      const value = card.frontmatter[key];
      if (value === undefined) continue;
      
      const stringValue = String(value);
      if (caseSensitive) {
        if (stringValue.includes(query)) return true;
      } else {
        if (stringValue.toLowerCase().includes(query.toLowerCase())) return true;
      }
    }
    
    return false;
  }
  
  /**
   * 생성일 검색
   * @param card 카드
   * @param query 검색어
   * @returns 검색 조건에 맞는지 여부
   */
  private matchesCreateDate(card: ICard, query: string): boolean {
    // 날짜 범위 파싱
    const { start, end } = this.parseDateRange(query);
    if (!start) return false;
    
    const createTime = card.getCreatedTime();
    const createDate = new Date(createTime);
    
    // 시작일만 있는 경우
    if (!end) {
      const startDate = new Date(start);
      return this.isSameDay(createDate, startDate);
    }
    
    // 시작일과 종료일이 있는 경우
    const startDate = new Date(start);
    const endDate = new Date(end);
    return createDate >= startDate && createDate <= endDate;
  }
  
  /**
   * 수정일 검색
   * @param card 카드
   * @param query 검색어
   * @returns 검색 조건에 맞는지 여부
   */
  private matchesModifyDate(card: ICard, query: string): boolean {
    // 날짜 범위 파싱
    const { start, end } = this.parseDateRange(query);
    if (!start) return false;
    
    const modifyTime = card.getModifiedTime();
    const modifyDate = new Date(modifyTime);
    
    // 시작일만 있는 경우
    if (!end) {
      const startDate = new Date(start);
      return this.isSameDay(modifyDate, startDate);
    }
    
    // 시작일과 종료일이 있는 경우
    const startDate = new Date(start);
    const endDate = new Date(end);
    return modifyDate >= startDate && modifyDate <= endDate;
  }
  
  /**
   * 정규식 검색
   * @param card 카드
   * @param query 검색어
   * @param caseSensitive 대소문자 구분 여부
   * @returns 검색 조건에 맞는지 여부
   */
  private matchesRegex(card: ICard, query: string, caseSensitive: boolean): boolean {
    try {
      const flags = caseSensitive ? '' : 'i';
      const regex = new RegExp(query, flags);
      return regex.test(card.content);
    } catch (error) {
      console.error('정규식 오류:', error);
      return false;
    }
  }
  
  /**
   * 날짜 범위 파싱
   * @param query 검색어
   * @returns 시작일과 종료일
   */
  private parseDateRange(query: string): { start: string | null; end: string | null } {
    // 시작일과 종료일 파싱
    const match = query.match(/start:([^\s]+)(?:\s+end:([^\s]+))?/);
    if (match) {
      return {
        start: match[1],
        end: match[2] || null
      };
    }
    
    // 단일 날짜 파싱
    if (query.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return {
        start: query,
        end: null
      };
    }
    
    return {
      start: null,
      end: null
    };
  }
  
  /**
   * 같은 날짜인지 확인
   * @param date1 날짜 1
   * @param date2 날짜 2
   * @returns 같은 날짜인지 여부
   */
  private isSameDay(date1: Date, date2: Date): boolean {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  }
  
  /**
   * 프론트매터 키 추출
   * @param query 검색어
   * @returns 프론트매터 키
   */
  private extractFrontmatterKey(query: string): string | undefined {
    const match = query.match(/^\[([^\]]+)\]/);
    return match ? match[1] : undefined;
  }
  
  /**
   * 검색 강조 정보 생성
   * @param card 카드
   * @param query 검색어
   * @param searchType 검색 타입
   * @param caseSensitive 대소문자 구분 여부
   * @returns 검색 강조 정보
   */
  private createHighlightInfo(
    card: ICard,
    query: string,
    searchType: SearchType,
    caseSensitive: boolean
  ): ISearchHighlightInfo {
    const highlightInfo: ISearchHighlightInfo = {
      query,
      searchType,
      caseSensitive,
      matches: []
    };
    
    // 검색 타입에 따라 다른 처리
    switch (searchType) {
      case 'content':
        this.addContentMatches(highlightInfo, card.content, query, caseSensitive);
        break;
      case 'filename':
        this.addMatches(highlightInfo, card.title, query, caseSensitive);
        break;
      case 'tag':
        card.tags.forEach(tag => {
          this.addMatches(highlightInfo, tag, query, caseSensitive);
        });
        break;
      case 'path':
        this.addMatches(highlightInfo, card.getPath(), query, caseSensitive);
        break;
      case 'frontmatter':
        if (card.frontmatter) {
          const frontmatterKey = this.extractFrontmatterKey(query);
          if (frontmatterKey && card.frontmatter[frontmatterKey] !== undefined) {
            this.addMatches(highlightInfo, String(card.frontmatter[frontmatterKey]), query.substring(frontmatterKey.length + 2), caseSensitive);
          } else {
            for (const key in card.frontmatter) {
              this.addMatches(highlightInfo, String(card.frontmatter[key]), query, caseSensitive);
            }
          }
        }
        break;
    }
    
    return highlightInfo;
  }
  
  /**
   * 내용 매치 추가
   * @param highlightInfo 강조 정보
   * @param content 내용
   * @param query 검색어
   * @param caseSensitive 대소문자 구분 여부
   */
  private addContentMatches(
    highlightInfo: ISearchHighlightInfo,
    content: string,
    query: string,
    caseSensitive: boolean
  ): void {
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      this.addMatches(highlightInfo, line, query, caseSensitive, i);
    }
  }
  
  /**
   * 매치 추가
   * @param highlightInfo 강조 정보
   * @param text 텍스트
   * @param query 검색어
   * @param caseSensitive 대소문자 구분 여부
   * @param lineNumber 라인 번호
   */
  private addMatches(
    highlightInfo: ISearchHighlightInfo,
    text: string,
    query: string,
    caseSensitive: boolean,
    lineNumber?: number
  ): void {
    const searchText = caseSensitive ? text : text.toLowerCase();
    const searchQuery = caseSensitive ? query : query.toLowerCase();
    
    let startIndex = 0;
    while (startIndex < searchText.length) {
      const index = searchText.indexOf(searchQuery, startIndex);
      if (index === -1) break;
      
      highlightInfo.matches.push({
        text: text.substring(index, index + query.length),
        startIndex: index,
        endIndex: index + query.length,
        lineNumber
      });
      
      startIndex = index + 1;
    }
  }
} 