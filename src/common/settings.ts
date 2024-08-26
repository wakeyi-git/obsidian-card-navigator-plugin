// src/common/settings.ts

import { CardNavigatorSettings } from './types';

export const DEFAULT_SETTINGS: CardNavigatorSettings = {
    cardsPerView: 6,
    centerCardMethod: 'scroll',
    activeCardBorderColor: 'var(--active-border-color)',
    activeCardBackgroundColor: 'var(--active-background-color)',
    sortCriterion: 'fileName',
	dragDropContent: false,
    showFileName: true,
    fileNameSize: 20,
    showFirstHeader: true,
    firstHeaderSize: 18,
    showContent: true,
    contentSize: 15,
    contentLength: 5,
}
