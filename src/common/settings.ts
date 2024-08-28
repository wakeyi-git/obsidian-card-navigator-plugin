// src/common/settings.ts

import { CardNavigatorSettings, SortCriterion } from './types';

export const DEFAULT_SETTINGS: CardNavigatorSettings = {
    cardsPerView: 6,
	useSelectedFolder: false,
    selectedFolder: null,
	sortCriterion: 'fileName' as SortCriterion,
    sortOrder: 'asc' as 'asc' | 'desc',
	renderContentAsHtml: false,
    centerCardMethod: 'scroll',
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
