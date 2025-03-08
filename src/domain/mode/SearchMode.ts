import { App, TFile } from 'obsidian';
import { IMode, Mode } from './Mode';

/**
 * 검색 타입
 * 검색 대상을 정의합니다.
 */
export type SearchType = 'title' | 'content' | 'path' | 'frontmatter' | 'all';

/**
 * 검색 모드 클래스
 * 검색 기반 모드를 구현합니다.
 */
export class SearchMode extends Mode {
  type: 'search' = 'search';
  private app: App;
  private query = '';
  private searchType: SearchType = 'content';
  private caseSensitive = false;
  private frontmatterKey?: string;
  
  constructor(app: App) {
    super('search');
    this.app = app;
  }
  
  /**
   * 검색 쿼리 설정
   * @param query 검색 쿼리
   */
  setQuery(query: string): void {
    this.query = query;
  }
  
  /**
   * 검색 타입 설정
   * @param searchType 검색 타입
   * @param frontmatterKey 프론트매터 키 (검색 타입이 frontmatter인 경우)
   */
  setSearchType(searchType: SearchType, frontmatterKey?: string): void {
    this.searchType = searchType;
    this.frontmatterKey = frontmatterKey;
  }
  
  /**
   * 대소문자 구분 여부 설정
   * @param caseSensitive 대소문자 구분 여부
   */
  setCaseSensitive(caseSensitive: boolean): void {
    this.caseSensitive = caseSensitive;
  }
  
  /**
   * 카드 세트 가져오기
   * 검색 모드에서는 최근 검색 쿼리 목록을 반환합니다.
   * @returns 최근 검색 쿼리 목록
   */
  async getCardSets(): Promise<string[]> {
    console.log(`[SearchMode] 검색 쿼리 목록 가져오기`);
    
    // 최근 검색 쿼리 목록 가져오기 (로컬 스토리지 또는 설정에서)
    const recentSearches = this.getRecentSearches();
    
    // 현재 쿼리가 있고 목록에 없으면 추가
    if (this.query && !recentSearches.includes(this.query)) {
      recentSearches.unshift(this.query);
      
      // 최대 10개까지만 유지
      if (recentSearches.length > 10) {
        recentSearches.pop();
      }
      
      // 최근 검색 쿼리 저장
      this.saveRecentSearches(recentSearches);
    }
    
    return recentSearches;
  }
  
  /**
   * 필터 옵션 가져오기
   * 검색 모드에서는 검색 타입 목록을 반환합니다.
   * @returns 검색 타입 목록
   */
  async getFilterOptions(): Promise<string[]> {
    console.log(`[SearchMode] 검색 필터 옵션 가져오기`);
    
    // 검색 타입 목록 반환
    return ['title', 'content', 'path', 'frontmatter', 'all'];
  }
  
  /**
   * 파일 목록 가져오기
   * 현재 검색 쿼리에 해당하는 파일 목록을 가져옵니다.
   * @returns 파일 경로 목록
   */
  async getFiles(): Promise<string[]> {
    console.log(`[SearchMode] 검색 쿼리 '${this.query}'에 해당하는 파일 목록 가져오기`);
    
    if (!this.query) {
      console.log(`[SearchMode] 검색 쿼리가 없습니다.`);
      return [];
    }
    
    try {
      // 모든 마크다운 파일 가져오기
      const files = this.app.vault.getMarkdownFiles();
      
      // 검색 쿼리에 맞는 파일 필터링
      const matchedFiles = await this.filterFilesByQuery(files);
      console.log(`[SearchMode] 검색 쿼리 '${this.query}'에 해당하는 파일 ${matchedFiles.length}개 찾음`);
      
      // 파일 경로 목록 반환
      return matchedFiles.map(file => file.path);
    } catch (error) {
      console.error(`[SearchMode] 파일 목록 가져오기 오류:`, error);
      return [];
    }
  }
  
