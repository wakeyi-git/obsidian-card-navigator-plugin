import { LayoutStrategy, CardPosition } from './layoutStrategy';
import { Card } from '../../common/types';

export class GridLayout implements LayoutStrategy {
    constructor(private columns: number, private cardGap: number) {}

    arrange(cards: Card[], containerWidth: number, containerHeight: number, cardsPerView: number): CardPosition[] {
        const positions: CardPosition[] = [];
        const totalGapWidth = this.cardGap * (this.columns - 1);
        const cardWidth = (containerWidth - totalGapWidth) / this.columns;
        const cardHeight = cardWidth * 0.75; // Assuming a 4:3 aspect ratio

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

	getColumnsCount(): number {
		return this.columns;
	}

    getScrollDirection(): 'vertical' | 'horizontal' {
        return 'vertical';
    }
}
