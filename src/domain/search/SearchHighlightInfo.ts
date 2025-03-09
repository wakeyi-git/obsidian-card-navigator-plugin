/**
 * 검색 강조 정보 인터페이스
 * 검색 결과에서 강조할 텍스트와 위치 정보를 정의합니다.
 */
export interface ISearchHighlightInfo {
  /**
   * 강조할 텍스트
   */
  text: string;
  
  /**
   * 강조할 위치 (인덱스)
   */
  positions: number[];
} 