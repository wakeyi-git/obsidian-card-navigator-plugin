import { App, TFile, TFolder } from 'obsidian';
import { CardSetSource, CardSetSourceType, ICardSet } from './CardSet';
import { ICard } from '../card/Card';

/**
 * 폴더 카드셋 소스 클래스
 * 폴더를 기반으로 카드셋을 구성하고, 태그를 필터링 옵션으로 사용합니다.
 */
export class FolderCardSetSource extends CardSetSource {
  private app: App;
  private includeSubfolders = true;
  private folderCache: ICardSet[] | null = null;
  private lastFolderCacheTime = 0;
  private folderFilesCache: Map<string, string[]> = new Map();
  private readonly FOLDER_CACHE_TTL = 30000; // 30초 캐시 유효 시간
  private isInitialized = false;
  
  constructor(app: App) {
    super('folder');
    this.app = app;
    
    // 파일 변경 이벤트 리스너 등록
    this.app.vault.on('create', this.handleFileChange.bind(this));
    this.app.vault.on('delete', this.handleFileChange.bind(this));
    this.app.vault.on('rename', this.handleFileChange.bind(this));
    this.app.vault.on('modify', this.handleFileChange.bind(this));
  }
  
  /**
   * 파일 변경 이벤트 핸들러
   */
  private handleFileChange(): void {
    // 캐시 초기화
    this.clearCache();
  }
  
  /**
   * 캐시 초기화
   */
  clearCache(): void {
    super.clearCache();
    this.folderCache = null;
    this.lastFolderCacheTime = 0;
    this.folderFilesCache.clear();
  }
  
  /**
   * 하위 폴더 포함 여부 설정
   * @param include 하위 폴더 포함 여부
   */
  setIncludeSubfolders(include: boolean): void {
    if (this.includeSubfolders !== include) {
      this.includeSubfolders = include;
      
      // 캐시 초기화
      this.folderFilesCache.clear();
    }
  }
  
  /**
   * 하위 폴더 포함 여부 가져오기
   * @returns 하위 폴더 포함 여부
   */
  getIncludeSubfolders(): boolean {
    return this.includeSubfolders;
  }
  
  /**
   * 카드셋 목록 가져오기
   * 현재 볼트의 모든 폴더 목록을 가져옵니다.
   */
  async getCardSets(): Promise<ICardSet[]> {
    // 캐시 확인
    const now = Date.now();
    if (this.folderCache && now - this.lastFolderCacheTime < this.FOLDER_CACHE_TTL) {
      return this.folderCache;
    }
    
    // 모든 마크다운 파일 가져오기
    const files = this.app.vault.getMarkdownFiles();
    
    // 폴더 목록 추출
    const folderSet = new Set<string>();
    
    // 루트 폴더 추가
    folderSet.add('/');
    
    // 파일 경로에서 폴더 추출
    for (const file of files) {
      const folderPath = file.parent?.path || '/';
      folderSet.add(folderPath);
      
      // 하위 폴더 포함 옵션이 활성화된 경우 상위 폴더도 추가
      if (this.includeSubfolders) {
        let parent = file.parent;
        while (parent && parent.path !== '/') {
          folderSet.add(parent.path);
          parent = parent.parent;
        }
      }
    }
    
    // 폴더 목록을 배열로 변환하고 정렬
    const folders = Array.from(folderSet).sort((a, b) => {
      // 루트 폴더를 맨 위로
      if (a === '/') return -1;
      if (b === '/') return 1;
      
      // 나머지는 알파벳 순으로 정렬
      return a.localeCompare(b);
    });
    
    // 폴더 목록을 ICardSet 배열로 변환
    const folderCardSets: ICardSet[] = folders.map(folder => {
      const name = folder === '/' ? '루트' : folder.split('/').pop() || folder;
      return {
        id: folder,
        name,
        sourceType: 'folder',
        source: folder,
        type: 'active'
      };
    });
    
    // 캐시 업데이트
    this.folderCache = folderCardSets;
    this.lastFolderCacheTime = now;
    
    return folderCardSets;
  }
  
