import { LayoutStrategy, CardPosition } from './layoutStrategy';
import { Card } from '../../common/types';

export class MasonryLayout implements LayoutStrategy {
    constructor(
        private columns: number,
        private cardGap: number,
        private isBodyLengthUnlimited: boolean,
        private bodyLength: number
    ) {}

    arrange(cards: Card[], containerWidth: number, containerHeight: number, cardsPerView: number): CardPosition[] {
        const positions: CardPosition[] = [];
        const columnHeights = new Array(this.columns).fill(0);
        const totalGapWidth = this.cardGap * (this.columns - 1);
        const cardWidth = (containerWidth - totalGapWidth) / this.columns;

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

        return positions;
    }

	getColumnsCount(): number {
		return this.columns;
	}

    getScrollDirection(): 'vertical' | 'horizontal' {
        return 'vertical';
    }

    private calculateCardHeight(card: Card, width: number): number {
        // 기본 높이 (카드 제목, 여백 등을 위한 공간)
        const baseHeight = 100;

        // 내용의 길이 계산
        let bodyLength = card.body?.length || 0;
        if (!this.isBodyLengthUnlimited) {
            bodyLength = Math.min(bodyLength, this.bodyLength);
        }

        // 내용의 줄 수 추정 (대략적인 계산)
        const estimatedLines = Math.ceil(bodyLength / (width / 10)); // 글자 크기를 10px로 가정

        // 줄 높이 (픽셀)
        const lineHeight = 20;

        // 전체 높이 계산
        return baseHeight + estimatedLines * lineHeight;
    }
}
