import { DomainEvent } from './DomainEvent';
import { DomainEventType } from './DomainEventType';
import { CardSetType } from '../models/CardSet';
import { ISearchConfig } from '../models/Search';
import { ISortConfig } from '../models/Sort';
import { ICardStyle, ICardSection } from '../models/Card';
import { ILayoutConfig } from '../models/Layout';

/**
 * 툴바 액션 이벤트
 */
export class ToolbarActionEvent extends DomainEvent<typeof DomainEventType.TOOLBAR_ACTION> {
  constructor(
    cardSetType: CardSetType,
    searchConfig: ISearchConfig,
    sortConfig: ISortConfig,
    cardSection: ICardSection,
    cardStyle: ICardStyle,
    layoutConfig: ILayoutConfig
  ) {
    super(DomainEventType.TOOLBAR_ACTION, {
      cardSetType,
      searchConfig,
      sortConfig,
      cardSection,
      cardStyle,
      layoutConfig
    });
  }
}

/**
 * 카드셋 타입 변경 이벤트
 */
export class CardSetTypeChangedEvent extends DomainEvent<typeof DomainEventType.TOOLBAR_CARD_SET_TYPE_CHANGED> {
  constructor(oldType: CardSetType, newType: CardSetType) {
    super(DomainEventType.TOOLBAR_CARD_SET_TYPE_CHANGED, { oldType, newType });
  }
}

/**
 * 검색 설정 변경 이벤트
 */
export class SearchConfigChangedEvent extends DomainEvent<typeof DomainEventType.TOOLBAR_SEARCH_CONFIG_CHANGED> {
  constructor(oldConfig: ISearchConfig, newConfig: ISearchConfig) {
    super(DomainEventType.TOOLBAR_SEARCH_CONFIG_CHANGED, { oldConfig, newConfig });
  }
}

/**
 * 정렬 설정 변경 이벤트
 */
export class SortConfigChangedEvent extends DomainEvent<typeof DomainEventType.TOOLBAR_SORT_CONFIG_CHANGED> {
  constructor(oldConfig: ISortConfig, newConfig: ISortConfig) {
    super(DomainEventType.TOOLBAR_SORT_CONFIG_CHANGED, { oldConfig, newConfig });
  }
}

/**
 * 카드 섹션 변경 이벤트
 */
export class CardSectionChangedEvent extends DomainEvent<typeof DomainEventType.TOOLBAR_CARD_SECTION_CHANGED> {
  constructor(oldSection: ICardSection, newSection: ICardSection) {
    super(DomainEventType.TOOLBAR_CARD_SECTION_CHANGED, { oldSection, newSection });
  }
}

/**
 * 카드 스타일 변경 이벤트
 */
export class CardStyleChangedEvent extends DomainEvent<typeof DomainEventType.TOOLBAR_CARD_STYLE_CHANGED> {
  constructor(oldStyle: ICardStyle, newStyle: ICardStyle) {
    super(DomainEventType.TOOLBAR_CARD_STYLE_CHANGED, { oldStyle, newStyle });
  }
}

/**
 * 레이아웃 설정 변경 이벤트
 */
export class LayoutConfigChangedEvent extends DomainEvent<typeof DomainEventType.TOOLBAR_LAYOUT_CONFIG_CHANGED> {
  constructor(oldConfig: ILayoutConfig, newConfig: ILayoutConfig) {
    super(DomainEventType.TOOLBAR_LAYOUT_CONFIG_CHANGED, { oldConfig, newConfig });
  }
} 