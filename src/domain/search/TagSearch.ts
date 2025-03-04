import { ICard } from '../card/Card';
import { Search } from './Search';

/**
 * 태그 검색 클래스
 * 카드의 태그를 기준으로 검색하는 클래스입니다.
 */
export class TagSearch extends Search {
  constructor(query: string = '', caseSensitive: boolean = false) {
    super('tag', query, caseSensitive);
  }
  
  /**
   * 태그 검색 수행
   * @param cards 검색할 카드 목록
   * @returns 검색 결과 카드 목록
   */
  search(cards: ICard[]): ICard[] {
    if (!this.query) return cards;
    
    return cards.filter(card => {
      if (!card.tags || card.tags.length === 0) return false;
      
      return card.tags.some(tag => this.matches(tag));
    });
  }
  
  /**
   * 태그 검색 객체 직렬화
   * @returns 직렬화된 검색 객체
   */
  serialize(): any {
    return {
      ...super.serialize()
    };
  }
} 