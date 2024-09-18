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
    isDefault?: boolean;
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
    defaultLayout: 'auto' | 'list' | 'grid' | 'masonry';
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
    presets: Record<string, Preset>;
	folderPresets: FolderPresets;
	autoApplyPresets: boolean;
	lastActivePreset: string;
}

export const globalSettingsKeys: (keyof CardNavigatorSettings)[] = [
    'presets',
    'lastActivePreset',
    'autoApplyPresets',
    'folderPresets',
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
    presets: {
        default: {
            name: 'default',
            settings: {},
			isDefault: true
        }
    },
	folderPresets: {},
	autoApplyPresets: false,
    lastActivePreset: 'default'
};

// Function to initialize default settings
export function initializeDefaultSettings(): void {
    const defaultSettings = Object.fromEntries(
        Object.entries(DEFAULT_SETTINGS).filter(
            ([key]) => key !== 'presets' && key !== 'lastActivePreset'
        )
    );

    if (DEFAULT_SETTINGS.presets && DEFAULT_SETTINGS.presets.default) {
        DEFAULT_SETTINGS.presets.default.settings = defaultSettings;
    } else {
        console.error('Default preset is not properly initialized');
    }
}

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

// Define display settings for the UI
export const displaySettings: Array<{ name: string, key: keyof CardNavigatorSettings, description: string }> = [
    { name: 'Show File Name', key: 'showFileName', description: 'Toggle File Name Display' },
    { name: 'Show First Header', key: 'showFirstHeader', description: 'Toggle First Header Display' },
    { name: 'Show Body', key: 'showBody', description: 'Toggle Body Display' },
];

// Define font size settings for the UI
export const fontSizeSettings: Array<{ name: string, key: keyof CardNavigatorSettings, description: string }> = [
    { name: 'File Name Font Size', key: 'fileNameFontSize', description: 'Set Font Size for File Name' },
    { name: 'First Header Font Size', key: 'firstHeaderFontSize', description: 'Set Font Size for First Header' },
    { name: 'Body Font Size', key: 'bodyFontSize', description: 'Set Font Size for Body' },
];

// Define keyboard shortcuts for the application
export const keyboardShortcuts: Array<{ name: string, description: string }> = [
    { name: 'Scroll Up One Card', description: 'Move up by one card' },
    { name: 'Scroll Down One Card', description: 'Move down by one card' },
    { name: 'Scroll Left One Card', description: 'Move left by one card' },
    { name: 'Scroll Right One Card', description: 'Move right by one card' },
    { name: 'Scroll Up/Left One Page', description: 'Move up/left by one page of cards' },
    { name: 'Scroll Down/Right One Page', description: 'Move down/right by one page of cards' },
    { name: 'Center Active Card', description: 'Center the currently active card' },
    { name: 'Focus Card Navigator', description: 'Set focus to the Card Navigator' },
    { name: 'Open Card Context Menu', description: 'Open the context menu for the focused card' }
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
    return displaySettings.map(setting => ({
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
