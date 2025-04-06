import { DomainEvent } from './DomainEvent';
import { DomainEventType } from './DomainEventType';
import { ICardSet } from '../models/CardSet';
import { ISortConfig } from '../models/SortConfig';
import { ISearchResult, ISearchCriteria } from '../models/SearchResult';

/**
 * 카드셋 정렬 시작 이벤트
 */
export class CardSetSortStartedEvent extends DomainEvent<typeof DomainEventType.CARD_SET_SORT_STARTED> {
  constructor(cardSet: ICardSet, config: ISortConfig) {
    super(DomainEventType.CARD_SET_SORT_STARTED, { cardSet, config });
  }
}

/**
 * 카드셋 정렬 완료 이벤트
 */
export class CardSetSortCompletedEvent extends DomainEvent<typeof DomainEventType.CARD_SET_SORT_COMPLETED> {
  constructor(cardSet: ICardSet, config: ISortConfig) {
    super(DomainEventType.CARD_SET_SORT_COMPLETED, { cardSet, config });
  }
}

/**
 * 카드셋 정렬 실패 이벤트
 */
export class CardSetSortFailedEvent extends DomainEvent<typeof DomainEventType.CARD_SET_SORT_FAILED> {
  constructor(cardSet: ICardSet, config: ISortConfig, error: Error) {
    super(DomainEventType.CARD_SET_SORT_FAILED, { cardSet, config, error });
  }
}

/**
 * 검색 결과 정렬 시작 이벤트
 */
export class SearchResultSortStartedEvent extends DomainEvent<typeof DomainEventType.SEARCH_RESULT_SORT_STARTED> {
  constructor(result: { criteria: ISearchCriteria; cardIds: string[]; searchTime: number; totalCount: number; filteredCount: number }, config: ISortConfig) {
    super(DomainEventType.SEARCH_RESULT_SORT_STARTED, { result, config });
  }
}

/**
 * 검색 결과 정렬 완료 이벤트
 */
export class SearchResultSortCompletedEvent extends DomainEvent<typeof DomainEventType.SEARCH_RESULT_SORT_COMPLETED> {
  constructor(result: { criteria: ISearchCriteria; cardIds: string[]; searchTime: number; totalCount: number; filteredCount: number }, config: ISortConfig) {
    super(DomainEventType.SEARCH_RESULT_SORT_COMPLETED, { result, config });
  }
}

/**
 * 검색 결과 정렬 실패 이벤트
 */
export class SearchResultSortFailedEvent extends DomainEvent<typeof DomainEventType.SEARCH_RESULT_SORT_FAILED> {
  constructor(result: { criteria: ISearchCriteria; cardIds: string[]; searchTime: number; totalCount: number; filteredCount: number }, config: ISortConfig, error: Error) {
    super(DomainEventType.SEARCH_RESULT_SORT_FAILED, { result, config, error });
  }
}

/**
 * 우선순위 태그 정렬 시작 이벤트
 */
export class PriorityTagsSortStartedEvent extends DomainEvent<typeof DomainEventType.PRIORITY_TAGS_SORT_STARTED> {
  constructor(cardSet: ICardSet, priorityTags: string[]) {
    super(DomainEventType.PRIORITY_TAGS_SORT_STARTED, { cardSet, priorityTags });
  }
}

/**
 * 우선순위 태그 정렬 완료 이벤트
 */
export class PriorityTagsSortCompletedEvent extends DomainEvent<typeof DomainEventType.PRIORITY_TAGS_SORT_COMPLETED> {
  constructor(cardSet: ICardSet, priorityTags: string[]) {
    super(DomainEventType.PRIORITY_TAGS_SORT_COMPLETED, { cardSet, priorityTags });
  }
}

/**
 * 우선순위 태그 정렬 실패 이벤트
 */
export class PriorityTagsSortFailedEvent extends DomainEvent<typeof DomainEventType.PRIORITY_TAGS_SORT_FAILED> {
  constructor(cardSet: ICardSet, priorityTags: string[], error: Error) {
    super(DomainEventType.PRIORITY_TAGS_SORT_FAILED, { cardSet, priorityTags, error });
  }
}

/**
 * 우선순위 폴더 정렬 시작 이벤트
 */
export class PriorityFoldersSortStartedEvent extends DomainEvent<typeof DomainEventType.PRIORITY_FOLDERS_SORT_STARTED> {
  constructor(cardSet: ICardSet, priorityFolders: string[]) {
    super(DomainEventType.PRIORITY_FOLDERS_SORT_STARTED, { cardSet, priorityFolders });
  }
}

/**
 * 우선순위 폴더 정렬 완료 이벤트
 */
export class PriorityFoldersSortCompletedEvent extends DomainEvent<typeof DomainEventType.PRIORITY_FOLDERS_SORT_COMPLETED> {
  constructor(cardSet: ICardSet, priorityFolders: string[]) {
    super(DomainEventType.PRIORITY_FOLDERS_SORT_COMPLETED, { cardSet, priorityFolders });
  }
}

/**
 * 우선순위 폴더 정렬 실패 이벤트
 */
export class PriorityFoldersSortFailedEvent extends DomainEvent<typeof DomainEventType.PRIORITY_FOLDERS_SORT_FAILED> {
  constructor(cardSet: ICardSet, priorityFolders: string[], error: Error) {
    super(DomainEventType.PRIORITY_FOLDERS_SORT_FAILED, { cardSet, priorityFolders, error });
  }
} 