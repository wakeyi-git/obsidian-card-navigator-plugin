/**
 * 캐시 서비스 인터페이스
 */
export interface ICacheService {
  /**
   * 캐시 초기화
   */
  initialize(): void;

  /**
   * 캐시 정리
   */
  cleanup(): void;

  /**
   * 캐시 데이터 가져오기
   * @param key 캐시 키
   */
  get<T>(key: string): T | null;

  /**
   * 캐시 데이터 저장
   * @param key 캐시 키
   * @param value 캐시 값
   */
  set<T>(key: string, value: T): void;

  /**
   * 캐시 데이터 삭제
   * @param key 캐시 키
   */
  delete(key: string): void;

  /**
   * 캐시 데이터 초기화
   */
  clear(): void;

  /**
   * 캐시 데이터 존재 여부 확인
   * @param key 캐시 키
   */
  has(key: string): boolean;
} 