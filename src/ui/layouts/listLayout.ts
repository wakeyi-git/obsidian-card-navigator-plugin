import { LayoutStrategy, CardPosition } from './layoutStrategy';
import { Card } from '../../common/types';

export class ListLayout implements LayoutStrategy {
    constructor(private isVertical: boolean, private cardGap: number, private alignCardHeight: boolean) {}

    arrange(cards: Card[], containerWidth: number, containerHeight: number, cardsPerView: number): CardPosition[] {
        const positions: CardPosition[] = [];
        let currentPosition = 0;

        const fixedCardSize = this.alignCardHeight
            ? (this.isVertical
                ? (containerHeight - (cardsPerView - 1) * this.cardGap) / cardsPerView
                : (containerWidth - (cardsPerView - 1) * this.cardGap) / cardsPerView)
            : null;

        cards.forEach((card) => {
            const cardSize: number | 'auto' = fixedCardSize || 'auto';
            const position: CardPosition = {
                card,
                x: this.isVertical ? 0 : currentPosition,
                y: this.isVertical ? currentPosition : 0,
                width: this.isVertical ? containerWidth : cardSize,
                height: this.isVertical ? cardSize : containerHeight
            };
            positions.push(position);

            if (fixedCardSize) {
                currentPosition += fixedCardSize + this.cardGap;
            } else {
                currentPosition += (this.isVertical ? containerHeight : containerWidth) / cardsPerView + this.cardGap;
            }
        });

        return positions;
    }

    getScrollDirection(): 'vertical' | 'horizontal' {
        return this.isVertical ? 'vertical' : 'horizontal';
    }
}
