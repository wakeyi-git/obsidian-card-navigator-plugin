import { ICard } from '../card/Card';
import { TFile } from 'obsidian';
import { ModeType, CardSetType } from '../mode/Mode';

/**
 * 검색 타입
 * 검색 대상을 정의합니다.
 */
export type SearchType = 'filename' | 'content' | 'tag' | 'path' | 'frontmatter' | 'create' | 'modify' | 'regex' | 'folder';

/**
 * 검색 범위 타입
 * 검색 범위를 정의합니다.
 */
export type SearchScope = 'all' | 'current';

/**
 * 검색 모드 상태 인터페이스
 * 검색 모드의 상태를 정의합니다.
 */
export interface ISearchModeState {
  /**
   * 검색 쿼리
   */
  query: string;
  
  /**
   * 검색 타입
   */
  searchType: SearchType;
  
  /**
   * 대소문자 구분 여부
   */
  caseSensitive: boolean;
  
  /**
   * 프론트매터 키 (검색 타입이 frontmatter인 경우)
   */
  frontmatterKey?: string;
  
  /**
   * 검색 범위
   */
  searchScope: SearchScope;
  
  /**
   * 검색 모드 전환 전 카드셋
   */
  preSearchCards: ICard[];
  
  /**
   * 검색 모드 전환 전 모드
   */
  previousMode: ModeType;
  
  /**
   * 검색 모드 전환 전 카드 세트
   */
  previousCardSet: string | null;
  
  /**
   * 검색 모드 전환 전 카드 세트 타입
   */
  previousCardSetType: CardSetType;
}

/**
 * 검색 인터페이스
 * 모든 검색 구현체가 구현해야 하는 인터페이스입니다.
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
   * 파일이 검색 조건과 일치하는지 확인
   * @param file 확인할 파일
   * @returns 일치 여부
   */
  match(file: TFile): Promise<boolean>;
  
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
  
  constructor(type: SearchType, query = '', caseSensitive = false) {
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
  
  abstract match(file: TFile): Promise<boolean>;
  
  /**
   * 검색 수행
   * @param cards 검색할 카드 목록
   * @returns 검색 결과 카드 목록
   */
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
    if (!this.query) {
      // 검색어가 비어있는 경우 모든 항목 매칭 (기존 동작 유지)
      return true;
    }
    
    if (this.caseSensitive) {
      return text.includes(this.query);
    } else {
      return text.toLowerCase().includes(this.query.toLowerCase());
    }
  }
} 