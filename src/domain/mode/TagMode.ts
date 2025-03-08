import { App, TFile } from 'obsidian';
import { Mode, ModeType } from './Mode';

/**
 * 태그 모드 클래스
 * 태그를 기반으로 카드 세트를 구성하고, 폴더를 필터링 옵션으로 사용합니다.
 */
export class TagMode extends Mode {
  private app: App;
  private isFixed = false; // 태그 고정 여부 추가
  
  constructor(app: App) {
    super('tag');
    this.app = app;
  }
  
  /**
   * 태그 고정 여부 설정
   * @param isFixed 고정 여부
   */
  setFixed(isFixed: boolean): void {
    this.isFixed = isFixed;
    console.log(`[TagMode] 태그 고정 상태 변경: ${isFixed}`);
  }
  
  /**
   * 태그 고정 여부 확인
   * @returns 고정 여부
   */
  isTagFixed(): boolean {
    return this.isFixed;
  }
  
  /**
   * 태그 목록 가져오기
   * 현재 볼트의 모든 태그 목록을 가져옵니다.
   */
  async getCardSets(): Promise<string[]> {
    const tags: Set<string> = new Set();
    const files = this.app.vault.getMarkdownFiles();
    
    console.log(`[TagMode] 전체 마크다운 파일 수: ${files.length}`);
    console.log(`[TagMode] 태그 목록 수집 시작`);
    
    for (const file of files) {
      const cache = this.app.metadataCache.getFileCache(file);
      if (cache && cache.tags) {
        for (const tag of cache.tags) {
          // 인라인 태그는 항상 # 포함
          tags.add(tag.tag);
          console.log(`[TagMode] 파일 ${file.path}에서 인라인 태그 추가: ${tag.tag}`);
        }
      }
      
      // 프론트매터 태그도 확인
      if (cache && cache.frontmatter) {
        // tags 속성 처리 (복수형)
        if (cache.frontmatter.tags) {
          const frontmatterTags = Array.isArray(cache.frontmatter.tags) 
            ? cache.frontmatter.tags 
            : [cache.frontmatter.tags];
          
          for (const tag of frontmatterTags) {
            // 프론트매터 태그는 # 없을 수 있으므로 정규화
            const normalizedTag = tag.startsWith('#') ? tag : `#${tag}`;
            tags.add(normalizedTag);
            console.log(`[TagMode] 파일 ${file.path}에서 프론트매터 tags 추가: ${normalizedTag}`);
          }
        }
        
        // tag 속성 처리 (단수형)
        if (cache.frontmatter.tag) {
          const frontmatterTags = Array.isArray(cache.frontmatter.tag) 
            ? cache.frontmatter.tag 
            : [cache.frontmatter.tag];
          
          for (const tag of frontmatterTags) {
            // 프론트매터 태그는 # 없을 수 있으므로 정규화
            const normalizedTag = tag.startsWith('#') ? tag : `#${tag}`;
            tags.add(normalizedTag);
            console.log(`[TagMode] 파일 ${file.path}에서 프론트매터 tag 추가: ${normalizedTag}`);
          }
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
   * 여러 태그가 쉼표로 구분되어 있는 경우 OR 연산으로 처리합니다.
   */
  async getFilesWithCurrentTag(): Promise<string[]> {
    if (!this.currentCardSet) return [];
    
    console.log(`[TagMode] 현재 태그로 파일 검색 시작: ${this.currentCardSet}`);
    
    // 쉼표로 구분된 여러 태그 처리
    const tagList = this.currentCardSet.split(',').map(tag => tag.trim());
    console.log(`[TagMode] 검색할 태그 목록: ${tagList.join(', ')}`);
    
    const files: Set<string> = new Set();
    const allFiles = this.app.vault.getMarkdownFiles();
    
    // 각 태그를 정규화하여 배열로 저장 (# 있는 버전과 없는 버전 모두 포함)
    const normalizedTags: string[] = [];
    tagList.forEach(tag => {
      // # 있는 버전
      const tagWithHash = tag.startsWith('#') ? tag : `#${tag}`;
      normalizedTags.push(tagWithHash);
      
      // # 없는 버전
      const tagWithoutHash = tag.startsWith('#') ? tag.substring(1) : tag;
      normalizedTags.push(tagWithoutHash);
    });
    
    console.log(`[TagMode] 정규화된 태그 목록: ${normalizedTags.join(', ')}`);
    console.log(`[TagMode] 전체 파일 수: ${allFiles.length}`);
    
    for (const file of allFiles) {
      // 파일의 모든 태그(인라인 + 프론트매터)를 가져옵니다.
      const fileTags = this.getAllTagsFromFile(file);
      
      if (fileTags.length > 0) {
        console.log(`[TagMode] 파일 ${file.path}의 모든 태그: ${fileTags.join(', ')}`);
        
        // 파일의 태그 중 하나라도 검색 태그 목록에 포함되어 있으면 추가
        let hasMatchingTag = false;
        
        // 각 파일 태그에 대해 검색 태그와 비교
        for (const fileTag of fileTags) {
          // 파일 태그 정규화 (# 있는 버전과 없는 버전)
          const fileTagWithHash = fileTag.startsWith('#') ? fileTag : `#${fileTag}`;
          const fileTagWithoutHash = fileTag.startsWith('#') ? fileTag.substring(1) : fileTag;
          
          // 검색 태그와 비교
          for (const searchTag of normalizedTags) {
            // 정확히 일치하는지 확인
            if (fileTagWithHash === searchTag || fileTagWithoutHash === searchTag) {
              hasMatchingTag = true;
              console.log(`[TagMode] 파일 ${file.path}에서 태그 매치 발견: ${fileTag} = ${searchTag}`);
              break;
            }
          }
          
          if (hasMatchingTag) break;
        }
        
        if (hasMatchingTag) {
          files.add(file.path);
        }
      }
    }
    
    const fileArray = Array.from(files);
    console.log(`[TagMode] 태그 ${this.currentCardSet}가 있는 파일 수: ${fileArray.length}`);
    return fileArray;
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
    
    // 프론트매터 태그도 확인
    if (cache && cache.frontmatter) {
      // tags 속성 처리 (복수형)
      if (cache.frontmatter.tags) {
        const frontmatterTags = Array.isArray(cache.frontmatter.tags) 
          ? cache.frontmatter.tags 
          : [cache.frontmatter.tags];
        
        for (const tag of frontmatterTags) {
          const normalizedTag = tag.startsWith('#') ? tag : `#${tag}`;
          if (!tags.includes(normalizedTag)) {
            tags.push(normalizedTag);
          }
        }
      }
      
      // tag 속성 처리 (단수형)
      if (cache.frontmatter.tag) {
        const frontmatterTags = Array.isArray(cache.frontmatter.tag) 
          ? cache.frontmatter.tag 
          : [cache.frontmatter.tag];
        
        for (const tag of frontmatterTags) {
          const normalizedTag = tag.startsWith('#') ? tag : `#${tag}`;
          if (!tags.includes(normalizedTag)) {
            tags.push(normalizedTag);
          }
        }
      }
    }
    
    return tags;
  }
  
  /**
   * 파일에서 모든 태그 가져오기
   * 인라인 태그와 프론트매터 태그를 모두 가져옵니다.
   * @param file 파일
   * @returns 태그 목록
   */
  getAllTagsFromFile(file: TFile): string[] {
    const tags: string[] = [];
    const cache = this.app.metadataCache.getFileCache(file);
    
    if (!cache) return tags;
    
    // 인라인 태그 추가
    if (cache.tags) {
      for (const tag of cache.tags) {
        if (!tags.includes(tag.tag)) {
          tags.push(tag.tag);
        }
      }
    }
    
    // 프론트매터 태그 추가
    if (cache.frontmatter) {
      // tags 속성 처리 (복수형)
      if (cache.frontmatter.tags) {
        const frontmatterTags = Array.isArray(cache.frontmatter.tags) 
          ? cache.frontmatter.tags 
          : [cache.frontmatter.tags];
        
        for (const tag of frontmatterTags) {
          // 프론트매터 태그는 # 없을 수 있으므로 정규화
          const normalizedTag = tag.startsWith('#') ? tag : `#${tag}`;
          if (!tags.includes(normalizedTag)) {
            tags.push(normalizedTag);
          }
        }
      }
      
      // tag 속성 처리 (단수형)
      if (cache.frontmatter.tag) {
        const frontmatterTags = Array.isArray(cache.frontmatter.tag) 
          ? cache.frontmatter.tag 
          : [cache.frontmatter.tag];
        
        for (const tag of frontmatterTags) {
          // 프론트매터 태그는 # 없을 수 있으므로 정규화
          const normalizedTag = tag.startsWith('#') ? tag : `#${tag}`;
          if (!tags.includes(normalizedTag)) {
            tags.push(normalizedTag);
          }
        }
      }
    }
    
    return tags;
  }
} 