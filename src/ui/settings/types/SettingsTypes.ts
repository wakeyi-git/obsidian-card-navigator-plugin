import { ModeType } from '../../../domain/mode/Mode';

/**
 * 카드 네비게이터 설정 인터페이스
 */
export interface ICardNavigatorSettings {
  // 기본 설정
  defaultMode: ModeType;
  defaultLayout: 'grid' | 'masonry';
  includeSubfolders: boolean;
  defaultCardSet: string;
  isCardSetFixed: boolean;
  tagCaseSensitive?: boolean;
  
  // 카드 설정
  cardWidth: number;
  cardHeight: number;
  cardHeaderContent?: string;
  cardBodyContent?: string;
  cardFooterContent?: string;
  renderingMode?: string;
  
  // 카드 스타일 설정
  normalCardBgColor?: string;
  activeCardBgColor?: string;
  focusedCardBgColor?: string;
  headerBgColor?: string;
  bodyBgColor?: string;
  footerBgColor?: string;
  headerFontSize?: number;
  bodyFontSize?: number;
  footerFontSize?: number;
  
  // 검색 설정
  tagModeSearchOptions?: string[];
  folderModeSearchOptions?: string[];
  frontmatterSearchKey?: string;
  defaultSearchScope?: 'all' | 'current';
  
  // 정렬 설정
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  customSortKey?: string;
  
  // 레이아웃 설정
  fixedCardHeight?: boolean;
  cardMinWidth?: number;
  cardMinHeight?: number;
  
  // 우선 순위 설정
  priorityTags: string[];
  priorityFolders: string[];
  
  // 프리셋 설정
  folderPresetMappings?: {folder: string, presetId: string}[];
  tagPresetMappings?: {tag: string, presetId: string}[];
  presetPriorities?: {id: string, type: 'folder' | 'tag', target: string}[];
}

/**
 * 설정 탭 속성 인터페이스
 */
export interface ISettingsTabProps {
  settings: Partial<ICardNavigatorSettings> & {
    // 콜백 함수들 추가
    onLayoutChange?: (layout: 'grid' | 'masonry') => void;
    onPresetApply?: (presetId: string) => void;
    onPresetSave?: () => void;
    onPresetDelete?: (presetId: string) => void;
  };
  onChange: (key: keyof ICardNavigatorSettings, value: any) => void;
  service: any;
}

/**
 * 프리셋 인터페이스
 */
export interface IPreset {
  id: string;
  name: string;
  description?: string;
}