import { Card } from './Card';
import { CardSet } from './CardSet';

/**
 * 검색 옵션
 */
export interface ISearchOptions {
  /**
   * 검색 범위
   */
  scope: 'vault' | 'current';
  
  /**
   * 검색 필드
   */
  fields: {
    title: boolean;
    content: boolean;
    tags: boolean;
    path: boolean;
  };
  
  /**
   * 대소문자 구분
   */
  caseSensitive: boolean;
  
  /**
   * 정규식 사용
   */
  useRegex: boolean;
  
  /**
   * 전체 단어 일치
   */
  wholeWord: boolean;
}

/**
 * 검색 결과
 */
export interface ISearchResult {
  /**
   * 검색된 카드 목록
   */
  cards: Card[];
  
  /**
   * 검색된 카드셋
   */
  cardSet: CardSet;
  
  /**
   * 검색어
   */
  query: string;
  
  /**
   * 검색 옵션
   */
  options: ISearchOptions;
} 