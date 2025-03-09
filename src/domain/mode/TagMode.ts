import { App, TFile, CachedMetadata, HeadingCache, BlockCache } from 'obsidian';
import { Mode, ModeType } from './Mode';
import { ICard } from '../card/Card';

/**
 * 태그 모드 클래스
 * 태그를 기반으로 카드 세트를 구성하고, 폴더를 필터링 옵션으로 사용합니다.
 */
export class TagMode extends Mode {
  private app: App;
  private tagCaseSensitive = false; // 대소문자 구분 여부
  
  constructor(app: App) {
    super('tag');
    this.app = app;
  }
  
  /**
   * 대소문자 구분 여부 설정
   * @param caseSensitive 대소문자 구분 여부
   */
  setCaseSensitive(caseSensitive: boolean): void {
    this.tagCaseSensitive = caseSensitive;
    console.log(`[TagMode] 대소문자 구분 여부 변경: ${caseSensitive}`);
  }
  
  /**
   * 대소문자 구분 여부 확인
   * @returns 대소문자 구분 여부
   */
  isCaseSensitive(): boolean {
    return this.tagCaseSensitive;
  }
  
  /**
   * 카드 세트 가져오기
   * 모든 마크다운 파일에서 태그를 수집하여 카드 세트를 생성합니다.
   * @returns 카드 세트 목록
   */
  async getCardSets(): Promise<string[]> {
    const tagSet = new Set<string>();
    
    // 모든 마크다운 파일 가져오기
    const files = this.app.vault.getMarkdownFiles();
    console.log(`[TagMode] 총 ${files.length}개의 마크다운 파일 처리 중...`);
    
    // 모든 파일에서 태그 수집
    for (const file of files) {
      // getAllTagsFromFile 메서드를 사용하여 모든 태그 가져오기
      const fileTags = await this.getAllTagsFromFile(file);
      
      // 수집된 태그를 Set에 추가
      for (const tag of fileTags) {
        tagSet.add(tag);
      }
    }
    
    const tagArray = Array.from(tagSet);
    console.log(`[TagMode] 총 ${tagArray.length}개의 태그 발견: ${tagArray.join(', ')}`);
    
    return tagArray;
  }
  
