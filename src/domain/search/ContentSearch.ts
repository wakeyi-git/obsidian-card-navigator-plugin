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
      // 카드의 내용이 이미 있는 경우 사용
      if (card.content) {
        return this.matches(card.content);
      }
      
      // 카드에 file 속성이 있고 TFile 인스턴스인 경우 파일 내용 읽기
      if (card.file && card.file instanceof TFile) {
        const content = await this.app.vault.read(card.file);
        return this.matches(content);
      }
      
      return false;
    } catch (error) {
      console.error(`[ContentSearch] 카드 내용 읽기 오류:`, error);
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