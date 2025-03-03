import { ICard } from '../card/Card';
import { Search, SearchType } from './Search';

/**
 * 태그 검색 클래스
 * 카드를 태그를 기준으로 검색합니다.
 */
export class TagSearch extends Search {
  constructor(query: string = '', caseSensitive: boolean = false) {
    super('tag', query, caseSensitive);
  }

  /**
   * 검색 적용
   * 카드를 태그 기준으로 검색합니다.
   * @param cards 카드 목록
   * @returns 검색된 카드 목록
   */
  apply(cards: ICard[]): ICard[] {
    if (!this.query) {
      return cards;
    }

    return cards.filter(card => {
      const tags = card.tags || [];
      
      // 태그 배열에서 검색어를 포함하는 태그가 있는지 확인
      return tags.some(tag => this.includes(tag, this.query));
    });
  }
} 