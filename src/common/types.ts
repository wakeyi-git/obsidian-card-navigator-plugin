// types.ts
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
    presets: Record<string, Preset>;
    lastActivePreset: string;
    autoApplyFolderPresets: boolean;
    folderPresets: { [folderPath: string]: string[] };
    activeFolderPresets: { [folderPath: string]: string };
}

export const globalSettingsKeys: (keyof CardNavigatorSettings)[] = [
	'presetFolderPath',
	'presets',
    'lastActivePreset',
    'autoApplyFolderPresets',
    'folderPresets',
	'activeFolderPresets'
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
    fileNameFontSize: 20,
    firstHeaderFontSize: 20,
    bodyFontSize: 15,
	presetFolderPath: 'CardNavigatorPresets',
    presets: {},
    lastActivePreset: '',
    autoApplyFolderPresets: true,
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
    fileNameFontSize: { min: 15, max: 25, step: 1 },
    firstHeaderFontSize: { min: 15, max: 25, step: 1 },
    bodyFontSize: { min: 10, max: 20, step: 1 },
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
    { value: 'fileName_asc', label: 'File name (A to Z)' },
    { value: 'fileName_desc', label: 'File name (Z to A)' },
    { value: 'lastModified_desc', label: 'Last modified (newest first)' },
    { value: 'lastModified_asc', label: 'Last modified (oldest first)' },
    { value: 'created_desc', label: 'Created (newest first)' },
    { value: 'created_asc', label: 'Created (oldest first)' },
];

// Define content settings for the UI
export const contentSettings: Array<{ name: string, key: keyof CardNavigatorSettings, description: string }> = [
    { name: 'Show file name', key: 'showFileName', description: 'Toggle file name display' },
    { name: 'Show first header', key: 'showFirstHeader', description: 'Toggle first header display' },
    { name: 'Show body', key: 'showBody', description: 'Toggle body display' },
];

// Define font size settings for the UI
export const fontSizeSettings: Array<{ name: string, key: keyof CardNavigatorSettings, description: string }> = [
    { name: 'File name font size', key: 'fileNameFontSize', description: 'Set font size for file name' },
    { name: 'First header font size', key: 'firstHeaderFontSize', description: 'Set font size for first header' },
    { name: 'Body font size', key: 'bodyFontSize', description: 'Set font size for body' },
];

// Define keyboard shortcuts for the application
export const keyboardShortcuts: Array<{ name: string, description: string }> = [
    { name: 'Scroll up one card', description: 'Move up by one card.' },
    { name: 'Scroll down one card', description: 'Move down by one card.' },
    { name: 'Scroll left one card', description: 'Move left by one card.' },
    { name: 'Scroll right one card', description: 'Move right by one card.' },
    { name: 'Scroll up/left one page', description: 'Move up/left by one page of cards.' },
    { name: 'Scroll down/right one page', description: 'Move down/right by one page of cards.' },
    { name: 'Center active card', description: 'Center the currently active card.' },
    { name: 'Move focus to Card Navigator', description: 'Set focus to the Card Navigator.' },
    { name: 'Open card context menu', description: 'Open the context menu for the focused card.' }
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
