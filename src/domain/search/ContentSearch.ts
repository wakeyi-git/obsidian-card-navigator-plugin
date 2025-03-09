import { App, TFile } from 'obsidian';
import { ICard } from '../card/Card';
import { Search } from './Search';

/**
 * 내용 검색 클래스
 * 파일 내용을 기준으로 검색합니다.
 */
export class ContentSearch extends Search {
  private app: App;
  
  constructor(app: App, query = '', caseSensitive = false) {
    super('content', query, caseSensitive);
    this.app = app;
  }
  
  /**
   * 검색 수행
   * @param cards 검색할 카드 목록
   * @returns 검색 결과 카드 목록
   */
  search(cards: ICard[]): ICard[] {
    if (!this.query) return cards;
    
    return cards.filter(card => {
      const content = card.content || '';
      return this.matches(content);
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
      const content = await this.app.vault.read(file);
      return this.matches(content);
    } catch (error) {
      console.error(`[ContentSearch] 파일 읽기 오류 (${file.path}):`, error);
      return false;
    }
  }
  
  /**
   * 내용 검색 객체 직렬화
   * @returns 직렬화된 검색 객체
   */
  serialize(): any {
    return {
      ...super.serialize()
    };
  }
} 