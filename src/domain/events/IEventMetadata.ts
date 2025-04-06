/**
 * 이벤트 메타데이터 컨텍스트 타입
 */
export type EventMetadataContext = {
  timestamp?: number;
  duration?: number;
  count?: number;
  status?: string;
  message?: string;
  details?: string;
  [key: string]: unknown;
};

/**
 * 이벤트 메타데이터 인터페이스
 */
export interface IEventMetadata {
  /**
   * 이벤트 소스
   */
  source?: string;

  /**
   * 이벤트 대상
   */
  target?: string;

  /**
   * 추가 컨텍스트 정보
   */
  context?: EventMetadataContext;

  /**
   * 에러 정보
   */
  error?: Error;
} 