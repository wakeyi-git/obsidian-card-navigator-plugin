import { LayoutStrategy, CardPosition } from './layoutStrategy';
import { Card } from '../../common/types';

// Class implementing the List layout strategy for card arrangement
export class ListLayout implements LayoutStrategy {
    constructor(private isVertical: boolean, private cardGap: number, private alignCardHeight: boolean) {}

    // Arrange cards in a list layout (either vertical or horizontal)
    arrange(cards: Card[], containerWidth: number, containerHeight: number, cardsPerView: number): CardPosition[] {
        const positions: CardPosition[] = [];
        let currentPosition = 0;

        // Calculate card size based on container dimensions and number of cards per view
        const cardSize = this.isVertical
            ? (containerHeight - (cardsPerView - 1) * this.cardGap) / cardsPerView
            : (containerWidth - (cardsPerView - 1) * this.cardGap) / cardsPerView;

        cards.forEach((card) => {
            const position: CardPosition = {
                card,
                x: this.isVertical ? 0 : currentPosition,
                y: this.isVertical ? currentPosition : 0,
                width: this.isVertical ? containerWidth : cardSize,
                height: this.isVertical ? cardSize : containerHeight
            };
            positions.push(position);

            // Update position for the next card
            currentPosition += cardSize + this.cardGap;
        });

        return positions;
    }

    // Get the number of columns in the layout (always 1 for list layout)
	getColumnsCount(): number {
		return 1;
	}

    // Get the scroll direction based on layout orientation
    getScrollDirection(): 'vertical' | 'horizontal' {
        return this.isVertical ? 'vertical' : 'horizontal';
    }

    // Get the container style for the list layout
    getContainerStyle(): Partial<CSSStyleDeclaration> {
        return {
            display: 'flex',
            flexDirection: this.isVertical ? 'column' : 'row',
            gap: `${this.cardGap}px`,
            alignItems: 'stretch',
            overflow: this.isVertical ? 'auto hidden' : 'hidden auto',
            height: '100%',
            width: 'calc(100% + var(--size-4-3))',
			paddingRight: 'var(--size-4-3)'
        };
    }

    // Get the card style for the list layout
    getCardStyle(): Partial<CSSStyleDeclaration> {
        return {
            flex: this.alignCardHeight ? '0 0 auto' : '1 0 auto',
            minHeight: this.isVertical ? '0' : '100%',
            minWidth: this.isVertical ? '100%' : '0'
        };
    }
}
