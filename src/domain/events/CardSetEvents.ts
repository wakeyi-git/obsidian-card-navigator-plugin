import { DomainEvent } from './DomainEvent';
import { DomainEventType } from './DomainEventType';
import { ICardSet } from '../models/CardSet';
import { ILayoutConfig } from '../models/Layout';
import { CardSetType } from '../models/CardSet';
import { ISearchCriteria } from '../models/Search';
import { ISortConfig } from '../models/Sort';

/**
 * 카드셋 생성 이벤트
 */
export class CardSetCreatedEvent extends DomainEvent<typeof DomainEventType.CARDSET_CREATED> {
  constructor(cardSet: ICardSet) {
    super(DomainEventType.CARDSET_CREATED, { cardSet });
  }

  toString(): string {
    try {
      // 순환 참조 방지를 위해 기본 정보만 포함
      const safeCardSet = {
        id: this.data.cardSet.id,
        type: this.data.cardSet.config.criteria.type,
        criteria: this.data.cardSet.config.criteria.folderPath || 
                 this.data.cardSet.config.criteria.tag || 
                 this.data.cardSet.config.criteria.filePath || '',
        cardCount: this.data.cardSet.cards?.length || 0
      };
      
      return `CardSetCreatedEvent: ${JSON.stringify(safeCardSet)}`;
    } catch (error) {
      // 직렬화 오류 시 기본 문자열 반환
      return `CardSetCreatedEvent: ${this.data.cardSet.id} (${this.data.cardSet.cards?.length || 0} cards)`;
    }
  }
}

/**
 * 카드셋 업데이트 이벤트
 */
export class CardSetUpdatedEvent extends DomainEvent<typeof DomainEventType.CARDSET_UPDATED> {
  constructor(cardSet: ICardSet) {
    super(DomainEventType.CARDSET_UPDATED, { cardSet });
  }

  toString(): string {
    try {
      // 순환 참조 방지를 위해 기본 정보만 포함
      const safeCardSet = {
        id: this.data.cardSet.id,
        type: this.data.cardSet.config.criteria.type,
        criteria: this.data.cardSet.config.criteria.folderPath || 
                 this.data.cardSet.config.criteria.tag || 
                 this.data.cardSet.config.criteria.filePath || '',
        cardCount: this.data.cardSet.cards?.length || 0
      };
      
      return `CardSetUpdatedEvent: ${JSON.stringify(safeCardSet)}`;
    } catch (error) {
      // 직렬화 오류 시 기본 문자열 반환
      return `CardSetUpdatedEvent: ${this.data.cardSet.id} (${this.data.cardSet.cards?.length || 0} cards)`;
    }
  }
}

/**
 * 카드셋 삭제 이벤트
 */
export class CardSetDeletedEvent extends DomainEvent<typeof DomainEventType.CARDSET_DELETED> {
  constructor(cardSet: ICardSet) {
    super(DomainEventType.CARDSET_DELETED, { cardSet });
  }

  toString(): string {
    try {
      // 순환 참조 방지를 위해 기본 정보만 포함
      const safeCardSet = {
        id: this.data.cardSet.id,
        type: this.data.cardSet.config.criteria.type,
        criteria: this.data.cardSet.config.criteria.folderPath || 
                 this.data.cardSet.config.criteria.tag || 
                 this.data.cardSet.config.criteria.filePath || '',
        cardCount: this.data.cardSet.cards?.length || 0
      };
      
      return `CardSetDeletedEvent: ${JSON.stringify(safeCardSet)}`;
    } catch (error) {
      // 직렬화 오류 시 기본 문자열 반환
      return `CardSetDeletedEvent: ${this.data.cardSet.id} (${this.data.cardSet.cards?.length || 0} cards)`;
    }
  }
}

/**
 * 카드셋 필터링 이벤트
 */
export class CardSetFilteredEvent extends DomainEvent<typeof DomainEventType.CARDSET_FILTERED> {
  constructor(cardSet: ICardSet) {
    super(DomainEventType.CARDSET_FILTERED, { cardSet });
  }

