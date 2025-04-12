import { 
  ICardStyle, 
  DEFAULT_CARD_STYLE,
  ICardDisplayOptions,
  DEFAULT_CARD_DISPLAY_OPTIONS,
  ICardSection,
  DEFAULT_CARD_SECTION,
  IRenderConfig,
  DEFAULT_RENDER_CONFIG,
  ICardStateStyle,
  DEFAULT_CARD_STATE_STYLE
} from './Card';
import { CardSetType, ICardSetConfig, DEFAULT_CARD_SET_CONFIG } from './CardSet';
import { ILayoutConfig, DEFAULT_LAYOUT_CONFIG } from './Layout';
import { ISearchConfig, DEFAULT_SEARCH_CONFIG } from './Search';
import { ISortConfig, DEFAULT_SORT_CONFIG } from './Sort';
import { IPresetContentConfig, DEFAULT_PRESET_CONTENT_CONFIG, IPresetFeatureConfig, DEFAULT_PRESET_FEATURE_CONFIG, IPresetMapping } from './Preset';

/**
 * 카드 도메인 설정 인터페이스
 */
export interface ICardDomainSettings {
  /** 카드 스타일 */
  style: ICardStyle;
  /** 카드 표시 옵션 */
  displayOptions: ICardDisplayOptions;
  /** 카드 섹션 설정 */
  sections: {
    header: ICardSection;
    body: ICardSection;
    footer: ICardSection;
  };
  /** 카드 렌더링 설정 */
  renderConfig: IRenderConfig;
  /** 카드 상태별 스타일 */
  stateStyle: ICardStateStyle;
}

/**
 * 기본 카드 도메인 설정
 */
export const DEFAULT_CARD_DOMAIN_SETTINGS: ICardDomainSettings = {
  style: DEFAULT_CARD_STYLE,
  displayOptions: DEFAULT_CARD_DISPLAY_OPTIONS,
  sections: {
    header: DEFAULT_CARD_SECTION,
    body: DEFAULT_CARD_SECTION,
    footer: DEFAULT_CARD_SECTION
  },
  renderConfig: DEFAULT_RENDER_CONFIG,
  stateStyle: DEFAULT_CARD_STATE_STYLE
};

/**
 * 카드셋 도메인 설정 인터페이스
 */
export interface ICardSetDomainSettings {
  type: CardSetType;
  config: ICardSetConfig;
}

/**
 * 기본 카드셋 도메인 설정
 */
export const DEFAULT_CARD_SET_DOMAIN_SETTINGS: ICardSetDomainSettings = {
  type: CardSetType.FOLDER,
  config: DEFAULT_CARD_SET_CONFIG
};

/**
 * 레이아웃 도메인 설정 인터페이스
 */
export interface ILayoutDomainSettings {
  /** 레이아웃 설정 */
  readonly config: ILayoutConfig;
}

/**
 * 기본 레이아웃 도메인 설정
 */
export const DEFAULT_LAYOUT_DOMAIN_SETTINGS: ILayoutDomainSettings = {
  config: DEFAULT_LAYOUT_CONFIG
};

/**
 * 검색 도메인 설정 인터페이스
 */
export interface ISearchDomainSettings {
  /** 검색 설정 */
  readonly config: ISearchConfig;
}

/**
 * 기본 검색 도메인 설정
 */
export const DEFAULT_SEARCH_DOMAIN_SETTINGS: ISearchDomainSettings = {
  config: DEFAULT_SEARCH_CONFIG
};

/**
 * 정렬 도메인 설정 인터페이스
 */
export interface ISortDomainSettings {
  /** 정렬 설정 */
  readonly config: ISortConfig;
}

/**
 * 기본 정렬 도메인 설정
 */
export const DEFAULT_SORT_DOMAIN_SETTINGS: ISortDomainSettings = {
  config: DEFAULT_SORT_CONFIG
};

/**
 * 프리셋 도메인 설정 인터페이스
 */
export interface IPresetDomainSettings {
  /** 프리셋 설정 */
  readonly config: IPresetContentConfig;
  /** 프리셋 매핑 목록 */
  readonly mappings: readonly IPresetMapping[];
}

/**
 * 기본 프리셋 도메인 설정
 */
export const DEFAULT_PRESET_DOMAIN_SETTINGS: IPresetDomainSettings = {
  config: DEFAULT_PRESET_CONTENT_CONFIG,
  mappings: []
};

/**
 * 플러그인 설정 인터페이스
 */
export interface IPluginSettings {
  card: ICardDomainSettings;
  cardSet: ICardSetDomainSettings;
  layout: ILayoutDomainSettings;
  sort: ISortDomainSettings;
  search: ISearchDomainSettings;
  preset: IPresetDomainSettings;
}

/**
 * 기본 플러그인 설정
 */
export const DEFAULT_PLUGIN_SETTINGS: IPluginSettings = {
  card: DEFAULT_CARD_DOMAIN_SETTINGS,
  cardSet: DEFAULT_CARD_SET_DOMAIN_SETTINGS,
  layout: DEFAULT_LAYOUT_DOMAIN_SETTINGS,
  search: DEFAULT_SEARCH_DOMAIN_SETTINGS,
  sort: DEFAULT_SORT_DOMAIN_SETTINGS,
  preset: DEFAULT_PRESET_DOMAIN_SETTINGS
};

/**
 * 플러그인 설정 클래스
 */
export class PluginSettings implements IPluginSettings {
  constructor(
    public readonly card: ICardDomainSettings,
    public readonly cardSet: ICardSetDomainSettings,
    public readonly layout: ILayoutDomainSettings,
    public readonly search: ISearchDomainSettings,
    public readonly sort: ISortDomainSettings,
    public readonly preset: IPresetDomainSettings
  ) {}

  /**
   * 설정 유효성 검사
   */
  validate(): boolean {
    return (
      !!this.card.style &&
      !!this.card.displayOptions &&
      !!this.card.sections.header &&
      !!this.card.sections.body &&
      !!this.card.sections.footer &&
      !!this.card.renderConfig &&
      !!this.card.stateStyle &&
      !!this.cardSet.config &&
      !!this.layout.config &&
      !!this.search.config &&
      !!this.sort.config &&
      !!this.preset.config
    );
  }
} 