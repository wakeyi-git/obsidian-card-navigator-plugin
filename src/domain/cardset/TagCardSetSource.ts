import { App, TFile, CachedMetadata } from 'obsidian';
import { CardSetSource, CardSetSourceType, ICardSet } from './CardSet';
import { ICard } from '../card/Card';

/**
 * 태그 카드셋 소스 클래스
 * 태그를 기반으로 카드셋을 구성하고, 폴더를 필터링 옵션으로 사용합니다.
 */
export class TagCardSetSource extends CardSetSource {
  private app: App;
  private tagCaseSensitive = false; // 대소문자 구분 여부
  private tagCache: Map<string, string[]> = new Map(); // 태그별 파일 경로 캐시
  private fileTagCache: Map<string, string[]> = new Map(); // 파일별 태그 캐시
  private allTagsCache: ICardSet[] | null = null; // 모든 태그 캐시
  private lastTagCacheUpdate = 0; // 마지막 태그 캐시 업데이트 시간
  private readonly TAG_CACHE_TTL = 60000; // 1분 캐시 유효 시간
  private isInitialized = false; // 초기화 완료 플래그
  
  constructor(app: App) {
    super('tag');
    this.app = app;
    
    // 메타데이터 변경 이벤트 리스너 등록
    this.app.metadataCache.on('changed', this.handleMetadataChanged.bind(this));
    this.app.metadataCache.on('resolve', this.handleMetadataResolved.bind(this));
  }
  
  /**
   * 메타데이터 변경 이벤트 핸들러
   * @param file 변경된 파일
   */
  private handleMetadataChanged(file: TFile): void {
    // 파일의 태그 캐시 초기화
    this.fileTagCache.delete(file.path);
    
    // 태그 캐시 초기화 (다음 요청 시 재구성)
    this.allTagsCache = null;
    
    // 현재 선택된 태그와 관련된 파일인 경우 태그 캐시 초기화
    if (this.currentCardSet) {
      const normalizedTag = this.normalizeTag(this.currentCardSet);
      this.tagCache.delete(normalizedTag);
    }
  }
  
  /**
   * 메타데이터 해결 이벤트 핸들러
   */
  private handleMetadataResolved(): void {
    // 모든 캐시 초기화
    this.clearCache();
  }
  
  /**
   * 소스 초기화
   */
  async initialize(): Promise<void> {
    console.log('[TagCardSetSource] 초기화 시작');
    
    // 이미 초기화된 경우 중복 초기화 방지
    if (this.isInitialized) {
      console.log('[TagCardSetSource] 이미 초기화되었습니다.');
      return;
    }
    
    // 메타데이터 변경 이벤트 리스너 등록
    this.app.metadataCache.on('changed', this.handleMetadataChanged.bind(this));
    this.app.metadataCache.on('resolved', this.handleMetadataResolved.bind(this));
    
    // 초기화 완료 플래그 설정
    this.isInitialized = true;
    
    // 캐시 초기화
    this.clearCache();
    
    console.log('[TagCardSetSource] 초기화 완료');
  }
  
  /**
   * 대소문자 구분 여부 설정
   * @param caseSensitive 대소문자 구분 여부
   */
  setCaseSensitive(caseSensitive: boolean): void {
    if (this.tagCaseSensitive !== caseSensitive) {
      this.tagCaseSensitive = caseSensitive;
      
      // 캐시 초기화
      this.clearCache();
    }
  }
  
  /**
   * 대소문자 구분 여부 확인
   * @returns 대소문자 구분 여부
   */
  isCaseSensitive(): boolean {
    return this.tagCaseSensitive;
  }
  
  /**
   * 캐시 초기화
   */
  clearCache(): void {
    super.clearCache();
    this.tagCache.clear();
    this.fileTagCache.clear();
    this.allTagsCache = null;
    this.lastTagCacheUpdate = 0;
  }
  
