import { App, TFile } from 'obsidian';
import { IMode, Mode } from './Mode';
import { ICard } from '../card/Card';

/**
 * 검색 타입
 * 검색 대상을 정의합니다.
 */
export type SearchType = 'filename' | 'content' | 'tag' | 'path' | 'frontmatter' | 'create' | 'modify';

/**
 * 검색 범위 타입
 * 검색 범위를 정의합니다.
 */
export type SearchScope = 'all' | 'current';

/**
 * 검색 모드 클래스
 * 검색 기반 모드를 구현합니다.
 */
export class SearchMode extends Mode {
  type: 'search' = 'search';
  private app: App;
  private query = '';
  private searchType: SearchType = 'filename';
  private caseSensitive = false;
  private frontmatterKey?: string;
  private searchScope: SearchScope = 'current';
  private preSearchCards: ICard[] = []; // 검색 모드 전환 전 카드셋
  
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
   * 검색 쿼리 가져오기
   * @returns 검색 쿼리
   */
  getQuery(): string {
    return this.query;
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
   * 검색 타입 가져오기
   * @returns 검색 타입
   */
  getSearchType(): SearchType {
    return this.searchType;
  }
  
  /**
   * 프론트매터 키 가져오기
   * @returns 프론트매터 키
   */
  getFrontmatterKey(): string | undefined {
    return this.frontmatterKey;
  }
  
  /**
   * 대소문자 구분 여부 설정
   * @param caseSensitive 대소문자 구분 여부
   */
  setCaseSensitive(caseSensitive: boolean): void {
    this.caseSensitive = caseSensitive;
  }
  
  /**
   * 대소문자 구분 여부 가져오기
   * @returns 대소문자 구분 여부
   */
  isCaseSensitive(): boolean {
    return this.caseSensitive;
  }
  
  /**
   * 검색 범위 설정
   * @param scope 검색 범위 ('all': 볼트 전체, 'current': 현재 카드셋)
   */
  setSearchScope(scope: SearchScope): void {
    console.log(`[SearchMode] 검색 범위 변경: ${scope}`);
    this.searchScope = scope;
  }
  
  /**
   * 검색 범위 가져오기
   * @returns 검색 범위
   */
  getSearchScope(): SearchScope {
    return this.searchScope;
  }
  
  /**
   * 검색 모드 전환 전 카드셋 설정
   * 이전 모드(폴더 모드/태그 모드)에서 표시되었던 카드셋을 저장합니다.
   * @param cards 카드셋
   */
  setPreSearchCards(cards: ICard[]): void {
    console.log(`[SearchMode] 검색 모드 전환 전 카드셋 저장: ${cards.length}개`);
    this.preSearchCards = [...cards];
  }
  
  /**
   * 검색 모드 전환 전 카드셋 가져오기
   * @returns 카드셋
   */
  getPreSearchCards(): ICard[] {
    return this.preSearchCards;
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
    return ['filename', 'content', 'tag', 'path', 'frontmatter', 'create', 'modify'];
  }
  
  /**
   * 파일 목록 가져오기
   * 현재 검색 쿼리에 해당하는 파일 목록을 가져옵니다.
   * @returns 파일 경로 목록
   */
  async getFiles(): Promise<string[]> {
    console.log(`[SearchMode] 검색 쿼리 '${this.query}'에 해당하는 파일 목록 가져오기 (범위: ${this.searchScope})`);
    
    if (!this.query) {
      console.log(`[SearchMode] 검색 쿼리가 없습니다.`);
      return [];
    }
    
    try {
      let files: TFile[];
      
      // 검색 범위에 따라 파일 목록 가져오기
      if (this.searchScope === 'all') {
        // 볼트 전체 검색
        files = this.app.vault.getMarkdownFiles();
        console.log(`[SearchMode] 볼트 전체 검색: ${files.length}개 파일`);
      } else {
        // 현재 카드셋 내 검색
        if (this.preSearchCards.length === 0) {
          console.log(`[SearchMode] 이전 카드셋이 없습니다. 볼트 전체 검색으로 전환합니다.`);
          files = this.app.vault.getMarkdownFiles();
        } else {
          // 이전 카드셋의 파일 경로로 TFile 객체 가져오기
          const filePaths = this.preSearchCards.map(card => card.path);
          files = filePaths
            .map(path => this.app.vault.getAbstractFileByPath(path))
            .filter((file): file is TFile => file instanceof TFile);
          console.log(`[SearchMode] 현재 카드셋 내 검색: ${files.length}개 파일`);
        }
      }
      
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
        case 'filename':
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
          
        case 'tag':
          const fileCache = metadataCache.getFileCache(file);
          if (fileCache && fileCache.tags) {
            for (const tag of fileCache.tags) {
              const tagText = this.caseSensitive ? tag.tag : tag.tag.toLowerCase();
              if (tagText.includes(query)) {
                isMatch = true;
                break;
              }
            }
          }
          break;
          
        case 'frontmatter':
          const fmCache = metadataCache.getFileCache(file);
          if (fmCache && fmCache.frontmatter) {
            if (this.frontmatterKey) {
              // 특정 프론트매터 키 검색
              const value = fmCache.frontmatter[this.frontmatterKey];
              if (value !== undefined) {
                const valueStr = this.caseSensitive ? String(value) : String(value).toLowerCase();
                isMatch = valueStr.includes(query);
              }
            } else {
              // 모든 프론트매터 검색
              for (const key in fmCache.frontmatter) {
                const value = fmCache.frontmatter[key];
                if (value !== undefined) {
                  const valueStr = this.caseSensitive ? String(value) : String(value).toLowerCase();
                  if (valueStr.includes(query)) {
                    isMatch = true;
                    break;
                  }
                }
              }
            }
          }
          break;
          
        case 'create':
          const createTime = file.stat.ctime;
          const createDate = new Date(createTime);
          const createDateStr = createDate.toISOString().split('T')[0]; // YYYY-MM-DD 형식
          isMatch = createDateStr.includes(query);
          break;
          
        case 'modify':
          const modifyTime = file.stat.mtime;
          const modifyDate = new Date(modifyTime);
          const modifyDateStr = modifyDate.toISOString().split('T')[0]; // YYYY-MM-DD 형식
          isMatch = modifyDateStr.includes(query);
          break;
      }
      
      if (isMatch) {
        filteredFiles.push(file);
      }
    }
    
    return filteredFiles;
  }
  
