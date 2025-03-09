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
  search(cards: ICard[]): ICard[] {
    if (!this.query) return cards;
    
    return cards.filter(card => {
      return this.matches(card.path);
    });
  }
  
  /**
   * 파일이 검색 조건과 일치하는지 확인
   * @param file 확인할 파일
   * @returns 일치 여부
   */
  async match(file: TFile): Promise<boolean> {
    if (!this.query) return true;
    
    return this.matches(file.path);
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