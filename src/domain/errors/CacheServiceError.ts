import { DomainError } from './DomainError';

/**
 * 캐시 서비스 관련 에러
 */
export class CacheServiceError extends DomainError {
  constructor(code: string, message: string) {
    super('CACHE_SERVICE', code, message);
  }
} 