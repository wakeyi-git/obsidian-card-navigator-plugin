import { DomainEvent } from './DomainEvent';
import { DomainEventType } from './DomainEventType';
import { ISearchConfig, ISearchCriteria, ISearchResult } from '../models/Search';
import { ICard } from '../models/Card';
import { ICardSet } from '../models/CardSet';

/**
 * 검색 시작 이벤트
 */
export class SearchStartedEvent extends DomainEvent<typeof DomainEventType.SEARCH_STARTED> {
  constructor(query: string, config: ISearchConfig) {
    super(DomainEventType.SEARCH_STARTED, { query, config });
  }
}

/**
 * 검색 완료 이벤트
 */
export class SearchCompletedEvent extends DomainEvent<typeof DomainEventType.SEARCH_COMPLETED> {
  constructor(result: ISearchResult) {
    super(DomainEventType.SEARCH_COMPLETED, { result });
  }
}

/**
 * 검색 실패 이벤트
 */
export class SearchFailedEvent extends DomainEvent<typeof DomainEventType.SEARCH_FAILED> {
  constructor(error: Error, query: string, config: ISearchConfig) {
    super(DomainEventType.SEARCH_FAILED, { error, query, config });
  }
}

/**
 * 검색 결과 필터링 이벤트
 */
export class SearchResultsFilteredEvent extends DomainEvent<typeof DomainEventType.SEARCH_RESULTS_FILTERED> {
  constructor(result: ISearchResult, criteria: ISearchCriteria) {
    super(DomainEventType.SEARCH_RESULTS_FILTERED, { result, criteria });
  }
}

/**
 * 검색 결과 정렬 이벤트
 */
export class SearchResultsSortedEvent extends DomainEvent<typeof DomainEventType.SEARCH_RESULTS_SORTED> {
  constructor(result: ISearchResult, criteria: ISearchCriteria) {
    super(DomainEventType.SEARCH_RESULTS_SORTED, { result, criteria });
  }
}

/**
 * 검색 인덱스 업데이트 이벤트
 */
export class SearchIndexUpdatedEvent extends DomainEvent<typeof DomainEventType.SEARCH_INDEX_UPDATED> {
  constructor(card: ICard) {
    super(DomainEventType.SEARCH_INDEX_UPDATED, { card });
  }
}

/**
 * 검색 인덱스 삭제 이벤트
 */
export class SearchIndexRemovedEvent extends DomainEvent<typeof DomainEventType.SEARCH_INDEX_REMOVED> {
  constructor(cardId: string) {
    super(DomainEventType.SEARCH_INDEX_REMOVED, { cardId });
  }
} 