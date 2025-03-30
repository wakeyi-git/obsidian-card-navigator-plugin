import { DomainEvent } from '@/domain/events/DomainEvent';

/**
 * 캐시 이벤트 타입
 */
export enum CacheEventType {
  ITEM_ADDED = 'cache.itemAdded',
  ITEM_DELETED = 'cache.itemDeleted',
  CLEARED = 'cache.cleared',
  CLEANUP = 'cache.cleanup'
}

/**
 * 캐시 항목 추가 이벤트
 */
export class CacheItemAddedEvent extends DomainEvent {
  constructor(public readonly key: string) {
    super(CacheEventType.ITEM_ADDED);
  }
}

/**
 * 캐시 항목 삭제 이벤트
 */
export class CacheItemDeletedEvent extends DomainEvent {
  constructor(public readonly key: string) {
    super(CacheEventType.ITEM_DELETED);
  }
}

/**
 * 캐시 초기화 이벤트
 */
export class CacheClearedEvent extends DomainEvent {
  constructor() {
    super(CacheEventType.CLEARED);
  }
}

/**
 * 캐시 정리 이벤트
 */
export class CacheCleanupEvent extends DomainEvent {
  constructor(public readonly deletedCount: number) {
    super(CacheEventType.CLEANUP);
  }
} 