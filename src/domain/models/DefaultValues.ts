import { DEFAULT_CARD } from './Card';
import { DEFAULT_CARD_NAVIGATOR_STATE } from './CardNavigatorState';
import { DEFAULT_CARD_RENDER_CONFIG, ICardRenderConfig } from './CardRenderConfig';
import { DEFAULT_CARD_SET, DEFAULT_CARD_SET_CONFIG, DEFAULT_CARD_SET_OPTIONS, CardSetType } from './CardSet';
import { DEFAULT_CARD_STYLE, ICardStyle } from './CardStyle';
import { DEFAULT_LAYOUT_CONFIG, ILayoutConfig } from './LayoutConfig';
import { DEFAULT_PRESET, DEFAULT_PRESET_CONFIG, DEFAULT_PRESET_METADATA } from './Preset';
import { DEFAULT_SEARCH_FILTER } from './SearchFilter';
import { DEFAULT_SORT_CONFIG, SortField, SortOrder, ISortConfig } from './SortConfig';

import { DEFAULT_CARD_CONFIG, ICardConfig } from './CardConfig';
import { DEFAULT_CARD_SET_CONFIG_OPTIONS, ICardSetConfigOptions } from './CardSetConfig';
import { DEFAULT_SEARCH_CONFIG, ISearchConfig } from './SearchConfig';
import { DEFAULT_PRESET_CONFIG as DEFAULT_PRESET_SETTINGS_CONFIG, IPresetConfig } from './PresetConfig';

/**
 * 플러그인 설정 인터페이스
 */
export interface PluginSettings {
  card: any;
  cardSet: any;
  layout: any;
  search: any;
  sort: any;
  preset: any;
  
  // 카드셋 설정 관련 추가 속성
  defaultCardSetType?: CardSetType;
  includeSubfolders?: boolean;
  includeBacklinks?: boolean;
  includeOutgoingLinks?: boolean;
  linkLevel?: number;
  
  // 카드셋 모드 설정
  folderSetMode?: string;
  fixedFolderPath?: string;
  tagSetMode?: string;
  fixedTag?: string;

  // 카드 렌더링 및 스타일 설정
  cardRenderConfig?: any;
  cardStyle?: any;
  
  // 초기화 관련 플래그
  servicesInitialized?: boolean;
  
  // 기타 설정
  [key: string]: any;
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
   * 카드 내비게이터 상태 기본값
   */
  cardNavigatorState: DEFAULT_CARD_NAVIGATOR_STATE,

  /**
   * 카드 렌더링 설정 기본값
   */
  cardRenderConfig: DEFAULT_CARD_RENDER_CONFIG,

  /**
   * 카드셋 기본값
   */
  cardSet: {
    default: DEFAULT_CARD_SET,
    config: DEFAULT_CARD_SET_CONFIG,
    options: DEFAULT_CARD_SET_OPTIONS
  },

  /**
   * 카드 스타일 기본값
   */
  cardStyle: DEFAULT_CARD_STYLE,

  /**
   * 레이아웃 설정 기본값
   */
  layoutConfig: DEFAULT_LAYOUT_CONFIG,

  /**
   * 프리셋 기본값
   */
  preset: {
    default: DEFAULT_PRESET,
    config: DEFAULT_PRESET_CONFIG,
    metadata: DEFAULT_PRESET_METADATA
  },

  /**
   * 검색 필터 기본값
   */
  searchFilter: DEFAULT_SEARCH_FILTER,

  /**
   * 정렬 설정 기본값
   */
  sortConfig: DEFAULT_SORT_CONFIG,

  /**
   * 플러그인 설정 기본값
   */
  plugin: {
    card: DEFAULT_CARD_CONFIG,
    cardSet: DEFAULT_CARD_SET_CONFIG_OPTIONS,
    layout: DEFAULT_LAYOUT_CONFIG,
    search: DEFAULT_SEARCH_CONFIG,
    sort: DEFAULT_SORT_CONFIG,
    preset: DEFAULT_PRESET_SETTINGS_CONFIG,
    
    // 카드셋 설정 관련 추가 속성
    defaultCardSetType: CardSetType.FOLDER,
    includeSubfolders: true,
    includeBacklinks: true,
    includeOutgoingLinks: false,
    linkLevel: 1,
    
    // 카드셋 모드 설정
    folderSetMode: 'active',
    fixedFolderPath: '',
    tagSetMode: 'active',
    fixedTag: '',

    // 카드 렌더링 및 스타일 설정
    cardRenderConfig: DEFAULT_CARD_RENDER_CONFIG,
    cardStyle: DEFAULT_CARD_STYLE,
    
    // 초기화 관련 플래그
    servicesInitialized: false,
  } as PluginSettings
} as const; 