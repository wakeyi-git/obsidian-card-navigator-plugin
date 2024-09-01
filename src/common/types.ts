// src/common/types.ts

import { TFile } from 'obsidian';
import { t } from 'i18next';

export interface Card {
    file: TFile;
    fileName?: string;
    firstHeader?: string;
    content?: string;
}

export type EventHandler = () => void;

export type IconName = 'folder' | 'arrow-up-narrow-wide' | 'settings';

export type ScrollDirection = 'up' | 'down' | 'left' | 'right';

export type SortCriterion = 'fileName' | 'lastModified' | 'created';

export const sortOptions: Array<{ value: string, label: string }> = [
    { value: 'fileName_asc', label: t('File name (A to Z)') },
    { value: 'fileName_desc', label: t('File name (Z to A)') },
    { value: 'lastModified_desc', label: t('Last modified (newest first)') },
    { value: 'lastModified_asc', label: t('Last modified (oldest first)') },
    { value: 'created_desc', label: t('Created (newest first)') },
    { value: 'created_asc', label: t('Created (oldest first)') },
];

export const displaySettings: Array<{ name: string, key: keyof CardNavigatorSettings }> = [
    { name: t('Show File Name'), key: 'showFileName' },
    { name: t('Show First Header'), key: 'showFirstHeader' },
    { name: t('Show Content'), key: 'showContent' },
];

export const keyboardShortcuts: Array<{ name: string }> = [
    { name: t('Scroll Up One Card') },
    { name: t('Scroll Down One Card') },
    { name: t('Scroll Left One Card') },
    { name: t('Scroll Right One Card') },
    { name: t('Scroll Up/Left One Page') },
    { name: t('Scroll Down/Right One Page') },
    { name: t('Center Active Card') }
];

export interface CardNavigatorSettings {
    cardsPerView: number;
    useSelectedFolder: boolean;
    selectedFolder: string | null;
    sortCriterion: SortCriterion;
    sortOrder: 'asc' | 'desc';
    fixedCardHeight: boolean;
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

export type NumberSettingKey = Extract<keyof CardNavigatorSettings, {
    [K in keyof CardNavigatorSettings]: CardNavigatorSettings[K] extends number ? K : never
}[keyof CardNavigatorSettings]>;

export interface RangeSettingConfig {
    min: number;
    max: number;
    step: number;
}

export const rangeSettingConfigs: Record<NumberSettingKey, RangeSettingConfig> = {
    cardsPerView: { min: 1, max: 10, step: 1 },
    fileNameSize: { min: 15, max: 25, step: 1 },
    firstHeaderSize: { min: 15, max: 25, step: 1 },
    contentSize: { min: 10, max: 20, step: 1 },
    contentLength: { min: 1, max: 10, step: 1 },
    animationDuration: { min: 100, max: 1000, step: 100 },
};

export const fontSizeSettings: Array<{ name: string, key: NumberSettingKey }> = [
    { name: t('File Name Size'), key: 'fileNameSize' },
    { name: t('First Header Size'), key: 'firstHeaderSize' },
    { name: t('Content Size'), key: 'contentSize' },
];
