import { DomainEvent } from './DomainEvent';
import { DomainEventType } from './DomainEventType';
import { ISearchResult } from '../models/SearchResult';

/**
 * 검색 시작 이벤트
 */
export class SearchStartedEvent extends DomainEvent<string> {
  constructor(public readonly query: string) {
    super(DomainEventType.SEARCH_STARTED, query);
  }
}

/**
 * 검색 완료 이벤트
 */
export class SearchCompletedEvent extends DomainEvent<ISearchResult> {
  constructor(public readonly result: ISearchResult) {
    super(DomainEventType.SEARCH_COMPLETED, result);
  }
}

/**
 * 검색 실패 이벤트
 */
export class SearchFailedEvent extends DomainEvent<ISearchResult> {
  constructor(data: ISearchResult) {
    super(DomainEventType.SEARCH_FAILED, data);
  }
}

/**
 * 검색 초기화 이벤트
 */
export class SearchClearedEvent extends DomainEvent<void> {
  constructor() {
    super(DomainEventType.SEARCH_CLEARED, undefined);
  }
} 