import { ICacheService } from '../../domain/services/ICacheService';
import { IErrorHandler } from '@/domain/interfaces/infrastructure/IErrorHandler';
import { ILoggingService } from '@/domain/interfaces/infrastructure/ILoggingService';
import { IPerformanceMonitor } from '@/domain/interfaces/infrastructure/IPerformanceMonitor';
import { IAnalyticsService } from '@/domain/interfaces/infrastructure/IAnalyticsService';
import { CacheServiceError } from '@/domain/errors/CacheServiceError';
import { Container } from '@/infrastructure/di/Container';

/**
 * 캐시 서비스 구현체
 */
export class CacheService implements ICacheService {
  private static instance: CacheService;

  private cache: Map<string, any>;
  private readonly maxSize: number;
  private readonly ttl: number; // Time To Live (밀리초)

  private constructor(
    private readonly errorHandler: IErrorHandler,
    private readonly loggingService: ILoggingService,
    private readonly performanceMonitor: IPerformanceMonitor,
    private readonly analyticsService: IAnalyticsService,
    maxSize: number = 1000,
    ttl: number = 3600000 // 기본 1시간
  ) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.ttl = ttl;
  }

  static getInstance(): CacheService {
    if (!CacheService.instance) {
      const container = Container.getInstance();
      CacheService.instance = new CacheService(
        container.resolve('IErrorHandler'),
        container.resolve('ILoggingService'),
        container.resolve('IPerformanceMonitor'),
        container.resolve('IAnalyticsService')
      );
    }
    return CacheService.instance;
  }

  /**
   * 캐시 초기화
   */
  initialize(): void {
    const perfMark = 'CacheService.initialize';
    this.performanceMonitor.startMeasure(perfMark);
    try {
      this.loggingService.debug('캐시 서비스 초기화 시작');
      this.cache.clear();
      this.loggingService.info('캐시 서비스 초기화 완료');
    } catch (error) {
      this.loggingService.error('캐시 서비스 초기화 실패', { error });
      this.errorHandler.handleError(error as Error, 'CacheService.initialize');
      throw new CacheServiceError('INITIALIZATION_FAILED', '캐시 초기화에 실패했습니다.');
    } finally {
      this.performanceMonitor.endMeasure(perfMark);
    }
  }

  /**
   * 캐시 정리
   */
  cleanup(): void {
    const perfMark = 'CacheService.cleanup';
    this.performanceMonitor.startMeasure(perfMark);
    try {
      this.loggingService.debug('캐시 서비스 정리 시작');
      const now = Date.now();
      let expiredCount = 0;
      for (const [key, value] of this.cache.entries()) {
        if (value.expiry && value.expiry < now) {
          this.cache.delete(key);
          expiredCount++;
        }
      }

      this.analyticsService.trackEvent('cache_cleanup', {
        expiredCount,
        remainingCount: this.cache.size
      });

      this.loggingService.info('캐시 서비스 정리 완료', { expiredCount });
    } catch (error) {
      this.loggingService.error('캐시 서비스 정리 실패', { error });
      this.errorHandler.handleError(error as Error, 'CacheService.cleanup');
      throw new CacheServiceError('CLEANUP_FAILED', '캐시 정리에 실패했습니다.');
    } finally {
      this.performanceMonitor.endMeasure(perfMark);
    }
  }

  /**
   * 캐시 데이터 가져오기
   */
  get<T>(key: string): T | null {
    const perfMark = 'CacheService.get';
    this.performanceMonitor.startMeasure(perfMark);
    try {
      this.loggingService.debug('캐시 데이터 조회 시작', { key });
      const item = this.cache.get(key);
      if (!item) {
        this.loggingService.debug('캐시 데이터 없음', { key });
        return null;
      }

      if (item.expiry && item.expiry < Date.now()) {
        this.loggingService.debug('캐시 데이터 만료', { key });
        this.cache.delete(key);
        return null;
      }

      this.loggingService.debug('캐시 데이터 조회 완료', { key });
      return item.value as T;
    } catch (error) {
      this.loggingService.error('캐시 데이터 조회 실패', { error, key });
      this.errorHandler.handleError(error as Error, 'CacheService.get');
      throw new CacheServiceError('GET_FAILED', '캐시 데이터 조회에 실패했습니다.');
    } finally {
      this.performanceMonitor.endMeasure(perfMark);
    }
  }

  /**
   * 캐시 데이터 저장
   */
  set<T>(key: string, value: T): void {
    const perfMark = 'CacheService.set';
    this.performanceMonitor.startMeasure(perfMark);
    try {
      this.loggingService.debug('캐시 데이터 저장 시작', { key });

      // 캐시 크기 제한 확인
      if (this.cache.size >= this.maxSize) {
        this.loggingService.debug('캐시 크기 제한 도달, 정리 시작', { currentSize: this.cache.size });
        this.cleanup();
        if (this.cache.size >= this.maxSize) {
          // 가장 오래된 항목 제거
          const oldestKey = this.cache.keys().next().value;
          this.cache.delete(oldestKey);
          this.loggingService.debug('가장 오래된 캐시 데이터 제거', { oldestKey });
        }
      }

      this.cache.set(key, {
        value,
        expiry: Date.now() + this.ttl
      });

      this.analyticsService.trackEvent('cache_set', {
        key,
        cacheSize: this.cache.size
      });

      this.loggingService.info('캐시 데이터 저장 완료', { key });
    } catch (error) {
      this.loggingService.error('캐시 데이터 저장 실패', { error, key });
      this.errorHandler.handleError(error as Error, 'CacheService.set');
      throw new CacheServiceError('SET_FAILED', '캐시 데이터 저장에 실패했습니다.');
    } finally {
      this.performanceMonitor.endMeasure(perfMark);
    }
  }

  /**
   * 캐시 데이터 삭제
   */
  delete(key: string): void {
    const perfMark = 'CacheService.delete';
    this.performanceMonitor.startMeasure(perfMark);
    try {
      this.loggingService.debug('캐시 데이터 삭제 시작', { key });
      this.cache.delete(key);

      this.analyticsService.trackEvent('cache_delete', {
        key,
        cacheSize: this.cache.size
      });

      this.loggingService.info('캐시 데이터 삭제 완료', { key });
    } catch (error) {
      this.loggingService.error('캐시 데이터 삭제 실패', { error, key });
      this.errorHandler.handleError(error as Error, 'CacheService.delete');
      throw new CacheServiceError('DELETE_FAILED', '캐시 데이터 삭제에 실패했습니다.');
    } finally {
      this.performanceMonitor.endMeasure(perfMark);
    }
  }

  /**
   * 캐시 데이터 초기화
   */
  clear(): void {
    const perfMark = 'CacheService.clear';
    this.performanceMonitor.startMeasure(perfMark);
    try {
      this.loggingService.debug('캐시 데이터 초기화 시작');
      const previousSize = this.cache.size;
      this.cache.clear();

      this.analyticsService.trackEvent('cache_clear', {
        previousSize,
        currentSize: this.cache.size
      });

      this.loggingService.info('캐시 데이터 초기화 완료', { previousSize });
    } catch (error) {
      this.loggingService.error('캐시 데이터 초기화 실패', { error });
      this.errorHandler.handleError(error as Error, 'CacheService.clear');
      throw new CacheServiceError('CLEAR_FAILED', '캐시 초기화에 실패했습니다.');
    } finally {
      this.performanceMonitor.endMeasure(perfMark);
    }
  }

  /**
   * 캐시 데이터 존재 여부 확인
   */
  has(key: string): boolean {
    const perfMark = 'CacheService.has';
    this.performanceMonitor.startMeasure(perfMark);
    try {
      this.loggingService.debug('캐시 데이터 존재 여부 확인 시작', { key });
      const item = this.cache.get(key);
      if (!item) {
        this.loggingService.debug('캐시 데이터 없음', { key });
        return false;
      }

      if (item.expiry && item.expiry < Date.now()) {
        this.loggingService.debug('캐시 데이터 만료', { key });
        this.cache.delete(key);
        return false;
      }

      this.loggingService.debug('캐시 데이터 존재', { key });
      return true;
    } catch (error) {
      this.loggingService.error('캐시 데이터 존재 여부 확인 실패', { error, key });
      this.errorHandler.handleError(error as Error, 'CacheService.has');
      throw new CacheServiceError('HAS_FAILED', '캐시 데이터 확인에 실패했습니다.');
    } finally {
      this.performanceMonitor.endMeasure(perfMark);
    }
  }
} 