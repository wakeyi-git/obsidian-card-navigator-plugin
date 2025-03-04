import { ICard } from '../card/Card';
import { Search } from './Search';

/**
 * 프론트매터 검색 클래스
 * 카드의 프론트매터를 기준으로 검색하는 클래스입니다.
 */
export class FrontmatterSearch extends Search {
  private frontmatterKey: string;
  
  constructor(query: string = '', frontmatterKey: string = '', caseSensitive: boolean = false) {
    super('frontmatter', query, caseSensitive);
    this.frontmatterKey = frontmatterKey;
  }
  
  /**
   * 프론트매터 키 가져오기
   * @returns 프론트매터 키
   */
  getFrontmatterKey(): string {
    return this.frontmatterKey;
  }
  
  /**
   * 프론트매터 키 설정
   * @param key 프론트매터 키
   */
  setFrontmatterKey(key: string): void {
    this.frontmatterKey = key;
  }
  
  /**
   * 프론트매터 검색 수행
   * @param cards 검색할 카드 목록
   * @returns 검색 결과 카드 목록
   */
  search(cards: ICard[]): ICard[] {
    if (!this.query) return cards;
    
    return cards.filter(card => {
      if (!card.frontmatter) return false;
      
      // 특정 프론트매터 키가 지정된 경우
      if (this.frontmatterKey) {
        const value = card.frontmatter[this.frontmatterKey];
        if (value === undefined) return false;
        
        // 값이 배열인 경우
        if (Array.isArray(value)) {
          return value.some(item => 
            typeof item === 'string' && this.matches(item)
          );
        }
        
        // 값이 문자열인 경우
        if (typeof value === 'string') {
          return this.matches(value);
        }
        
        // 값이 숫자인 경우
        if (typeof value === 'number') {
          return this.matches(value.toString());
        }
        
        return false;
      } 
      // 모든 프론트매터 필드에서 검색
      else {
        return Object.entries(card.frontmatter).some(([key, value]) => {
          // 값이 배열인 경우
          if (Array.isArray(value)) {
            return value.some(item => 
              typeof item === 'string' && this.matches(item)
            );
          }
          
          // 값이 문자열인 경우
          if (typeof value === 'string') {
            return this.matches(value);
          }
          
          // 값이 숫자인 경우
          if (typeof value === 'number') {
            return this.matches(value.toString());
          }
          
          return false;
        });
      }
    });
  }
  
  /**
   * 프론트매터 검색 객체 직렬화
   * @returns 직렬화된 검색 객체
   */
  serialize(): any {
    return {
      ...super.serialize(),
      frontmatterKey: this.frontmatterKey
    };
  }
} 