  /**
   * 태그 정규화
   * 태그 형식을 일관되게 유지합니다. (항상 # 접두사 포함)
   * @param tag 정규화할 태그
   * @returns 정규화된 태그
   */
  private normalizeTag(tag: string): string {
    // 쉼표로 구분된 여러 태그인 경우 첫 번째 태그만 사용
    if (tag.includes(',')) {
      tag = tag.split(',')[0].trim();
    }
    
    // # 접두사 추가
    return tag.startsWith('#') ? tag : `#${tag}`;
  }
  
  /**
   * 태그 비교
   * 대소문자 구분 설정에 따라 태그를 비교합니다.
   * @param tag1 비교할 태그 1
   * @param tag2 비교할 태그 2
   * @returns 일치 여부
   */
  private compareTag(tag1: string, tag2: string): boolean {
    // 정규화
    const normalizedTag1 = this.normalizeTag(tag1);
    const normalizedTag2 = this.normalizeTag(tag2);
    
    if (this.tagCaseSensitive) {
      // 대소문자 구분
      return normalizedTag1 === normalizedTag2;
    } else {
      // 대소문자 무시
      return normalizedTag1.toLowerCase() === normalizedTag2.toLowerCase();
    }
  }
  
  /**
   * 카드셋 목록 가져오기
   * 현재 볼트의 모든 태그 목록을 가져옵니다.
   */
  async getCardSets(): Promise<ICardSet[]> {
    // 캐시 확인
    const now = Date.now();
    if (this.allTagsCache && now - this.lastTagCacheUpdate < this.TAG_CACHE_TTL) {
      return this.allTagsCache;
    }
    
    // 모든 마크다운 파일 가져오기
    const files = this.app.vault.getMarkdownFiles();
    
    // 태그 목록 추출
    const tagSet = new Set<string>();
    
    // 파일별로 태그 추출
    for (const file of files) {
      const cache = this.app.metadataCache.getFileCache(file);
      if (!cache) continue;
      
      const tags = this.extractTagsFromCache(cache);
      for (const tag of tags) {
        tagSet.add(tag);
      }
    }
    
    // 태그 목록을 배열로 변환하고 정렬
    const tags = Array.from(tagSet).sort();
    
    // 태그 목록을 ICardSet 배열로 변환
    const tagCardSets: ICardSet[] = tags.map(tag => {
      return {
        id: tag,
        name: tag,
        sourceType: 'tag',
        source: tag,
        type: 'active'
      };
    });
    
    // 캐시 업데이트
    this.allTagsCache = tagCardSets;
    this.lastTagCacheUpdate = now;
    
    return tagCardSets;
  }
  
  /**
   * 메타데이터 캐시에서 태그 추출
   * @param cache 메타데이터 캐시
   * @returns 태그 목록
   */
  private extractTagsFromCache(cache: CachedMetadata): string[] {
    const tags: Set<string> = new Set();
    
    // 인라인 태그 추가
    if (cache.tags) {
      for (const tag of cache.tags) {
        tags.add(tag.tag);
      }
    }
    
    // 프론트매터 태그 추가
    if (cache.frontmatter && cache.frontmatter.tags) {
      const frontmatterTags = Array.isArray(cache.frontmatter.tags) 
        ? cache.frontmatter.tags 
        : [cache.frontmatter.tags];
      
      for (const tag of frontmatterTags) {
        const normalizedTag = this.normalizeTag(tag);
        tags.add(normalizedTag);
      }
    }
    
    return Array.from(tags);
  }
  
