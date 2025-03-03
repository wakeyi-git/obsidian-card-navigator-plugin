import { App, TFile } from 'obsidian';
import { ISearchService } from '../../core/interfaces/service/ISearchService';
import { SearchResult } from '../../core/models/SearchResult';
import { 
  SearchEvent, 
  SearchEventHandler, 
  SearchMatch, 
  SearchOptions, 
  SearchSuggestion 
} from '../../core/types/search.types';
import { ErrorCode } from '../../core/constants/error.constants';
import { Card } from '../../core/models/Card';
import { IFileService } from '../../core/interfaces/service/IFileService';
import { IMetadataService } from '../../core/interfaces/service/IMetadataService';
import { ITagService } from '../../core/interfaces/service/ITagService';
import { ErrorHandler } from '../../utils/error/ErrorHandler';
import { Log } from '../../utils/log/Log';
import { SEARCH_CLASS_NAMES, SEARCH_STYLES } from '../../styles/components/search.styles';
import { SEARCH_DEFAULTS, SEARCH_EVENTS, SEARCH_SCOPE_TYPES, SEARCH_TYPES } from '../../core/constants/search.constants';

/**
 * 검색 서비스 구현 클래스
 * 검색 기능과 관련된 기능을 구현합니다.
 */
export class SearchService implements ISearchService {
  /**
   * 검색 옵션
   */
  private options: SearchOptions;
  
  /**
   * 최근 검색어 목록
   */
  private recentSearchTerms: string[] = [];
  
  /**
   * 최대 검색 기록 수
   */
  private maxSearchHistory: number = 10;
  
  /**
   * 이벤트 핸들러 맵
   */
  private eventHandlers: Map<SearchEvent, SearchEventHandler[]> = new Map();
  
  /**
   * 현재 검색 중인지 여부
   */
  private isSearching: boolean = false;
  
  /**
   * 검색 서비스 생성자
   * @param app Obsidian 앱 인스턴스
   * @param options 검색 옵션
   * @param fileService 파일 서비스
   * @param metadataService 메타데이터 서비스
   */
  constructor(
    private readonly app: App, 
    options: Partial<SearchOptions> = {},
    private readonly fileService: IFileService,
    private readonly metadataService: IMetadataService
  ) {
    // 기본 옵션과 사용자 옵션 병합
    this.options = {
      searchInTitle: true,
      searchInHeaders: true,
      searchInTags: true,
      searchInContent: true,
      searchInFrontmatter: false,
      caseSensitive: false,
      useRegex: false,
      matchWholeWord: false,
      ...options
    };
    
    // 이벤트 핸들러 맵 초기화
    this.eventHandlers.set('search-started', []);
    this.eventHandlers.set('search-completed', []);
    this.eventHandlers.set('search-cancelled', []);
    this.eventHandlers.set('search-error', []);
  }
  
  /**
   * 검색 서비스 초기화
   * @param options 검색 옵션
   */
  initialize(options?: Partial<SearchOptions>): void {
    if (options) {
      this.setOptions(options);
    }
  }
  
