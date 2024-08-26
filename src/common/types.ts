// src/common/types.ts

import { TFile } from 'obsidian';

export interface Card {
    file: TFile;
    fileName?: string;
    firstHeader?: string;
    content?: string;
}

export type SortCriterion = 'fileName' | 'lastModified' | 'created';

export interface CardNavigatorSettings {
    cardsPerView: number;
    centerCardMethod: 'scroll' | 'centered';
    activeCardBorderColor: string;
    activeCardBackgroundColor: string;
    sortCriterion: SortCriterion;
	dragDropContent: boolean;
    showFileName: boolean;
    fileNameSize: number;
    showFirstHeader: boolean;
    firstHeaderSize: number;
    showContent: boolean;
    contentSize: number;
    contentLength: number;
}
