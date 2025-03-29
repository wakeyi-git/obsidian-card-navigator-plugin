import { TFile } from 'obsidian';
import { t } from 'i18next';
import { App } from 'obsidian';
import { ICardService } from '../services/ICardService';
import { CardNavigatorView } from '../../presentation/views/CardNavigatorView';
import { CardService } from '../services/CardService';

/**
 * 검색 옵션 인터페이스
 */
export interface SearchOptions {
    useRegex: boolean;
    caseSensitive: boolean;
    searchInTitle: boolean;
    searchInHeaders: boolean;
    searchInTags: boolean;
    searchInFrontmatter: boolean;
    searchInContent: boolean;
}

/**
 * 기본 검색 옵션
 */
export const DEFAULT_SEARCH_OPTIONS: SearchOptions = {
    useRegex: false,
    caseSensitive: false,
    searchInTitle: true,
    searchInHeaders: true,
    searchInTags: true,
    searchInFrontmatter: true,
    searchInContent: true
};

/**
 * 배치 처리 크기
 */
export const BATCH_SIZE = 50;

/**
 * 카드 컨텐츠 섹션 타입
 */
export type ContentSectionType = 'fileName' | 'firstHeader' | 'body' | 'tags' | 'date' | 'property';

/**
 * 카드셋 타입
 */
export type CardSetType = 'folder' | 'tag' | 'link' | 'activeFolder' | 'selectedFolder' | 'vault';

/**
 * 정렬 기준
 */
export type SortCriterion = 'fileName' | 'updateDate' | 'createDate' | 'property' | 'lastModified' | 'created';

/**
 * 정렬 순서
 */
export type SortOrder = 'asc' | 'desc';

/**
 * 필터 타입
 */
export type FilterType = 'search' | 'tag' | 'folder' | 'date';

/**
 * 기본 레이아웃 타입
 */
export type DefaultLayout = 'auto' | 'list' | 'grid' | 'masonry';

/**
 * 스크롤 방향 타입
 */
export type ScrollDirection = 'up' | 'down' | 'left' | 'right';

/**
 * 카드 네비게이터 설정 구조
 */
export interface CardNavigatorSettings {
  // 폴더 관련 설정
  cardSetType: CardSetType;
  selectedFolder: string | null;
  
  // 정렬 관련 설정
  sortCriterion: SortCriterion;
  sortOrder: SortOrder;
  
  // 렌더링 관련 설정
  renderContentAsHtml: boolean;
  dragDropContent: boolean;
  defaultLayout: DefaultLayout;
  
  // 카드 레이아웃 설정
  cardWidthThreshold: number;
  alignCardHeight: boolean;
  cardsPerView: number;
  gridColumns: number;
  gridCardHeight: number;
  masonryColumns: number;
  
  // 카드 내용 표시 설정
  showFileName: boolean;
  showFirstHeader: boolean;
  showBody: boolean;
  bodyLengthLimit: boolean;
  bodyLength: number;
  
  // 폰트 크기 설정
  fileNameFontSize: number;
  firstHeaderFontSize: number;
  bodyFontSize: number;
  
  // 프리셋 관련 설정
  presetFolderPath: string;
  GlobalPreset: string;
  lastActivePreset: string;
  autoApplyPresets: boolean;
  autoApplyFolderPresets: boolean;
  folderPresets?: Record<string, string[]> | null;
  activeFolderPresets?: Record<string, string> | null;
  
  // 기타 설정
  enableScrollAnimation: boolean;
  
  // 인덱스 시그니처 추가
  [key: string]: any;
}

/**
 * 카드 스타일
 */
export interface CardStyle {
  width: number;
  height: number;
  fontSize: number;
  lineHeight: number;
  padding: number;
  margin: number;
  borderRadius: number;
  backgroundColor: string;
  textColor: string;
  borderWidth: number;
  borderColor: string;
  boxShadow: string;
}

/**
 * 컨텐츠 스타일 인터페이스
 */
export interface ContentStyle {
  backgroundColor: string;
  fontSize: number;
  borderColor: string;
  borderWidth: number;
}

/**
 * 카드 위치 인터페이스
 */
export interface CardPosition {
  left: number;
  top: number;
  width: number;
  height: number;
}

/**
 * 카드 컨텐츠 섹션 인터페이스
 */
export interface CardContentSection {
  type: ContentSectionType;
  value: string;
  style: ContentStyle;
}

