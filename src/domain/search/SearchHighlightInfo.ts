import { SearchType } from './Search';

/**
 * 검색 강조 정보 인터페이스
 * 검색 결과에서 강조할 텍스트와 위치 정보를 정의합니다.
 */
export interface ISearchHighlightInfo {
  /**
   * 검색어
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
   * 강조할 텍스트
   */
  text: string;
  
  /**
   * 강조할 위치 (인덱스)
   */
  positions: number[];
  
  /**
   * 매치 정보 목록
   */
  matches: Array<{
    text: string;
    position: number;
    length: number;
  }>;
} 