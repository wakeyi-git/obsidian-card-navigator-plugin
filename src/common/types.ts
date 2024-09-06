//src/ui/common/types.ts

import { TFile } from 'obsidian';
import { t } from 'i18next';

export interface Card {
    file: TFile;
    fileName?: string;
    firstHeader?: string;
    content?: string;
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
    showContent: boolean;
    contentFontSize: number;
    contentLength: number;
    lastActivePreset: string;
    presets: Record<string, Preset>;
}

export const DEFAULT_SETTINGS: CardNavigatorSettings = {
    cardsPerView: 5,
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
    showContent: true,
    contentFontSize: 15,
    contentLength: 500,
    lastActivePreset: 'default',
    presets: {
        default: {
            name: 'Default',
            settings: {
                cardsPerView: 5,
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
                showContent: true,
                contentFontSize: 15,
                contentLength: 500,
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
    cardsPerView: { min: 1, max: 10, step: 1 },
    fileNameFontSize: { min: 15, max: 25, step: 1 },
    firstHeaderFontSize: { min: 15, max: 25, step: 1 },
    contentFontSize: { min: 10, max: 20, step: 1 },
    contentLength: { min: 0, max: 1000, step: 50 },
    animationDuration: { min: 100, max: 1000, step: 100 },
};

export const displaySettings: Array<{ name: string, key: keyof CardNavigatorSettings }> = [
    { name: 'Show File Name', key: 'showFileName' },
    { name: 'Show First Header', key: 'showFirstHeader' },
    { name: 'Show Content', key: 'showContent' },
];

export const fontSizeSettings: Array<{ name: string, key: NumberSettingKey }> = [
    { name: 'File Name Font Size', key: 'fileNameFontSize' },
    { name: 'First Header Font Size', key: 'firstHeaderFontSize' },
    { name: 'Content Font Size', key: 'contentFontSize' },
];

export const keyboardShortcuts: Array<{ name: string }> = [
    { name: 'Scroll Up One Card' },
    { name: 'Scroll Down One Card' },
    { name: 'Scroll Left One Card' },
    { name: 'Scroll Right One Card' },
    { name: 'Scroll Up/Left One Page' },
    { name: 'Scroll Down/Right One Page' },
    { name: 'Center Active Card' }
];

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

export function getTranslatedKeyboardShortcuts() {
    return keyboardShortcuts.map(shortcut => ({
        ...shortcut,
        name: t(shortcut.name)
    }));
}
