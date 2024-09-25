// gridLayout.ts
import { LayoutStrategy, CardPosition } from './layoutStrategy';
import { Card, CardNavigatorSettings } from '../../common/types';

// Class implementing the Grid layout strategy for card arrangement
export class GridLayout implements LayoutStrategy {
    constructor(private columns: number, private cardGap: number, private settings: CardNavigatorSettings) {}

    // Arrange cards in a grid layout
	arrange(cards: Card[], containerWidth: number, _containerHeight: number, _cardsPerView: number): CardPosition[] {
		const positions: CardPosition[] = [];
		const totalGapWidth = this.cardGap * (this.columns - 1);
		const cardWidth = (containerWidth - totalGapWidth) / this.columns;
		const cardHeight = this.settings.gridCardHeight;

        cards.forEach((card, index) => {
            const column = index % this.columns;
            const row = Math.floor(index / this.columns);

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
