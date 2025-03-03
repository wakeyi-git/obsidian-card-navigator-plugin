import { ICard } from '../card/Card';
import { Search } from './Search';

/**
 * 파일명 검색 클래스
 * 카드의 파일명을 기준으로 검색합니다.
 */
export class FilenameSearch extends Search {
  constructor(query: string = '', caseSensitive: boolean = false) {
    super('filename', query, caseSensitive);
  }

  /**
   * 검색 적용
   * 카드의 파일명을 기준으로 검색합니다.
   * @param cards 카드 목록
   * @returns 검색된 카드 목록
   */
  apply(cards: ICard[]): ICard[] {
    if (!this.query) {
      return [...cards];
    }

    return cards.filter(card => {
      const title = card.title || '';
      
      if (this.caseSensitive) {
        return title.includes(this.query);
      } else {
        return title.toLowerCase().includes(this.query.toLowerCase());
      }
    });
  }
} 