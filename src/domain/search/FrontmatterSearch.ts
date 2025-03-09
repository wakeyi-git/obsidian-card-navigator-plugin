import { ICard } from '../card/Card';
import { Search } from './Search';
import { App, TFile } from 'obsidian';

/**
 * 프론트매터 검색 클래스
 * 카드의 프론트매터를 기준으로 검색하는 클래스입니다.
 */
export class FrontmatterSearch extends Search {
  private frontmatterKey: string;
  private app: App;
  
  constructor(app: App, query = '', caseSensitive = false, frontmatterKey = '') {
    super('frontmatter', query, caseSensitive);
    this.frontmatterKey = frontmatterKey;
    this.app = app;
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
  
  /**
   * 파일이 검색 조건과 일치하는지 확인
   * @param file 확인할 파일
   * @returns 일치 여부
   */
  async match(file: TFile): Promise<boolean> {
    if (!this.query) return true;
    
    try {
      // 파일의 캐시된 메타데이터에서 프론트매터 가져오기
      const cache = this.app.metadataCache.getFileCache(file);
      if (!cache || !cache.frontmatter) return false;
      
      // 특정 프론트매터 키가 지정된 경우
      if (this.frontmatterKey) {
        const value = cache.frontmatter[this.frontmatterKey];
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
        
        // 값이 불리언인 경우
        if (typeof value === 'boolean') {
          return this.matches(value.toString());
        }
        
        return false;
      }
      
      // 모든 프론트매터 키-값 쌍에서 검색
      for (const key in cache.frontmatter) {
        const value = cache.frontmatter[key];
        
        // 값이 배열인 경우
        if (Array.isArray(value)) {
          if (value.some(item => typeof item === 'string' && this.matches(item))) {
            return true;
          }
          continue;
        }
        
        // 값이 문자열인 경우
        if (typeof value === 'string' && this.matches(value)) {
          return true;
        }
        
        // 값이 숫자인 경우
        if (typeof value === 'number' && this.matches(value.toString())) {
          return true;
        }
        
        // 값이 불리언인 경우
        if (typeof value === 'boolean' && this.matches(value.toString())) {
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error(`[FrontmatterSearch] 파일 프론트매터 검색 오류 (${file.path}):`, error);
      return false;
    }
  }
} 