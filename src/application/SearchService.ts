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
import { ICardNavigatorService } from './CardNavigatorService';

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
  private isInSearchMode = false;
  private searchScope: 'all' | 'current' = 'current';
  private preSearchCards: ICard[] = [];
  private cardNavigatorService: ICardNavigatorService;
  
  constructor(presetService: IPresetService, cardService: ICardService, modeService: IModeService, cardNavigatorService: ICardNavigatorService) {
    this.presetService = presetService;
    this.cardService = cardService;
    this.modeService = modeService;
    this.cardNavigatorService = cardNavigatorService;
  }
  
  /**
   * 초기화
   * 검색 서비스를 초기화합니다.
   */
  initialize(): void {
    // 기본 검색 설정
    this.currentSearch = new FilenameSearch();
    this.isInSearchMode = false;
    
    // 설정에서 기본 검색 범위 가져오기
    if (this.cardNavigatorService) {
      this.cardNavigatorService.getSettings().then(settings => {
        if (settings.defaultSearchScope) {
          this.searchScope = settings.defaultSearchScope;
        } else {
          this.searchScope = 'current';
        }
      });
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
    this.isInSearchMode = false;
    
    // 설정에서 기본 검색 범위 가져오기
    if (this.cardNavigatorService) {
      this.cardNavigatorService.getSettings().then(settings => {
        if (settings.defaultSearchScope) {
          this.searchScope = settings.defaultSearchScope;
        } else {
          this.searchScope = 'current';
        }
      });
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
    // 검색어가 비어있거나 스페이스만 있는 경우에도 검색 모드 유지
    if (!query || query.trim() === '') {
      // 검색어가 비어있는 경우 현재 검색 객체의 쿼리만 비우고 검색 모드 유지
      if (this.currentSearch) {
        this.currentSearch.setQuery('');
      } else {
        // 검색 객체가 없는 경우 기본 검색 객체(파일명 검색) 생성
        this.currentSearch = new FilenameSearch('');
      }
      this.isInSearchMode = true;
      return;
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
      this.isInSearchMode = true;
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
      
      this.currentSearch = new RegexSearch(regexPattern);
      this.isInSearchMode = true;
    } else if (query.startsWith('create:')) {
      // 생성일 검색 - 'create:' 접두사 이후의 텍스트를 검색어로 사용
      // 접두사 이후의 텍스트 추출
      let dateQuery = query.substring(7).trim();
      
      // 큰따옴표로 묶인 검색어 처리 (따옴표 제거)
      if (dateQuery.startsWith('"') && dateQuery.endsWith('"')) {
        dateQuery = dateQuery.substring(1, dateQuery.length - 1);
      }
      
      this.currentSearch = new DateSearch(dateQuery, 'creation');
      this.isInSearchMode = true;
    } else if (query.startsWith('modify:')) {
      // 수정일 검색 - 'modify:' 접두사 이후의 텍스트를 검색어로 사용
      // 접두사 이후의 텍스트 추출
      let dateQuery = query.substring(7).trim();
      
      // 큰따옴표로 묶인 검색어 처리 (따옴표 제거)
      if (dateQuery.startsWith('"') && dateQuery.endsWith('"')) {
        dateQuery = dateQuery.substring(1, dateQuery.length - 1);
      }
      
      this.currentSearch = new DateSearch(dateQuery, 'modification');
      this.isInSearchMode = true;
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
    // 검색 객체가 없는 경우에만 원본 카드 반환
    if (!this.currentSearch) {
      this.isInSearchMode = false;
      return Promise.resolve(cards);
    }
    
    // 검색어가 비어있더라도 검색 모드 유지
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
    
    // 검색 실행 - 검색어가 비어있더라도 검색 객체의 search 메서드 호출
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
    return this.searchHistory;
  }
  
  /**
   * 검색 기록 삭제
   */
  clearSearchHistory(): void {
    this.searchHistory = [];
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
      query = query.substring(1).trim(); // 접두사 이후의 텍스트를 검색어로 사용 (공백 제거)
    }
    // 내용 검색: content:text 또는 "content:text"
    else if (query.startsWith('content:')) {
      type = 'content';
      query = query.substring(8).trim(); // 접두사 이후의 텍스트를 검색어로 사용 (공백 제거)
    }
    // 폴더 검색: path:folder 또는 "path:folder"
    else if (query.startsWith('path:')) {
      type = 'path';
      query = query.substring(5).trim(); // 접두사 이후의 텍스트를 검색어로 사용 (공백 제거)
    }
    // 정규식 검색: regex:pattern
    else if (query.startsWith('regex:')) {
      type = 'regex';
      query = query.substring(6).trim(); // 접두사 이후의 텍스트를 검색어로 사용 (공백 제거)
    }
    // 생성일 검색: create:date
    else if (query.startsWith('create:')) {
      type = 'date';
      query = query.substring(7).trim(); // 접두사 이후의 텍스트를 검색어로 사용 (공백 제거)
      dateType = 'creation';
    }
    // 수정일 검색: modify:date
    else if (query.startsWith('modify:')) {
      type = 'date';
      query = query.substring(7).trim(); // 접두사 이후의 텍스트를 검색어로 사용 (공백 제거)
      dateType = 'modification';
    }
    // 프론트매터 검색: [key]:value
    else if (query.match(/^\[.+\]:/)) {
      const match = query.match(/^\[(.+)\]:(.*)/);
      if (match) {
        type = 'frontmatter';
        frontmatterKey = match[1].trim();
        query = match[2].trim(); // 콜론 이후의 텍스트를 검색어로 사용 (공백 제거)
      }
    }
    // 프론트매터 검색: key:value
    else if (query.includes(':')) {
      const parts = query.split(':', 2);
      if (parts.length === 2 && parts[0].trim() !== '') {
        type = 'frontmatter';
        frontmatterKey = parts[0].trim();
        query = parts[1].trim(); // 콜론 이후의 텍스트를 검색어로 사용 (공백 제거)
      }
    }
    
    // 따옴표 제거 (따옴표로 묶인 검색어는 공백을 포함할 수 있음)
    if (query.startsWith('"') && query.endsWith('"')) {
      query = query.substring(1, query.length - 1);
    }
    
    return { type, query, frontmatterKey, dateType };
  }

  /**
   * 복합 검색 실행
   * @param query 복합 검색어 (스페이스로 구분)
   * @param cards 검색할 카드 목록
   * @returns 검색 결과 카드 목록
   */
  async applyComplexSearch(query: string, cards: ICard[]): Promise<ICard[]> {
    if (!query || query.trim() === '') {
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

    // 검색 파트 추출
    let parts: string[] = [];
    
    // 스페이스로 구분된 검색어 처리 (접두사 기반)
    const prefixPatterns = [
      'file:', 'content:', 'tag:', 'path:', 'folder:', 
      'fm:', 'frontmatter:', 'create:', 'modify:', 'regex:'
    ];
    
    // 검색어에서 접두사 위치 찾기 (큰따옴표로 묶인 부분은 건너뛰기)
    const prefixPositions: number[] = [];
    
    // 큰따옴표 위치 추적을 위한 변수
    let inQuotes = false;
    let quoteStart = -1;
    
    // 각 접두사 패턴에 대해 검색어에서 위치 찾기
    for (let i = 0; i < query.length; i++) {
      // 큰따옴표 처리
      if (query[i] === '"') {
        if (!inQuotes) {
          // 따옴표 시작
          inQuotes = true;
          quoteStart = i;
        } else {
          // 따옴표 끝
          inQuotes = false;
        }
        continue;
      }
      
      // 따옴표 안에 있는 경우 건너뛰기
      if (inQuotes) continue;
      
      // 접두사 확인
      for (const prefix of prefixPatterns) {
        if (i + prefix.length <= query.length && 
            query.substring(i, i + prefix.length) === prefix && 
            (i === 0 || query[i - 1] === ' ')) {
          prefixPositions.push(i);
          break;
        }
      }
    }
    
    // 위치를 오름차순으로 정렬
    prefixPositions.sort((a, b) => a - b);
    
    // 접두사 위치를 기준으로 검색어 분할
    if (prefixPositions.length > 0) {
      for (let i = 0; i < prefixPositions.length; i++) {
        const start = prefixPositions[i];
        const end = i < prefixPositions.length - 1 ? prefixPositions[i + 1] : query.length;
        
        // 현재 접두사부터 다음 접두사 전까지의 부분 추출
        const part = query.substring(start, end).trim();
        if (part) {
          parts.push(part);
        }
      }
    } else {
      // 접두사가 없는 경우 전체 검색어를 하나의 파트로 처리
      parts = [query.trim()];
    }
    
    // 검색 파트가 없으면 원본 카드 반환
    if (parts.length === 0) {
      this.isInSearchMode = false;
      return cards;
    }

    console.log(`[SearchService] 복합 검색: ${parts.length}개의 검색 파트 처리`);
    
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