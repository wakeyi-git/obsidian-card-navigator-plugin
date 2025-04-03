import { TFile } from 'obsidian';
import { ICard, NoteTitleDisplayType } from './Card';
import { ICardRenderConfig, DEFAULT_CARD_RENDER_CONFIG, CardRenderType } from './CardRenderConfig';
import { ICardSet, ICardSetConfig, ICardSetOptions, DEFAULT_CARD_SET, DEFAULT_CARD_SET_CONFIG, DEFAULT_CARD_SET_OPTIONS, CardSetType, LinkType } from './CardSet';
import { ICardStyle, DEFAULT_CARD_STYLE } from './CardStyle';
import { ILayoutConfig, DEFAULT_LAYOUT_CONFIG, LayoutType, LayoutDirection } from './LayoutConfig';
import { IPreset, IPresetConfig, IPresetMetadata, DEFAULT_PRESET, DEFAULT_PRESET_CONFIG, DEFAULT_PRESET_METADATA, PresetType } from './Preset';
import { ISearchFilter, DEFAULT_SEARCH_FILTER, DEFAULT_SEARCH_OPTIONS } from './SearchFilter';
import { ISortConfig, DEFAULT_SORT_CONFIG, SortField, SortOrder } from './SortConfig';

/**
 * 도메인 모델 기본값 통합 관리
 */
export const DefaultValues = {
  /**
   * 카드 기본값
   */
  card: {
    id: '',
    file: null as unknown as TFile,
    fileName: '',
    firstHeader: null,
    content: '',
    tags: [],
    properties: {},
    createdAt: new Date(),
    updatedAt: new Date(),
    metadata: {},
    renderConfig: DEFAULT_CARD_RENDER_CONFIG,
    titleDisplayType: NoteTitleDisplayType.FILENAME,
    validate: () => true,
    toString: function() {
      return `Card(${this.titleDisplayType === NoteTitleDisplayType.FILENAME ? this.fileName : this.firstHeader || this.fileName})`;
    }
  } as ICard,

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
  searchFilter: {
    default: DEFAULT_SEARCH_FILTER,
    options: DEFAULT_SEARCH_OPTIONS
  },

  /**
   * 정렬 설정 기본값
   */
  sortConfig: DEFAULT_SORT_CONFIG,

  /**
   * 플러그인 설정 기본값
   */
  plugin: {
    cardTitleDisplayType: 'filename' as const,
    cardRenderType: CardRenderType.TEXT,
    renderMarkdown: true,
    defaultCardSetType: CardSetType.FOLDER,
    defaultCardSetCriteria: '',
    includeSubfolders: true,
    linkType: LinkType.BACKLINK,
    linkLevel: 1,
    includeBacklinks: true,
    includeOutgoingLinks: false,
    includePatterns: [],
    excludePatterns: [],
    layoutType: LayoutType.MASONRY,
    layoutDirection: LayoutDirection.VERTICAL,
    cardHeightFixed: false,
    cardMinWidth: 300,
    cardMinHeight: 200,
    cardGap: 16,
    cardPadding: 16,
    defaultPreset: 'default',
    autoApplyPreset: true,
    presetType: PresetType.GLOBAL,
    folderPresetMappings: [],
    tagPresetMappings: [],
    datePresetMappings: [],
    propertyPresetMappings: [],
    searchScope: 'all' as const,
    searchFilename: true,
    searchContent: true,
    searchTags: true,
    caseSensitive: false,
    useRegex: false,
    sortField: SortField.UPDATED,
    sortOrder: SortOrder.DESC,
    priorityTags: [] as string[],
    priorityFolders: [] as string[],
    cardStyle: DEFAULT_CARD_STYLE,
    cardRenderConfig: DEFAULT_CARD_RENDER_CONFIG
  } as PluginSettings
} as const;

/**
 * 플러그인 설정 타입
 */
export type PluginSettings = {
  cardTitleDisplayType: 'filename' | 'first_header';
  cardRenderType: CardRenderType;
  renderMarkdown: boolean;
  defaultCardSetType: CardSetType;
  defaultCardSetCriteria: string;
  includeSubfolders: boolean;
  linkType: LinkType;
  linkLevel: number;
  includeBacklinks: boolean;
  includeOutgoingLinks: boolean;
  includePatterns?: string[];
  excludePatterns?: string[];
  layoutType: LayoutType;
  layoutDirection: LayoutDirection;
  cardHeightFixed: boolean;
  cardMinWidth: number;
  cardMinHeight: number;
  cardGap: number;
  cardPadding: number;
  defaultPreset: string;
  autoApplyPreset: boolean;
  presetType: PresetType;
  folderPresetMappings: Array<{ folder: string; preset: string }>;
  tagPresetMappings: Array<{ tag: string; preset: string }>;
  datePresetMappings: Array<{ startDate: string; endDate: string; preset: string }>;
  propertyPresetMappings: Array<{ name: string; value: string; preset: string }>;
  searchScope: 'all' | 'current';
  searchFilename: boolean;
  searchContent: boolean;
  searchTags: boolean;
  caseSensitive: boolean;
  useRegex: boolean;
  sortField: SortField;
  sortOrder: SortOrder;
  priorityTags: string[];
  priorityFolders: string[];
  cardStyle: ICardStyle;
  cardRenderConfig: ICardRenderConfig;
}; 