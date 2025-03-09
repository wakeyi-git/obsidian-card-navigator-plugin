import { App, TFile } from 'obsidian';
import { CardSetSource, CardSetSourceType } from './CardSet';
import { ICard } from '../card/Card';

/**
 * 태그 카드셋 소스 클래스
 * 태그를 기반으로 카드셋을 구성하고, 폴더를 필터링 옵션으로 사용합니다.
 */
export class TagCardSetSource extends CardSetSource {
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
  }
  
  /**
   * 대소문자 구분 여부 확인
   * @returns 대소문자 구분 여부
   */
  isCaseSensitive(): boolean {
    return this.tagCaseSensitive;
  }
  
  /**
   * 태그 목록 가져오기
   * 현재 볼트의 모든 태그 목록을 가져옵니다.
   */
  async getCardSets(): Promise<string[]> {
    const tags: Set<string> = new Set();
    const files = this.app.vault.getMarkdownFiles();
    
    for (const file of files) {
      const cache = this.app.metadataCache.getFileCache(file);
      
      // 인라인 태그 추가
      if (cache && cache.tags) {
        for (const tag of cache.tags) {
          tags.add(tag.tag);
        }
      }
      
      // 프론트매터 태그 추가
      if (cache && cache.frontmatter && cache.frontmatter.tags) {
        const frontmatterTags = Array.isArray(cache.frontmatter.tags) 
          ? cache.frontmatter.tags 
          : [cache.frontmatter.tags];
        
        for (const tag of frontmatterTags) {
          const normalizedTag = tag.startsWith('#') ? tag : `#${tag}`;
          tags.add(normalizedTag);
        }
      }
    }
    
    return Array.from(tags).sort();
  }
  
  /**
   * 카드셋 객체 목록 가져오기
   * UI에서 사용할 수 있는 형태로 카드셋 정보를 반환합니다.
   */
  async getCardSetObjects(): Promise<{id: string, name: string, type: string, cardSetSource: string, path: string}[]> {
    const tags = await this.getCardSets();
    
    return tags.map(tag => {
      const name = tag.startsWith('#') ? tag.substring(1) : tag;
      return {
        id: tag,
        name,
        type: 'tag',
        cardSetSource: 'tag',
        path: tag
      };
    });
  }
  
  /**
   * 필터 옵션 가져오기
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
   * 현재 태그가 포함된 파일 목록 가져오기
   * @param tag 태그
   * @returns 파일 경로 목록
   */
  async getFilesWithCurrentTag(tag: string): Promise<string[]> {
    console.log(`[TagCardSetSource] getFilesWithCurrentTag 호출: ${tag}`);
    
    // 결과를 저장할 Set (중복 제거)
    const fileSet = new Set<string>();
    
    // 쉼표로 구분된 여러 태그 처리
    const tagList = tag.split(',').map(t => t.trim()).filter(t => t);
    console.log(`[TagCardSetSource] 처리할 태그 목록: ${tagList.join(', ')}`);
    
    // 태그가 없는 경우 빈 배열 반환
    if (tagList.length === 0) {
      console.log(`[TagCardSetSource] 처리할 태그가 없습니다.`);
      return [];
    }
    
    // 각 태그에 대해 파일 검색
    for (const singleTag of tagList) {
      // 태그 정규화 (# 접두사 추가)
      const normalizedTags = [singleTag].map(t => {
        return t.startsWith('#') ? t : `#${t}`;
      });
      
      // 해시 없는 태그 버전도 생성
      const tagsWithoutHash = normalizedTags.map(t => 
        t.startsWith('#') ? t.substring(1) : t
      );
      
      console.log(`[TagCardSetSource] 현재 태그 검색: ${singleTag}`);
      console.log(`[TagCardSetSource] 정규화된 태그 목록: ${normalizedTags.join(', ')}`);
      console.log(`[TagCardSetSource] 해시 없는 태그 목록: ${tagsWithoutHash.join(', ')}`);
      
      // 모든 마크다운 파일 가져오기
      const allFiles = this.app.vault.getMarkdownFiles();
      console.log(`[TagCardSetSource] 총 ${allFiles.length}개의 마크다운 파일 검색 중...`);
      
      // 각 파일에 대해 태그 확인
      for (const file of allFiles) {
        // 파일의 모든 태그(인라인 + 프론트매터)를 가져옵니다.
        const fileTags = await this.getAllTagsFromFile(file);
        
        if (fileTags.length > 0) {
          console.log(`[TagCardSetSource] 파일 ${file.path}의 태그: ${fileTags.join(', ')}`);
          
          // 태그 중 하나라도 일치하는지 확인
          const hasMatchingTag = normalizedTags.some(searchTag => {
            const searchTagLower = this.tagCaseSensitive ? searchTag : searchTag.toLowerCase();
            const searchTagWithoutHash = searchTagLower.startsWith('#') 
              ? searchTagLower.substring(1) 
              : searchTagLower;
            
            return fileTags.some(fileTag => {
              const fileTagLower = this.tagCaseSensitive ? fileTag : fileTag.toLowerCase();
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
                  console.log(`[TagCardSetSource] 태그 일치(대소문자 구분): ${fileTag} = ${searchTag}`);
                }
                return match;
              } else {
                // 대소문자 무시하고 비교 (이미 소문자로 변환됨)
                const match = fileTagLower === searchTagLower || 
                             fileTagWithoutHash === searchTagWithoutHash;
                
                if (match) {
                  console.log(`[TagCardSetSource] 태그 일치(대소문자 무시): ${fileTag} = ${searchTag}`);
                }
                return match;
              }
            });
          });
          
          if (hasMatchingTag) {
            fileSet.add(file.path);
          }
        } else {
          console.log(`[TagCardSetSource] 파일 ${file.path}에 태그가 없습니다.`);
        }
      }
    }
    
    const result = Array.from(fileSet);
    console.log(`[TagCardSetSource] 태그 '${tag}'가 포함된 파일 ${result.length}개 찾음`);
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
      console.error(`[TagCardSetSource] 파일 ${file.path}의 태그 가져오기 오류:`, error);
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
  getCurrentTag(): string | null {
    return this.currentCardSet;
  }
  
  /**
   * 태그 고정 여부 확인
   * @returns 태그 고정 여부
   */
  isFixedTag(): boolean {
    return this.isCardSetFixed();
  }
  
  /**
   * 태그 설정
   * @param tag 태그
   * @param isFixed 고정 여부
   */
  setTag(tag: string, isFixed = false): void {
    this.selectCardSet(tag, isFixed);
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
