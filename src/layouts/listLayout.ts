import { LayoutStrategy, CardPosition } from './layoutStrategy';
import { Card } from 'common/types';
import { LayoutConfig } from './layoutConfig';

/**
 * 리스트 레이아웃 전략을 구현하는 클래스
 * 카드를 세로 또는 가로 방향의 목록으로 배열합니다.
 */
export class ListLayout implements LayoutStrategy {
    //#region 클래스 속성
    private cardWidth: number = 0;
    private layoutConfig: LayoutConfig;
    //#endregion

    //#region 초기화
    // 생성자: 리스트 레이아웃 초기화
    constructor(
        private isVertical: boolean,
        private cardGap: number,
        private alignCardHeight: boolean,
        layoutConfig: LayoutConfig
    ) {
        this.layoutConfig = layoutConfig;
    }

    // 카드 너비 설정
    setCardWidth(width: number): void {
        this.cardWidth = width || this.layoutConfig.calculateCardWidth(1);
    }
    //#endregion

    //#region 카드 배치 및 레이아웃 관리
    // 카드를 리스트 형태로 배치 (세로 또는 가로)
    arrange(cards: Card[], containerWidth: number, containerHeight: number, cardsPerView: number): CardPosition[] {
        const positions: CardPosition[] = [];
        let currentPosition = 0;

        // 카드 크기 계산
        const cardSize: { width: number, height: number | 'auto' } = this.isVertical
            ? {
                width: containerWidth,
                height: this.alignCardHeight 
                    ? this.layoutConfig.calculateCardHeight(containerHeight, cardsPerView)
                    : 'auto'
            }
            : {
                width: this.layoutConfig.calculateCardWidth(cardsPerView),
                height: containerHeight
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

            // 다음 카드의 위치 업데이트
            const positionDelta = this.isVertical
                ? (cardSize.height === 'auto' ? containerHeight / cardsPerView : cardSize.height)
                : cardSize.width;
            currentPosition += positionDelta + this.layoutConfig.getCardGap();
        });

        return positions;
    }

    // 컨테이너 스타일 가져오기
    getContainerStyle(): Partial<CSSStyleDeclaration> {
        return this.layoutConfig.getContainerStyle(this.isVertical);
    }

    // 카드 스타일 가져오기
    getCardStyle(): Partial<CSSStyleDeclaration> {
        return this.layoutConfig.getCardStyle(this.isVertical, this.alignCardHeight);
    }
    //#endregion

    //#region 레이아웃 속성 조회
    // 열 수 반환 (리스트는 항상 1)
    getColumnsCount(): number {
        return 1;
    }

    // 스크롤 방향 반환 (레이아웃 방향에 따라)
    getScrollDirection(): 'vertical' | 'horizontal' {
        return this.isVertical ? 'vertical' : 'horizontal';
    }
    //#endregion
}
