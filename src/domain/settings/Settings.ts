import { CardSetSourceMode } from '../cardset/CardSet';
import { NavigationMode } from '../navigation/Navigation';
import { CardRenderingMode } from '../card/Card';
import { RenderOptions } from '../../infrastructure/services/MarkdownRenderer';
import { ICardDisplaySettings, ICardStyle } from '../card/Card';
import { LayoutOptions } from '../layout/Layout';

/**
 * 레이아웃 방향 선호도
 */
export enum LayoutDirectionPreference {
  AUTO = 'auto',
  VERTICAL = 'vertical',
  HORIZONTAL = 'horizontal'
}

/**
 * 프리셋 매핑 타입
 */
export type PresetMappingType = 'folder' | 'tag' | 'created' | 'modified' | 'property';

/**
 * 날짜 범위
 */
export interface IDateRange {
  start?: string;
  end?: string;
  relative?: {
    unit: 'day' | 'week' | 'month' | 'year';
    value: number;
    reference: 'now' | 'start-of-week' | 'start-of-month' | 'start-of-year';
  };
  pattern?: {
    type: 'weekday' | 'month' | 'year' | 'day-of-month';
    value: number | number[];
  };
}

/**
 * 프로퍼티 조건
 */
export interface IPropertyCondition {
  key: string;
  operator: 'equals' | 'not-equals' | 'contains' | 'not-contains' | 'greater-than' | 'less-than' | 'exists' | 'not-exists';
  value?: any;
}

/**
 * 레이아웃 설정
 */
export interface ILayoutSettings {
  mode: 'grid' | 'masonry';
  cardWidth: number;
  cardHeight: number;
  gap: number;
  padding: number;
  layoutDirectionPreference: LayoutDirectionPreference;
}

/**
 * 프리셋 매핑
 */
export interface IPresetMapping {
  id: string;
  type: PresetMappingType;
  target?: string;
  dateRange?: IDateRange;
  propertyCondition?: IPropertyCondition;
  includeSubfolders?: boolean;
  presetId: string;
  priority: number;
  description?: string;
}

/**
 * 프리셋
 */
export interface IPreset {
  /**
   * 프리셋 ID
   */
  id: string;
  
  /**
   * 프리셋 이름
   */
  name: string;
  
  /**
   * 프리셋 설명
   */
  description: string;
  
  /**
   * 프리셋 설정
   */
  settings: {
    /**
     * 기본 모드
     */
    defaultMode: CardSetSourceMode;
    
    /**
     * 카드 표시 설정
     */
    cardDisplay: ICardDisplaySettings;
    
    /**
     * 레이아웃 설정
     */
    layout: LayoutOptions;
    
    /**
     * 스타일 설정
     */
    style: {
      /**
       * 카드 스타일
       */
      card: ICardStyle;
    };
  };
}

/**
 * 설정
 */
export interface ISettings {
  defaultMode: CardSetSourceMode;
  cardDisplay: ICardDisplaySettings;
  layout: LayoutOptions;
  style: {
    card: ICardStyle;
  };
  markdown: IMarkdownSettings;
  presets: IPreset[];
  enabled: boolean;
  autoRefresh: boolean;
  defaultCardSetSource: CardSetSourceMode;
  defaultLayout: 'grid' | 'masonry';
  includeSubfolders: boolean;
  defaultFolderCardSet: string;
  defaultTagCardSet: string;
  isCardSetFixed: boolean;
  defaultSearchScope?: 'all' | 'current';
  tagCaseSensitive?: boolean;
  useLastCardSetSourceOnLoad?: boolean;
  debugMode?: boolean;
  cardSetSourceMode: CardSetSourceMode;
  selectedFolder?: string;
  selectedTags?: string[];
  cardWidth: number;
  cardHeight: number;
  cardHeaderContent: string;
  cardBodyContent: string;
  cardFooterContent: string;
  cardHeaderContentMultiple?: string[];
  cardBodyContentMultiple?: string[];
  cardFooterContentMultiple?: string[];
  navigationMode?: NavigationMode;
  presetMappings: IPresetMapping[];
  activePresetId?: string;
  defaultPresetId?: string;
  toolbarItems: any[];
}

/**
 * 설정 저장소 인터페이스
 */
