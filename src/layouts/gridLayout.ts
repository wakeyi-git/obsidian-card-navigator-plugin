import { LayoutStrategy, CardPosition } from './layoutStrategy';
import { Card, CardNavigatorSettings } from 'common/types';
import { LayoutConfig } from './layoutConfig';

/**
 * 그리드 레이아웃 전략을 구현하는 클래스
 * 카드를 격자 형태로 배열합니다.
 */
export class GridLayout implements LayoutStrategy {
    //#region 클래스 속성
    private cardWidth: number = 0;
    private layoutConfig: LayoutConfig;
    //#endregion

    //#region 초기화
    // 생성자: 그리드 레이아웃 초기화
    constructor(
        private columns: number,
        private cardGap: number,
        private settings: CardNavigatorSettings,
        layoutConfig: LayoutConfig
    ) {
        this.layoutConfig = layoutConfig;
    }
    //#endregion

    //#region 카드 크기 및 레이아웃 관리
    // 카드 너비 설정
    setCardWidth(width: number): void {
        this.cardWidth = width || this.layoutConfig.calculateCardWidth(this.columns);
    }

    // 카드를 그리드 형태로 배치
    arrange(cards: Card[], containerWidth: number, containerHeight: number, cardsPerView: number): CardPosition[] {
        const positions: CardPosition[] = [];
        const cardWidth = this.cardWidth || this.layoutConfig.calculateCardWidth(this.columns);
        const cardHeight = this.settings.alignCardHeight 
            ? this.layoutConfig.calculateCardHeight(containerHeight, cardsPerView)
            : this.settings.gridCardHeight;

        cards.forEach((card, index) => {
            const column = index % this.columns;
            const row = Math.floor(index / this.columns);

            positions.push({
                card,
                x: column * (cardWidth + this.layoutConfig.getCardGap()),
                y: row * (cardHeight + this.layoutConfig.getCardGap()),
                width: cardWidth,
                height: cardHeight
            });
        });

        return positions;
    }
    //#endregion

    //#region 레이아웃 속성 조회
    // 그리드의 열 수 반환
    getColumnsCount(): number {
        return this.columns;
    }

    // 스크롤 방향 반환 (항상 수직)
    getScrollDirection(): 'vertical' | 'horizontal' {
        return 'vertical';
    }
    //#endregion
}