  /**
   * 검색 수행
   * @param searchTerm 검색어
   * @param files 검색할 파일 목록
   * @returns 검색 결과 배열
   */
  async search(searchTerm: string, files: TFile[]): Promise<SearchResult[]> {
    try {
      // 검색 시작 이벤트 발생
      this.triggerEvent('search-started', { searchTerm });
      
      // 검색 중 상태 설정
      this.isSearching = true;
      
      // 검색어가 비어있으면 빈 배열 반환
      if (!searchTerm.trim()) {
        this.isSearching = false;
        this.triggerEvent('search-completed', { searchTerm, results: [] });
        return [];
      }
      
      // 검색어 기록에 추가
      this.addToSearchHistory(searchTerm);
      
      // 검색 결과 배열
      const results: SearchResult[] = [];
      
      // 정규식 검색 패턴 생성
      const searchPattern = this.createSearchPattern(searchTerm);
      
      // 각 파일 검색
      for (const file of files) {
        try {
          // 파일 검색 결과
          const result = await this.searchFile(file, searchPattern);
          
          // 결과가 있으면 추가
          if (result.matches.length > 0) {
            results.push(result);
          }
        } catch (error: any) {
          console.warn(`파일 검색 오류: ${file.path}`, error);
          // 개별 파일 오류는 무시하고 계속 진행
        }
      }
      
      // 결과 정렬 (점수 기준 내림차순)
      results.sort(SearchResult.compare);
      
      // 검색 완료 이벤트 발생
      this.triggerEvent('search-completed', { searchTerm, results });
      
      // 검색 중 상태 해제
      this.isSearching = false;
      
      return results;
    } catch (error: any) {
      // 검색 중 상태 해제
      this.isSearching = false;
      
      console.error(`${ErrorCode.SEARCH_ERROR}: ${error.message}`, error);
      
      // 검색 오류 이벤트 발생
      this.triggerEvent('search-error', { searchTerm, error: error.message });
      
      throw new Error(`${ErrorCode.SEARCH_ERROR}: ${error.message}`);
    }
  }
  
  /**
   * 검색 취소
   */
  cancelSearch(): void {
    if (this.isSearching) {
      this.isSearching = false;
      this.triggerEvent('search-cancelled', {});
    }
  }
  
  /**
   * 검색 옵션 설정
   * @param options 검색 옵션
   */
  setOptions(options: Partial<SearchOptions>): void {
    this.options = { ...this.options, ...options };
    this.triggerEvent('search-options-changed', { options: this.options });
  }
  
  /**
   * 검색 옵션 가져오기
   * @returns 현재 검색 옵션
   */
  getOptions(): SearchOptions {
    return { ...this.options };
  }
  
  /**
   * 검색 제안 가져오기
   * @param searchTerm 검색어
   * @returns 검색 제안 배열
   */
  async getSuggestions(searchTerm: string): Promise<SearchSuggestion[]> {
    try {
      const suggestions: SearchSuggestion[] = [];
      
      // 검색어가 비어있으면 최근 검색어만 반환
      if (!searchTerm.trim()) {
        // 최근 검색어 제안
        for (const term of this.recentSearchTerms) {
          suggestions.push({
            value: term,
            type: 'recent',
            displayText: `최근: ${term}`
          });
        }
        return suggestions;
      }
      
      // 검색어 소문자 변환 (대소문자 구분 없는 경우)
      const searchTermLower = this.options.caseSensitive ? searchTerm : searchTerm.toLowerCase();
      
      // 최근 검색어 중 일치하는 항목 추가
      for (const term of this.recentSearchTerms) {
        const termLower = this.options.caseSensitive ? term : term.toLowerCase();
        if (termLower.includes(searchTermLower)) {
          suggestions.push({
            value: term,
            type: 'recent',
            displayText: `최근: ${term}`
          });
        }
      }
      
      // 파일 이름 제안
      const files = this.app.vault.getMarkdownFiles();
      for (const file of files) {
        const fileNameLower = this.options.caseSensitive ? file.basename : file.basename.toLowerCase();
        if (fileNameLower.includes(searchTermLower)) {
          suggestions.push({
            value: file.basename,
            type: 'file',
            displayText: `파일: ${file.basename}`
          });
        }
        
        // 최대 5개까지만 추가
        if (suggestions.length >= 10) break;
      }
      
      // 태그 제안
      const allTags = this.getAllTags();
      for (const tag of allTags) {
        const tagLower = this.options.caseSensitive ? tag : tag.toLowerCase();
        if (tagLower.includes(searchTermLower)) {
          suggestions.push({
            value: tag,
            type: 'tag',
            displayText: `태그: ${tag}`
          });
        }
        
        // 최대 15개까지만 추가
        if (suggestions.length >= 15) break;
      }
      
      return suggestions;
    } catch (error: any) {
      console.error(`검색 제안 오류: ${error.message}`, error);
      return [];
    }
  }
  
