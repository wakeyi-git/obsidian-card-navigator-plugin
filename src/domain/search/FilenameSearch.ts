import { App, TFile } from 'obsidian';
import { ICard } from '../card/Card';
import { Search } from './Search';

/**
 * 파일명 검색 클래스
 * 파일명을 기준으로 카드를 검색하는 클래스입니다.
 */
export class FilenameSearch extends Search {
  private app: App;
  
  constructor(app: App, query = '', caseSensitive = false) {
    super('filename', query, caseSensitive);
    this.app = app;
  }
  
  /**
   * 파일명 검색 수행
   * @param cards 검색할 카드 목록
   * @returns 검색 결과 카드 목록
   */
  search(cards: ICard[]): ICard[] {
    if (!this.query) return cards;
    
    return cards.filter(card => {
      // 파일 경로에서 basename 추출 (확장자 제외한 파일명)
      const pathParts = card.path.split('/');
      const filenameWithExt = pathParts[pathParts.length - 1];
      const basename = filenameWithExt.replace(/\.[^/.]+$/, ''); // 확장자 제거
      
      return this.matches(basename);
    });
  }
  
  /**
   * 파일이 검색 조건과 일치하는지 확인
   * @param file 확인할 파일
   * @returns 일치 여부
   */
  async match(file: TFile): Promise<boolean> {
    if (!this.query) return true;
    
    const filename = file.basename;
    return this.matches(filename);
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