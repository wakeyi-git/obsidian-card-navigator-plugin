// masonryLayout.ts
import { LayoutStrategy, CardPosition } from './layoutStrategy';
import { Card, CardNavigatorSettings } from '../../common/types';

// Class implementing the Masonry layout strategy for card arrangement
export class MasonryLayout implements LayoutStrategy {
    constructor(
        private columns: number,
        private cardGap: number,
        private settings: CardNavigatorSettings
    ) {
        if (columns <= 0) {
            throw new Error('The number of columns must be greater than 0');
        }
    }

    // Arrange cards in a masonry layout
	arrange(cards: Card[], containerWidth: number, containerHeight: number, cardsPerView: number): CardPosition[] {
        const positions: CardPosition[] = [];
        const columnHeights = new Array(this.columns).fill(0);
        const totalGapWidth = this.cardGap * (this.columns - 1);
        const cardWidth = Math.max(1, (containerWidth - totalGapWidth) / this.columns);

        cards.forEach((card) => {
            const shortestColumn = columnHeights.indexOf(Math.min(...columnHeights));
            const cardHeight = this.calculateCardHeight(card, cardWidth);

            positions.push({
                card,
                x: shortestColumn * (cardWidth + this.cardGap),
                y: columnHeights[shortestColumn],
                width: cardWidth,
                height: cardHeight
            });

            columnHeights[shortestColumn] += cardHeight + this.cardGap;
        });

        if (positions.length !== cards.length) {
            console.error('Mismatch between cards and positions array lengths.');
        }

        return positions;
    }

    // Return the number of columns in the layout
    getColumnsCount(): number {
        return this.columns;
    }

    // Return the scroll direction for this layout
    getScrollDirection(): 'vertical' | 'horizontal' {
        return 'vertical';
    }

    // Calculate the height of a card based on its content
    private calculateCardHeight(card: Card, width: number): number {
        if (width <= 0) {
            return 100;
        }
        const baseHeight = 100;
        const lineHeight = 20;

        let contentLength = 0;

		if (this.settings?.bodyLengthLimit) {
            contentLength = Math.min(card.body?.length || 0, this.settings?.bodyLength || 0);
        } else {
            contentLength = card.body?.length || 0;
        }

        const estimatedLines = Math.ceil(contentLength / (width / 10));

        return baseHeight + estimatedLines * lineHeight;
    }
}
