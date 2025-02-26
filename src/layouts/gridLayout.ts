import { LayoutStrategy, CardPosition } from './layoutStrategy';
import { Card, CardNavigatorSettings } from 'common/types';
import { LayoutStyleManager } from './layoutStyleManager';

/**
 * 그리드 레이아웃 전략을 구현하는 클래스
 * 카드를 격자 형태로 배열합니다.
 */
export class GridLayout implements LayoutStrategy {
    //#region 클래스 속성
    private cardWidth: number = 0;
    private containerEl: HTMLElement | null = null;
    private layoutStyleManager: LayoutStyleManager | null = null;
    //#endregion

    //#region 초기화
    // 생성자: 그리드 레이아웃 초기화
    constructor(
        private columns: number,
        private settings: CardNavigatorSettings
    ) {
        if (columns <= 0) {
            throw new Error('The number of columns must be greater than 0');
        }
    }

    /**
     * 컨테이너 요소 설정
     */
    setContainer(container: HTMLElement): void {
        this.containerEl = container;
        
        // 레이아웃 스타일 매니저 초기화
        if (!this.layoutStyleManager && container) {
            this.layoutStyleManager = new LayoutStyleManager(
                (container as any).ownerDocument.defaultView.app,
                container,
                this.settings
            );
        }
        
        // 컨테이너에 CSS 변수 설정
        if (container) {
            container.style.setProperty('--grid-columns', this.columns.toString());
            container.style.setProperty('--grid-card-height', `${this.settings.gridCardHeight}px`);
            
            // 그리드 레이아웃 스타일 설정
            container.style.display = 'grid';
            container.style.gridTemplateColumns = `repeat(${this.columns}, 1fr)`;
            
            const cardGap = this.getCardGap();
            container.style.gap = `${cardGap}px`;
            container.style.gridAutoRows = `${this.settings.gridCardHeight}px`;
        }
    }
    //#endregion

    //#region 카드 크기 및 레이아웃 관리
    // 카드 너비 설정
    setCardWidth(width: number): void {
        this.cardWidth = width;
        
        // 컨테이너에 카드 너비 CSS 변수 설정
        if (this.containerEl) {
            this.containerEl.style.setProperty('--grid-card-width', `${width}px`);
        }
    }

    // 카드 간격 가져오기
    private getCardGap(): number {
        if (this.layoutStyleManager) {
            return this.layoutStyleManager.getCardGap();
        }
        return 10; // 기본값
    }

    // 카드를 그리드 형태로 배치
    calculatePositions(cards: Card[], containerWidth: number, containerHeight: number): CardPosition[] {
        const positions: CardPosition[] = [];
        const cardGap = this.getCardGap();
        
        // 레이아웃 스타일 매니저를 통해 카드 너비 계산
        let newCardWidth: number;
        if (this.layoutStyleManager) {
            newCardWidth = this.layoutStyleManager.calculateCardWidth(this.columns);
        } else {
            // 레이아웃 스타일 매니저가 없는 경우 직접 계산
            const containerPadding = 10; // 기본값
            const availableWidth = containerWidth - (containerPadding * 2); // 좌우 패딩만 고려
            const totalGapWidth = cardGap * (this.columns - 1);
            newCardWidth = Math.floor((availableWidth - totalGapWidth) / this.columns);
        }
        
        // 카드 너비 업데이트
        this.setCardWidth(newCardWidth);
        
        // 카드 높이 계산 (그리드 레이아웃은 항상 고정 높이 사용)
        const cardHeight = this.settings.gridCardHeight;

        cards.forEach((card, index) => {
            const row = Math.floor(index / this.columns);
            const col = index % this.columns;
            
            // 카드 ID (파일 경로 사용)
            const cardId = card.file.path;

            const position: CardPosition = {
                id: cardId,
                left: col * (newCardWidth + cardGap),
                top: row * (cardHeight + cardGap),
                width: newCardWidth,
                height: cardHeight,
                column: col + 1 // CSS Grid에서 사용할 열 번호 (1부터 시작)
            };
            positions.push(position);
        });

        return positions;
    }

    /**
     * 설정을 업데이트합니다.
     */
    public updateSettings(settings: CardNavigatorSettings) {
        this.settings = settings;
        
        // 컨테이너가 있는 경우 CSS 변수 업데이트
        if (this.containerEl) {
            this.containerEl.style.setProperty('--grid-card-height', `${settings.gridCardHeight}px`);
            this.containerEl.style.gridAutoRows = `${settings.gridCardHeight}px`;
        }
        
        // 레이아웃 스타일 매니저 설정 업데이트
        if (this.layoutStyleManager) {
            this.layoutStyleManager.updateSettings(settings);
        }
    }
    //#endregion

    //#region 레이아웃 속성 조회
    /**
     * 레이아웃 타입을 반환합니다.
     */
    getLayoutType(): CardNavigatorSettings['defaultLayout'] {
        return 'grid';
    }

    // 그리드의 열 수 반환
    public getColumnsCount(): number {
        return this.columns;
    }

    /**
     * 열 수를 설정합니다.
     */
    public setColumnsCount(columns: number): void {
        if (this.columns === columns) return; // 변경이 없으면 종료
        
        this.columns = columns;
        
        // 컨테이너에 CSS 변수와 그리드 템플릿 업데이트
        if (this.containerEl) {
            this.containerEl.style.setProperty('--grid-columns', this.columns.toString());
            this.containerEl.style.gridTemplateColumns = `repeat(${this.columns}, 1fr)`;
        }
    }

    // 스크롤 방향 반환 (항상 수직)
    getScrollDirection(): 'vertical' | 'horizontal' {
        return 'vertical';
    }

    // 컨테이너 너비 변화에 대응하는 메서드
    public handleContainerResize(newWidth: number): void {
        if (!this.containerEl) return;
        
        // 레이아웃 스타일 매니저를 통해 카드 너비 계산
        let newCardWidth: number;
        if (this.layoutStyleManager) {
            newCardWidth = this.layoutStyleManager.calculateCardWidth(this.columns);
        } else {
            // 레이아웃 스타일 매니저가 없는 경우 직접 계산
            const cardGap = this.getCardGap();
            const containerPadding = 10; // 기본값
            const availableWidth = newWidth - (containerPadding * 2);
            const totalGapWidth = cardGap * (this.columns - 1);
            newCardWidth = Math.floor((availableWidth - totalGapWidth) / this.columns);
        }
        
        // 카드 너비가 변경되었는지 확인
        const widthChanged = Math.abs(this.cardWidth - newCardWidth) > 2; // 2px 이상 차이가 있을 때만 업데이트
        
        if (widthChanged) {
            // 카드 너비 업데이트
            this.setCardWidth(newCardWidth);
            
            // 그리드 템플릿 열 업데이트
            this.containerEl.style.gridTemplateColumns = `repeat(${this.columns}, 1fr)`;
            
            // 컨테이너에 이벤트 발생시켜 카드 위치 재계산 요청
            const event = new CustomEvent('grid-resize', { 
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
