import { DEFAULT_CARD } from './Card';
import { DEFAULT_CARD_CONFIG, ICardConfig } from './CardConfig';
import { DEFAULT_CARD_STYLE, ICardStyle } from './CardStyle';
import { DEFAULT_LAYOUT_CONFIG, ILayoutConfig } from './LayoutConfig';
import { DEFAULT_FOLDER_CARD_SET_CONFIG, ICardSetConfig } from './CardSetConfig';
import { DEFAULT_SORT_CONFIG, ISortConfig } from './SortConfig';
import { DEFAULT_SEARCH_CONFIG, ISearchConfig } from './SearchConfig';
import { IPresetConfig, IPresetMetadata } from './Preset';
import { DEFAULT_CARD_NAVIGATOR_STATE } from './CardNavigatorState';
import { DEFAULT_FILTER_CONFIG, IFilterConfig } from './FilterConfig';

/**
 * 플러그인 설정 인터페이스
 */
export interface IPluginSettings {
  /** 카드 설정 */
  readonly cardConfig: ICardConfig;
  /** 카드셋 설정 */
  readonly cardSetConfig: ICardSetConfig;
  /** 레이아웃 설정 */
  readonly layoutConfig: ILayoutConfig;
  /** 정렬 설정 */
  readonly sortConfig: ISortConfig;
  /** 필터 설정 */
  readonly filterConfig: IFilterConfig;
  /** 검색 설정 */
  readonly searchConfig: ISearchConfig;
  /** 카드 스타일 설정 */
  readonly cardStyle: ICardStyle;
  /** 프리셋 설정 */
  readonly presetConfig: IPresetConfig;
  /** 초기화 관련 플래그 */
  readonly servicesInitialized?: boolean;
}

/**
 * 도메인 모델 기본값 통합 관리
 */
export const DefaultValues = {
  /**
   * 카드 기본값
   */
  card: DEFAULT_CARD,

  /**
   * 카드 설정 기본값
   */
  cardConfig: DEFAULT_CARD_CONFIG,

  /**
   * 카드 스타일 기본값
   */
  cardStyle: DEFAULT_CARD_STYLE,

  /**
   * 카드셋 설정 기본값
   */
  cardSetConfig: DEFAULT_FOLDER_CARD_SET_CONFIG,

  /**
   * 검색 설정 기본값
   */
  searchConfig: DEFAULT_SEARCH_CONFIG,

  /**
   * 정렬 설정 기본값
   */
  sortConfig: DEFAULT_SORT_CONFIG,

  /**
   * 레이아웃 설정 기본값
   */
  layoutConfig: DEFAULT_LAYOUT_CONFIG,

  /**
   * 프리셋 기본값
   */
  preset: {
    /** 기본 프리셋 메타데이터 */
    metadata: {
      id: 'default',
      name: '기본 프리셋',
      description: '기본 프리셋 설정입니다.',
      createdAt: new Date(),
      updatedAt: new Date(),
      category: 'default'
    } as IPresetMetadata,
    /** 기본 프리셋 설정 */
    config: {
      cardConfig: DEFAULT_CARD_CONFIG,
      cardSetConfig: DEFAULT_FOLDER_CARD_SET_CONFIG,
      searchConfig: DEFAULT_SEARCH_CONFIG,
      sortConfig: DEFAULT_SORT_CONFIG,
      layoutConfig: DEFAULT_LAYOUT_CONFIG
    } as IPresetConfig,
    /** 기본 매핑 목록 */
    mappings: []
  },

  /**
   * 플러그인 설정 기본값
   */
  plugin: {
    cardConfig: DEFAULT_CARD_CONFIG,
    cardSetConfig: DEFAULT_FOLDER_CARD_SET_CONFIG,
    layoutConfig: DEFAULT_LAYOUT_CONFIG,
    sortConfig: DEFAULT_SORT_CONFIG,
    filterConfig: DEFAULT_FILTER_CONFIG,
    searchConfig: DEFAULT_SEARCH_CONFIG,
    cardStyle: DEFAULT_CARD_STYLE,
    presetConfig: {
      cardConfig: DEFAULT_CARD_CONFIG,
      cardSetConfig: DEFAULT_FOLDER_CARD_SET_CONFIG,
      searchConfig: DEFAULT_SEARCH_CONFIG,
      sortConfig: DEFAULT_SORT_CONFIG,
      layoutConfig: DEFAULT_LAYOUT_CONFIG
    } as IPresetConfig,
    servicesInitialized: false
  } as IPluginSettings,

  /**
   * 카드 내비게이터 상태 기본값
   */
  cardNavigatorState: DEFAULT_CARD_NAVIGATOR_STATE
} as const; 