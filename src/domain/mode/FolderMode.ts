import { App, TFolder } from 'obsidian';
import { Mode, ModeType } from './Mode';

/**
 * 폴더 모드 클래스
 * 폴더를 기반으로 카드 세트를 구성하고, 태그를 필터링 옵션으로 사용합니다.
 */
export class FolderMode extends Mode {
  private app: App;
  private includeSubfolders: boolean = true;
  
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
    const folders: Set<string> = new Set();
    const files = this.app.vault.getMarkdownFiles();
    
    console.log(`[FolderMode] 전체 마크다운 파일 수: ${files.length}`);
    
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
    console.log(`[FolderMode] 발견된 폴더 수: ${folderArray.length}, 폴더 목록: ${folderArray.join(', ')}`);
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
    
    console.log(`[FolderMode] 현재 폴더의 파일 목록 가져오기 시작, 폴더: ${this.currentCardSet}, 하위 폴더 포함: ${this.includeSubfolders}`);
    
    const files: string[] = [];
    const allFiles = this.app.vault.getMarkdownFiles();
    
    console.log(`[FolderMode] 전체 마크다운 파일 수: ${allFiles.length}`);
    
    // 정규화된 경로 확보 (끝에 슬래시 제거)
    const normalizedCardSet = this.currentCardSet.endsWith('/') && this.currentCardSet !== '/' 
      ? this.currentCardSet.slice(0, -1) 
      : this.currentCardSet;
    
    console.log(`[FolderMode] 정규화된 카드 세트 경로: ${normalizedCardSet}`);
    
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
        // 하위 폴더 포함 옵션이 활성화되어 있고, 하위 폴더인 경우
        files.push(filePath);
      }
    }
    
    console.log(`[FolderMode] 현재 폴더의 파일 목록 가져오기 완료, 파일 수: ${files.length}`);
    console.log(`[FolderMode] 찾은 파일 경로:`, files);
    
    return files;
  }
} 