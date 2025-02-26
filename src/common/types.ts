import { TFile } from 'obsidian';
import { t } from 'i18next';

//#region 기본 인터페이스
// 카드 객체 구조 정의
export interface Card {
    file: TFile;
    fileName?: string;
    firstHeader?: string;
    body?: string;
}

// 프리셋 구조 정의
export interface Preset {
    name: string;
    settings: Partial<CardNavigatorSettings>;
    isDefault: boolean;
    description?: string;
}

// 폴더별 프리셋 구조 정의
export interface FolderPresets {
    [folderPath: string]: string[];
}
//#endregion

//#region 설정 관련 타입
// 카드 네비게이터 설정 구조 정의
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
    defaultLayout: defaultLayout;
    
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
    useCssGridMode: boolean;
}

// 전역 설정 키 정의
export const globalSettingsKeys: (keyof CardNavigatorSettings)[] = [
    'presetFolderPath',
    'GlobalPreset',
    'lastActivePreset',
    'autoApplyPresets',
    'autoApplyFolderPresets',
    'folderPresets',
    'activeFolderPresets',
    'cardSetType',
    'selectedFolder'
];

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
    enableScrollAnimation: true,
    useCssGridMode: false
};
//#endregion

//#region 숫자 설정 관련 타입
// 숫자 설정 키 타입 정의
export type NumberSettingKey = Extract<keyof CardNavigatorSettings, {
    [K in keyof CardNavigatorSettings]: CardNavigatorSettings[K] extends number ? K : never
}[keyof CardNavigatorSettings]>;

// 범위 설정 구성 인터페이스
export interface RangeSettingConfig {
    min: number;
    max: number;
    step: number;
}

// 숫자 설정의 범위 구성 정의
export const rangeSettingConfigs: Record<NumberSettingKey, RangeSettingConfig> = {
    cardWidthThreshold: { min: 150, max: 600, step: 10 },
    gridColumns: { min: 1, max: 10, step: 1 },
    gridCardHeight: { min: 100, max: 500, step: 10 },
    masonryColumns: { min: 1, max: 10, step: 1 },
    cardsPerView: { min: 1, max: 10, step: 1 },
    fileNameFontSize: { min: 10, max: 25, step: 1 },
    firstHeaderFontSize: { min: 10, max: 25, step: 1 },
    bodyFontSize: { min: 10, max: 25, step: 1 },
    bodyLength: { min: 1, max: 1001, step: 50 },
};
//#endregion

//#region 공통 타입 정의
// 이벤트 핸들러 타입
export type EventHandler = () => void;
// 아이콘 이름 타입
export type IconName = 'folder' | 'arrow-up-narrow-wide' | 'settings';
// 스크롤 방향 타입
export type ScrollDirection = 'up' | 'down' | 'left' | 'right';
// 정렬 기준 타입
export type SortCriterion = 'fileName' | 'lastModified' | 'created';
// 정렬 순서 타입
export type SortOrder = 'asc' | 'desc';
// 기본 레이아웃 타입
export type defaultLayout = 'auto' | 'list' | 'grid' | 'masonry';
// 툴바 메뉴 타입
export type ToolbarMenu = 'sort' | 'settings';
// 카드 세트 타입
export type CardSetType = 'activeFolder' | 'selectedFolder' | 'vault';
//#endregion

//#region UI 설정 옵션
// 정렬 옵션 정의
export const sortOptions: Array<{ value: string, label: string }> = [
    { value: 'fileName_asc', label: 'SORT_FILE_NAME_ASC' },
    { value: 'fileName_desc', label: 'SORT_FILE_NAME_DESC' },
    { value: 'lastModified_desc', label: 'SORT_LAST_MODIFIED_DESC' },
    { value: 'lastModified_asc', label: 'SORT_LAST_MODIFIED_ASC' },
    { value: 'created_desc', label: 'SORT_CREATED_DESC' },
    { value: 'created_asc', label: 'SORT_CREATED_ASC' },
];

// 내용 표시 설정 정의
export const contentSettings: Array<{ name: string, key: keyof CardNavigatorSettings, description: string }> = [
    { name: 'SHOW_FILE_NAME', key: 'showFileName', description: 'TOGGLE_FILE_NAME_DISPLAY' },
    { name: 'SHOW_FIRST_HEADER', key: 'showFirstHeader', description: 'TOGGLE_FIRST_HEADER_DISPLAY' },
    { name: 'SHOW_BODY', key: 'showBody', description: 'TOGGLE_BODY_DISPLAY' },
];

