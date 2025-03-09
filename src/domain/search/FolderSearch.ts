import { ICard } from '../card/Card';
import { Search } from './Search';
import { App, TFile } from 'obsidian';

/**
 * 폴더 검색 클래스
 * 카드의 폴더 경로를 기준으로 검색하는 클래스입니다.
 */
export class FolderSearch extends Search {
  private app: App;
  
  constructor(app: App, query = '', caseSensitive = false) {
    super('folder', query, caseSensitive);
    this.app = app;
  }
  
  /**
   * 폴더 검색 수행
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
      // 카드 경로에서 폴더 부분만 추출
      if (card.path) {
        const folderPath = card.path.substring(0, card.path.lastIndexOf('/'));
        return this.matches(folderPath);
      }
      
      // 카드에 file 속성이 있고 TFile 인스턴스인 경우 파일 경로에서 폴더 추출
      if (card.file && card.file instanceof TFile) {
        const folderPath = card.file.path.substring(0, card.file.path.lastIndexOf('/'));
        return this.matches(folderPath);
      }
      
      return false;
    } catch (error) {
      console.error(`[FolderSearch] 카드 폴더 검색 오류:`, error);
      return false;
    }
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