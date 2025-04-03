import { DomainEvent, DomainEventType } from './DomainEvent';
import { ICardSet } from '../models/CardSet';

/**
 * 검색 시작 이벤트
 */
export class SearchStartedEvent extends DomainEvent {
  constructor(public readonly query: string) {
    super('search.started' as DomainEventType);
  }
}

/**
 * 검색 완료 이벤트
 */
export class SearchCompletedEvent extends DomainEvent {
  constructor(public readonly results: ICardSet) {
    super('search.completed' as DomainEventType);
  }
}

/**
 * 검색 실패 이벤트
 */
export class SearchFailedEvent extends DomainEvent {
  constructor(public readonly error: Error) {
    super('search.failed' as DomainEventType);
  }
} 