  /**
   * 필터 옵션 가져오기
   * 현재 볼트의 모든 폴더 목록을 가져옵니다.
   */
  async getFilterOptions(): Promise<string[]> {
    // 캐시 확인
    const cacheKey = 'filterOptions';
    const cachedOptions = this.getFromCache<string[]>(cacheKey);
    if (cachedOptions) {
      return cachedOptions;
    }
    
    const folders: Set<string> = new Set();
    const files = this.app.vault.getMarkdownFiles();
    
    // 루트 폴더 추가
    folders.add('/');
    
    for (const file of files) {
      const filePath = file.path;
      const lastSlashIndex = filePath.lastIndexOf('/');
      
      if (lastSlashIndex > 0) {
        const folderPath = filePath.substring(0, lastSlashIndex);
        folders.add(folderPath);
        
        // 상위 폴더들도 추가
        let parentPath = folderPath;
        while (parentPath.includes('/')) {
          parentPath = parentPath.substring(0, parentPath.lastIndexOf('/'));
          if (parentPath) {
            folders.add(parentPath);
          }
        }
      }
    }
    
    const result = Array.from(folders).sort();
    
    // 캐시에 저장
    this.setCache(cacheKey, result);
    
    return result;
  }
  
  /**
   * 현재 태그가 포함된 파일 목록 가져오기
   * @param tag 태그
   * @returns 파일 경로 목록
   */
  async getFilesWithTag(tag: string): Promise<string[]> {
    if (!tag) return [];
    
    // 태그 정규화
    const normalizedTag = this.normalizeTag(tag);
    
    // 캐시 확인
    const cacheKey = `tag:${normalizedTag}:${this.tagCaseSensitive}`;
    const cachedFiles = this.getFromCache<string[]>(cacheKey);
    if (cachedFiles) {
      return cachedFiles;
    }
    
    // 결과를 저장할 Set (중복 제거)
    const fileSet = new Set<string>();
    
    // 모든 마크다운 파일 가져오기
    const allFiles = this.app.vault.getMarkdownFiles();
    
    // 각 파일에 대해 태그 확인
    for (const file of allFiles) {
      // 파일의 메타데이터 캐시 가져오기
      const cache = this.app.metadataCache.getFileCache(file);
      if (!cache) continue;
      
      // 파일의 모든 태그 가져오기
      const fileTags = this.extractTagsFromCache(cache);
      
      // 태그 일치 여부 확인
      const hasMatchingTag = fileTags.some(fileTag => 
        this.compareTag(fileTag, normalizedTag)
      );
      
      if (hasMatchingTag) {
        fileSet.add(file.path);
      }
    }
    
    const result = Array.from(fileSet);
    
    // 캐시에 저장
    this.setCache(cacheKey, result);
    
    return result;
  }
  
  /**
   * 현재 활성화된 파일의 태그 가져오기
   * @param file 파일
   * @returns 태그 목록
   */
  async getActiveFileTags(file: TFile): Promise<string[]> {
    // 캐시 확인
    const cacheKey = `file:${file.path}:tags`;
    const cachedTags = this.getFromCache<string[]>(cacheKey);
    if (cachedTags) {
      return cachedTags;
    }
    
    // 파일의 메타데이터 캐시 가져오기
    const cache = this.app.metadataCache.getFileCache(file);
    if (!cache) return [];
    
    // 파일의 모든 태그 가져오기
    const tags = this.extractTagsFromCache(cache);
    
    // 캐시에 저장
    this.setCache(cacheKey, tags);
    
    return tags;
  }
  
  /**
   * 파일 목록 가져오기
   * 현재 선택된 태그가 포함된 파일 목록을 가져옵니다.
   */
  async getFiles(): Promise<string[]> {
    if (!this.currentCardSet) return [];
    return this.getFilesWithTag(this.currentCardSet);
  }
  
  /**
   * 카드 목록 가져오기
   * @param cardService 카드 서비스
   * @returns 카드 목록
   */
  async getCards(cardService: any): Promise<ICard[]> {
    const files = await this.getFiles();
    return cardService.getCardsByPaths(files);
  }
  
  /**
   * 설정 초기화
   */
  reset(): void {
    super.reset();
    this.tagCaseSensitive = false;
  }
}