  /**
   * 최근 검색어 가져오기
   * @returns 최근 검색어 배열
   */
  getRecentSearchTerms(): string[] {
    return [...this.recentSearchTerms];
  }
  
  /**
   * 검색 기록 지우기
   */
  clearSearchHistory(): void {
    this.recentSearchTerms = [];
  }
  
  /**
   * 이벤트 리스너 등록
   * @param event 이벤트 타입
   * @param handler 이벤트 핸들러
   */
  on(event: SearchEvent, handler: SearchEventHandler): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    
    this.eventHandlers.get(event)?.push(handler);
  }
  
  /**
   * 이벤트 리스너 제거
   * @param event 이벤트 타입
   * @param handler 이벤트 핸들러
   */
  off(event: SearchEvent, handler: SearchEventHandler): void {
    if (!this.eventHandlers.has(event)) {
      return;
    }
    
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index !== -1) {
        handlers.splice(index, 1);
      }
    }
  }
  
  /**
   * 파일 검색
   * @param file 검색할 파일
   * @param searchPattern 검색 패턴
   * @returns 검색 결과
   */
  private async searchFile(file: TFile, searchPattern: RegExp): Promise<SearchResult> {
    // 검색 결과 생성
    const result = new SearchResult(file, searchPattern.source);
    
    // 파일 이름 검색
    if (this.options.searchInTitle) {
      this.searchInFileName(file, searchPattern, result);
    }
    
    // 메타데이터 캐시 가져오기
    const cache = this.app.metadataCache.getFileCache(file);
    
    if (cache) {
      // 헤더 검색
      if (this.options.searchInHeaders && cache.headings) {
        this.searchInHeadings(cache.headings, searchPattern, result);
      }
      
      // 태그 검색
      if (this.options.searchInTags && cache.tags) {
        this.searchInTags(cache.tags, searchPattern, result);
      }
      
      // 프론트매터 검색
      if (this.options.searchInFrontmatter && cache.frontmatter) {
        this.searchInFrontmatter(cache.frontmatter, searchPattern, result);
      }
    }
    
    // 내용 검색
    if (this.options.searchInContent) {
      await this.searchInContent(file, searchPattern, result);
    }
    
    return result;
  }
  
  /**
   * 파일 이름 검색
   * @param file 파일
   * @param searchPattern 검색 패턴
   * @param result 검색 결과
   */
  private searchInFileName(file: TFile, searchPattern: RegExp, result: SearchResult): void {
    const fileName = file.basename;
    let match: RegExpExecArray | null;
    
    while ((match = searchPattern.exec(fileName)) !== null) {
      result.addMatch({
        type: 'title',
        text: match[0],
        position: match.index
      });
    }
  }
  
  /**
   * 헤딩 검색
   * @param headings 헤딩 배열
   * @param searchPattern 검색 패턴
   * @param result 검색 결과
   */
  private searchInHeadings(headings: any[], searchPattern: RegExp, result: SearchResult): void {
    for (const heading of headings) {
      let match: RegExpExecArray | null;
      
      while ((match = searchPattern.exec(heading.heading)) !== null) {
        result.addMatch({
          type: 'header',
          text: match[0],
          position: match.index
        });
      }
    }
  }
  
  /**
   * 태그 검색
   * @param tags 태그 배열
   * @param searchPattern 검색 패턴
   * @param result 검색 결과
   */
  private searchInTags(tags: any[], searchPattern: RegExp, result: SearchResult): void {
    for (const tag of tags) {
      let match: RegExpExecArray | null;
      
      while ((match = searchPattern.exec(tag.tag)) !== null) {
        result.addMatch({
          type: 'tag',
          text: match[0],
          position: match.index
        });
      }
    }
  }
  
  /**
   * 프론트매터 검색
   * @param frontmatter 프론트매터 객체
   * @param searchPattern 검색 패턴
   * @param result 검색 결과
   */
  private searchInFrontmatter(frontmatter: any, searchPattern: RegExp, result: SearchResult): void {
    for (const key in frontmatter) {
      const value = frontmatter[key];
      
      // 문자열인 경우만 검색
      if (typeof value === 'string') {
        let match: RegExpExecArray | null;
        
        while ((match = searchPattern.exec(value)) !== null) {
          result.addMatch({
            type: 'frontmatter',
            text: match[0],
            position: match.index
          });
        }
      }
    }
  }
  
  /**
   * 내용 검색
   * @param file 파일
   * @param searchPattern 검색 패턴
   * @param result 검색 결과
   */
  private async searchInContent(file: TFile, searchPattern: RegExp, result: SearchResult): Promise<void> {
    try {
      // 파일 내용 읽기
      const content = await this.app.vault.read(file);
      
      let match: RegExpExecArray | null;
      
      while ((match = searchPattern.exec(content)) !== null) {
        result.addMatch({
          type: 'content',
          text: match[0],
          position: match.index
        });
      }
    } catch (error: any) {
      console.warn(`파일 내용 읽기 오류: ${file.path}`, error);
    }
  }
  
  /**
   * 검색 패턴 생성
   * @param searchTerm 검색어
   * @returns 정규식 패턴
   */
  private createSearchPattern(searchTerm: string): RegExp {
    if (!searchTerm) {
      return /(?:)/; // 빈 검색어는 아무것도 매치하지 않음
    }
    
    let pattern = searchTerm;
    
    // 정규식이 아닌 경우 특수 문자 이스케이프
    if (!this.options.useRegex) {
      pattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    
    // 전체 단어 매치 옵션이 활성화된 경우
    if (this.options.matchWholeWord) {
      // 정규식이 아닌 경우에만 단어 경계 추가
      if (!this.options.useRegex) {
        pattern = `\\b${pattern}\\b`;
      }
    }
    
    // 대소문자 구분 옵션
    const flags = this.options.caseSensitive ? 'g' : 'gi';
    
    try {
      return new RegExp(pattern, flags);
    } catch (error) {
      // 정규식 생성 오류 시 기본 패턴 반환
      return new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags);
    }
  }
  
  /**
   * 검색 기록에 추가
   * @param searchTerm 검색어
   */
  private addToSearchHistory(searchTerm: string): void {
    // 이미 있는 경우 제거
    const index = this.recentSearchTerms.indexOf(searchTerm);
    if (index !== -1) {
      this.recentSearchTerms.splice(index, 1);
    }
    
    // 맨 앞에 추가
    this.recentSearchTerms.unshift(searchTerm);
    
    // 최대 개수 유지
    if (this.recentSearchTerms.length > this.maxSearchHistory) {
      this.recentSearchTerms.pop();
    }
  }
  
  /**
   * 모든 태그 가져오기
   * @returns 태그 배열
   */
  private getAllTags(): string[] {
    try {
      const tags: Set<string> = new Set();
      
      // 모든 마크다운 파일 가져오기
      const files = this.fileService.getAllMarkdownFiles();
      
      // 각 파일의 태그 수집
      for (const file of files) {
        const fileTags = this.metadataService.getTags(file);
        fileTags.forEach(tag => tags.add(tag));
      }
      
      return Array.from(tags).sort();
    } catch (error) {
      Log.error('태그 가져오기 실패', error);
      return [];
    }
  }
  
  /**
   * 이벤트 발생
   * @param event 이벤트 타입
   * @param data 이벤트 데이터
   */
  private triggerEvent(event: SearchEvent, data: any): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => handler(data));
    }
  }
  
  /**
   * 검색 서비스 정리
   */
  destroy(): void {
    // 이벤트 핸들러 정리
    this.eventHandlers.clear();
    
    // 검색 취소
    this.cancelSearch();
  }
  
  /**
   * 파일 검색
   * @param files 검색할 파일 배열
   * @param searchTerm 검색어
   * @returns 검색 결과 파일 배열
   */
  async searchFiles(files: TFile[], searchTerm: string): Promise<TFile[]> {
    const result = await ErrorHandler.captureError(async () => {
      if (!searchTerm || searchTerm.trim() === '') {
        return files;
      }
      
      const searchPattern = this.createSearchPattern(searchTerm);
      const results: TFile[] = [];
      
      for (const file of files) {
        // 파일명 검색
        if (searchPattern.test(file.name)) {
          results.push(file);
          continue;
        }
        
        // 태그 검색
        const tags = this.metadataService.getTags(file);
        if (tags.some(tag => searchPattern.test(tag))) {
          results.push(file);
          continue;
        }
        
        // 헤딩 검색
        const headings = this.metadataService.getHeadings(file);
        if (headings.some(heading => searchPattern.test(heading.heading))) {
          results.push(file);
          continue;
        }
        
        // 프론트매터 검색
        const frontmatter = this.metadataService.getFrontMatter(file);
        if (frontmatter) {
          const frontmatterValues = Object.values(frontmatter);
          if (frontmatterValues.some(value => 
            typeof value === 'string' && searchPattern.test(value)
          )) {
            results.push(file);
            continue;
          }
        }
        
        // 내용 검색 (옵션에 따라)
        if (this.options.searchInContent) {
          const content = await this.fileService.getFileContent(file);
          if (content && searchPattern.test(content)) {
            results.push(file);
          }
        }
      }
      
      return results;
    }, ErrorCode.SEARCH_ERROR, { searchTerm });
    
    // undefined인 경우 빈 배열 반환
    return result || [];
  }
  
  /**
   * 카드 검색
   * @param cards 검색할 카드 배열
   * @param searchTerm 검색어
   * @returns 검색 결과 카드 배열
   */
  async searchCards(cards: Card[], searchTerm: string): Promise<Card[]> {
    // 카드에서 파일 추출
    const files = cards.map(card => card.file).filter((file): file is TFile => !!file);
    
    // 파일 검색 수행
    const results = await this.search(searchTerm, files);
    
    // 검색 결과 파일과 일치하는 카드만 반환
    const resultFileIds = new Set(results.map(result => result.file.path));
    return cards.filter(card => card.file && resultFileIds.has(card.file.path));
  }
  
  /**
   * 검색 옵션 가져오기
   * @param key 옵션 키
   * @returns 옵션 값
   */
  getOption<K extends keyof SearchOptions>(key: K): SearchOptions[K] {
    return this.options[key];
  }
  
  /**
   * 검색 기록에 검색어 추가
   * @param searchTerm 검색어
   */
  addToHistory(searchTerm: string): void {
    this.addToSearchHistory(searchTerm);
  }
  
  /**
   * 상세 검색 결과 가져오기
   * @param files 검색할 파일 배열
   * @param searchTerm 검색어
   * @returns 상세 검색 결과 배열
   */
  async getDetailedSearchResults(files: TFile[], searchTerm: string): Promise<SearchResult[]> {
    return this.search(searchTerm, files);
  }
  
  /**
   * 검색 결과 하이라이트 처리
   * @param content 원본 콘텐츠
   * @param searchTerm 검색어
   * @returns 하이라이트된 콘텐츠
   */
  highlightSearchResults(content: string, searchTerm: string): string {
    if (!searchTerm || !content) return content;
    
    try {
      const matches = this.findMatches(content, searchTerm);
      if (!matches.length) return content;

      let highlightedText = '';
      let lastIndex = 0;

      matches.slice(0, SEARCH_STYLES.HIGHLIGHT.MAX_HIGHLIGHTS).forEach((match: RegExpExecArray) => {
        const start = Math.max(0, match.index - SEARCH_STYLES.HIGHLIGHT.CONTEXT_LENGTH);
        const end = Math.min(content.length, match.index + match[0].length + SEARCH_STYLES.HIGHLIGHT.CONTEXT_LENGTH);

        if (start > lastIndex) {
          highlightedText += SEARCH_STYLES.HIGHLIGHT.SEPARATOR;
        }

        highlightedText += content.slice(start, match.index);
        highlightedText += `<${SEARCH_STYLES.HIGHLIGHT.TAG} class="${SEARCH_CLASS_NAMES.HIGHLIGHT}">${match[0]}</${SEARCH_STYLES.HIGHLIGHT.TAG}>`;
        highlightedText += content.slice(match.index + match[0].length, end);

        lastIndex = end;
      });

      if (lastIndex < content.length) {
        highlightedText += SEARCH_STYLES.HIGHLIGHT.SEPARATOR;
      }

      return highlightedText;
    } catch (error) {
      // 정규식 오류 등의 예외 처리
      return content;
    }
  }

  /**
   * 검색 패턴과 일치하는 모든 매치를 찾습니다.
   * @param text 검색할 텍스트
   * @param searchTerm 검색어
   * @returns RegExpExecArray 배열
   */
  private findMatches(text: string, searchTerm: string): RegExpExecArray[] {
    const pattern = this.createSearchPattern(searchTerm);
    const matches: RegExpExecArray[] = [];
    let match: RegExpExecArray | null;
    
    while ((match = pattern.exec(text)) !== null) {
      matches.push(match);
      if (!pattern.global) break; // global 플래그가 없는 경우 무한 루프 방지
    }
    
    return matches;
  }

  /**
   * 검색 컨테이너 요소를 가져옵니다.
   * @returns HTMLElement
   */
  private getSearchContainer(): HTMLElement {
    let container = document.querySelector(`.${SEARCH_CLASS_NAMES.CONTAINER}`);
    if (!container) {
      container = document.createElement('div');
      container.classList.add(SEARCH_CLASS_NAMES.CONTAINER);
      document.body.appendChild(container);
    }
    return container as HTMLElement;
  }

  /**
   * 검색 결과를 업데이트합니다.
   * @param results 검색 결과 배열
   */
  private updateSearchResults(results: SearchResult[]): void {
    const container = this.getSearchContainer();
    container.classList.remove(SEARCH_CLASS_NAMES.LOADING);
    container.classList.remove(SEARCH_CLASS_NAMES.ERROR);

    const resultsElement = container.querySelector(`.${SEARCH_CLASS_NAMES.RESULTS}`);
    if (!resultsElement) return;

    if (!results.length) {
      resultsElement.classList.add(SEARCH_CLASS_NAMES.NO_RESULTS);
      return;
    }

    resultsElement.classList.remove(SEARCH_CLASS_NAMES.NO_RESULTS);
    results.forEach(result => {
      const matchElement = document.createElement('div');
      matchElement.classList.add(SEARCH_CLASS_NAMES.MATCH.BASE);
      
      const matchType = result.matches[0]?.type || SEARCH_TYPES.CONTENT;
      
      switch (matchType) {
        case SEARCH_TYPES.TITLE:
          matchElement.classList.add(SEARCH_CLASS_NAMES.MATCH.TITLE);
          break;
        case SEARCH_TYPES.HEADER:
          matchElement.classList.add(SEARCH_CLASS_NAMES.MATCH.HEADER);
          break;
        case SEARCH_TYPES.TAG:
          matchElement.classList.add(SEARCH_CLASS_NAMES.MATCH.TAG);
          break;
        case SEARCH_TYPES.CONTENT:
          matchElement.classList.add(SEARCH_CLASS_NAMES.MATCH.CONTENT);
          break;
        case SEARCH_TYPES.FRONTMATTER:
          matchElement.classList.add(SEARCH_CLASS_NAMES.MATCH.FRONTMATTER);
          break;
      }

      // ... existing code ...
    });
  }
} 