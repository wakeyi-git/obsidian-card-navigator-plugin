import { Card, ICard } from './Card';

/**
 * 카드 팩토리 인터페이스
 * 카드 객체를 생성하기 위한 인터페이스입니다.
 */
export interface ICardFactory {
  /**
   * 카드 생성
   * @param id 카드 ID
   * @param title 카드 제목
   * @param content 카드 내용
   * @param tags 카드 태그 목록
   * @param path 카드 경로
   * @param created 생성일
   * @param modified 수정일
   * @param frontmatter 프론트매터 데이터
   * @returns 생성된 카드
   */
  createCard(
    id: string,
    title: string,
    content: string,
    tags: string[],
    path: string,
    created: number,
    modified: number,
    frontmatter?: Record<string, any>
  ): ICard;
  
  /**
   * 옵시디언 파일에서 카드 생성
   * @param file 옵시디언 파일
   * @param content 파일 내용
   * @param frontmatter 프론트매터 데이터
   * @returns 생성된 카드
   */
  createFromFile(
    file: any,
    content: string,
    frontmatter?: Record<string, any>
  ): ICard;
}

/**
 * 카드 팩토리 클래스
 * 카드 객체를 생성하는 클래스입니다.
 */
export class CardFactory implements ICardFactory {
  createCard(
    id: string,
    title: string,
    content: string,
    tags: string[] = [],
    path: string,
    created: number,
    modified: number,
    frontmatter?: Record<string, any>
  ): ICard {
    return new Card(
      id,
      title,
      content,
      tags,
      path,
      created,
      modified,
      frontmatter
    );
  }
  
  createFromFile(
    file: any,
    content: string,
    frontmatter?: Record<string, any>
  ): ICard {
    // 파일 경로에서 파일 이름 추출
    const filename = file.basename || '';
    
    // 태그 추출 (프론트매터에서 태그 가져오기)
    const tags: string[] = [];
    if (frontmatter) {
      // 'tags' 속성 처리 (복수형)
      if (frontmatter.tags) {
        if (Array.isArray(frontmatter.tags)) {
          // 배열인 경우 각 태그 추가
          frontmatter.tags.forEach((tag: string) => {
            // # 포함 여부 확인하여 정규화
            const normalizedTag = tag.startsWith('#') ? tag.substring(1) : tag;
            if (!tags.includes(normalizedTag)) {
              tags.push(normalizedTag);
            }
          });
        } else if (typeof frontmatter.tags === 'string') {
          // 문자열인 경우 단일 태그 추가
          const normalizedTag = frontmatter.tags.startsWith('#') 
            ? frontmatter.tags.substring(1) 
            : frontmatter.tags;
          tags.push(normalizedTag);
        }
      }
      
      // 'tag' 속성 처리 (단수형)
      if (frontmatter.tag) {
        if (Array.isArray(frontmatter.tag)) {
          // 배열인 경우 각 태그 추가
          frontmatter.tag.forEach((tag: string) => {
            // # 포함 여부 확인하여 정규화
            const normalizedTag = tag.startsWith('#') ? tag.substring(1) : tag;
            if (!tags.includes(normalizedTag)) {
              tags.push(normalizedTag);
            }
          });
        } else if (typeof frontmatter.tag === 'string') {
          // 문자열인 경우 단일 태그 추가
          const normalizedTag = frontmatter.tag.startsWith('#') 
            ? frontmatter.tag.substring(1) 
            : frontmatter.tag;
          if (!tags.includes(normalizedTag)) {
            tags.push(normalizedTag);
          }
        }
      }
    }
    
    // 파일 캐시에서 태그 추출 (옵시디언 내부 태그)
    if (file.cache && file.cache.tags && Array.isArray(file.cache.tags)) {
      file.cache.tags.forEach((tagObj: any) => {
        // '#' 제거하고 추가
        const tagName = tagObj.tag.startsWith('#') ? tagObj.tag.substring(1) : tagObj.tag;
        if (!tags.includes(tagName)) {
          tags.push(tagName);
          console.log(`[CardFactory] 파일 캐시에서 인라인 태그 추가: ${tagName}`);
        }
      });
    }
    
    // 파일 메타데이터 캐시에서 태그 추출 (인라인 태그)
    if (file.app && file.path) {
      try {
        const metadataCache = file.app.metadataCache;
        const fileCache = metadataCache.getFileCache(file);
        
        if (fileCache) {
          // 인라인 태그 추출
          if (fileCache.tags && Array.isArray(fileCache.tags)) {
            fileCache.tags.forEach((tagObj: any) => {
              const tagName = tagObj.tag.startsWith('#') ? tagObj.tag.substring(1) : tagObj.tag;
              if (!tags.includes(tagName)) {
                tags.push(tagName);
                console.log(`[CardFactory] 메타데이터 캐시에서 인라인 태그 추가: ${tagName}`);
              }
            });
          }
          
          // 블록 태그 추출
          if (fileCache.blocks) {
            for (const blockId in fileCache.blocks) {
              const block = fileCache.blocks[blockId];
              // @ts-ignore - Obsidian API에서 BlockCache에 tags 속성이 있지만 타입 정의에 없음
              if (block.tags && Array.isArray(block.tags)) {
                // @ts-ignore
                block.tags.forEach((tag: string) => {
                  const tagName = tag.startsWith('#') ? tag.substring(1) : tag;
                  if (!tags.includes(tagName)) {
                    tags.push(tagName);
                    console.log(`[CardFactory] 블록에서 태그 추가: ${tagName}`);
                  }
                });
              }
            }
          }
        }
      } catch (error) {
        console.error('[CardFactory] 메타데이터 캐시에서 태그 추출 중 오류:', error);
      }
    }
    
    // 파일 내용에서 직접 태그 추출 (정규식 사용)
    if (content) {
      const tagRegex = /#[a-zA-Z가-힣0-9_\-/]+/g;
      const matches = content.match(tagRegex);
      
      if (matches) {
        matches.forEach(tag => {
          // '#' 제거하고 추가
          const tagName = tag.substring(1);
          if (!tags.includes(tagName)) {
            tags.push(tagName);
            console.log(`[CardFactory] 파일 내용에서 직접 태그 추출: ${tagName}`);
          }
        });
      }
    }
    
    if (tags.length > 0) {
      console.log(`[CardFactory] 파일 ${file.path}에서 추출된 총 태그 수: ${tags.length}, 태그 목록: ${tags.join(', ')}`);
    }
    
    return this.createCard(
      file.path,
      filename,
      content,
      tags,
      file.path,
      file.stat?.ctime || Date.now(),
      file.stat?.mtime || Date.now(),
      frontmatter
    );
  }
} 