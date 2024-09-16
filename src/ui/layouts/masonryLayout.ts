import { LayoutStrategy, CardPosition } from './layoutStrategy';
import { Card } from '../../common/types';

// Class implementing the Masonry layout strategy for card arrangement
export class MasonryLayout implements LayoutStrategy {
    constructor(
        private columns: number,
        private cardGap: number,
        private isBodyLengthUnlimited: boolean,
        private bodyLength: number
    ) {}

    // Arrange cards in a Masonry layout
    arrange(cards: Card[], containerWidth: number, containerHeight: number, cardsPerView: number): CardPosition[] {
        const positions: CardPosition[] = [];
        const columnHeights = new Array(this.columns).fill(0); // Track height of each column
        const totalGapWidth = this.cardGap * (this.columns - 1);
        const cardWidth = (containerWidth - totalGapWidth) / this.columns;

        cards.forEach((card) => {
            // Find the column with the shortest height
            const shortestColumn = columnHeights.indexOf(Math.min(...columnHeights));
            const cardHeight = this.calculateCardHeight(card, cardWidth);

            // Position the card in the shortest column
            positions.push({
                card,
                x: shortestColumn * (cardWidth + this.cardGap),
                y: columnHeights[shortestColumn],
                width: cardWidth,
                height: cardHeight
            });

            // Update the height of the column
            columnHeights[shortestColumn] += cardHeight + this.cardGap;
        });

        return positions;
    }

    // Get the number of columns in the layout
	getColumnsCount(): number {
		return this.columns;
	}

    // Get the scroll direction for the layout
    getScrollDirection(): 'vertical' | 'horizontal' {
        return 'vertical';
    }

    // Calculate the height of a card based on its content
    private calculateCardHeight(card: Card, width: number): number {
        // Base height for card title, margins, etc.
        const baseHeight = 100;

        // Calculate content length
        let bodyLength = card.body?.length || 0;
        if (!this.isBodyLengthUnlimited) {
            bodyLength = Math.min(bodyLength, this.bodyLength);
        }

        // Estimate number of lines (approximate calculation)
        const estimatedLines = Math.ceil(bodyLength / (width / 10)); // Assuming font size of 10px

        // Line height in pixels
        const lineHeight = 20;

        // Calculate total height
        return baseHeight + estimatedLines * lineHeight;
    }
}
