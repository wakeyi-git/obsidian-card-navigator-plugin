import { ICard } from '../card/Card';
import { Search } from './Search';

/**
 * 파일명 검색 클래스
 * 파일명을 기준으로 카드를 검색하는 클래스입니다.
 */
export class FilenameSearch extends Search {
  constructor(query = '', caseSensitive = false) {
    super('filename', query, caseSensitive);
  }
  
  /**
   * 파일명 검색 수행
   * @param cards 검색할 카드 목록
   * @returns 검색 결과 카드 목록
   */
  search(cards: ICard[]): ICard[] {
    if (!this.query) return cards;
    
    return cards.filter(card => {
      if (!card.title) return false;
      return this.matches(card.title);
    });
  }
  
  /**
   * 파일명 검색 객체 직렬화
   * @returns 직렬화된 검색 객체
   */
  serialize(): any {
    return {
      ...super.serialize()
    };
  }
} 