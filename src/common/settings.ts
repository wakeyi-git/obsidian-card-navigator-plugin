// src/common/settings.ts

import { CardNavigatorSettings, SortCriterion } from './types';

export const DEFAULT_SETTINGS: CardNavigatorSettings = {
    cardsPerView: 6,
	useSelectedFolder: false,
    selectedFolder: null,
	sortCriterion: 'fileName' as SortCriterion,
    sortOrder: 'asc' as 'asc' | 'desc',
	fixedCardHeight: true,
	renderContentAsHtml: false,
	centerActiveCardOnOpen: true,
	centerCardMethod: 'scroll',
	animationDuration: 300,
	centerActiveCardHotkey: { modifiers: ["Ctrl", "Mod"], key: "Home" },
	activeCardBorderColor: 'var(--active-border-color)',
    activeCardBackgroundColor: 'var(--active-background-color)',
	dragDropContent: false,
    showFileName: true,
    fileNameSize: 20,
    showFirstHeader: true,
    firstHeaderSize: 18,
    showContent: true,
    contentSize: 15,
    contentLength: 5,
}
