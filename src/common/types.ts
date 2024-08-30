// src/common/types.ts

import { TFile, Hotkey } from 'obsidian';

export interface Card {
    file: TFile;
    fileName?: string;
    firstHeader?: string;
    content?: string;
}

export type SortCriterion = 'fileName' | 'lastModified' | 'created';

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
	centerActiveCardHotkey?: Hotkey;
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
