import { ICard } from '../card/Card';
import { Search } from './Search';

/**
 * 폴더 검색 클래스
 * 카드의 폴더 경로를 기준으로 검색하는 클래스입니다.
 */
export class FolderSearch extends Search {
  constructor(query = '', caseSensitive = false) {
    super('folder', query, caseSensitive);
  }
  
  /**
   * 폴더 검색 수행
   * @param cards 검색할 카드 목록
   * @returns 검색 결과 카드 목록
   */
  search(cards: ICard[]): ICard[] {
    if (!this.query) return cards;
    
    return cards.filter(card => {
      if (!card.path) return false;
      
      // 폴더 경로 추출
      const pathParts = card.path.split('/');
      pathParts.pop(); // 파일명 제거
      const folderPath = pathParts.join('/');
      
      return this.matches(folderPath);
    });
  }
  
  /**
   * 폴더 검색 객체 직렬화
   * @returns 직렬화된 검색 객체
   */
  serialize(): any {
    return {
      ...super.serialize()
    };
  }
} 