export interface ISettingsRepository {
  load(): Promise<ISettings>;
  save(settings: ISettings): Promise<void>;
  getDefaultSettings(): ISettings;
}

export interface IMarkdownSettings {
  renderOptions: RenderOptions;
}

/**
 * 카드 네비게이터 설정 클래스
 */
export class CardNavigatorSettings implements ISettings {
  /**
   * 기본 모드
   */
  defaultMode: CardSetSourceMode = CardSetSourceMode.FOLDER;
  
  /**
   * 카드 표시 설정
   */
  cardDisplay: ICardDisplaySettings = {
    headerContent: 'title',
    bodyContent: 'content',
    footerContent: 'tags',
    dateFormat: {
      format: 'YYYY-MM-DD HH:mm:ss',
      locale: 'ko-KR',
      useRelativeTime: false
    },
    frontmatterFormat: {
      fields: [],
      labels: {},
      separator: ' | ',
      format: 'list'
    }
  };
  
  /**
   * 레이아웃 설정
   */
  layout: LayoutOptions = {
    type: 'grid',
    cardWidth: 300,
    cardHeight: 200,
    gap: 16,
    padding: 16,
    direction: 'auto'
  };
  
  /**
   * 스타일 설정
   */
  style: {
    /**
     * 카드 스타일
     */
    card: ICardStyle;
  } = {
    card: {
      normal: {
        background: '#ffffff',
        fontSize: 14,
        borderStyle: 'solid',
        borderColor: '#e0e0e0',
        borderWidth: 1,
        borderRadius: 4
      },
      active: {
        background: '#f0f0f0',
        fontSize: 14,
        borderStyle: 'solid',
        borderColor: '#4a9eff',
        borderWidth: 2,
        borderRadius: 4
      },
      focused: {
        background: '#e8f4ff',
        fontSize: 14,
        borderStyle: 'solid',
        borderColor: '#4a9eff',
        borderWidth: 2,
        borderRadius: 4
      },
      header: {
        background: '#f8f9fa',
        fontSize: 16,
        borderStyle: 'none',
        borderColor: '#e0e0e0',
        borderWidth: 0,
        borderRadius: 4
      },
      body: {
        background: '#ffffff',
        fontSize: 14,
        borderStyle: 'none',
        borderColor: '#e0e0e0',
        borderWidth: 0,
        borderRadius: 4
      },
      footer: {
        background: '#f8f9fa',
        fontSize: 12,
        borderStyle: 'none',
        borderColor: '#e0e0e0',
        borderWidth: 0,
        borderRadius: 4
      }
    }
  };
  
  /**
   * 프리셋 목록
   */
  presets: IPreset[] = [];

  /**
   * 마크다운 렌더링 설정
   */
  markdown: {
    /**
     * 렌더링 옵션
     */
    renderOptions: RenderOptions;
  } = {
    renderOptions: {
      highlightCode: true,
      renderImages: true,
      renderMath: true,
      renderLinks: true,
      renderCallouts: true
    }
  };

  enabled = true;
  autoRefresh = true;
  defaultCardSetSource: CardSetSourceMode = CardSetSourceMode.FOLDER;
  defaultLayout: 'grid' | 'masonry' = 'grid';
  includeSubfolders = true;
  defaultFolderCardSet = '';
  defaultTagCardSet = '';
  isCardSetFixed = false;
  defaultSearchScope: 'all' | 'current' = 'all';
  tagCaseSensitive = false;
  useLastCardSetSourceOnLoad = false;
  debugMode = false;
  cardSetSourceMode: CardSetSourceMode = CardSetSourceMode.FOLDER;
  selectedFolder = '';
  selectedTags: string[] = [];
  cardWidth = 200;
  cardHeight = 150;
  cardHeaderContent = '# {{title}}';
  cardBodyContent = '{{content}}';
  cardFooterContent = '{{#tags}} #{{.}} {{/tags}}';
  cardHeaderContentMultiple: string[] = [];
  cardBodyContentMultiple: string[] = [];
  cardFooterContentMultiple: string[] = [];
  navigationMode?: NavigationMode;
  presetMappings: IPresetMapping[] = [];
  activePresetId?: string;
  defaultPresetId?: string;
  toolbarItems: any[] = [];
} 