// 폰트 크기 설정 정의
export const fontSizeSettings: Array<{ name: string, key: keyof CardNavigatorSettings, description: string }> = [
    { name: 'FILE_NAME_FONT_SIZE', key: 'fileNameFontSize', description: 'SET_FILE_NAME_FONT_SIZE' },
    { name: 'FIRST_HEADER_FONT_SIZE', key: 'firstHeaderFontSize', description: 'SET_FIRST_HEADER_FONT_SIZE' },
    { name: 'BODY_FONT_SIZE', key: 'bodyFontSize', description: 'SET_BODY_FONT_SIZE' },
];

// 키보드 단축키 정의
export const keyboardShortcuts: Array<{ name: string, description: string }> = [
    { name: 'SCROLL_UP_ONE_CARD', description: 'MOVE_UP_ONE_CARD' },
    { name: 'SCROLL_DOWN_ONE_CARD', description: 'MOVE_DOWN_ONE_CARD' },
    { name: 'SCROLL_LEFT_ONE_CARD', description: 'MOVE_LEFT_ONE_CARD' },
    { name: 'SCROLL_RIGHT_ONE_CARD', description: 'MOVE_RIGHT_ONE_CARD' },
    { name: 'SCROLL_UP_LEFT_ONE_PAGE', description: 'MOVE_UP_LEFT_ONE_PAGE' },
    { name: 'SCROLL_DOWN_RIGHT_ONE_PAGE', description: 'MOVE_DOWN_RIGHT_ONE_PAGE' },
    { name: 'CENTER_ACTIVE_CARD', description: 'CENTER_CURRENTLY_ACTIVE_CARD' },
    { name: 'MOVE_FOCUS_TO_CARD_NAVIGATOR', description: 'SET_FOCUS_TO_CARD_NAVIGATOR' },
    { name: 'OPEN_CARD_CONTEXT_MENU', description: 'OPEN_CONTEXT_MENU_FOR_FOCUSED_CARD' }
];
//#endregion

//#region 번역 유틸리티 함수
// 키보드 단축키 번역
export function getTranslatedKeyboardShortcuts() {
    return keyboardShortcuts.map(shortcut => ({
        name: t(shortcut.name),
        description: t(shortcut.description)
    }));
}

// 정렬 옵션 번역
export function getTranslatedSortOptions() {
    return sortOptions.map(option => ({
        ...option,
        label: t(option.label)
    }));
}

// 표시 설정 번역
export function getTranslatedDisplaySettings() {
    return contentSettings.map(setting => ({
        ...setting,
        name: t(setting.name)
    }));
}

// 폰트 크기 설정 번역
export function getTranslatedFontSizeSettings() {
    return fontSizeSettings.map(setting => ({
        ...setting,
        name: t(setting.name)
    }));
}
//#endregion

//#region 검색 관련 타입
// 검색 관련 상수
export const SEARCH_DEBOUNCE_DELAY = 300;
export const MIN_SEARCH_TERM_LENGTH = 2;
export const MAX_SEARCH_HISTORY = 10;
export const BATCH_SIZE = 20;

// 검색 옵션 인터페이스
export interface SearchOptions {
    searchInTitle?: boolean;      // 제목 검색
    searchInHeaders?: boolean;    // 헤더 검색
    searchInTags?: boolean;       // 태그 검색
    searchInContent?: boolean;    // 내용 검색
    searchInFrontmatter?: boolean; // 프론트매터 검색
    caseSensitive?: boolean;      // 대소문자 구분
    useRegex?: boolean;           // 정규식 사용
}

// 기본 검색 옵션
export const DEFAULT_SEARCH_OPTIONS: SearchOptions = {
    searchInTitle: true,
    searchInHeaders: true,
    searchInTags: true,
    searchInContent: true,
    searchInFrontmatter: true,
    caseSensitive: false,
    useRegex: false,
};

// 검색 결과 인터페이스
export interface SearchResult {
    file: TFile;
    matches: {
        type: 'title' | 'header' | 'tag' | 'content' | 'frontmatter';
        text: string;
        position?: number;
    }[];
}

// 검색어 추천을 위한 인터페이스
export interface SearchSuggestion {
    value: string;
    type: 'path' | 'file' | 'tag' | 'property' | 'section';
    display: string;
}

// 검색 상태 인터페이스
export interface SearchState {
    isSearching: boolean;
    lastSearchTerm: string;
    searchHistory: SearchHistory;
    searchService: SearchService;
}

// 검색 서비스 인터페이스
export interface SearchService {
    setOptions(options: Partial<SearchOptions>): void;
    getOption<K extends keyof SearchOptions>(key: K): SearchOptions[K];
    searchFiles(files: TFile[], searchTerm: string): Promise<TFile[]>;
}

// 검색 히스토리 인터페이스
export interface SearchHistory {
    add(term: string): void;
    recent: string[];
    clear(): void;
}
//#endregion
