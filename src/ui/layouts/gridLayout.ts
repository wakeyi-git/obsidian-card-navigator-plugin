// gridLayout.ts
import { LayoutStrategy, CardPosition } from './layoutStrategy';
import { Card, CardNavigatorSettings } from '../../common/types';

// Class implementing the Grid layout strategy for card arrangement
export class GridLayout implements LayoutStrategy {
    constructor(private columns: number, private cardGap: number, private settings: CardNavigatorSettings) {}

    // Arrange cards in a grid layout
    arrange(cards: Card[], containerWidth: number, containerHeight: number, cardsPerView: number): CardPosition[] {
        if (this.columns <= 0) {
            throw new Error('Number of columns must be greater than 0');
        }
        if (containerWidth <= 0) {
            throw new Error('Container width must be greater than 0');
        }

        const positions: CardPosition[] = [];
        // Calculate total width of gaps between cards
        const totalGapWidth = this.cardGap * (this.columns - 1);
        // Calculate card width based on container width, number of columns, and gaps
        const cardWidth = (containerWidth - totalGapWidth) / this.columns;
        // Set card height
        const cardHeight = this.settings.gridCardHeight;

        cards.forEach((card, index) => {
            // Calculate column and row for each card
            const column = index % this.columns;
            const row = Math.floor(index / this.columns);

            // Add card position to the positions array
            positions.push({
                card,
                x: column * (cardWidth + this.cardGap),
                y: row * (cardHeight + this.cardGap),
                width: cardWidth,
                height: cardHeight
            });
        });

        return positions;
    }

    // Get the number of columns in the grid
    getColumnsCount(): number {
        return this.columns;
    }

    // Get the scroll direction for the grid layout (always vertical)
    getScrollDirection(): 'vertical' | 'horizontal' {
        return 'vertical';
    }
}
