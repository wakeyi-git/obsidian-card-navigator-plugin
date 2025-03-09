import { ICard } from '../card/Card';
import { Search } from './Search';
import { App, TFile } from 'obsidian';

/**
 * 태그 검색 클래스
 * 카드의 태그를 기준으로 검색하는 클래스입니다.
 */
export class TagSearch extends Search {
  private app: App;
  
  constructor(app: App, query = '', caseSensitive = false) {
    super('tag', query, caseSensitive);
    this.app = app;
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
   * 파일이 검색 조건과 일치하는지 확인
   * @param file 확인할 파일
   * @returns 일치 여부
   */
  async match(file: TFile): Promise<boolean> {
    if (!this.query) return true;
    
    try {
      // 파일의 캐시된 메타데이터에서 태그 가져오기
      const cache = this.app.metadataCache.getFileCache(file);
      if (!cache || !cache.tags || cache.tags.length === 0) return false;
      
      // 태그 목록에서 검색어와 일치하는 태그 찾기
      return cache.tags.some(tagCache => this.matches(tagCache.tag));
    } catch (error) {
      console.error(`[TagSearch] 파일 태그 검색 오류 (${file.path}):`, error);
      return false;
    }
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