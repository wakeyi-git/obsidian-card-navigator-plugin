import { DomainEvent } from './DomainEvent';
import { DomainEventType } from './DomainEventType';
import { IPluginSettings } from '../models/PluginSettings';
import { ICardStyle, ICardSection, ICardStateStyle } from '../models/Card';
import { ICardSetConfig } from '../models/CardSet';
import { ILayoutConfig } from '../models/Layout';
import { ISortConfig } from '../models/Sort';
import { ISearchConfig } from '../models/Search';
import { ICardDisplayOptions } from '../models/Card';
import { TitleSource } from '../models/Card';

/**
 * 설정 변경 이벤트
 */
export class SettingsChangedEvent extends DomainEvent<typeof DomainEventType.SETTINGS_CHANGED> {
  constructor(oldSettings: IPluginSettings, newSettings: IPluginSettings) {
    super(DomainEventType.SETTINGS_CHANGED, { oldSettings, newSettings });
  }
}

/**
 * 카드 설정 변경 이벤트
 */
export class CardConfigChangedEvent extends DomainEvent<typeof DomainEventType.CARD_CONFIG_CHANGED> {
  constructor(oldConfig: ICardStateStyle, newConfig: ICardStateStyle) {
    super(DomainEventType.CARD_CONFIG_CHANGED, { oldConfig, newConfig });
  }
}

/**
 * 카드셋 설정 변경 이벤트
 */
export class CardSetConfigChangedEvent extends DomainEvent<typeof DomainEventType.CARD_SET_CONFIG_CHANGED> {
  constructor(type: string, oldConfig: ICardSetConfig, newConfig: ICardSetConfig) {
    super(DomainEventType.CARD_SET_CONFIG_CHANGED, { type, oldConfig, newConfig });
  }
}

/**
 * 레이아웃 설정 변경 이벤트
 */
export class LayoutConfigChangedEvent extends DomainEvent<typeof DomainEventType.LAYOUT_CONFIG_CHANGED> {
  constructor(oldConfig: ILayoutConfig, newConfig: ILayoutConfig) {
    super(DomainEventType.LAYOUT_CONFIG_CHANGED, { oldConfig, newConfig });
  }
}

/**
 * 정렬 설정 변경 이벤트
 */
export class SortConfigChangedEvent extends DomainEvent<typeof DomainEventType.SORT_CONFIG_CHANGED> {
  constructor(oldConfig: ISortConfig, newConfig: ISortConfig) {
    super(DomainEventType.SORT_CONFIG_CHANGED, { oldConfig, newConfig });
  }
}

/**
 * 검색 설정 변경 이벤트
 */
export class SearchConfigChangedEvent extends DomainEvent<typeof DomainEventType.SEARCH_CONFIG_CHANGED> {
  constructor(oldConfig: ISearchConfig, newConfig: ISearchConfig) {
    super(DomainEventType.SEARCH_CONFIG_CHANGED, { oldConfig, newConfig });
  }
}

/**
 * 카드 스타일 변경 이벤트
 */
export class CardStyleChangedEvent extends DomainEvent<typeof DomainEventType.CARD_STYLE_CHANGED> {
  constructor(
    public readonly section: 'card' | 'header' | 'body' | 'footer',
    public readonly state: 'normal' | 'active' | 'focused' | 'style',
    public readonly property: string,
    public readonly value: string | number
  ) {
    super(DomainEventType.CARD_STYLE_CHANGED, { section, state, property, value });
  }
}

/**
 * 카드 섹션 표시 변경 이벤트
 */
export class CardSectionDisplayChangedEvent extends DomainEvent<typeof DomainEventType.CARD_SECTION_DISPLAY_CHANGED> {
  constructor(
    public readonly section: 'header' | 'body' | 'footer',
    public readonly property: keyof ICardDisplayOptions | 'titleSource',
    public readonly oldValue: boolean | TitleSource,
    public readonly newValue: boolean | TitleSource
  ) {
    super(DomainEventType.CARD_SECTION_DISPLAY_CHANGED, { section, property, oldValue, newValue });
  }
}

/**
 * 타이틀 소스 변경 이벤트
 */
export class TitleSourceChangedEvent extends DomainEvent<typeof DomainEventType.TITLE_SOURCE_CHANGED> {
  constructor(
    public readonly oldValue: TitleSource,
    public readonly newValue: TitleSource
  ) {
    super(DomainEventType.TITLE_SOURCE_CHANGED, {
      oldSource: oldValue,
      newSource: newValue
    });
  }
} 