// src/common/settings.ts

import { CardNavigatorSettings, SortCriterion, SortOrder } from './types';

export const DEFAULT_SETTINGS: CardNavigatorSettings = {
    cardsPerView: 5,
	useSelectedFolder: false,
    selectedFolder: null,
	sortCriterion: 'fileName' as SortCriterion,
    sortOrder: 'asc' as SortOrder,
	alignCardHeight: true,
	renderContentAsHtml: false,
	centerActiveCardOnOpen: true,
	centerCardMethod: 'scroll',
	animationDuration: 300,
	activeCardBorderColor: 'var(--active-border-color)',
    activeCardBackgroundColor: 'var(--active-background-color)',
	dragDropContent: false,
    showFileName: true,
    fileNameSize: 20,
    showFirstHeader: true,
    firstHeaderSize: 20,
    showContent: true,
    contentSize: 15,
    contentLength: 500,
}
