import { App, TFile, TFolder, Vault, MetadataCache } from 'obsidian';
import { TimerUtil } from './TimerUtil';

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
  
  /**
   * 메타데이터 캐시 가져오기
   * @returns 메타데이터 캐시
   */
  getMetadataCache(): MetadataCache;
}

/**
 * Obsidian 어댑터 클래스
 * Obsidian API와의 통합을 위한 클래스입니다.
 */
export class ObsidianAdapter implements IObsidianAdapter {
  private app: App;
  private vault: Vault;
  private metadataCache: MetadataCache;
  
  // 성능 모니터링을 위한 카운터 추가
  private fileAccessCount = 0;
  private folderAccessCount = 0;
  private tagAccessCount = 0;
  private metadataAccessCount = 0;
  
  constructor(app: App) {
    this.app = app;
    this.vault = app.vault;
    this.metadataCache = app.metadataCache;
  }
  
  getAllMarkdownFiles(): TFile[] {
    const timerLabel = `[성능] ObsidianAdapter.getAllMarkdownFiles 실행 시간-${Date.now()}`;
    console.time(timerLabel);
    this.fileAccessCount++;
    
    try {
      const files = this.vault.getMarkdownFiles();
      console.log(`[성능] 마크다운 파일 접근 횟수: ${this.fileAccessCount}, 파일 수: ${files.length}`);
      console.timeEnd(timerLabel);
      return files;
    } catch (error) {
      console.error('[성능] ObsidianAdapter.getAllMarkdownFiles 오류:', error);
      console.timeEnd(timerLabel);
      return [];
    }
  }
  
  getMarkdownFilesInFolder(folderPath: string): TFile[] {
    const timerLabel = `[성능] ObsidianAdapter.getMarkdownFilesInFolder(${folderPath}) 실행 시간-${Date.now()}`;
    console.time(timerLabel);
    this.folderAccessCount++;
    
    try {
      // 모든 마크다운 파일 가져오기
      const allFiles = this.getAllMarkdownFiles();
      console.log(`[성능] 폴더 접근 횟수: ${this.folderAccessCount}, 전체 파일 수: ${allFiles.length}`);
      
      // 정규화된 폴더 경로 (끝에 슬래시 제거, 루트 폴더는 예외)
      const normalizedFolderPath = folderPath.endsWith('/') && folderPath !== '/' 
        ? folderPath.slice(0, -1) 
        : folderPath;
      
      console.log(`[성능] 정규화된 폴더 경로: ${normalizedFolderPath}`);
      
      // 루트 폴더인 경우
      if (normalizedFolderPath === '/') {
        const rootFiles = allFiles.filter(file => {
          const lastSlashIndex = file.path.lastIndexOf('/');
          return lastSlashIndex === -1 || lastSlashIndex === 0;
        });
        
        console.log(`[성능] 루트 폴더 파일 수: ${rootFiles.length}`);
        console.timeEnd(timerLabel);
        return rootFiles;
      }
      
      // 특정 폴더의 파일만 필터링
      const filesInFolder = allFiles.filter(file => {
        const filePath = file.path;
        const fileDir = filePath.substring(0, Math.max(0, filePath.lastIndexOf('/')));
        
        return fileDir === normalizedFolderPath;
      });
      
      console.log(`[성능] 폴더 '${normalizedFolderPath}'의 파일 수: ${filesInFolder.length}`);
      console.timeEnd(timerLabel);
      return filesInFolder;
    } catch (error) {
      console.error(`[성능] ObsidianAdapter.getMarkdownFilesInFolder(${folderPath}) 오류:`, error);
      console.timeEnd(timerLabel);
      return [];
    }
  }
  
