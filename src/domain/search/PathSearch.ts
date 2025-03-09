import { ICard } from '../card/Card';
import { Search, SearchType } from './Search';
import { App, TFile } from 'obsidian';

/**
 * 경로 검색 클래스
 * 카드의 경로를 기준으로 검색하는 클래스입니다.
 */
export class PathSearch extends Search {
  private app: App;
  
  constructor(app: App, query = '', caseSensitive = false) {
    super('path', query, caseSensitive);
    this.app = app;
  }
  
  /**
   * 경로 검색 수행
   * @param cards 검색할 카드 목록
   * @returns 검색 결과 카드 목록
   */
  async search(cards: ICard[]): Promise<ICard[]> {
    if (!this.query) return cards;
    
    const results: ICard[] = [];
    for (const card of cards) {
      if (await this.match(card)) {
        results.push(card);
      }
    }
    return results;
  }
  
  /**
   * 카드가 검색 조건과 일치하는지 확인
   * @param card 확인할 카드
   * @returns 일치 여부
   */
  async match(card: ICard): Promise<boolean> {
    if (!this.query) return true;
    
    try {
      // 카드 경로 확인
      if (card.path) {
        return this.matches(card.path);
      }
      
      // 카드에 file 속성이 있고 TFile 인스턴스인 경우 파일 경로 확인
      if (card.file && card.file instanceof TFile) {
        return this.matches(card.file.path);
      }
      
      return false;
    } catch (error) {
      console.error(`[PathSearch] 카드 경로 검색 오류:`, error);
      return false;
    }
  }
  
  /**
   * 경로 검색 객체 직렬화
   * @returns 직렬화된 검색 객체
   */
  serialize(): any {
    return {
      ...super.serialize()
    };
  }
} 