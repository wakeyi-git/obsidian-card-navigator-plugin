import { LoggingService } from '@/infrastructure/services/LoggingService';
import { ICacheService } from '@/domain/services/ICacheService';
import { DomainEventDispatcher } from '@/domain/events/DomainEventDispatcher';
import { CacheClearedEvent, CacheCleanupEvent } from '@/domain/events/CacheEvents';
import { App } from 'obsidian';

/**
 * 캐시 설정 인터페이스
 */
interface ICacheConfig {
  maxSize: number;
  ttl: number; // Time To Live (밀리초)
}

/**
 * 캐시 항목 인터페이스
 */
interface ICacheItem<T> {
  value: T;
  timestamp: number;
}

/**
 * 캐시 서비스 클래스
 */
export class CacheService implements ICacheService {
  private _cache: Map<string, any> = new Map();
  private _startTime: number;
  private config: ICacheConfig;
  private app: App;
  private eventDispatcher: DomainEventDispatcher;

  constructor(app: App, eventDispatcher: DomainEventDispatcher, private readonly loggingService: LoggingService) {
    this.app = app;
    this.eventDispatcher = eventDispatcher;
    this._startTime = performance.now();
    this.loggingService.debug('CacheService 초기화 시작');
    this.config = {
      maxSize: 1000, // 최대 캐시 항목 수
      ttl: 5 * 60 * 1000 // 5분
    };
  }

  /**
   * 서비스 초기화
   */
  async initialize(): Promise<void> {
    try {
      this.loggingService.debug('CacheService 초기화 시작');
      // 캐시 초기화 로직 구현
      this._cache.clear();
      this.loggingService.debug('CacheService 초기화 완료');
    } catch (error) {
      this.loggingService.error('CacheService 초기화 실패:', error);
      throw error;
    }
  }

  /**
   * 캐시에 키가 존재하는지 확인
   */
  has(key: string): boolean {
    return this._cache.has(key);
  }

  /**
   * 캐시에 데이터 저장
   */
  set(key: string, value: any): void {
    try {
      this.loggingService.debug('캐시 데이터 저장:', { key });
      this._cache.set(key, value);
      this.loggingService.debug('캐시 데이터 저장 완료:', { key });
    } catch (error) {
      this.loggingService.error('캐시 데이터 저장 실패:', error);
      throw error;
    }
  }

  /**
   * 캐시에서 데이터 조회
   */
  get<T>(key: string): T | null {
    try {
      this.loggingService.debug('캐시 데이터 조회:', { key });
      const value = this._cache.get(key);
      this.loggingService.debug('캐시 데이터 조회 완료:', { key });
      return value as T || null;
    } catch (error) {
      this.loggingService.error('캐시 데이터 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 캐시에서 데이터 삭제
   */
  delete(key: string): void {
    try {
      this.loggingService.debug('캐시 데이터 삭제:', { key });
      this._cache.delete(key);
      this.loggingService.debug('캐시 데이터 삭제 완료:', { key });
    } catch (error) {
      this.loggingService.error('캐시 데이터 삭제 실패:', error);
      throw error;
    }
  }

  /**
   * 캐시 초기화
   */
  clear(): void {
    try {
      this.loggingService.debug('캐시 초기화 시작');
      this._cache.clear();
      this.loggingService.debug('캐시 초기화 완료');
    } catch (error) {
      this.loggingService.error('캐시 초기화 실패:', error);
      throw error;
    }
  }

  /**
   * 캐시 정리
   */
  private _cleanupCache(): void {
    const now = Date.now();
    let deletedCount = 0;

    // 만료된 항목 제거
    for (const [key, item] of this._cache.entries()) {
      if (now - item.timestamp > this.config.ttl) {
        this._cache.delete(key);
        deletedCount++;
      }
    }

    // 캐시 크기가 여전히 제한을 초과하면 가장 오래된 항목 제거
    if (this._cache.size > this.config.maxSize) {
      const sortedEntries = Array.from(this._cache.entries())
        .sort(([, a], [, b]) => a.timestamp - b.timestamp);
      
      while (this._cache.size > this.config.maxSize) {
        const [key] = sortedEntries.shift()!;
        this._cache.delete(key);
        deletedCount++;
      }
    }

    if (deletedCount > 0) {
      this.eventDispatcher.dispatch(new CacheCleanupEvent(deletedCount));
    }
  }

  /**
   * 캐시 상태 조회
   */
  public getStats(): { size: number; maxSize: number } {
    return {
      size: this._cache.size,
      maxSize: this.config.maxSize
    };
  }

  /**
   * 서비스 정리
   */
  cleanup(): void {
    this.loggingService.debug('CacheService 정리');
    this._cache.clear();
    this.eventDispatcher.dispatch(new CacheClearedEvent());
  }
} 