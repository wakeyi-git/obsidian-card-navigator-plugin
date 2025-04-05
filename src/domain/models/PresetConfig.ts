import { PresetMappingType } from './Preset';

/**
 * 자동 적용 프리셋 설정 인터페이스
 */
export interface IAutoApplyPresetConfig {
  readonly applyGlobalPreset: boolean;
  readonly applyFolderPreset: boolean;
  readonly applyTagPreset: boolean;
  readonly applyDatePreset: boolean;
  readonly applyPropertyPreset: boolean;
}

/**
 * 폴더 프리셋 매핑 인터페이스
 */
export interface IFolderPresetMapping {
  readonly folderPath: string;
  readonly presetId: string;
  readonly priority: number;
}

/**
 * 태그 프리셋 매핑 인터페이스
 */
export interface ITagPresetMapping {
  readonly tag: string;
  readonly presetId: string;
  readonly priority: number;
}

/**
 * 날짜 프리셋 매핑 인터페이스
 */
export interface IDatePresetMapping {
  readonly startDate: string;
  readonly endDate: string;
  readonly presetId: string;
  readonly priority: number;
}

/**
 * 속성 프리셋 매핑 인터페이스
 */
export interface IPropertyPresetMapping {
  readonly property: string;
  readonly value: string;
  readonly presetId: string;
  readonly priority: number;
}

/**
 * 프리셋 일반 설정 인터페이스
 */
export interface IPresetGeneralConfig {
  readonly autoApplyPreset: IAutoApplyPresetConfig;
  readonly globalPreset: string;
  readonly folderPresetMappings: IFolderPresetMapping[];
  readonly tagPresetMappings: ITagPresetMapping[];
  readonly datePresetMappings: IDatePresetMapping[];
  readonly propertyPresetMappings: IPropertyPresetMapping[];
}

/**
 * 프리셋 설정 항목 인터페이스
 */
export interface IPresetSettingsItem {
  readonly name: string;
  readonly description: string;
  readonly category?: string;
  readonly settings: {
    readonly card: {
      readonly cardGeneral: any;
      readonly cardContent: any;
      readonly cardStyle: any;
    };
    readonly cardSet: any;
    readonly layout: any;
    readonly search: any;
    readonly sort: any;
  };
}

/**
 * 프리셋 리스트 인터페이스
 */
export interface IPresetList {
  readonly [key: string]: IPresetSettingsItem;
}

/**
 * 프리셋 설정 인터페이스
 */
export interface IPresetConfig {
  readonly presetGeneral: IPresetGeneralConfig;
  readonly presetList: IPresetList;
}

/**
 * 자동 적용 프리셋 기본 설정
 */
export const DEFAULT_AUTO_APPLY_PRESET_CONFIG: IAutoApplyPresetConfig = {
  applyGlobalPreset: true,
  applyFolderPreset: true,
  applyTagPreset: true,
  applyDatePreset: false,
  applyPropertyPreset: false
};

/**
 * 프리셋 일반 설정 기본값
 */
export const DEFAULT_PRESET_GENERAL_CONFIG: IPresetGeneralConfig = {
  autoApplyPreset: DEFAULT_AUTO_APPLY_PRESET_CONFIG,
  globalPreset: 'default',
  folderPresetMappings: [],
  tagPresetMappings: [],
  datePresetMappings: [],
  propertyPresetMappings: []
};

/**
 * 기본 프리셋 목록
 */
export const DEFAULT_PRESET_LIST: IPresetList = {
  default: {
    name: '기본 프리셋',
    description: '기본 설정값으로 구성된 프리셋',
    category: '기본',
    settings: {
      card: {
        cardGeneral: {},
        cardContent: {},
        cardStyle: {}
      },
      cardSet: {},
      layout: {},
      search: {},
      sort: {}
    }
  }
};

/**
 * 프리셋 설정 기본값
 */
export const DEFAULT_PRESET_CONFIG: IPresetConfig = {
  presetGeneral: DEFAULT_PRESET_GENERAL_CONFIG,
  presetList: DEFAULT_PRESET_LIST
}; 