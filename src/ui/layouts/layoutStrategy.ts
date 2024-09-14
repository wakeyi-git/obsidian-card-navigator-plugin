import { Card } from '../../common/types';

export interface LayoutStrategy {
    arrange(cards: Card[], containerWidth: number, containerHeight: number, cardsPerView: number): CardPosition[];
    getScrollDirection(): 'vertical' | 'horizontal';
	getColumnsCount(): number;
}

export interface CardPosition {
    card: Card;
    x: number;
    y: number;
    width: number | 'auto';
    height: number | 'auto';
}
