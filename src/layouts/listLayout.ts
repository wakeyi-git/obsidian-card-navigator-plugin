import { LayoutStrategy, CardPosition } from './layoutStrategy';
import { Card, CardNavigatorSettings } from 'common/types';
import { LayoutConfig } from './layoutConfig';

/**
 * 리스트 레이아웃 전략을 구현하는 클래스
 * 카드를 세로 또는 가로 방향의 목록으로 배열합니다.
 */
export class ListLayout implements LayoutStrategy {
    //#region 클래스 속성
    private cardWidth: number = 0;
    private layoutConfig: LayoutConfig;
    private settings: CardNavigatorSettings;
    private alignCardHeight: boolean;
    //#endregion

    //#region 초기화
    // 생성자: 리스트 레이아웃 초기화
    constructor(
        private isVertical: boolean,
        private cardGap: number,
        alignCardHeight: boolean,
        settings: CardNavigatorSettings,
        layoutConfig: LayoutConfig
    ) {
        this.layoutConfig = layoutConfig;
        this.settings = settings;
        this.alignCardHeight = alignCardHeight;
    }

    // 카드 너비 설정
    setCardWidth(width: number): void {
        this.cardWidth = width || this.layoutConfig.calculateCardWidth(1);
    }

    /**
     * 설정을 업데이트합니다.
     */
    public updateSettings(settings: CardNavigatorSettings) {
        this.settings = settings;
        this.alignCardHeight = settings.alignCardHeight;
    }
    //#endregion

    //#region 카드 배치 및 레이아웃 관리
    // 카드를 리스트 형태로 배치 (세로 또는 가로)
    arrange(cards: Card[], containerWidth: number, containerHeight: number): CardPosition[] {
        const positions: CardPosition[] = [];
        const cardGap = this.layoutConfig.getCardGap();
        let currentPosition = 0;

        // 최신 설정값으로 카드 높이 계산
        const cardHeight = this.layoutConfig.calculateCardHeight('list');
        const cardWidth = this.isVertical ? containerWidth : this.cardWidth;

        cards.forEach((card) => {
            const position: CardPosition = {
                card,
                x: this.isVertical ? 0 : currentPosition,
                y: this.isVertical ? currentPosition : 0,
                width: cardWidth,
                height: cardHeight
            };
            positions.push(position);

            // 최신 설정값으로 위치 계산
            const positionDelta = this.isVertical ? 
                (typeof cardHeight === 'number' ? cardHeight : containerHeight / this.settings.cardsPerView) : 
                cardWidth;
            currentPosition += positionDelta + cardGap;
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