  /**
   * 내부용 카드 세트 객체 생성 메서드
   * 태그 기반 카드 세트 정보 객체 배열을 생성합니다.
   * @returns 태그 정보 객체 배열
   */
  async getCardSetObjects(): Promise<{id: string, name: string, type: string, mode: string, path: string}[]> {
    const cardSets: {id: string, name: string, type: string, mode: string, path: string}[] = [];
    const tags = await this.getCardSets();
    
    // 태그를 기반으로 카드 세트 생성
    for (const tag of tags) {
      const cardSet = {
        id: tag,
        name: tag,
        type: 'tag',
        mode: 'tag',
        path: tag
      };
      cardSets.push(cardSet);
    }
    
    return cardSets;
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
   * 현재 태그가 포함된 파일 가져오기
   * @param tag 태그
   * @returns 파일 경로 목록
   */
  async getFilesWithCurrentTag(tag: string): Promise<string[]> {
    const fileSet = new Set<string>();
    
    // 태그가 비어있으면 빈 배열 반환
    if (!tag) {
      return [];
    }
    
    // 쉼표로 구분된 여러 태그 처리
    const tags = tag.split(',').map(t => t.trim());
    
    // 태그 정규화 (# 있는 경우와 없는 경우 모두 처리)
    const normalizedTags = tags.map(t => {
      // 중첩 태그 처리 (예: #tag/subtag)
      if (t.includes('/')) {
        const parts = t.split('/');
        const firstPart = parts[0].startsWith('#') ? parts[0] : `#${parts[0]}`;
        return `${firstPart}/${parts.slice(1).join('/')}`;
      }
      return t.startsWith('#') ? t : `#${t}`;
    });
    
    // 해시 없는 태그 버전도 생성
    const tagsWithoutHash = normalizedTags.map(t => 
      t.startsWith('#') ? t.substring(1) : t
    );
    
    console.log(`[TagMode] 현재 태그 검색: ${tag}`);
    console.log(`[TagMode] 정규화된 태그 목록: ${normalizedTags.join(', ')}`);
    console.log(`[TagMode] 해시 없는 태그 목록: ${tagsWithoutHash.join(', ')}`);
    
    // 모든 마크다운 파일 가져오기
    const allFiles = this.app.vault.getMarkdownFiles();
    console.log(`[TagMode] 총 ${allFiles.length}개의 마크다운 파일 검색 중...`);
    
    // 각 파일에 대해 태그 확인
    for (const file of allFiles) {
      // 파일의 모든 태그(인라인 + 프론트매터)를 가져옵니다.
      const fileTags = await this.getAllTagsFromFile(file);
      
      if (fileTags.length > 0) {
        console.log(`[TagMode] 파일 ${file.path}의 태그: ${fileTags.join(', ')}`);
        
        // 태그 중 하나라도 일치하는지 확인
        const hasMatchingTag = normalizedTags.some(searchTag => {
          const searchTagLower = searchTag.toLowerCase();
          const searchTagWithoutHash = searchTagLower.startsWith('#') 
            ? searchTagLower.substring(1) 
            : searchTagLower;
          
          return fileTags.some(fileTag => {
            const fileTagLower = fileTag.toLowerCase();
            const fileTagWithoutHash = fileTagLower.startsWith('#') 
              ? fileTagLower.substring(1) 
              : fileTagLower;
            
            // 대소문자 구분 설정에 따라 비교
            if (this.tagCaseSensitive) {
              // 정확한 태그 일치 또는 해시 제외 일치
              const match = fileTag === searchTag || 
                           (fileTag.startsWith('#') && fileTag.substring(1) === searchTagWithoutHash) ||
                           (searchTag.startsWith('#') && searchTag.substring(1) === fileTagWithoutHash);
              
              if (match) {
                console.log(`[TagMode] 태그 일치(대소문자 구분): ${fileTag} = ${searchTag}`);
              }
              return match;
            } else {
              // 대소문자 무시하고 비교 (이미 소문자로 변환됨)
              const match = fileTagLower === searchTagLower || 
                           fileTagWithoutHash === searchTagWithoutHash;
              
              if (match) {
                console.log(`[TagMode] 태그 일치(대소문자 무시): ${fileTag} = ${searchTag}`);
              }
              return match;
            }
          });
        });
        
        if (hasMatchingTag) {
          fileSet.add(file.path);
          console.log(`[TagMode] 파일 추가: ${file.path}`);
        }
      } else {
        console.log(`[TagMode] 파일 ${file.path}에 태그가 없습니다.`);
      }
    }
    
    const result = Array.from(fileSet);
    console.log(`[TagMode] 태그 '${tag}'를 가진 파일 수: ${result.length}`);
    return result;
  }
  
  /**
   * 현재 활성화된 파일의 태그 가져오기
   * @param file 파일
   * @returns 태그 목록
   */
  async getActiveFileTags(file: TFile): Promise<string[]> {
    return await this.getAllTagsFromFile(file);
  }
  
  /**
   * 파일 목록 가져오기
   * 현재 선택된 태그가 포함된 파일 목록을 가져옵니다.
   */
  async getFiles(): Promise<string[]> {
    if (!this.currentCardSet) return [];
    return this.getFilesWithCurrentTag(this.currentCardSet);
  }
  
  /**
   * 파일의 모든 태그 가져오기
   * 파일의 프론트매터와 인라인 태그를 모두 가져옵니다.
   * @param file 파일
   * @returns 태그 목록
   */
  async getAllTagsFromFile(file: TFile): Promise<string[]> {
    const tagSet = new Set<string>();
    
    try {
      // 파일 캐시 가져오기
      const cache = this.app.metadataCache.getFileCache(file);
      
      if (!cache) {
        return [];
      }
      
      // 1. 프론트매터 태그 처리
      if (cache.frontmatter && cache.frontmatter.tags) {
        const frontmatterTags = cache.frontmatter.tags;
        
        if (Array.isArray(frontmatterTags)) {
          // 배열 형태의 태그
          for (const tag of frontmatterTags) {
            const normalizedTag = tag.startsWith('#') ? tag : `#${tag}`;
            tagSet.add(normalizedTag);
          }
        } else if (typeof frontmatterTags === 'string') {
          // 쉼표로 구분된 문자열 형태의 태그
          const tags = frontmatterTags.split(',').map(t => t.trim());
          for (const tag of tags) {
            const normalizedTag = tag.startsWith('#') ? tag : `#${tag}`;
            tagSet.add(normalizedTag);
          }
        }
      }
      
      // 2. 인라인 태그 처리
      if (cache.tags) {
        for (const tagObj of cache.tags) {
          // 코드 블록 내의 태그는 제외
          const fileContent = await this.app.vault.read(file);
          if (!this.isTagInCodeBlock(fileContent, tagObj.tag)) {
            tagSet.add(tagObj.tag);
          }
        }
      }
      
      return Array.from(tagSet);
    } catch (error) {
      console.error(`[TagMode] 파일 ${file.path}의 태그 가져오기 오류:`, error);
      return [];
    }
  }
  
  /**
   * 태그가 코드 블록 내에 있는지 확인
   * @param content 파일 내용
   * @param tag 태그
   * @returns 코드 블록 내 여부
   */
  private isTagInCodeBlock(content: string, tag: string): boolean {
    // 코드 블록 내의 태그인지 확인하는 로직
    // 간단한 구현: 코드 블록 시작과 끝 사이에 태그가 있는지 확인
    const codeBlockRegex = /```[\s\S]*?```/g;
    let match;
    
    while ((match = codeBlockRegex.exec(content)) !== null) {
      if (match[0].includes(tag)) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * 현재 태그 가져오기
   * @returns 현재 선택된 태그
   */
  getCurrentTag(): string {
    return this.currentCardSet || '';
  }
  
  /**
   * 태그 고정 여부 확인
   * @returns 태그 고정 여부
   */
  isFixedTag(): boolean {
    return this.isFixed();
  }
  
  /**
   * 태그 설정
   * @param tag 설정할 태그
   * @param isFixed 고정 여부
   */
  setTag(tag: string, isFixed: boolean = false): void {
    this.currentCardSet = tag;
    this.setFixed(isFixed);
    console.log(`[TagMode] 태그 설정: ${tag}, 고정=${isFixed}`);
  }
  
  /**
   * 카드 목록 가져오기
   * 현재 선택된 태그의 카드 목록을 가져옵니다.
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
    this.tagCaseSensitive = false;
  }
}
