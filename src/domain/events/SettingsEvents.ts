import { DomainEvent } from './DomainEvent';
import { DomainEventType } from './DomainEventType';
import { IPluginSettings } from '../models/DefaultValues';
import { ICardConfig } from '../models/CardConfig';
import { ICardSetConfig } from '../models/CardSetConfig';
import { ILayoutConfig } from '../models/LayoutConfig';
import { ISortConfig } from '../models/SortConfig';
import { IFilterConfig } from '../models/FilterConfig';
import { ISearchConfig } from '../models/SearchConfig';
import { ICardStyle, IStyleProperties } from '../models/CardStyle';
import { ICardSectionConfig } from '../models/CardConfig';

/**
 * 설정 변경 이벤트
 */
export class SettingsChangedEvent extends DomainEvent<'settings:changed'> {
  constructor(oldSettings: IPluginSettings, newSettings: IPluginSettings) {
    super('settings:changed', { oldSettings, newSettings });
  }
}

/**
 * 카드 설정 변경 이벤트
 */
export class CardConfigChangedEvent extends DomainEvent<'card:config:changed'> {
  constructor(oldConfig: ICardConfig, newConfig: ICardConfig) {
    super('card:config:changed', { oldConfig, newConfig });
  }
}

/**
 * 카드셋 설정 변경 이벤트
 */
export class CardSetConfigChangedEvent extends DomainEvent<'card:set:config:changed'> {
  constructor(type: string, oldConfig: ICardSetConfig, newConfig: ICardSetConfig) {
    super('card:set:config:changed', { type, oldConfig, newConfig });
  }
}

/**
 * 레이아웃 설정 변경 이벤트
 */
export class LayoutConfigChangedEvent extends DomainEvent<'layout:config:changed'> {
  constructor(oldConfig: ILayoutConfig, newConfig: ILayoutConfig) {
    super('layout:config:changed', { oldConfig, newConfig });
  }
}

/**
 * 정렬 설정 변경 이벤트
 */
export class SortConfigChangedEvent extends DomainEvent<'sort:config:changed'> {
  constructor(oldConfig: ISortConfig, newConfig: ISortConfig) {
    super('sort:config:changed', { oldConfig, newConfig });
  }
}

/**
 * 필터 설정 변경 이벤트
 */
export class FilterConfigChangedEvent extends DomainEvent<'filter:config:changed'> {
  constructor(oldConfig: IFilterConfig, newConfig: IFilterConfig) {
    super('filter:config:changed', { oldConfig, newConfig });
  }
}

/**
 * 검색 설정 변경 이벤트
 */
export class SearchConfigChangedEvent extends DomainEvent<'search:config:changed'> {
  constructor(oldConfig: ISearchConfig, newConfig: ISearchConfig) {
    super('search:config:changed', { oldConfig, newConfig });
  }
}

/**
 * 카드 스타일 변경 이벤트
 */
export class CardStyleChangedEvent extends DomainEvent<'card:style:changed'> {
  constructor(oldStyle: ICardStyle, newStyle: ICardStyle) {
    super('card:style:changed', { oldStyle, newStyle });
  }
}

/**
 * 카드 섹션 표시 변경 이벤트
 */
export class CardSectionDisplayChangedEvent extends DomainEvent<'card:section:display:changed'> {
  constructor(section: 'header' | 'body' | 'footer', property: keyof ICardSectionConfig, oldValue: boolean, newValue: boolean) {
    super('card:section:display:changed', { section, property, oldValue, newValue });
  }
} 