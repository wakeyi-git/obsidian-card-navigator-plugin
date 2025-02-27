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
        console.log(`[CardNavigator] ListLayout 생성: isVertical = ${isVertical}, alignCardHeight = ${alignCardHeight}`);
    }

    // 카드 너비 설정
    setCardWidth(width: number): void {
        this.cardWidth = width || this.layoutConfig.calculateCardWidth(this.settings.cardsPerView);
        console.log(`[CardNavigator] ListLayout 카드 너비 설정: ${this.cardWidth}px`);
    }

    /**
     * 설정을 업데이트합니다.
     */
    public updateSettings(settings: CardNavigatorSettings) {
        this.settings = settings;
        this.alignCardHeight = settings.alignCardHeight;
        // 카드 너비 재계산
        this.setCardWidth(this.layoutConfig.calculateCardWidth(this.isVertical ? 1 : this.settings.cardsPerView));
    }
    //#endregion

    //#region 카드 배치 및 레이아웃 관리
    // 카드를 리스트 형태로 배치 (세로 또는 가로)
    arrange(cards: Card[], containerWidth: number, containerHeight: number): CardPosition[] {
        console.log(`[CardNavigator] ListLayout arrange 호출: isVertical = ${this.isVertical}, 컨테이너 크기 = ${containerWidth}x${containerHeight}`);
        
        const positions: CardPosition[] = [];
        const cardGap = this.layoutConfig.getCardGap();
        let currentPosition = 0;

        // 카드 높이 계산
        const cardHeightValue = this.layoutConfig.calculateCardHeight('list', this.isVertical);
        // 'auto'인 경우 기본값 사용
        const cardHeight = cardHeightValue === 'auto' ? 200 : cardHeightValue;
        
        // isVertical에 따라 카드 너비 설정
        // 세로 모드(isVertical=true)에서는 컨테이너 너비를 사용
        // 가로 모드(isVertical=false)에서는 계산된 카드 너비 사용
        const cardWidth = this.isVertical ? 
            containerWidth : 
            this.cardWidth || this.layoutConfig.calculateCardWidth(this.settings.cardsPerView);
        
        console.log(`[CardNavigator] ListLayout 카드 크기 계산: width = ${cardWidth}px, height = ${cardHeight}px`);

        cards.forEach((card, index) => {
            // 카드 ID (파일 경로 사용)
            const cardId = card.file.path;
            
            // isVertical에 따라 카드 위치 설정
            // 세로 모드(isVertical=true): 카드가 세로로 쌓임 (left=0, top이 증가)
            // 가로 모드(isVertical=false): 카드가 가로로 나열됨 (left가 증가, top=0)
            const position: CardPosition = {
                id: cardId,
                left: this.isVertical ? 0 : currentPosition,
                top: this.isVertical ? currentPosition : 0,
                width: cardWidth,
                height: cardHeight
            };
            
            console.log(`[CardNavigator] 카드 #${index} 위치: left=${position.left}, top=${position.top}, width=${position.width}, height=${position.height}`);
            positions.push(position);

            // 최신 설정값으로 위치 계산
            // 세로 모드에서는 높이+간격만큼 아래로, 가로 모드에서는 너비+간격만큼 오른쪽으로 이동
            const positionDelta = this.isVertical ? cardHeight : cardWidth;
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
    // 열 수 반환
    public getColumnsCount(): number {
        // isVertical 값에 따라 열 수 결정
        // true(세로 모드): 1열 (세로로 쌓임)
        // false(가로 모드): cardsPerView 열 (가로로 나열됨)
        const columns = this.isVertical ? 1 : this.settings.cardsPerView;
        console.log(`[CardNavigator] ListLayout 열 수: isVertical = ${this.isVertical}, columns = ${columns}`);
        return columns;
    }

    // 스크롤 방향 반환 (레이아웃 방향에 따라)
    getScrollDirection(): 'vertical' | 'horizontal' {
        // isVertical 값에 따라 스크롤 방향 결정
        // true: 세로 스크롤, false: 가로 스크롤
        const direction = this.isVertical ? 'vertical' : 'horizontal';
        console.log(`[CardNavigator] 스크롤 방향: isVertical = ${this.isVertical}, direction = ${direction}, layoutType = list`);
        return direction;
    }

    // 레이아웃 타입 반환
    getLayoutType(): string {
        return 'list';
    }

    // 컨테이너 너비 변화에 대응하는 메서드
    public updateContainerWidth(newWidth: number): void {
        if (newWidth <= 0) return;
        
        // 리스트 레이아웃은 자동으로 너비가 조정되므로 별도 처리 불필요
        // 필요한 경우 카드 너비 재계산
        const cardWidth = this.isVertical ? 
            newWidth : // 세로 모드에서는 컨테이너 너비 사용
            this.layoutConfig.calculateCardWidth(this.settings.cardsPerView); // 가로 모드에서는 계산된 너비 사용
        
        this.setCardWidth(cardWidth);
    }
    //#endregion
}
