// masonryLayout.ts
import { LayoutStrategy, CardPosition } from './layoutStrategy';
import { Card , CardNavigatorSettings } from '../../common/types';

// Class implementing the Masonry layout strategy for card arrangement
export class MasonryLayout implements LayoutStrategy {
    constructor(
        private columns: number,
        private cardGap: number,
        private settings: CardNavigatorSettings
    ) {}

    // Arrange cards in a masonry layout
    arrange(cards: Card[], containerWidth: number, containerHeight: number, cardsPerView: number): CardPosition[] {
        const positions: CardPosition[] = [];
        // Initialize an array to keep track of each column's height
        const columnHeights = new Array(this.columns).fill(0);
        // Calculate the total width taken up by gaps between cards
        const totalGapWidth = this.cardGap * (this.columns - 1);
        // Calculate the width of each card
        const cardWidth = (containerWidth - totalGapWidth) / this.columns;

        // Iterate through each card and position it
        cards.forEach((card) => {
            // Find the column with the shortest height
            const shortestColumn = columnHeights.indexOf(Math.min(...columnHeights));
            // Calculate the height of the current card
            const cardHeight = this.calculateCardHeight(card, cardWidth);

            // Add the card's position to the positions array
            positions.push({
                card,
                x: shortestColumn * (cardWidth + this.cardGap),
                y: columnHeights[shortestColumn],
                width: cardWidth,
                height: cardHeight
            });

            // Update the height of the column where the card was placed
            columnHeights[shortestColumn] += cardHeight + this.cardGap;
        });

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
        const baseHeight = 100; // Base height for card title, margins, etc.
        const lineHeight = 20; // Line height in pixels
        
        let contentLength = 0;
        // If there's a body length limit in the settings, use it
        if (this.settings.bodyLengthLimit) {
            contentLength = Math.min(card.body?.length || 0, this.settings.bodyLength);
        } else {
            contentLength = card.body?.length || 0;
        }

        // Estimate number of lines (approximate calculation)
        const estimatedLines = Math.ceil(contentLength / (width / 10)); // Assuming font size of 10px

        // Return the total estimated height of the card
        return baseHeight + estimatedLines * lineHeight;
    }
}
