import { App, TFile, CachedMetadata, HeadingCache, BlockCache } from 'obsidian';
import { Mode, ModeType } from './Mode';
import { ICardSet } from '../cardset/CardSet';

/**
 * 태그 모드 클래스
 * 태그를 기반으로 카드 세트를 구성하고, 폴더를 필터링 옵션으로 사용합니다.
 */
export class TagMode extends Mode {
  private app: App;
  private isFixed = false; // 태그 고정 여부
  private tagCaseSensitive = false; // 대소문자 구분 여부
  
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
    console.log(`[TagMode] 태그 고정 여부 변경: ${isFixed}`);
  }
  
  /**
   * 태그 고정 여부 확인
   * @returns 고정 여부
   */
  isTagFixed(): boolean {
    return this.isFixed;
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
   * ICardSet 객체 배열을 생성합니다.
   * @returns ICardSet 객체 배열
   */
  async getCardSetObjects(): Promise<ICardSet[]> {
    const cardSets: ICardSet[] = [];
    const tags = await this.getCardSets();
    
    // 태그를 기반으로 카드 세트 생성
    for (const tag of tags) {
      const cardSet: ICardSet = {
        id: tag,
        name: tag,
        type: 'tag',
        mode: 'tag',
        path: tag,
        includeSubfolders: false,
        isFixed: false,
        getCards: async () => [],
        update: () => {}
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
   * 현재 선택된 태그가 있는 파일 목록을 가져옵니다.
   */
  async getFiles(): Promise<string[]> {
    if (!this.currentCardSet) return [];
    return await this.getFilesWithCurrentTag(this.currentCardSet);
  }
  
  /**
   * 파일에서 모든 태그 가져오기
   * 인라인 태그와 프론트매터 태그를 모두 가져옵니다.
   * @param file 파일
   * @returns 태그 목록
   */
  async getAllTagsFromFile(file: TFile): Promise<string[]> {
    const tags: string[] = [];
    const cache = this.app.metadataCache.getFileCache(file);
    
    if (!cache) return tags;
    
    // 인라인 태그 추가
    if (cache.tags) {
      for (const tag of cache.tags) {
        if (!tags.includes(tag.tag)) {
          tags.push(tag.tag);
          console.log(`[TagMode] 파일 ${file.path}에서 인라인 태그 추가: ${tag.tag}`);
        }
      }
    }
    
    // 블록 참조 태그 추가
    if (cache.blocks) {
      for (const blockId in cache.blocks) {
        const block = cache.blocks[blockId];
        // @ts-ignore - Obsidian API에서 BlockCache에 tags 속성이 있지만 타입 정의에 없음
        if (block.tags) {
          // @ts-ignore
          for (const tag of block.tags) {
            if (!tags.includes(tag)) {
              tags.push(tag);
              console.log(`[TagMode] 파일 ${file.path}에서 블록 태그 추가: ${tag}`);
            }
          }
        }
      }
    }
    
    // 헤딩 태그 추가
    if (cache.headings) {
      for (const heading of cache.headings) {
        // @ts-ignore - Obsidian API에서 HeadingCache에 tags 속성이 있지만 타입 정의에 없음
        if (heading.tags) {
          // @ts-ignore
          for (const tag of heading.tags) {
            if (!tags.includes(tag)) {
              tags.push(tag);
              console.log(`[TagMode] 파일 ${file.path}에서 헤딩 태그 추가: ${tag}`);
            }
          }
        }
      }
    }
    
    // 프론트매터 태그 추가
    if (cache.frontmatter) {
      // tags 속성 처리 (복수형)
      if (cache.frontmatter.tags) {
        let frontmatterTags: string[] = [];
        
        // 문자열인 경우 쉼표로 구분된 목록일 수 있음
        if (typeof cache.frontmatter.tags === 'string') {
          frontmatterTags = cache.frontmatter.tags.split(',').map(t => t.trim());
        } 
        // 배열인 경우
        else if (Array.isArray(cache.frontmatter.tags)) {
          frontmatterTags = cache.frontmatter.tags;
        }
        // 기타 타입인 경우 문자열로 변환
        else {
          frontmatterTags = [String(cache.frontmatter.tags)];
        }
        
        for (const tag of frontmatterTags) {
          // 프론트매터 태그는 # 없을 수 있으므로 정규화
          const normalizedTag = tag.startsWith('#') ? tag : `#${tag}`;
          if (!tags.includes(normalizedTag)) {
            tags.push(normalizedTag);
            console.log(`[TagMode] 파일 ${file.path}에서 프론트매터 tags 추가: ${normalizedTag}`);
          }
        }
      }
      
      // tag 속성 처리 (단수형)
      if (cache.frontmatter.tag) {
        let frontmatterTags: string[] = [];
        
        // 문자열인 경우 쉼표로 구분된 목록일 수 있음
        if (typeof cache.frontmatter.tag === 'string') {
          frontmatterTags = cache.frontmatter.tag.split(',').map(t => t.trim());
        } 
        // 배열인 경우
        else if (Array.isArray(cache.frontmatter.tag)) {
          frontmatterTags = cache.frontmatter.tag;
        }
        // 기타 타입인 경우 문자열로 변환
        else {
          frontmatterTags = [String(cache.frontmatter.tag)];
        }
        
        for (const tag of frontmatterTags) {
          // 프론트매터 태그는 # 없을 수 있으므로 정규화
          const normalizedTag = tag.startsWith('#') ? tag : `#${tag}`;
          if (!tags.includes(normalizedTag)) {
            tags.push(normalizedTag);
            console.log(`[TagMode] 파일 ${file.path}에서 프론트매터 tag 추가: ${normalizedTag}`);
          }
        }
      }
    }
    
    // 파일 내용에서 직접 태그 추출 (메타데이터 캐시가 불완전한 경우를 대비)
    if (tags.length === 0) {
      try {
        const content = await this.app.vault.read(file);
        if (content) {
          // 정규식으로 태그 추출 (#태그 형식)
          const tagRegex = /#[a-zA-Z가-힣0-9_\-/]+/g;
          const matches = content.match(tagRegex);
          
          if (matches) {
            for (const tag of matches) {
              // 코드 블록 내의 태그는 제외
              const isInCodeBlock = this.isTagInCodeBlock(content, tag);
              if (!isInCodeBlock && !tags.includes(tag)) {
                tags.push(tag);
                console.log(`[TagMode] 파일 ${file.path}에서 직접 추출한 태그 추가: ${tag}`);
              }
            }
          }
        }
      } catch (error) {
        console.error(`[TagMode] 파일 ${file.path}에서 태그 직접 추출 중 오류:`, error);
      }
    }
    
    return tags;
  }
  
  /**
   * 태그가 코드 블록 내에 있는지 확인
   * @param content 파일 내용
   * @param tag 태그
   * @returns 코드 블록 내 여부
   */
  private isTagInCodeBlock(content: string, tag: string): boolean {
    // 태그 위치 찾기
    const tagIndex = content.indexOf(tag);
    if (tagIndex === -1) return false;
    
    // 태그 이전 내용에서 코드 블록 시작 개수 세기
    const contentBeforeTag = content.substring(0, tagIndex);
    const codeBlockStarts = (contentBeforeTag.match(/```/g) || []).length;
    
    // 코드 블록 시작 개수가 짝수면 코드 블록 밖, 홀수면 코드 블록 안
    return codeBlockStarts % 2 === 1;
  }
}
