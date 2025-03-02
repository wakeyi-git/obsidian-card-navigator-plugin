import { App, TFile } from 'obsidian';
import { ISearchService } from '../../core/interfaces/ISearchService';
import { SearchResult } from '../../core/models/SearchResult';
import { 
  SearchEvent, 
  SearchEventHandler, 
  SearchMatch, 
  SearchOptions, 
  SearchSuggestion 
} from '../../core/types/search.types';
import { ErrorCode } from '../../core/constants/error.constants';

/**
 * 검색 서비스 구현 클래스
 * 검색 기능과 관련된 기능을 구현합니다.
 */
export class SearchService implements ISearchService {
  /**
   * Obsidian 앱 인스턴스
   */
  private app: App;
  
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
   */
  constructor(app: App, options: Partial<SearchOptions> = {}) {
    this.app = app;
    
    // 기본 옵션과 사용자 옵션 병합
    this.options = {
      searchInTitle: true,
      searchInHeader: true,
      searchInTags: true,
      searchInContent: true,
      searchInFrontmatter: false,
      caseSensitive: false,
      useRegex: false,
      ...options
    };
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
      if (this.options.searchInHeader && cache.headings) {
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
    try {
      if (this.options.useRegex) {
        // 정규식 검색
        return new RegExp(searchTerm, this.options.caseSensitive ? 'g' : 'gi');
      } else {
        // 일반 텍스트 검색 (정규식 특수문자 이스케이프)
        const escapedTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        return new RegExp(escapedTerm, this.options.caseSensitive ? 'g' : 'gi');
      }
    } catch (error: any) {
      console.error(`검색 패턴 생성 오류: ${error.message}`, error);
      // 오류 발생 시 기본 패턴 사용
      return new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
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
    const tagSet = new Set<string>();
    
    // 모든 파일의 캐시 순회
    this.app.metadataCache.getCachedFiles().forEach(filePath => {
      const cache = this.app.metadataCache.getCache(filePath);
      
      if (cache && cache.tags) {
        cache.tags.forEach(tagObj => {
          tagSet.add(tagObj.tag.substring(1)); // '#' 제거
        });
      }
    });
    
    return Array.from(tagSet);
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
} 