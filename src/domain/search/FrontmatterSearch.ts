import { ICard } from '../card/Card';
import { Search, SearchType } from './Search';

/**
 * 프론트매터 검색 클래스
 * 카드를 프론트매터 값을 기준으로 검색합니다.
 */
export class FrontmatterSearch extends Search {
  constructor(
    query: string = '',
    frontmatterKey: string = '',
    caseSensitive: boolean = false
  ) {
    super('frontmatter', query, caseSensitive, frontmatterKey);
  }

  /**
   * 검색 적용
   * 카드를 프론트매터 값 기준으로 검색합니다.
   * @param cards 카드 목록
   * @returns 검색된 카드 목록
   */
  apply(cards: ICard[]): ICard[] {
    if (!this.query || !this.frontmatterKey) {
      return cards;
    }

    return cards.filter(card => {
      const frontmatter = card.frontmatter || {};
      const value = frontmatter[this.frontmatterKey || ''];
      
      if (value === undefined || value === null) {
        return false;
      }
      
      // 값이 배열인 경우
      if (Array.isArray(value)) {
        return value.some(item => 
          this.includes(String(item), this.query)
        );
      }
      
      // 값이 문자열이나 다른 타입인 경우
      return this.includes(String(value), this.query);
    });
  }

  /**
   * 프론트매터 키 설정
   * @param key 프론트매터 키
   */
  setFrontmatterKey(key: string): void {
    this.frontmatterKey = key;
  }

  /**
   * 프론트매터 키 가져오기
   * @returns 프론트매터 키
   */
  getFrontmatterKey(): string | undefined {
    return this.frontmatterKey;
  }
} 