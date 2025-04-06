/**
 * 검색 기준 인터페이스
 */
export interface ISearchCriteria {
  /** 대소문자 구분 여부 */
  readonly caseSensitive: boolean;
  /** 퍼지 검색 여부 */
  readonly fuzzy: boolean;
  /** 정규식 사용 여부 */
  readonly regex: boolean;
  /** 실시간 검색 여부 */
  readonly realtimeSearch: boolean;
  /** 검색 결과 제한 */
  readonly resultLimit: number;
} 