  getMarkdownFilesWithTag(tag: string): TFile[] {
    const timerLabel = `[성능] ObsidianAdapter.getMarkdownFilesWithTag(${tag}) 실행 시간-${Date.now()}`;
    console.time(timerLabel);
    this.tagAccessCount++;
    
    try {
      // 정규화된 태그 (# 포함)
      const normalizedTag = tag.startsWith('#') ? tag : `#${tag}`;
      const tagWithoutHash = tag.startsWith('#') ? tag.substring(1) : tag;
      
      console.log(`[성능] 태그 접근 횟수: ${this.tagAccessCount}, 태그: ${normalizedTag}, 해시 없는 태그: ${tagWithoutHash}`);
      
      // 모든 마크다운 파일 가져오기
      const allFiles = this.getAllMarkdownFiles();
      
      // 특정 태그를 가진 파일만 필터링
      const filesWithTag = allFiles.filter(file => {
        const cache = this.metadataCache.getFileCache(file);
        if (!cache) return false;
        
        // 인라인 태그 확인
        if (cache.tags && cache.tags.some(t => {
          const tagText = t.tag.toLowerCase();
          return tagText === normalizedTag.toLowerCase() || tagText === tag.toLowerCase();
        })) {
          console.log(`[ObsidianAdapter] 파일 '${file.path}'에서 인라인 태그 '${normalizedTag}' 발견`);
          return true;
        }
        
        // 프론트매터 태그 확인
        if (cache.frontmatter && cache.frontmatter.tags) {
          let frontmatterTags: string[] = [];
          
          // 프론트매터 태그가 문자열인 경우
          if (typeof cache.frontmatter.tags === 'string') {
            // 쉼표로 구분된 태그 목록일 수 있음
            frontmatterTags = cache.frontmatter.tags.split(',').map(t => t.trim());
          } 
          // 프론트매터 태그가 배열인 경우
          else if (Array.isArray(cache.frontmatter.tags)) {
            frontmatterTags = cache.frontmatter.tags;
          }
          // 단일 값인 경우
          else {
            frontmatterTags = [String(cache.frontmatter.tags)];
          }
          
          // 태그 비교 (대소문자 무시)
          if (frontmatterTags.some(t => {
            const tagText = String(t).toLowerCase();
            const withoutHash = tagText.startsWith('#') ? tagText.substring(1) : tagText;
            
            return withoutHash === tagWithoutHash.toLowerCase() || 
                   tagText === normalizedTag.toLowerCase() || 
                   tagText === tag.toLowerCase();
          })) {
            console.log(`[ObsidianAdapter] 파일 '${file.path}'에서 프론트매터 태그 '${tagWithoutHash}' 발견, 프론트매터 태그 목록:`, frontmatterTags);
            return true;
          }
        }
        
        return false;
      });
      
      console.log(`[성능] 태그 '${normalizedTag}'를 가진 파일 수: ${filesWithTag.length}`);
      console.timeEnd(timerLabel);
      return filesWithTag;
    } catch (error) {
      console.error(`[성능] ObsidianAdapter.getMarkdownFilesWithTag(${tag}) 오류:`, error);
      console.timeEnd(timerLabel);
      return [];
    }
  }
  
  getAllFolders(): TFolder[] {
    const timerLabel = `[성능] ObsidianAdapter.getAllFolders 실행 시간-${Date.now()}`;
    console.time(timerLabel);
    this.folderAccessCount++;
    
    try {
      const folders: TFolder[] = [];
      const rootFolder = this.vault.getRoot();
      
      // 루트 폴더 추가
      folders.push(rootFolder);
      
      // 재귀적으로 모든 폴더 탐색
      const collectFolders = (folder: TFolder) => {
        for (const child of folder.children) {
          if (child instanceof TFolder) {
            folders.push(child);
            collectFolders(child);
          }
        }
      };
      
      collectFolders(rootFolder);
      
      console.log(`[성능] 폴더 접근 횟수: ${this.folderAccessCount}, 폴더 수: ${folders.length}`);
      console.timeEnd(timerLabel);
      return folders;
    } catch (error) {
      console.error('[성능] ObsidianAdapter.getAllFolders 오류:', error);
      console.timeEnd(timerLabel);
      return [];
    }
  }
  
