import { App, TFile } from 'obsidian';
import { Mode, ModeType } from './Mode';

/**
 * 태그 모드 클래스
 * 태그를 기반으로 카드 세트를 구성하고, 폴더를 필터링 옵션으로 사용합니다.
 */
export class TagMode extends Mode {
  private app: App;
  
  constructor(app: App) {
    super('tag');
    this.app = app;
  }
  
  /**
   * 태그 목록 가져오기
   * 현재 볼트의 모든 태그 목록을 가져옵니다.
   */
  async getCardSets(): Promise<string[]> {
    const tags: Set<string> = new Set();
    const files = this.app.vault.getMarkdownFiles();
    
    console.log(`[TagMode] 전체 마크다운 파일 수: ${files.length}`);
    
    for (const file of files) {
      const cache = this.app.metadataCache.getFileCache(file);
      if (cache && cache.tags) {
        for (const tag of cache.tags) {
          tags.add(tag.tag);
        }
      }
    }
    
    const tagArray = Array.from(tags).sort();
    console.log(`[TagMode] 발견된 태그 수: ${tagArray.length}, 태그 목록: ${tagArray.join(', ')}`);
    return tagArray;
  }
  
  /**
   * 폴더 목록 가져오기
   * 현재 볼트의 모든 폴더 목록을 가져옵니다.
   */
  async getFilterOptions(): Promise<string[]> {
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
    
    return Array.from(folders).sort();
  }
  
  /**
   * 파일 목록 가져오기
   * 현재 선택된 태그가 있는 파일 목록을 가져옵니다.
   */
  async getFiles(): Promise<string[]> {
    return this.getFilesWithCurrentTag();
  }
  
  /**
   * 현재 태그가 있는 파일 목록 가져오기
   * 현재 선택된 태그가 있는 파일 목록을 가져옵니다.
   */
  async getFilesWithCurrentTag(): Promise<string[]> {
    if (!this.currentCardSet) return [];
    
    const files: string[] = [];
    const allFiles = this.app.vault.getMarkdownFiles();
    
    // 태그 정규화 (# 포함 여부 처리)
    const normalizedTag = this.currentCardSet.startsWith('#') 
      ? this.currentCardSet 
      : `#${this.currentCardSet}`;
    
    for (const file of allFiles) {
      const cache = this.app.metadataCache.getFileCache(file);
      if (cache) {
        let tagFound = false;
        
        // 인라인 태그 확인
        if (cache.tags) {
          console.log(`[TagMode] 파일 ${file.path}의 인라인 태그: ${cache.tags.map(t => t.tag).join(', ')}`);
          for (const tag of cache.tags) {
            if (tag.tag === normalizedTag) {
              files.push(file.path);
              tagFound = true;
              break;
            }
          }
        }
        
        // 프론트매터 태그 확인 (이미 찾았으면 스킵)
        if (!tagFound && cache.frontmatter && cache.frontmatter.tags) {
          const frontmatterTags = Array.isArray(cache.frontmatter.tags) 
            ? cache.frontmatter.tags 
            : [cache.frontmatter.tags];
          
          console.log(`[TagMode] 파일 ${file.path}의 프론트매터 태그: ${frontmatterTags.join(', ')}`);
          
          for (const tag of frontmatterTags) {
            const normalizedFrontmatterTag = tag.startsWith('#') ? tag : `#${tag}`;
            if (normalizedFrontmatterTag === normalizedTag || tag === this.currentCardSet) {
              files.push(file.path);
              break;
            }
          }
        }
      }
    }
    
    return files;
  }
  
  /**
   * 활성 파일의 태그 목록 가져오기
   * @param file 활성 파일
   * @returns 태그 목록
   */
  getActiveFileTags(file: TFile): string[] {
    const tags: string[] = [];
    const cache = this.app.metadataCache.getFileCache(file);
    
    if (cache && cache.tags) {
      for (const tag of cache.tags) {
        tags.push(tag.tag);
      }
    }
    
    return tags;
  }
} 