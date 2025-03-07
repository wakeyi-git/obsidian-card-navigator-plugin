import { ICard } from '../card/Card';

/**
 * 검색 타입 열거형
 */
export type SearchType = 'filename' | 'content' | 'tag' | 'frontmatter' | 'folder' | 'path' | 'create' | 'modify';

/**
 * 검색 인터페이스
 * 검색 기능을 정의하는 인터페이스입니다.
 */
export interface ISearch {
  /**
   * 검색 타입 가져오기
   * @returns 검색 타입
   */
  getType(): SearchType;
  
  /**
   * 검색어 가져오기
   * @returns 검색어
   */
  getQuery(): string;
  
  /**
   * 검색어 설정
   * @param query 검색어
   */
  setQuery(query: string): void;
  
  /**
   * 대소문자 구분 여부 가져오기
   * @returns 대소문자 구분 여부
   */
  isCaseSensitive(): boolean;
  
  /**
   * 대소문자 구분 여부 설정
   * @param caseSensitive 대소문자 구분 여부
   */
  setCaseSensitive(caseSensitive: boolean): void;
  
  /**
   * 검색 수행
   * @param cards 검색할 카드 목록
   * @returns 검색 결과 카드 목록
   */
  search(cards: ICard[]): ICard[];
  
  /**
   * 검색 객체 직렬화
   * @returns 직렬화된 검색 객체
   */
  serialize(): any;
}

/**
 * 기본 검색 추상 클래스
 * 검색 기능의 기본 구현을 제공하는 추상 클래스입니다.
 */
export abstract class Search implements ISearch {
  protected query: string;
  protected caseSensitive: boolean;
  protected type: SearchType;
  
  constructor(type: SearchType, query: string = '', caseSensitive: boolean = false) {
    this.type = type;
    this.query = query;
    this.caseSensitive = caseSensitive;
  }
  
  getType(): SearchType {
    return this.type;
  }
  
  getQuery(): string {
    return this.query;
  }
  
  setQuery(query: string): void {
    this.query = query;
  }
  
  isCaseSensitive(): boolean {
    return this.caseSensitive;
  }
  
  setCaseSensitive(caseSensitive: boolean): void {
    this.caseSensitive = caseSensitive;
  }
  
  abstract search(cards: ICard[]): ICard[];
  
  serialize(): any {
    return {
      type: this.type,
      query: this.query,
      caseSensitive: this.caseSensitive
    };
  }
  
  /**
   * 검색어 매칭 여부 확인
   * @param text 검색 대상 텍스트
   * @returns 매칭 여부
   */
  protected matches(text: string): boolean {
    if (!this.query) return true;
    
    if (this.caseSensitive) {
      return text.includes(this.query);
    } else {
      return text.toLowerCase().includes(this.query.toLowerCase());
    }
  }
} 