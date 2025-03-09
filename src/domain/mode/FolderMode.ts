import { App, TFile, TFolder } from 'obsidian';
import { Mode, ModeType } from './Mode';
import { ICard } from '../card/Card';

/**
 * 폴더 모드 클래스
 * 폴더를 기반으로 카드 세트를 구성하고, 태그를 필터링 옵션으로 사용합니다.
 */
export class FolderMode extends Mode {
  private app: App;
  private includeSubfolders = true;
  private folderCache: string[] | null = null;
  private lastFolderCacheTime = 0;
  private FOLDER_CACHE_TTL = 5000; // 5초 캐시 유효 시간
  
  constructor(app: App) {
    super('folder');
    this.app = app;
  }
  
  /**
   * 하위 폴더 포함 여부 설정
   * @param include 하위 폴더 포함 여부
   */
  setIncludeSubfolders(include: boolean): void {
    this.includeSubfolders = include;
  }
  
  /**
   * 하위 폴더 포함 여부 가져오기
   * @returns 하위 폴더 포함 여부
   */
  getIncludeSubfolders(): boolean {
    return this.includeSubfolders;
  }
  
  /**
   * 폴더 목록 가져오기
   * 현재 볼트의 모든 폴더 목록을 가져옵니다.
   */
  async getCardSets(): Promise<string[]> {
    // 캐시 확인
    const now = Date.now();
    if (this.folderCache && now - this.lastFolderCacheTime < this.FOLDER_CACHE_TTL) {
      return this.folderCache;
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
    
    const folderArray = Array.from(folders).sort();
    
    // 결과 캐싱
    this.folderCache = folderArray;
    this.lastFolderCacheTime = now;
    
    return folderArray;
  }
  
  /**
   * 태그 목록 가져오기
   * 현재 볼트의 모든 태그 목록을 가져옵니다.
   */
  async getFilterOptions(): Promise<string[]> {
    const tags: Set<string> = new Set();
    const files = this.app.vault.getMarkdownFiles();
    
    for (const file of files) {
      const cache = this.app.metadataCache.getFileCache(file);
      if (cache && cache.tags) {
        for (const tag of cache.tags) {
          tags.add(tag.tag);
        }
      }
    }
    
    return Array.from(tags).sort();
  }
  
  /**
   * 파일 목록 가져오기
   * 현재 선택된 폴더의 파일 목록을 가져옵니다.
   */
  async getFiles(): Promise<string[]> {
    return this.getFilesInCurrentFolder();
  }
  
  /**
   * 현재 폴더의 파일 목록 가져오기
   * 현재 선택된 폴더의 파일 목록을 가져옵니다.
   */
  async getFilesInCurrentFolder(): Promise<string[]> {
    if (!this.currentCardSet) return [];
    
    const files: string[] = [];
    const allFiles = this.app.vault.getMarkdownFiles();
    
    // 정규화된 경로 확보 (끝에 슬래시 제거)
    const normalizedCardSet = this.currentCardSet.endsWith('/') && this.currentCardSet !== '/' 
      ? this.currentCardSet.slice(0, -1) 
      : this.currentCardSet;
    
    for (const file of allFiles) {
      const filePath = file.path;
      // 파일의 폴더 경로 추출 (파일명 제외)
      const folderPath = filePath.substring(0, Math.max(0, filePath.lastIndexOf('/')));
      
      if (normalizedCardSet === '/' && folderPath === '') {
        // 루트 폴더인 경우
        files.push(filePath);
      } else if (folderPath === normalizedCardSet) {
        // 선택된 폴더인 경우
        files.push(filePath);
      } else if (this.includeSubfolders && 
                (folderPath.startsWith(normalizedCardSet + '/') || 
                 (normalizedCardSet === '/' && folderPath !== ''))) {
        // 하위 폴더인 경우 (하위 폴더 포함 옵션이 켜져 있을 때)
        files.push(filePath);
      }
    }
    
    return files;
  }
  
  /**
   * 현재 폴더 가져오기
   * @returns 현재 선택된 폴더
   */
  getCurrentFolder(): string {
    return this.currentCardSet || '';
  }
  
  /**
   * 폴더 고정 여부 확인
   * @returns 폴더 고정 여부
   */
  isFixedFolder(): boolean {
    return this.isFixed();
  }
  
  /**
   * 폴더 설정
   * @param folder 설정할 폴더
   * @param isFixed 고정 여부
   */
  setFolder(folder: string, isFixed = false): void {
    this.currentCardSet = folder;
    this.setFixed(isFixed);
    console.log(`[FolderMode] 폴더 설정: ${folder}, 고정=${isFixed}`);
  }
  
  /**
   * 카드 목록 가져오기
   * 현재 선택된 폴더의 카드 목록을 가져옵니다.
   * @param cardService 카드 서비스
   * @returns 카드 목록
   */
  async getCards(cardService: any): Promise<ICard[]> {
    const filePaths = await this.getFiles();
    return await cardService.getCardsByPaths(filePaths);
  }
  
  /**
   * 설정 초기화
   * 현재 모드의 설정을 초기화합니다.
   */
  reset(): void {
    super.reset();
    this.includeSubfolders = true;
  }
} 