  /**
   * 검색 쿼리로 파일 필터링
   * @param files 필터링할 파일 목록
   * @returns 필터링된 파일 목록
   */
  private async filterFilesByQuery(files: TFile[]): Promise<TFile[]> {
    // 검색 쿼리 준비
    const query = this.caseSensitive ? this.query : this.query.toLowerCase();
    const metadataCache = this.app.metadataCache;
    const filteredFiles: TFile[] = [];
    
    for (const file of files) {
      let isMatch = false;
      
      switch (this.searchType) {
        case 'title':
          const title = this.caseSensitive ? file.basename : file.basename.toLowerCase();
          isMatch = title.includes(query);
          break;
          
        case 'path':
          const path = this.caseSensitive ? file.path : file.path.toLowerCase();
          isMatch = path.includes(query);
          break;
          
        case 'content':
          try {
            const content = await this.app.vault.read(file);
            const searchContent = this.caseSensitive ? content : content.toLowerCase();
            isMatch = searchContent.includes(query);
          } catch (error) {
            console.error(`[SearchMode] 파일 내용 읽기 오류:`, error);
          }
          break;
          
        case 'frontmatter':
          if (this.frontmatterKey) {
            const metadata = metadataCache.getFileCache(file);
            if (metadata && metadata.frontmatter) {
              const value = metadata.frontmatter[this.frontmatterKey];
              if (value !== undefined) {
                const frontmatterValue = this.caseSensitive ? String(value) : String(value).toLowerCase();
                isMatch = frontmatterValue.includes(query);
              }
            }
          }
          break;
          
        case 'all':
          // 제목 검색
          const titleAll = this.caseSensitive ? file.basename : file.basename.toLowerCase();
          if (titleAll.includes(query)) {
            isMatch = true;
            break;
          }
          
          // 경로 검색
          const pathAll = this.caseSensitive ? file.path : file.path.toLowerCase();
          if (pathAll.includes(query)) {
            isMatch = true;
            break;
          }
          
          // 내용 검색
          try {
            const contentAll = await this.app.vault.read(file);
            const searchContentAll = this.caseSensitive ? contentAll : contentAll.toLowerCase();
            if (searchContentAll.includes(query)) {
              isMatch = true;
              break;
            }
          } catch (error) {
            console.error(`[SearchMode] 파일 내용 읽기 오류:`, error);
          }
          
          // 프론트매터 검색
          const metadataAll = metadataCache.getFileCache(file);
          if (metadataAll && metadataAll.frontmatter) {
            for (const key in metadataAll.frontmatter) {
              const value = metadataAll.frontmatter[key];
              if (value !== undefined) {
                const frontmatterValue = this.caseSensitive ? String(value) : String(value).toLowerCase();
                if (frontmatterValue.includes(query)) {
                  isMatch = true;
                  break;
                }
              }
            }
          }
          break;
      }
      
      if (isMatch) {
        filteredFiles.push(file);
      }
    }
    
    return filteredFiles;
  }
  
  /**
   * 최근 검색 쿼리 목록 가져오기
   * @returns 최근 검색 쿼리 목록
   */
  private getRecentSearches(): string[] {
    try {
      // 로컬 스토리지에서 최근 검색 쿼리 가져오기
      const recentSearchesJson = localStorage.getItem('card-navigator-recent-searches');
      return recentSearchesJson ? JSON.parse(recentSearchesJson) : [];
    } catch (error) {
      console.error(`[SearchMode] 최근 검색 쿼리 가져오기 오류:`, error);
      return [];
    }
  }
  
  /**
   * 최근 검색 쿼리 목록 저장
   * @param searches 저장할 검색 쿼리 목록
   */
  private saveRecentSearches(searches: string[]): void {
    try {
      // 로컬 스토리지에 최근 검색 쿼리 저장
      localStorage.setItem('card-navigator-recent-searches', JSON.stringify(searches));
    } catch (error) {
      console.error(`[SearchMode] 최근 검색 쿼리 저장 오류:`, error);
    }
  }
  
  /**
   * 설정 초기화
   * 검색 모드의 설정을 초기화합니다.
   */
  reset(): void {
    super.reset();
    this.query = '';
    this.searchType = 'content';
    this.caseSensitive = false;
    this.frontmatterKey = undefined;
  }
} 