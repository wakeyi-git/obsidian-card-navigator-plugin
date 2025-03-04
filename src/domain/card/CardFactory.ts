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
    if (frontmatter && frontmatter.tags) {
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
    
    // 파일 캐시에서 태그 추출 (옵시디언 내부 태그)
    if (file.tags && Array.isArray(file.tags)) {
      file.tags.forEach((tag: string) => {
        // '#' 제거하고 추가
        const tagName = tag.startsWith('#') ? tag.substring(1) : tag;
        if (!tags.includes(tagName)) {
          tags.push(tagName);
        }
      });
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