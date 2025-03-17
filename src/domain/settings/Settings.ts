import { CardSetSourceMode } from '../cardset/CardSet';
import { NavigationMode } from '../navigation/Navigation';
import { CardRenderingMode } from '../card/Card';

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
  id: string;
  name: string;
  description: string;
  settings: {
    defaultMode: 'folder' | 'tag';
    cardDisplay: ICardDisplaySettings;
    layout: ILayoutSettings;
    style: {
      card: ICardStyle;
    };
  };
}

/**
 * 설정
 */
export interface ISettings {
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
  
  layout: ILayoutSettings;
  navigationMode?: NavigationMode;
  
  presets: IPreset[];
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

export interface ICardDisplaySettings {
  headerContent: string;
  bodyContent: string;
  footerContent: string;
}

export interface ICardStyle {
  backgroundColor: string;
  fontSize: number;
  borderStyle: string;
  borderColor: string;
  borderWidth: number;
  borderRadius: number;
}

export class CardNavigatorSettings {
  defaultMode: 'folder' | 'tag' = 'folder';
  cardDisplay: ICardDisplaySettings = {
    headerContent: 'filename',
    bodyContent: 'firstheader',
    footerContent: 'tags'
  };
  layout: ILayoutSettings = {
    mode: 'grid',
    cardWidth: 200,
    cardHeight: 150,
    gap: 10,
    padding: 10,
    layoutDirectionPreference: LayoutDirectionPreference.AUTO
  };
  style: {
    card: ICardStyle;
  } = {
    card: {
      backgroundColor: 'var(--background-primary)',
      fontSize: 14,
      borderStyle: 'solid',
      borderColor: 'var(--background-modifier-border)',
      borderWidth: 1,
      borderRadius: 4
    }
  };
  presets: IPreset[] = [];
} 