import { ICard } from '../card/Card';
import { Search, SearchType } from './Search';

/**
 * 내용 검색 클래스
 * 카드를 내용을 기준으로 검색합니다.
 */
export class ContentSearch extends Search {
  constructor(query: string = '', caseSensitive: boolean = false) {
    super('content', query, caseSensitive);
  }

  /**
   * 검색 적용
   * 카드를 내용 기준으로 검색합니다.
   * @param cards 카드 목록
   * @returns 검색된 카드 목록
   */
  apply(cards: ICard[]): ICard[] {
    if (!this.query) {
      return cards;
    }

    return cards.filter(card => {
      const content = card.content || '';
      return this.includes(content, this.query);
    });
  }
} 