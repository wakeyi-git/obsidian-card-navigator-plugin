import { App, TFolder } from 'obsidian';
import { Mode, ModeType } from './Mode';

/**
 * 폴더 모드 클래스
 * 폴더를 기반으로 카드 세트를 구성하고, 태그를 필터링 옵션으로 사용합니다.
 */
export class FolderMode extends Mode {
  private app: App;
  
  constructor(app: App) {
    super('folder');
    this.app = app;
  }
  
  /**
   * 폴더 목록 가져오기
   * 현재 볼트의 모든 폴더 목록을 가져옵니다.
   */
  async getCardSets(): Promise<string[]> {
    const folders: string[] = [];
    const rootFolder = this.app.vault.getRoot();
    
    // 루트 폴더 추가
    folders.push('/');
    
    // 재귀적으로 모든 폴더 탐색
    const processFolder = (folder: TFolder, path: string) => {
      for (const child of folder.children) {
        if (child instanceof TFolder) {
          const folderPath = path === '/' ? `/${child.name}` : `${path}/${child.name}`;
          folders.push(folderPath);
          processFolder(child, folderPath);
        }
      }
    };
    
    processFolder(rootFolder, '/');
    
    return folders;
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
   * 현재 선택된 폴더의 파일 가져오기
   * 현재 선택된 폴더에 있는 모든 마크다운 파일을 가져옵니다.
   */
  async getFilesInCurrentFolder(): Promise<string[]> {
    if (!this.currentCardSet) return [];
    
    const files: string[] = [];
    const allFiles = this.app.vault.getMarkdownFiles();
    
    for (const file of allFiles) {
      const filePath = file.path;
      const folderPath = filePath.substring(0, filePath.lastIndexOf('/'));
      
      if (this.currentCardSet === '/' && folderPath === '') {
        // 루트 폴더인 경우
        files.push(filePath);
      } else if (folderPath === this.currentCardSet || folderPath.startsWith(`${this.currentCardSet}/`)) {
        // 선택된 폴더 또는 하위 폴더인 경우
        files.push(filePath);
      }
    }
    
    return files;
  }
} 