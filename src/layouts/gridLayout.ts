import { LayoutStrategy, CardPosition } from './layoutStrategy';
import { Card, CardNavigatorSettings } from 'common/types';

// Class implementing the Grid layout strategy for card arrangement
export class GridLayout implements LayoutStrategy {
    private cardWidth: number = 0;

    constructor(private columns: number, private cardGap: number, private settings: CardNavigatorSettings) {}

    setCardWidth(width: number): void {
        this.cardWidth = width;
    }

    // Arrange cards in a grid layout
    arrange(cards: Card[], containerWidth: number, containerHeight: number, cardsPerView: number): CardPosition[] {
        const positions: CardPosition[] = [];
        const totalGapWidth = this.cardGap * (this.columns - 1);
        const cardWidth = this.cardWidth || (containerWidth - totalGapWidth) / this.columns;
        
        // 그리드 모드에서는 항상 gridCardHeight 값을 사용
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
