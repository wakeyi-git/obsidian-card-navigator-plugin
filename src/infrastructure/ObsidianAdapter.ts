import { App, TFile, TFolder, Vault, MetadataCache } from 'obsidian';

/**
 * Obsidian 어댑터 인터페이스
 * Obsidian API와의 통합을 위한 인터페이스입니다.
 */
export interface IObsidianAdapter {
  /**
   * 모든 마크다운 파일 가져오기
   * @returns 마크다운 파일 목록
   */
  getAllMarkdownFiles(): TFile[];
  
  /**
   * 특정 폴더의 마크다운 파일 가져오기
   * @param folderPath 폴더 경로
   * @returns 마크다운 파일 목록
   */
  getMarkdownFilesInFolder(folderPath: string): TFile[];
  
  /**
   * 특정 태그를 가진 마크다운 파일 가져오기
   * @param tag 태그
   * @returns 마크다운 파일 목록
   */
  getMarkdownFilesWithTag(tag: string): TFile[];
  
  /**
   * 모든 폴더 가져오기
   * @returns 폴더 목록
   */
  getAllFolders(): TFolder[];
  
  /**
   * 모든 태그 가져오기
   * @returns 태그 목록
   */
  getAllTags(): string[];
  
  /**
   * 파일 내용 가져오기
   * @param file 파일
   * @returns 파일 내용
   */
  getFileContent(file: TFile): Promise<string>;
  
  /**
   * 파일 내용 업데이트
   * @param file 파일
   * @param content 새 내용
   */
  updateFileContent(file: TFile, content: string): Promise<void>;
  
  /**
   * 파일의 프론트매터 가져오기
   * @param file 파일
   * @returns 프론트매터 데이터
   */
  getFileFrontmatter(file: TFile): Record<string, any> | null;
  
  /**
   * 경로로 파일 가져오기
   * @param path 파일 경로
   * @returns 파일 객체
   */
  getFileByPath(path: string): TFile | null;
  
  /**
   * 파일의 링크 가져오기
   * @param file 파일
   * @returns 링크 목록
   */
  getFileLinks(file: TFile): { link: string; displayText: string }[];
}

/**
 * Obsidian 어댑터 클래스
 * Obsidian API와의 통합을 위한 클래스입니다.
 */
export class ObsidianAdapter implements IObsidianAdapter {
  private app: App;
  private vault: Vault;
  private metadataCache: MetadataCache;
  
  constructor(app: App) {
    this.app = app;
    this.vault = app.vault;
    this.metadataCache = app.metadataCache;
  }
  
  getAllMarkdownFiles(): TFile[] {
    return this.vault.getMarkdownFiles();
  }
  
  getMarkdownFilesInFolder(folderPath: string): TFile[] {
    const allFiles = this.getAllMarkdownFiles();
    
    // 루트 폴더인 경우
    if (folderPath === '/' || folderPath === '') {
      return allFiles.filter(file => !file.path.includes('/') || file.path.lastIndexOf('/') === 0);
    }
    
    // 정규화된 경로 확보
    const normalizedPath = folderPath.endsWith('/') ? folderPath : folderPath + '/';
    
    return allFiles.filter(file => {
      // 파일이 해당 폴더 내에 있는지 확인
      return file.path.startsWith(normalizedPath) && 
        // 하위 폴더의 파일은 제외
        file.path.substring(normalizedPath.length).indexOf('/') === -1;
    });
  }
  
  getMarkdownFilesWithTag(tag: string): TFile[] {
    const allFiles = this.getAllMarkdownFiles();
    const normalizedTag = tag.startsWith('#') ? tag : '#' + tag;
    
    return allFiles.filter(file => {
      const fileCache = this.metadataCache.getFileCache(file);
      
      if (!fileCache) return false;
      
      // 프론트매터에서 태그 확인
      const frontmatter = fileCache.frontmatter;
      if (frontmatter && frontmatter.tags) {
        const tags = Array.isArray(frontmatter.tags) 
          ? frontmatter.tags 
          : [frontmatter.tags];
          
        if (tags.some(t => t === tag || '#' + t === normalizedTag)) {
          return true;
        }
      }
      
      // 인라인 태그 확인
      const tags = fileCache.tags || [];
      return tags.some(tagObj => tagObj.tag === normalizedTag);
    });
  }
  
  getAllFolders(): TFolder[] {
    const folders: TFolder[] = [];
    const rootFolder = this.vault.getRoot();
    
    const collectFolders = (folder: TFolder) => {
      folders.push(folder);
      
      for (const child of folder.children) {
        if (child instanceof TFolder) {
          collectFolders(child);
        }
      }
    };
    
    // 루트 폴더부터 시작
    collectFolders(rootFolder);
    
    return folders;
  }
  
  getAllTags(): string[] {
    const tagSet = new Set<string>();
    
    // 모든 파일의 태그 수집
    for (const file of this.getAllMarkdownFiles()) {
      const fileCache = this.metadataCache.getFileCache(file);
      
      if (!fileCache) continue;
      
      // 프론트매터 태그 추가
      const frontmatter = fileCache.frontmatter;
      if (frontmatter && frontmatter.tags) {
        const tags = Array.isArray(frontmatter.tags) 
          ? frontmatter.tags 
          : [frontmatter.tags];
          
        tags.forEach(tag => tagSet.add(tag));
      }
      
      // 인라인 태그 추가
      const tags = fileCache.tags || [];
      tags.forEach(tagObj => {
        // '#' 제거
        const tagName = tagObj.tag.startsWith('#') 
          ? tagObj.tag.substring(1) 
          : tagObj.tag;
          
        tagSet.add(tagName);
      });
    }
    
    return Array.from(tagSet);
  }
  
  async getFileContent(file: TFile): Promise<string> {
    return await this.vault.read(file);
  }
  
  async updateFileContent(file: TFile, content: string): Promise<void> {
    await this.vault.modify(file, content);
  }
  
  getFileFrontmatter(file: TFile): Record<string, any> | null {
    const fileCache = this.metadataCache.getFileCache(file);
    
    if (!fileCache || !fileCache.frontmatter) {
      return null;
    }
    
    return fileCache.frontmatter;
  }
  
  /**
   * 경로로 파일 가져오기
   * @param path 파일 경로
   * @returns 파일 객체
   */
  getFileByPath(path: string): TFile | null {
    const file = this.app.vault.getAbstractFileByPath(path);
    if (file instanceof TFile) {
      return file;
    }
    return null;
  }
  
  /**
   * 폴더 경로로 폴더 객체 가져오기
   * @param path 폴더 경로
   * @returns 폴더 객체 또는 null
   */
  getFolderByPath(path: string): TFolder | null {
    const folder = this.vault.getAbstractFileByPath(path);
    
    if (folder instanceof TFolder) {
      return folder;
    }
    
    return null;
  }
  
  /**
   * 파일의 링크 가져오기
   * @param file 파일
   * @returns 링크 목록
   */
  getFileLinks(file: TFile): { link: string; displayText: string }[] {
    const links: { link: string; displayText: string }[] = [];
    const cache = this.metadataCache.getFileCache(file);
    
    if (cache && cache.links) {
      for (const link of cache.links) {
        links.push({
          link: link.link,
          displayText: link.displayText || link.link
        });
      }
    }
    
    return links;
  }
} 