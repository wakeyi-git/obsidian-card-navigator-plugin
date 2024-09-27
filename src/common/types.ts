import { TFile } from 'obsidian';
import { t } from 'i18next';

// Define the structure of a Card object
export interface Card {
    file: TFile;
    fileName?: string;
    firstHeader?: string;
    body?: string;
}

// Define the structure of a preset
export interface Preset {
    name: string;
    settings: Partial<CardNavigatorSettings>;
    isDefault: boolean;
    description?: string;
}

export interface FolderPresets {
    [folderPath: string]: string[];
}

// Define the structure of CardNavigator settings
export interface CardNavigatorSettings {
    useSelectedFolder: boolean;
    selectedFolder: string | null;
    sortCriterion: SortCriterion;
    sortOrder: SortOrder;
    renderContentAsHtml: boolean;
    dragDropContent: boolean;
    centerActiveCardOnOpen: boolean;
    defaultLayout: defaultLayout;
    cardWidthThreshold: number;
    alignCardHeight: boolean;
    cardsPerView: number;
    gridColumns: number;
    gridCardHeight: number;
    masonryColumns: number;
    showFileName: boolean;
    showFirstHeader: boolean;
    showBody: boolean;
    bodyLengthLimit: boolean;
    bodyLength: number;
    fileNameFontSize: number;
    firstHeaderFontSize: number;
    bodyFontSize: number;
    presetFolderPath: string;
    GlobalPreset: string;
    lastActivePreset: string;
    autoApplyFolderPresets: boolean;
    folderPresets?: Record<string, string[]> | null;
    activeFolderPresets?: Record<string, string> | null;
}

export const globalSettingsKeys: (keyof CardNavigatorSettings)[] = [
    'presetFolderPath',
    'GlobalPreset',
    'lastActivePreset',
    'autoApplyFolderPresets',
    'folderPresets',
    'activeFolderPresets',
	'useSelectedFolder',
	'selectedFolder'
] as const;

// Define default settings for the CardNavigator
export const DEFAULT_SETTINGS: CardNavigatorSettings = {
    useSelectedFolder: false,
    selectedFolder: null,
    sortCriterion: 'fileName',
    sortOrder: 'asc',
    renderContentAsHtml: false,
    dragDropContent: false,
    centerActiveCardOnOpen: true,
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
    autoApplyFolderPresets: false,
    folderPresets: {},
    activeFolderPresets: {}
};


// Define a type for numeric setting keys
export type NumberSettingKey = Extract<keyof CardNavigatorSettings, {
    [K in keyof CardNavigatorSettings]: CardNavigatorSettings[K] extends number ? K : never
}[keyof CardNavigatorSettings]>;

// Define the structure for range setting configurations
export interface RangeSettingConfig {
    min: number;
    max: number;
    step: number;
}

// Define range setting configurations for numeric settings
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

// Define common types used throughout the application
export type EventHandler = () => void;
export type IconName = 'folder' | 'arrow-up-narrow-wide' | 'settings';
export type ScrollDirection = 'up' | 'down' | 'left' | 'right';
export type SortCriterion = 'fileName' | 'lastModified' | 'created';
export type SortOrder = 'asc' | 'desc';
export type defaultLayout = 'auto' | 'list' | 'grid' | 'masonry';
export type ToolbarMenu = 'sort' | 'settings';

// Define sorting options for the application
export const sortOptions: Array<{ value: string, label: string }> = [
    { value: 'fileName_asc', label: 'SORT_FILE_NAME_ASC' },
    { value: 'fileName_desc', label: 'SORT_FILE_NAME_DESC' },
    { value: 'lastModified_desc', label: 'SORT_LAST_MODIFIED_DESC' },
    { value: 'lastModified_asc', label: 'SORT_LAST_MODIFIED_ASC' },
    { value: 'created_desc', label: 'SORT_CREATED_DESC' },
    { value: 'created_asc', label: 'SORT_CREATED_ASC' },
];

// Define content settings for the UI
export const contentSettings: Array<{ name: string, key: keyof CardNavigatorSettings, description: string }> = [
    { name: 'SHOW_FILE_NAME', key: 'showFileName', description: 'TOGGLE_FILE_NAME_DISPLAY' },
    { name: 'SHOW_FIRST_HEADER', key: 'showFirstHeader', description: 'TOGGLE_FIRST_HEADER_DISPLAY' },
    { name: 'SHOW_BODY', key: 'showBody', description: 'TOGGLE_BODY_DISPLAY' },
];

// Define font size settings for the UI
export const fontSizeSettings: Array<{ name: string, key: keyof CardNavigatorSettings, description: string }> = [
    { name: 'FILE_NAME_FONT_SIZE', key: 'fileNameFontSize', description: 'SET_FILE_NAME_FONT_SIZE' },
    { name: 'FIRST_HEADER_FONT_SIZE', key: 'firstHeaderFontSize', description: 'SET_FIRST_HEADER_FONT_SIZE' },
    { name: 'BODY_FONT_SIZE', key: 'bodyFontSize', description: 'SET_BODY_FONT_SIZE' },
];

// Define keyboard shortcuts for the application
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

// Function to translate keyboard shortcuts
export function getTranslatedKeyboardShortcuts() {
    return keyboardShortcuts.map(shortcut => ({
        name: t(shortcut.name),
        description: t(shortcut.description)
    }));
}

// Function to translate sort options
export function getTranslatedSortOptions() {
    return sortOptions.map(option => ({
        ...option,
        label: t(option.label)
    }));
}

// Function to translate display settings
export function getTranslatedDisplaySettings() {
    return contentSettings.map(setting => ({
        ...setting,
        name: t(setting.name)
    }));
}

// Function to translate font size settings
export function getTranslatedFontSizeSettings() {
    return fontSizeSettings.map(setting => ({
        ...setting,
        name: t(setting.name)
    }));
}
