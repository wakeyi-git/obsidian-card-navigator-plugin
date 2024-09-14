import { TFile } from 'obsidian';
import { t } from 'i18next';

export interface Card {
    file: TFile;
    fileName?: string;
    firstHeader?: string;
    body?: string;
}

export interface Preset {
    name: string;
    settings: Partial<CardNavigatorSettings>;
}

export type EventHandler = () => void;

export type IconName = 'folder' | 'arrow-up-narrow-wide' | 'settings';

export type ScrollDirection = 'up' | 'down' | 'left' | 'right';

export type SortCriterion = 'fileName' | 'lastModified' | 'created';

export type SortOrder = 'asc' | 'desc';

export type ToolbarMenu = 'sort' | 'settings';

export const sortOptions: Array<{ value: string, label: string }> = [
    { value: 'fileName_asc', label: 'File name (A to Z)' },
    { value: 'fileName_desc', label: 'File name (Z to A)' },
    { value: 'lastModified_desc', label: 'Last modified (newest first)' },
    { value: 'lastModified_asc', label: 'Last modified (oldest first)' },
    { value: 'created_desc', label: 'Created (newest first)' },
    { value: 'created_asc', label: 'Created (oldest first)' },
];

export type NumberSettingKey = Extract<keyof CardNavigatorSettings, {
    [K in keyof CardNavigatorSettings]: CardNavigatorSettings[K] extends number ? K : never
}[keyof CardNavigatorSettings]>;

export interface CardNavigatorSettings {
    defaultLayout: 'auto' | 'list' | 'grid' | 'masonry';
    cardWidthThreshold: number;
    gridColumns: number;
    masonryColumns: number;
    cardsPerView: number;
    useSelectedFolder: boolean;
    selectedFolder: string | null;
    sortCriterion: SortCriterion;
    sortOrder: SortOrder;
    alignCardHeight: boolean;
    renderContentAsHtml: boolean;
    centerActiveCardOnOpen: boolean;
    centerCardMethod: 'scroll' | 'centered';
    animationDuration: number;
    activeCardBorderColor: string;
    activeCardBackgroundColor: string;
    dragDropContent: boolean;
    showFileName: boolean;
    fileNameFontSize: number;
    showFirstHeader: boolean;
    firstHeaderFontSize: number;
    showBody: boolean;
    bodyFontSize: number;
    bodyLength: number;
    isBodyLengthUnlimited: boolean;
	lastActivePreset: string;
    presets: Record<string, Preset>;
}

export const DEFAULT_SETTINGS: CardNavigatorSettings = {
    defaultLayout: 'auto',
    cardWidthThreshold: 250,
    gridColumns: 4,
    masonryColumns: 4,
    cardsPerView: 4,
    useSelectedFolder: false,
    selectedFolder: null,
    sortCriterion: 'fileName',
    sortOrder: 'asc',
    alignCardHeight: true,
    renderContentAsHtml: false,
    centerActiveCardOnOpen: true,
    centerCardMethod: 'scroll',
    animationDuration: 300,
    activeCardBorderColor: 'var(--active-border-color)',
    activeCardBackgroundColor: 'var(--active-background-color)',
    dragDropContent: false,
    showFileName: true,
    fileNameFontSize: 20,
    showFirstHeader: true,
    firstHeaderFontSize: 20,
    showBody: true,
    bodyFontSize: 15,
    bodyLength: 500,
    isBodyLengthUnlimited: false,
    lastActivePreset: 'default',
    presets: {
        default: {
            name: 'default',
            settings: {
				defaultLayout: 'auto',
				cardWidthThreshold: 250,
				gridColumns: 4,
				masonryColumns: 4,
				cardsPerView: 4,
				useSelectedFolder: false,
				selectedFolder: null,
				sortCriterion: 'fileName',
				sortOrder: 'asc',
				alignCardHeight: true,
				renderContentAsHtml: false,
				centerActiveCardOnOpen: true,
				centerCardMethod: 'scroll',
				animationDuration: 300,
				activeCardBorderColor: 'var(--active-border-color)',
				activeCardBackgroundColor: 'var(--active-background-color)',
				dragDropContent: false,
				showFileName: true,
				fileNameFontSize: 20,
				showFirstHeader: true,
				firstHeaderFontSize: 20,
				showBody: true,
				bodyFontSize: 15,
				bodyLength: 500,
				isBodyLengthUnlimited: false,
			}
        }
    }
};

export interface RangeSettingConfig {
    min: number;
    max: number;
    step: number;
}

export const rangeSettingConfigs: Record<NumberSettingKey, RangeSettingConfig> = {
	cardWidthThreshold: { min: 150, max: 600, step: 10 },
	gridColumns: { min: 1, max: 10, step: 1 },
    masonryColumns: { min: 1, max: 10, step: 1 },
    cardsPerView: { min: 1, max: 10, step: 1 },
    fileNameFontSize: { min: 15, max: 25, step: 1 },
    firstHeaderFontSize: { min: 15, max: 25, step: 1 },
    bodyFontSize: { min: 10, max: 20, step: 1 },
    bodyLength: { min: 1, max: 1001, step: 50 },
    animationDuration: { min: 100, max: 1000, step: 100 },
};

export const displaySettings: Array<{ name: string, key: keyof CardNavigatorSettings, description: string }> = [
    { name: 'Show File Name', key: 'showFileName', description: 'Toggle File Name Display' },
    { name: 'Show First Header', key: 'showFirstHeader', description: 'Toggle First Header Display' },
    { name: 'Show Body', key: 'showBody', description: 'Toggle Body Display' },
];

export const fontSizeSettings: Array<{ name: string, key: keyof CardNavigatorSettings, description: string }> = [
    { name: 'File Name Font Size', key: 'fileNameFontSize', description: 'Set Font Size for File Name' },
    { name: 'First Header Font Size', key: 'firstHeaderFontSize', description: 'Set Font Size for First Header' },
    { name: 'Body Font Size', key: 'bodyFontSize', description: 'Set Font Size for Body' },
];

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

// Function to translate the keyboard shortcuts
export function getTranslatedKeyboardShortcuts() {
    return keyboardShortcuts.map(shortcut => ({
        name: t(shortcut.name),
        description: t(shortcut.description)
    }));
}

// Function to translate the labels
export function getTranslatedSortOptions() {
    return sortOptions.map(option => ({
        ...option,
        label: t(option.label)
    }));
}

export function getTranslatedDisplaySettings() {
    return displaySettings.map(setting => ({
        ...setting,
        name: t(setting.name)
    }));
}

export function getTranslatedFontSizeSettings() {
    return fontSizeSettings.map(setting => ({
        ...setting,
        name: t(setting.name)
    }));
}