  getAllTags(): string[] {
    const timerLabel = `[성능] ObsidianAdapter.getAllTags 실행 시간-${Date.now()}`;
    console.time(timerLabel);
    this.tagAccessCount++;
    
    try {
      const tagSet = new Set<string>();
      
      // 모든 마크다운 파일 가져오기
      const files = this.getAllMarkdownFiles();
      
      // 각 파일의 태그 수집
      for (const file of files) {
        const cache = this.metadataCache.getFileCache(file);
        if (!cache) continue;
        
        // 인라인 태그 수집
        if (cache.tags) {
          for (const tag of cache.tags) {
            tagSet.add(tag.tag);
          }
        }
        
        // 프론트매터 태그 수집
        if (cache.frontmatter && cache.frontmatter.tags) {
          const frontmatterTags = Array.isArray(cache.frontmatter.tags) 
            ? cache.frontmatter.tags 
            : [cache.frontmatter.tags];
          
          for (const tag of frontmatterTags) {
            // 프론트매터 태그는 # 없이 저장될 수 있으므로 # 추가
            const normalizedTag = tag.startsWith('#') ? tag : `#${tag}`;
            tagSet.add(normalizedTag);
          }
        }
      }
      
      const tags = Array.from(tagSet);
      
      console.log(`[성능] 태그 접근 횟수: ${this.tagAccessCount}, 태그 수: ${tags.length}`);
      console.log(`[ObsidianAdapter] 수집된 태그 목록: ${tags.join(', ')}`);
      console.timeEnd(timerLabel);
      return tags;
    } catch (error) {
      console.error('[성능] ObsidianAdapter.getAllTags 오류:', error);
      console.timeEnd(timerLabel);
      return [];
    }
  }
  
  async getFileContent(file: TFile): Promise<string> {
    const timerId = TimerUtil.startTimer(`[성능] ObsidianAdapter.getFileContent(${file.path})`);
    this.fileAccessCount++;
    
    try {
      const content = await this.vault.read(file);
      console.log(`[성능] 파일 내용 접근 횟수: ${this.fileAccessCount}, 파일: ${file.path}`);
      TimerUtil.endTimer(timerId);
      return content;
    } catch (error) {
      console.error(`[성능] ObsidianAdapter.getFileContent(${file.path}) 오류:`, error);
      TimerUtil.endTimer(timerId);
      return '';
    }
  }
  
  async updateFileContent(file: TFile, content: string): Promise<void> {
    await this.vault.modify(file, content);
  }
  
  getFileFrontmatter(file: TFile): Record<string, any> | null {
    const timerLabel = `[성능] ObsidianAdapter.getFileFrontmatter(${file.path}) 실행 시간-${Date.now()}`;
    console.time(timerLabel);
    this.metadataAccessCount++;
    
    try {
      const cache = this.metadataCache.getFileCache(file);
      const frontmatter = cache?.frontmatter || null;
      
      console.log(`[성능] 메타데이터 접근 횟수: ${this.metadataAccessCount}, 파일: ${file.path}`);
      console.timeEnd(timerLabel);
      return frontmatter;
    } catch (error) {
      console.error(`[성능] ObsidianAdapter.getFileFrontmatter(${file.path}) 오류:`, error);
      console.timeEnd(timerLabel);
      return null;
    }
  }
  
  /**
   * 경로로 파일 가져오기
   * @param path 파일 경로
   * @returns 파일 객체
   */
  getFileByPath(path: string): TFile | null {
    const timerLabel = `[성능] ObsidianAdapter.getFileByPath(${path}) 실행 시간-${Date.now()}`;
    console.time(timerLabel);
    this.fileAccessCount++;
    
    try {
      const file = this.vault.getAbstractFileByPath(path);
      
      console.log(`[성능] 파일 경로 접근 횟수: ${this.fileAccessCount}, 경로: ${path}`);
      console.timeEnd(timerLabel);
      
      if (file instanceof TFile) {
        return file;
      }
      
      return null;
    } catch (error) {
      console.error(`[성능] ObsidianAdapter.getFileByPath(${path}) 오류:`, error);
      console.timeEnd(timerLabel);
      return null;
    }
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
  
  getMetadataCache(): MetadataCache {
    return this.metadataCache;
  }
} 