import { TFile } from 'obsidian';

// Defines the structure of a card
export interface Card {
    file: TFile;
    fileName?: string;
    firstHeader?: string;
    content?: string;
}

// Defines a simple event handler function type
export type EventHandler = () => void;

// Defines the possible icon names used in the plugin
export type IconName = 'folder' | 'arrow-up-narrow-wide' | 'settings';

// Defines the possible scroll directions
export type ScrollDirection = 'up' | 'down' | 'left' | 'right';

// Defines the possible sort criteria for files
export type SortCriterion = 'fileName' | 'lastModified' | 'created';

// Defines the possible sort orders
export type SortOrder = 'asc' | 'desc';

// Defines the possible sort orders
export type ToolbarMenu = 'sort' | 'settings';

// Defines the available sort options
export const sortOptions: Array<{ value: string, label: string }> = [
    { value: 'fileName_asc', label: 'File name (A to Z)' },
    { value: 'fileName_desc', label: 'File name (Z to A)' },
    { value: 'lastModified_desc', label: 'Last modified (newest first)' },
    { value: 'lastModified_asc', label: 'Last modified (oldest first)' },
    { value: 'created_desc', label: 'Created (newest first)' },
    { value: 'created_asc', label: 'Created (oldest first)' },
];

// Extracts the keys of CardNavigatorSettings that have number values
export type NumberSettingKey = Extract<keyof CardNavigatorSettings, {
    [K in keyof CardNavigatorSettings]: CardNavigatorSettings[K] extends number ? K : never
}[keyof CardNavigatorSettings]>;

// Defines the structure of the plugin settings
export interface CardNavigatorSettings {
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
    fileNameSize: number;
    showFirstHeader: boolean;
    firstHeaderSize: number;
    showContent: boolean;
    contentSize: number;
    contentLength: number;
}

// Defines the structure of a range setting configuration
export interface RangeSettingConfig {
    min: number;
    max: number;
    step: number;
}

// Defines the range configurations for number settings
export const rangeSettingConfigs: Record<NumberSettingKey, RangeSettingConfig> = {
    cardsPerView: { min: 1, max: 10, step: 1 },
    fileNameSize: { min: 15, max: 25, step: 1 },
    firstHeaderSize: { min: 15, max: 25, step: 1 },
    contentSize: { min: 10, max: 20, step: 1 },
    contentLength: { min: 0, max: 1000, step: 50 },
    animationDuration: { min: 100, max: 1000, step: 100 },
};

// Defines the display settings
export const displaySettings: Array<{ name: string, key: keyof CardNavigatorSettings }> = [
    { name: 'Show File Name', key: 'showFileName' },
    { name: 'Show First Header', key: 'showFirstHeader' },
    { name: 'Show Content', key: 'showContent' },
];

// Defines the font size settings
export const fontSizeSettings: Array<{ name: string, key: NumberSettingKey }> = [
    { name: 'File Name Font Size', key: 'fileNameSize' },
    { name: 'First Header Font Size', key: 'firstHeaderSize' },
    { name: 'Content Font Size', key: 'contentSize' },
];

// Defines the available keyboard shortcuts
export const keyboardShortcuts: Array<{ name: string }> = [
    { name: 'Scroll Up One Card' },
    { name: 'Scroll Down One Card' },
    { name: 'Scroll Left One Card' },
    { name: 'Scroll Right One Card' },
    { name: 'Scroll Up/Left One Page' },
    { name: 'Scroll Down/Right One Page' },
    { name: 'Center Active Card' }
];
