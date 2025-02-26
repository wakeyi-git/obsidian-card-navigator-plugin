import { LayoutStrategy, CardPosition } from './layoutStrategy';
import { Card, CardNavigatorSettings } from 'common/types';
import { App } from 'obsidian';
import { LayoutStyleManager } from './layoutStyleManager';

/**
 * 리스트 레이아웃 전략을 구현하는 클래스
 * 카드를 세로 또는 가로 방향의 목록으로 배열합니다.
 */
export class ListLayout implements LayoutStrategy {
    //#region 클래스 속성
    private cardWidth: number = 0;
    private containerEl: HTMLElement | null = null;
    private layoutStyleManager!: LayoutStyleManager; // 느낌표로 나중에 초기화됨을 표시
    //#endregion

    //#region 초기화
    // 생성자: 리스트 레이아웃 초기화
    constructor(
        private isVertical: boolean,
        private settings: CardNavigatorSettings,
        private app: App,
        container?: HTMLElement
    ) {
        // 컨테이너가 제공된 경우 초기화
        if (container) {
            this.setContainer(container);
        }
    }

    /**
     * 컨테이너 요소 설정
     */
    setContainer(container: HTMLElement): void {
        this.containerEl = container;
        
        // 레이아웃 스타일 매니저 초기화
        this.layoutStyleManager = new LayoutStyleManager(this.app, container, this.settings);
        
        // 컨테이너에 CSS 변수 설정
        if (container) {
            container.style.setProperty('--list-direction', this.isVertical ? 'vertical' : 'horizontal');
        }
    }

    // 카드 너비 설정
    setCardWidth(width: number): void {
        this.cardWidth = width;
        
        // 컨테이너에 카드 너비 CSS 변수 설정
        if (this.containerEl) {
            this.containerEl.style.setProperty('--list-card-width', `${width}px`);
        }
    }

    /**
     * 설정을 업데이트합니다.
     */
    public updateSettings(settings: CardNavigatorSettings) {
        this.settings = settings;
        
        // 레이아웃 스타일 매니저 설정 업데이트
        if (this.layoutStyleManager) {
            this.layoutStyleManager.updateSettings(settings);
        }
    }
    //#endregion

    //#region 카드 배치 및 레이아웃 관리
    // 카드를 리스트 형태로 배치 (세로 또는 가로)
    calculatePositions(cards: Card[], containerWidth: number, containerHeight: number): CardPosition[] {
        const positions: CardPosition[] = [];
        
        // 카드 높이 계산
        const cardHeight = this.settings.alignCardHeight ? 
            this.calculateCardHeight(containerHeight) : 
            0; // 높이를 0으로 설정하여 auto 높이 사용
        
        // 카드 너비 계산
        let cardWidth: number;
        if (this.isVertical) {
            // 세로 방향일 때는 컨테이너 너비에서 패딩을 제외한 값
            cardWidth = containerWidth - (this.layoutStyleManager ? this.layoutStyleManager.getContainerPadding() * 2 : 20);
        } else {
            // 가로 방향일 때는 cardsPerView에 따라 계산
            if (this.layoutStyleManager) {
                cardWidth = this.layoutStyleManager.calculateCardWidth(this.settings.cardsPerView);
            } else {
                // 레이아웃 스타일 매니저가 없는 경우 직접 계산
                const cardGap = 10; // 기본값
                const containerPadding = 10; // 기본값
                const availableWidth = containerWidth - (containerPadding * 2);
                const totalGapWidth = cardGap * (this.settings.cardsPerView - 1);
                cardWidth = Math.floor((availableWidth - totalGapWidth) / this.settings.cardsPerView);
            }
        }
        
        // 카드 너비 업데이트
        this.setCardWidth(cardWidth);

        // 리스트 레이아웃에서는 위치를 직접 계산하지 않고 CSS 플렉스박스를 활용
        cards.forEach((card) => {
            // 카드 ID (파일 경로 사용)
            const cardId = card.file.path;
            
            // 위치 정보는 너비와 높이만 설정 (실제 위치는 CSS 플렉스박스가 처리)
            const position: CardPosition = {
                id: cardId,
                left: 0,
                top: 0,
                width: cardWidth,
                height: cardHeight
            };
            positions.push(position);
        });

        return positions;
    }
    
    /**
     * 카드 높이를 계산합니다.
     */
    private calculateCardHeight(containerHeight: number): number {
        if (!this.settings.alignCardHeight) {
            return 200; // 기본 높이
        }

        // 레이아웃 스타일 매니저를 통해 카드 간격과 컨테이너 패딩 가져오기
        const cardGap = this.layoutStyleManager ? this.layoutStyleManager.getCardGap() : 10;
        const containerPadding = this.layoutStyleManager ? this.layoutStyleManager.getContainerPadding() : 10;
                    
        // 사용 가능한 높이에서 모든 여백 제외
        const availableHeight = containerHeight - containerPadding * 2;
        
        // 정수로 나누어 떨어지는 높이 계산
        const totalGaps = cardGap * (this.settings.cardsPerView - 1);
        const heightWithoutGaps = availableHeight - totalGaps;
        const cardHeight = Math.floor(heightWithoutGaps / this.settings.cardsPerView);
        
        // 마지막 1px 여유 확보
        return Math.max(100, cardHeight - 1);
    }
    //#endregion

    //#region 레이아웃 속성 조회
    /**
     * 레이아웃 타입을 반환합니다.
     */
    getLayoutType(): CardNavigatorSettings['defaultLayout'] {
        return 'list';
    }
    
    // 열 수 반환
    public getColumnsCount(): number {
        return this.isVertical ? 1 : this.settings.cardsPerView;
    }

    // 스크롤 방향 반환 (레이아웃 방향에 따라)
    getScrollDirection(): 'vertical' | 'horizontal' {
        return this.isVertical ? 'vertical' : 'horizontal';
    }

    // 컨테이너 너비 변화에 대응하는 메서드
    public handleContainerResize(newWidth: number): void {
        if (!this.containerEl) return;
        
        // 카드 너비 계산
        let newCardWidth: number;
        if (this.isVertical) {
            // 세로 방향일 때는 컨테이너 너비에서 패딩을 제외한 값
            newCardWidth = newWidth - (this.layoutStyleManager ? this.layoutStyleManager.getContainerPadding() * 2 : 20);
        } else {
            // 가로 방향일 때는 cardsPerView에 따라 계산
            if (this.layoutStyleManager) {
                newCardWidth = this.layoutStyleManager.calculateCardWidth(this.settings.cardsPerView);
            } else {
                // 레이아웃 스타일 매니저가 없는 경우 직접 계산
                const cardGap = 10; // 기본값
                const containerPadding = 10; // 기본값
                const availableWidth = newWidth - (containerPadding * 2);
                const totalGapWidth = cardGap * (this.settings.cardsPerView - 1);
                newCardWidth = Math.floor((availableWidth - totalGapWidth) / this.settings.cardsPerView);
            }
        }
        
        // 카드 너비가 변경되었는지 확인
        const widthChanged = Math.abs(this.cardWidth - newCardWidth) > 2; // 2px 이상 차이가 있을 때만 업데이트
        
        if (widthChanged) {
            // 카드 너비 업데이트
            this.setCardWidth(newCardWidth);
            
            // 컨테이너에 이벤트 발생시켜 카드 위치 재계산 요청
            const event = new CustomEvent('list-resize', { 
                detail: { 
                    needsRecalculation: true,
                    newCardWidth: newCardWidth
                } 
            });
            this.containerEl.dispatchEvent(event);
        }
    }
    //#endregion
}