  toString(): string {
    try {
      // 순환 참조 방지를 위해 기본 정보만 포함
      const safeCardSet = {
        id: this.data.cardSet.id,
        type: this.data.cardSet.config.criteria.type,
        criteria: this.data.cardSet.config.criteria.folderPath || 
                 this.data.cardSet.config.criteria.tag || 
                 this.data.cardSet.config.criteria.filePath || '',
        cardCount: this.data.cardSet.cards?.length || 0
      };
      
      return `CardSetFilteredEvent: ${JSON.stringify(safeCardSet)}`;
    } catch (error) {
      // 직렬화 오류 시 기본 문자열 반환
      return `CardSetFilteredEvent: ${this.data.cardSet.id} (${this.data.cardSet.cards?.length || 0} cards)`;
    }
  }
}

/**
 * 카드셋 정렬 이벤트
 */
export class CardSetSortedEvent extends DomainEvent<typeof DomainEventType.CARDSET_SORTED> {
  constructor(cardSet: ICardSet) {
    super(DomainEventType.CARDSET_SORTED, { cardSet });
  }

  toString(): string {
    try {
      // 순환 참조 방지를 위해 기본 정보만 포함
      const safeCardSet = {
        id: this.data.cardSet.id,
        type: this.data.cardSet.config.criteria.type,
        criteria: this.data.cardSet.config.criteria.folderPath || 
                 this.data.cardSet.config.criteria.tag || 
                 this.data.cardSet.config.criteria.filePath || '',
        cardCount: this.data.cardSet.cards?.length || 0
      };
      
      return `CardSetSortedEvent: ${JSON.stringify(safeCardSet)}`;
    } catch (error) {
      // 직렬화 오류 시 기본 문자열 반환
      return `CardSetSortedEvent: ${this.data.cardSet.id} (${this.data.cardSet.cards?.length || 0} cards)`;
    }
  }
}

/**
 * 카드셋 레이아웃 변경 이벤트
 */
export class CardSetLayoutChangedEvent extends DomainEvent<typeof DomainEventType.TOOLBAR_CARD_SET_TYPE_CHANGED> {
  constructor(oldType: CardSetType, newType: CardSetType) {
    super(DomainEventType.TOOLBAR_CARD_SET_TYPE_CHANGED, { oldType, newType });
  }

  toString(): string {
    try {
      // 순환 참조 방지를 위해 기본 정보만 포함
      const safeCardSet = {
        oldType: this.data.oldType,
        newType: this.data.newType
      };
      
      return `CardSetLayoutChangedEvent: ${JSON.stringify(safeCardSet)}`;
    } catch (error) {
      // 직렬화 오류 시 기본 문자열 반환
      return `CardSetLayoutChangedEvent: ${this.data.oldType} -> ${this.data.newType}`;
    }
  }
}

/**
 * 카드셋 크기 변경 이벤트
 */
export class CardSetResizedEvent extends DomainEvent<typeof DomainEventType.LAYOUT_RESIZED> {
  constructor(layoutConfig: ILayoutConfig) {
    super(DomainEventType.LAYOUT_RESIZED, { layoutConfig });
  }

  toString(): string {
    try {
      // 순환 참조 방지를 위해 기본 정보만 포함
      const safeCardSet = {
        layoutConfig: this.data.layoutConfig
      };
      
      return `CardSetResizedEvent: ${JSON.stringify(safeCardSet)}`;
    } catch (error) {
      // 직렬화 오류 시 기본 문자열 반환
      return `CardSetResizedEvent: layout config updated`;
    }
  }
}

/**
 * 카드셋 검색 결과 정렬 이벤트
 */
export class CardSetSearchResultSortedEvent {
  constructor(
    public readonly cardSet: ICardSet,
    public readonly searchCriteria: ISearchCriteria,
    public readonly sortConfig: ISortConfig
  ) {}
} 