/**
 * 카드 섹션 타입
 */
export type CardSectionType = 'header' | 'text' | 'list' | 'code';

/**
 * 카드 섹션
 */
export interface CardSection {
  type: CardSectionType;
  content: string;
  level?: number;
}

/**
 * 카드 내용
 */
export interface CardContent {
  header: CardSection[];
  body: CardSection[];
  footer: CardSection[];
}

/**
 * 필터 기준 인터페이스
 */
export interface FilterCriteria {
  value: string;
  options?: Record<string, any>;
}

/**
 * 카드 필터 인터페이스
 */
export interface CardFilter {
  type: FilterType;
  criteria: FilterCriteria;
}

/**
 * 카드 정렬 인터페이스
 */
export interface CardSort {
  criterion: SortCriterion;
  order: SortOrder;
  priorityTags?: string[];
  priorityFolders?: string[];
}

/**
 * 프리셋 구조 정의
 */
export interface Preset {
    name: string;
    settings: Partial<CardNavigatorSettings>;
    isDefault: boolean;
    description?: string;
}

/**
 * 폴더별 프리셋 구조 정의
 */
export interface FolderPresets {
    [folderPath: string]: string[];
}

/**
 * 숫자 설정 키 타입 정의
 */
export type NumberSettingKey = Extract<keyof CardNavigatorSettings, {
    [K in keyof CardNavigatorSettings]: CardNavigatorSettings[K] extends number ? K : never
}[keyof CardNavigatorSettings]>;

/**
 * 범위 설정 구성 인터페이스
 */
export interface RangeSettingConfig {
    min: number;
    max: number;
    step: number;
}

/**
 * 정렬 옵션 인터페이스
 */
export interface SortOption {
    value: string;
    label: string;
}

/**
 * 정렬 옵션 정의
 */
export const sortOptions: SortOption[] = [
    { value: 'fileName_asc', label: 'SORT_FILE_NAME_ASC' },
    { value: 'fileName_desc', label: 'SORT_FILE_NAME_DESC' },
    { value: 'lastModified_desc', label: 'SORT_LAST_MODIFIED_DESC' },
    { value: 'lastModified_asc', label: 'SORT_LAST_MODIFIED_ASC' },
    { value: 'created_desc', label: 'SORT_CREATED_DESC' },
    { value: 'created_asc', label: 'SORT_CREATED_ASC' },
];

/**
 * 정렬 옵션 번역
 */
export function getTranslatedSortOptions(): SortOption[] {
    return sortOptions.map(option => ({
        ...option,
        label: t(option.label)
    }));
}

// 기본 설정값 정의
export const DEFAULT_SETTINGS: CardNavigatorSettings = {
    cardSetType: 'activeFolder',
    selectedFolder: null,
    sortCriterion: 'fileName',
    sortOrder: 'asc',
    renderContentAsHtml: false,
    dragDropContent: false,
    defaultLayout: 'auto',
    cardWidthThreshold: 250,
    alignCardHeight: true,
    cardsPerView: 4,
    gridColumns: 4,
    gridCardHeight: 200,
    masonryColumns: 4,
    showFileName: true,
    showFirstHeader: true,
    showBody: true,
    bodyLengthLimit: true,
    bodyLength: 501,
    fileNameFontSize: 17,
    firstHeaderFontSize: 17,
    bodyFontSize: 15,
    presetFolderPath: 'CardNavigatorPresets',
    GlobalPreset: 'default',
    lastActivePreset: 'default',
    autoApplyPresets: false,
    autoApplyFolderPresets: false,
    folderPresets: {},
    activeFolderPresets: {},
    enableScrollAnimation: true
};

/**
 * 검색 제안 인터페이스
 */
export interface SearchSuggestion {
    value: string;
    type: 'path' | 'file' | 'tag' | 'property' | 'section';
    display: string;
    path?: string;
    score?: number;
}

/**
 * 최대 검색 기록 수
 */
export const MAX_SEARCH_HISTORY = 10;

/**
 * 최소 검색어 길이
 */
export const MIN_SEARCH_TERM_LENGTH = 2;

/**
 * 검색 디바운스 지연 시간 (ms)
 */
export const SEARCH_DEBOUNCE_DELAY = 200;

/**
 * 카드 내용 설정 인터페이스
 */
export interface ContentSetting {
    key: string;
    name: string;
    description: string;
}

/**
 * 카드 내용 설정 목록
 */
