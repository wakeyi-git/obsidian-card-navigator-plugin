import { LayoutStrategy, CardPosition } from './layoutStrategy';
import { Card } from 'common/types';

// Class implementing the List layout strategy for card arrangement
export class ListLayout implements LayoutStrategy {
    private cardWidth: number = 0;

    constructor(private isVertical: boolean, private cardGap: number, private alignCardHeight: boolean) {}

    setCardWidth(width: number): void {
        this.cardWidth = width;
    }

    // Arrange cards in a list layout (either vertical or horizontal)
    arrange(cards: Card[], containerWidth: number, containerHeight: number, cardsPerView: number): CardPosition[] {
        const positions: CardPosition[] = [];
        let currentPosition = 0;

        // 카드 크기 계산
        const cardSize: { width: number, height: number | 'auto' } = this.isVertical
            ? {
                width: containerWidth,  // 세로 모드: 컨테이너의 전체 너비
                height: this.alignCardHeight 
                    ? (containerHeight - (this.cardGap * (cardsPerView - 1))) / cardsPerView 
                    : 'auto'
            }
            : {
                width: (containerWidth - (this.cardGap * (cardsPerView - 1))) / cardsPerView,  // 가로 모드: 컨테이너 너비를 cardsPerView로 나눔
                height: containerHeight  // 가로 모드: 컨테이너의 전체 높이
            };

        cards.forEach((card) => {
            const position: CardPosition = {
                card,
                x: this.isVertical ? 0 : currentPosition,
                y: this.isVertical ? currentPosition : 0,
                width: cardSize.width,
                height: cardSize.height
            };
            positions.push(position);

            // Update position for the next card
            const positionDelta = this.isVertical
                ? (cardSize.height === 'auto' ? containerHeight / cardsPerView : cardSize.height)
                : cardSize.width;
            currentPosition += positionDelta + this.cardGap;
        });

        return positions;
    }

    // Get the number of columns in the layout (always 1 for list layout)
	getColumnsCount(): number {
		return 1;
	}

    // Get the scroll direction based on layout orientation
    getScrollDirection(): 'vertical' | 'horizontal' {
        return this.isVertical ? 'vertical' : 'horizontal';
    }

    // Get the container style for the list layout
    getContainerStyle(): Partial<CSSStyleDeclaration> {
        return {
            display: 'flex',
            flexDirection: this.isVertical ? 'column' : 'row',
            gap: `${this.cardGap}px`,
            alignItems: 'stretch',
            overflowY: this.isVertical ? 'auto' : 'hidden',
            overflowX: this.isVertical ? 'hidden' : 'auto',
            height: '100%',
            width: 'calc(100% + var(--size-4-3))',
			paddingRight: 'var(--size-4-3)'
        };
    }

    // Get the card style for the list layout
    getCardStyle(): Partial<CSSStyleDeclaration> {
        const style: Partial<CSSStyleDeclaration> = {
            flexShrink: '0'
        };

        if (this.isVertical) {
            // 세로 모드
            style.width = '100%';
            style.height = this.alignCardHeight
                ? `calc((100% - var(--card-navigator-gap) * (var(--cards-per-view) - 1)) / var(--cards-per-view))`
                : 'auto';
        } else {
            // 가로 모드
            style.width = `calc((100% - var(--card-navigator-gap) * (var(--cards-per-view) - 1)) / var(--cards-per-view))`;
            style.height = '100%';
        }

        return style;
    }
}
