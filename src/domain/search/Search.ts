import { ICard } from '../card/Card';

/**
 * 검색 타입 정의
 */
export type SearchType = 'filename' | 'content' | 'tag' | 'frontmatter';

/**
 * 검색 인터페이스
 * 카드를 검색하기 위한 인터페이스입니다.
 */
export interface ISearch {
  /**
   * 검색 타입
   */
  type: SearchType;
  
  /**
   * 검색어
   */
  query: string;
  
  /**
   * 프론트매터 키 (frontmatter 타입인 경우)
   */
  frontmatterKey?: string;
  
  /**
   * 대소문자 구분 여부
   */
  caseSensitive: boolean;
  
  /**
   * 검색 적용
   * 주어진 카드 목록에 검색을 적용합니다.
   * @param cards 카드 목록
   * @returns 검색된 카드 목록
   */
  apply(cards: ICard[]): ICard[];
  
  /**
   * 검색어 설정
   * @param query 검색어
   */
  setQuery(query: string): void;
  
  /**
   * 대소문자 구분 설정
   * @param caseSensitive 대소문자 구분 여부
   */
  setCaseSensitive(caseSensitive: boolean): void;
}

/**
 * 검색 추상 클래스
 * 검색 인터페이스를 구현하는 추상 클래스입니다.
 */
export abstract class Search implements ISearch {
  type: SearchType;
  query: string;
  frontmatterKey?: string;
  caseSensitive: boolean;
  
  constructor(
    type: SearchType,
    query: string = '',
    caseSensitive: boolean = false,
    frontmatterKey?: string
  ) {
    this.type = type;
    this.query = query;
    this.caseSensitive = caseSensitive;
    this.frontmatterKey = frontmatterKey;
  }
  
  abstract apply(cards: ICard[]): ICard[];
  
  setQuery(query: string): void {
    this.query = query;
  }
  
  setCaseSensitive(caseSensitive: boolean): void {
    this.caseSensitive = caseSensitive;
  }
  
  /**
   * 문자열 포함 여부 확인
   * 대소문자 구분 설정에 따라 문자열 포함 여부를 확인합니다.
   * @param text 검색 대상 문자열
   * @param searchTerm 검색어
   * @returns 포함 여부
   */
  protected includes(text: string, searchTerm: string): boolean {
    if (!text || !searchTerm) return false;
    
    if (this.caseSensitive) {
      return text.includes(searchTerm);
    } else {
      return text.toLowerCase().includes(searchTerm.toLowerCase());
    }
  }
} 