  /**
   * 최근 검색 쿼리 가져오기
   * @returns 최근 검색 쿼리 목록
   */
  private getRecentSearches(): string[] {
    try {
      // 로컬 스토리지에서 가져오기
      const savedSearches = localStorage.getItem('card-navigator-recent-searches');
      if (savedSearches) {
        return JSON.parse(savedSearches);
      }
    } catch (error) {
      console.error(`[SearchMode] 최근 검색 쿼리 가져오기 오류:`, error);
    }
    
    return [];
  }
  
  /**
   * 최근 검색 쿼리 저장하기
   * @param searches 검색 쿼리 목록
   */
  private saveRecentSearches(searches: string[]): void {
    try {
      localStorage.setItem('card-navigator-recent-searches', JSON.stringify(searches));
    } catch (error) {
      console.error(`[SearchMode] 최근 검색 쿼리 저장 오류:`, error);
    }
  }
  
  /**
   * 설정 초기화
   * 현재 모드의 설정을 초기화합니다.
   */
  reset(): void {
    super.reset();
    this.query = '';
    this.searchType = 'filename';
    this.caseSensitive = false;
    this.frontmatterKey = undefined;
    this.searchScope = 'current';
    this.preSearchCards = [];
  }
  
  /**
   * 카드 목록 가져오기
   * 현재 검색 쿼리에 해당하는 카드 목록을 가져옵니다.
   * @param cardService 카드 서비스
   * @returns 카드 목록
   */
  async getCards(cardService: any): Promise<ICard[]> {
    const filePaths = await this.getFiles();
    return await cardService.getCardsByPaths(filePaths);
  }
} 