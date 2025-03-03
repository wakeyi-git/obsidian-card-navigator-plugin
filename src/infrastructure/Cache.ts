/**
 * 캐시 인터페이스
 * 데이터 캐싱을 위한 인터페이스입니다.
 */
export interface ICache<T> {
  /**
   * 캐시에서 데이터 가져오기
   * @param key 캐시 키
   * @returns 캐시된 데이터 또는 undefined
   */
  get(key: string): T | undefined;
  
  /**
   * 캐시에 데이터 저장
   * @param key 캐시 키
   * @param value 저장할 데이터
   * @param ttl 유효 시간(밀리초), 기본값은 무제한
   */
  set(key: string, value: T, ttl?: number): void;
  
  /**
   * 캐시에서 데이터 삭제
   * @param key 캐시 키
   * @returns 삭제 성공 여부
   */
  delete(key: string): boolean;
  
  /**
   * 캐시 초기화
   */
  clear(): void;
  
  /**
   * 캐시 크기 가져오기
   * @returns 캐시 크기
   */
  size(): number;
  
  /**
   * 캐시 키 목록 가져오기
   * @returns 캐시 키 목록
   */
  keys(): string[];
}

/**
 * 캐시 항목 인터페이스
 */
interface CacheItem<T> {
  value: T;
  expiry?: number;
}

/**
 * 캐시 클래스
 * 데이터 캐싱을 위한 클래스입니다.
 */
export class Cache<T> implements ICache<T> {
  private cache: Map<string, CacheItem<T>>;
  private defaultTTL: number | undefined;
  
  constructor(defaultTTL?: number) {
    this.cache = new Map<string, CacheItem<T>>();
    this.defaultTTL = defaultTTL;
  }
  
  get(key: string): T | undefined {
    const item = this.cache.get(key);
    
    if (!item) {
      return undefined;
    }
    
    // 만료 시간 확인
    if (item.expiry && item.expiry < Date.now()) {
      this.delete(key);
      return undefined;
    }
    
    return item.value;
  }
  
  set(key: string, value: T, ttl?: number): void {
    const expiry = ttl || this.defaultTTL
      ? Date.now() + (ttl || this.defaultTTL || 0)
      : undefined;
      
    this.cache.set(key, { value, expiry });
  }
  
  delete(key: string): boolean {
    return this.cache.delete(key);
  }
  
  clear(): void {
    this.cache.clear();
  }
  
  size(): number {
    return this.cache.size;
  }
  
  keys(): string[] {
    return Array.from(this.cache.keys());
  }
  
  /**
   * 만료된 항목 정리
   */
  cleanup(): void {
    const now = Date.now();
    
    for (const [key, item] of this.cache.entries()) {
      if (item.expiry && item.expiry < now) {
        this.cache.delete(key);
      }
    }
  }
  
  /**
   * 캐시 내용 가져오기
   * @returns 캐시 내용
   */
  getAll(): Map<string, T> {
    const result = new Map<string, T>();
    
    for (const [key, item] of this.cache.entries()) {
      // 만료 시간 확인
      if (item.expiry && item.expiry < Date.now()) {
        this.cache.delete(key);
        continue;
      }
      
      result.set(key, item.value);
    }
    
    return result;
  }
  
  /**
   * 캐시 항목 존재 여부 확인
   * @param key 캐시 키
   * @returns 존재 여부
   */
  has(key: string): boolean {
    const item = this.cache.get(key);
    
    if (!item) {
      return false;
    }
    
    // 만료 시간 확인
    if (item.expiry && item.expiry < Date.now()) {
      this.delete(key);
      return false;
    }
    
    return true;
  }
} 