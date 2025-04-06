import { DomainEvent } from './DomainEvent';
import { DomainEventType } from './DomainEventType';

/**
 * 캐시 초기화 이벤트
 */
export class CacheInitializedEvent extends DomainEvent<typeof DomainEventType.CACHE_INITIALIZED> {
  constructor() {
    super(DomainEventType.CACHE_INITIALIZED, {});
  }
}

/**
 * 캐시 정리 이벤트
 */
export class CacheCleanedEvent extends DomainEvent<typeof DomainEventType.CACHE_CLEANED> {
  constructor() {
    super(DomainEventType.CACHE_CLEANED, {});
  }
}

/**
 * 캐시 데이터 저장 이벤트
 */
export class CacheDataStoredEvent extends DomainEvent<typeof DomainEventType.CACHE_DATA_STORED> {
  constructor(key: string, data: unknown) {
    super(DomainEventType.CACHE_DATA_STORED, { key, data });
  }
}

/**
 * 캐시 데이터 삭제 이벤트
 */
export class CacheDataDeletedEvent extends DomainEvent<typeof DomainEventType.CACHE_DATA_DELETED> {
  constructor(key: string) {
    super(DomainEventType.CACHE_DATA_DELETED, { key });
  }
}

/**
 * 캐시 데이터 초기화 이벤트
 */
export class CacheDataClearedEvent extends DomainEvent<typeof DomainEventType.CACHE_DATA_CLEARED> {
  constructor() {
    super(DomainEventType.CACHE_DATA_CLEARED, {});
  }
} 