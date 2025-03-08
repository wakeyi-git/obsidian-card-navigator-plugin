import { ICard } from '../card/Card';
import { Search, SearchType } from './Search';

/**
 * 경로 검색 클래스
 * 카드의 경로를 기준으로 검색하는 클래스입니다.
 */
export class PathSearch extends Search {
  constructor(query = '', caseSensitive = false) {
    super('path', query, caseSensitive);
  }
  
  /**
   * 경로 검색 수행
   * @param cards 검색할 카드 목록
   * @returns 검색 결과 카드 목록
   */
  search(cards: ICard[]): ICard[] {
    if (!this.query) return cards;
    
    return cards.filter(card => {
      if (!card.path) return false;
      
      return this.matches(card.path);
    });
  }
  
  /**
   * 검색 객체 직렬화
   * @returns 직렬화된 검색 객체
   */
  serialize(): any {
    return {
      ...super.serialize(),
      type: 'path'
    };
  }
} 