  /**
   * 필터 옵션 가져오기
   * 현재 볼트의 모든 태그 목록을 가져옵니다.
   */
  async getFilterOptions(): Promise<string[]> {
    // 캐시 확인
    const cacheKey = 'filterOptions';
    const cachedOptions = this.getFromCache<string[]>(cacheKey);
    if (cachedOptions) {
      return cachedOptions;
    }
    
    // 모든 태그 가져오기
    const tags = new Set<string>();
    const files = this.app.vault.getMarkdownFiles();
    
    for (const file of files) {
      const cache = this.app.metadataCache.getFileCache(file);
      
      if (cache && cache.tags) {
        for (const tag of cache.tags) {
          tags.add(tag.tag);
        }
      }
    }
    
    const result = Array.from(tags).sort();
    
    // 캐시에 저장
    this.setCache(cacheKey, result);
    
    return result;
  }
  
  /**
   * 파일 목록 가져오기
   * 현재 선택된 폴더의 파일 목록을 가져옵니다.
   */
  async getFiles(): Promise<string[]> {
    return this.getFilesInFolder(this.currentCardSet);
  }
  
  /**
   * 지정된 폴더의 파일 목록 가져오기
   * @param folder 폴더 경로
   * @returns 파일 경로 목록
   */
  async getFilesInFolder(folder: string | null): Promise<string[]> {
    if (!folder) return [];
    
    // 캐시 확인
    const cacheKey = `folder:${folder}:${this.includeSubfolders}`;
    const cachedFiles = this.getFromCache<string[]>(cacheKey);
    if (cachedFiles) {
      return cachedFiles;
    }
    
    const files: string[] = [];
    const allFiles = this.app.vault.getMarkdownFiles();
    
    // 정규화된 경로 확보 (끝에 슬래시 제거)
    const normalizedFolder = folder.endsWith('/') && folder !== '/' 
      ? folder.slice(0, -1) 
      : folder;
    
    for (const file of allFiles) {
      const filePath = file.path;
      // 파일의 폴더 경로 추출 (파일명 제외)
      const folderPath = filePath.substring(0, Math.max(0, filePath.lastIndexOf('/')));
      
      if (normalizedFolder === '/' && folderPath === '') {
        // 루트 폴더인 경우
        files.push(filePath);
      } else if (folderPath === normalizedFolder) {
        // 선택된 폴더인 경우
        files.push(filePath);
      } else if (this.includeSubfolders && 
                (folderPath.startsWith(normalizedFolder + '/') || 
                 (normalizedFolder === '/' && folderPath !== ''))) {
        // 하위 폴더인 경우 (하위 폴더 포함 옵션이 켜져 있을 때)
        files.push(filePath);
      }
    }
    
    // 캐시에 저장
    this.setCache(cacheKey, files);
    
    return files;
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
    this.includeSubfolders = true;
  }
  
  /**
   * 소스 초기화
   */
  async initialize(): Promise<void> {
    console.log('[FolderCardSetSource] 초기화 시작');
    
    // 이미 초기화된 경우 중복 초기화 방지
    if (this.isInitialized) {
      console.log('[FolderCardSetSource] 이미 초기화되었습니다.');
      return;
    }
    
    // 파일 변경 이벤트 리스너 등록
    this.app.vault.on('create', this.handleFileChange.bind(this));
    this.app.vault.on('delete', this.handleFileChange.bind(this));
    this.app.vault.on('rename', this.handleFileChange.bind(this));
    this.app.vault.on('modify', this.handleFileChange.bind(this));
    
    // 초기화 완료 플래그 설정
    this.isInitialized = true;
    
    console.log('[FolderCardSetSource] 초기화 완료');
  }
} 