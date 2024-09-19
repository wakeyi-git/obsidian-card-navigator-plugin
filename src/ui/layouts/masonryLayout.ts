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
		if (!Array.isArray(cards) || cards.length === 0) {
			console.warn('The card array is empty or invalid.');
			return [];
		}
	
		const minDimension = 10; // 최소 허용 크기를 정의합니다
		if (isNaN(containerWidth) || isNaN(containerHeight) || containerWidth < minDimension || containerHeight < minDimension) {
			console.warn(`Container dimensions invalid or too small: ${containerWidth}x${containerHeight}`);
			return this.createDefaultLayout(cards);
		}

        if (containerWidth <= 0 || containerHeight <= 0) {
            console.warn('Invalid container dimensions.');
            return [];
        }

        const positions: CardPosition[] = [];
        // Initialize an array to keep track of each column's height
        const columnHeights = new Array(this.columns).fill(0);
        // Calculate the total width taken up by gaps between cards
        const totalGapWidth = this.cardGap * (this.columns - 1);
        // Calculate the width of each card
        const cardWidth = Math.max(1, (containerWidth - totalGapWidth) / this.columns);

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

        if (positions.length !== cards.length) {
            console.error('Mismatch between cards and positions array lengths.');
        }

        return positions;
    }

	private createDefaultLayout(cards: Card[]): CardPosition[] {
		// 모든 카드를 세로로 쌓는 간단한 레이아웃을 만듭니다
		return cards.map((card, index) => ({
			card,
			x: 0,
			y: index * 100, // 각 카드에 100px 높이를 할당
			width: 100,
			height: 100
		}));
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
            console.warn('카드 너비가 0 이하입니다. 기본 높이를 반환합니다.');
            return 100;
        }
        const baseHeight = 100; // Base height for card title, margins, etc.
        const lineHeight = 20; // Line height in pixels
        
        let contentLength = 0;
        // If there's a body length limit in the settings, use it
        if (this.settings?.bodyLengthLimit) {
            contentLength = Math.min(card.body?.length || 0, this.settings?.bodyLength || 0);
        } else {
            contentLength = card.body?.length || 0;
        }

        // Estimate number of lines (approximate calculation)
        const estimatedLines = Math.ceil(contentLength / (width / 10)); // Assuming font size of 10px

        // Return the total estimated height of the card
        return baseHeight + estimatedLines * lineHeight;
    }
}