export const contentSettings: ContentSetting[] = [
    {
        key: 'showFileName',
        name: t('SETTINGS_SHOW_FILE_NAME'),
        description: t('SETTINGS_SHOW_FILE_NAME_DESC')
    },
    {
        key: 'showFirstHeader',
        name: t('SETTINGS_SHOW_FIRST_HEADER'),
        description: t('SETTINGS_SHOW_FIRST_HEADER_DESC')
    },
    {
        key: 'showBody',
        name: t('SETTINGS_SHOW_BODY'),
        description: t('SETTINGS_SHOW_BODY_DESC')
    }
];

/**
 * 폰트 크기 설정 인터페이스
 */
export interface FontSizeSetting {
    key: string;
    name: string;
    description: string;
}

/**
 * 폰트 크기 설정 목록
 */
export const fontSizeSettings: FontSizeSetting[] = [
    {
        key: 'fileNameFontSize',
        name: t('SETTINGS_FILE_NAME_FONT_SIZE'),
        description: t('SETTINGS_FILE_NAME_FONT_SIZE_DESC')
    },
    {
        key: 'firstHeaderFontSize',
        name: t('SETTINGS_FIRST_HEADER_FONT_SIZE'),
        description: t('SETTINGS_FIRST_HEADER_FONT_SIZE_DESC')
    },
    {
        key: 'bodyFontSize',
        name: t('SETTINGS_BODY_FONT_SIZE'),
        description: t('SETTINGS_BODY_FONT_SIZE_DESC')
    }
];

/**
 * 키보드 단축키 인터페이스
 */
export interface KeyboardShortcut {
    name: string;
    description: string;
}

/**
 * 키보드 단축키 목록
 */
export const keyboardShortcuts: KeyboardShortcut[] = [
    {
        name: t('KEYBOARD_SHORTCUT_OPEN'),
        description: t('KEYBOARD_SHORTCUT_OPEN_DESC')
    },
    {
        name: t('KEYBOARD_SHORTCUT_FOCUS'),
        description: t('KEYBOARD_SHORTCUT_FOCUS_DESC')
    },
    {
        name: t('KEYBOARD_SHORTCUT_NAVIGATE'),
        description: t('KEYBOARD_SHORTCUT_NAVIGATE_DESC')
    },
    {
        name: t('KEYBOARD_SHORTCUT_OPEN_CARD'),
        description: t('KEYBOARD_SHORTCUT_OPEN_CARD_DESC')
    },
    {
        name: t('KEYBOARD_SHORTCUT_CONTEXT_MENU'),
        description: t('KEYBOARD_SHORTCUT_CONTEXT_MENU_DESC')
    }
];

/**
 * 전역 설정 키 타입
 */
export type GlobalSettingsKey = 'presetFolderPath' | 'folderPresets' | 'activeFolderPresets' | 'GlobalPreset' | 'autoApplyFolderPresets';

/**
 * 전역 설정 키 목록
 */
export const globalSettingsKeys: GlobalSettingsKey[] = [
    'presetFolderPath',
    'folderPresets',
    'activeFolderPresets',
    'GlobalPreset',
    'autoApplyFolderPresets'
];

/**
 * 숫자 설정 구성
 */
export const rangeSettingConfigs: Record<NumberSettingKey, RangeSettingConfig> = {
    cardWidthThreshold: { min: 200, max: 500, step: 10 },
    cardsPerView: { min: 1, max: 10, step: 1 },
    gridColumns: { min: 1, max: 8, step: 1 },
    gridCardHeight: { min: 100, max: 400, step: 10 },
    masonryColumns: { min: 1, max: 8, step: 1 },
    bodyLength: { min: 100, max: 1000, step: 50 },
    fileNameFontSize: { min: 12, max: 24, step: 1 },
    firstHeaderFontSize: { min: 12, max: 24, step: 1 },
    bodyFontSize: { min: 12, max: 24, step: 1 }
};

/**
 * 새로고침 유형을 정의하는 enum
 */
export enum RefreshType {
    /**
     * 전체 새로고침
     */
    FULL = 'FULL',

    /**
     * 선택된 항목만 새로고침
     */
    SELECTION = 'SELECTION',

    /**
     * 내용만 새로고침
     */
    CONTENT = 'CONTENT'
}

/**
 * 확장된 App 인터페이스
 */
export interface ExtendedApp extends App {
    cardService: CardService;
    cardNavigatorView: CardNavigatorView;
} 