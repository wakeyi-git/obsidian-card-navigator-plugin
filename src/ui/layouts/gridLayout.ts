import { LayoutStrategy, CardPosition } from './layoutStrategy';
import { Card } from '../../common/types';

export class GridLayout implements LayoutStrategy {
    constructor(private columns: number, private cardGap: number) {}

    arrange(cards: Card[], containerWidth: number, containerHeight: number, cardsPerView: number): CardPosition[] {
        const positions: CardPosition[] = [];
        const cardWidth = (containerWidth - (this.columns - 1) * this.cardGap) / this.columns;
        const cardHeight = cardWidth * 0.75; // Assuming a 4:3 aspect ratio

        cards.forEach((card, index) => {
            const column = index % this.columns;
            const row = Math.floor(index / this.columns);
            const isLastColumn = column === this.columns - 1;

            positions.push({
                card,
                x: column * (cardWidth + this.cardGap),
                y: row * (cardHeight + this.cardGap),
                width: isLastColumn ? cardWidth : cardWidth - this.cardGap,
                height: cardHeight
            });
        });

        return positions;
    }

    getScrollDirection(): 'vertical' | 'horizontal' {
        return 'vertical';
    }
}
