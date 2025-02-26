import { LayoutStrategy, CardPosition } from './layoutStrategy';
import { Card, CardNavigatorSettings } from 'common/types';
import { CardMaker } from 'ui/cardContainer/cardMaker';
import { App } from 'obsidian';
import { LayoutStyleManager } from './layoutStyleManager';

/**
 * 메이슨리 레이아웃 전략을 구현하는 클래스
 * 카드를 다양한 높이를 가진 열 형태로 배열합니다.
 * CSS 자동 레이아웃을 활용하여 컨테이너 크기 변경에 적응합니다.
 */
export class MasonryLayout implements LayoutStrategy {
    //#region 클래스 속성
    private container: HTMLElement | null = null;
    private cardWidth: number = 0;
    private columns: number = 1;
    private columnHeights: number[] = [];
    private cardHeights: Map<string, number> = new Map(); // 카드 ID별 높이 저장 (고정 높이 유지용)
    private layoutStyleManager!: LayoutStyleManager; // 느낌표로 나중에 초기화됨을 표시
    //#endregion

    //#region 초기화 및 설정
    // 생성자: 메이슨리 레이아웃 초기화
    constructor(
        private settings: CardNavigatorSettings,
        private cardMaker: CardMaker,
        private app: App,
        container?: HTMLElement
    ) {
        // 초기 열 수 설정
        this.columns = this.settings.masonryColumns;
        this.columnHeights = new Array(this.columns).fill(0);
        
        // 컨테이너가 제공된 경우 초기화
        if (container) {
            this.setContainer(container);
        }
    }

    /**
     * 컨테이너 요소 설정
     */
    setContainer(container: HTMLElement): void {
        this.container = container;
        
        // 레이아웃 스타일 매니저 초기화
        this.layoutStyleManager = new LayoutStyleManager(this.app, container, this.settings);
        
        // 컨테이너에 CSS 변수 설정
        if (container) {
            container.style.setProperty('--masonry-columns', this.columns.toString());
        }
    }

    /**
     * 카드 너비 설정
     */
    public setCardWidth(width: number): void {
        this.cardWidth = width;
        
        // 컨테이너에 카드 너비 CSS 변수 설정
        if (this.container) {
            this.container.style.setProperty('--masonry-card-width', `${width}px`);
        }
    }

    /**
     * 설정을 업데이트합니다.
     */
    public updateSettings(settings: CardNavigatorSettings) {
        this.settings = settings;
        
        // 열 수 업데이트
        if (this.columns !== settings.masonryColumns) {
            this.columns = settings.masonryColumns;
            this.columnHeights = new Array(this.columns).fill(0);
            
            // 컨테이너에 CSS 변수 업데이트
            if (this.container) {
                this.container.style.setProperty('--masonry-columns', this.columns.toString());
            }
        }
        
        // 레이아웃 스타일 매니저 설정 업데이트
        if (this.layoutStyleManager) {
            this.layoutStyleManager.updateSettings(settings);
        }
    }
    //#endregion

    //#region 카드 배치 및 레이아웃 관리
    /**
     * 카드 위치를 계산합니다.
     */
    calculatePositions(cards: Card[], containerWidth: number, containerHeight: number): CardPosition[] {
        // 컬럼 높이 초기화
        this.columnHeights = new Array(this.columns).fill(0);
        
        // 레이아웃 스타일 매니저를 통해 카드 너비 계산
        let newCardWidth: number;
        if (this.layoutStyleManager) {
            newCardWidth = this.layoutStyleManager.calculateCardWidth(this.columns);
        } else {
            // 레이아웃 스타일 매니저가 없는 경우 직접 계산
            const cardGap = 10; // 기본값
            const containerPadding = 10; // 기본값
            const availableWidth = containerWidth - (containerPadding * 2);
            const totalGapWidth = cardGap * (this.columns - 1);
            newCardWidth = Math.floor((availableWidth - totalGapWidth) / this.columns);
        }
        
        // 카드 너비 업데이트 및 CSS 변수 설정
        this.setCardWidth(newCardWidth);
        
        const positions: CardPosition[] = [];
        const cardGap = this.layoutStyleManager ? this.layoutStyleManager.getCardGap() : 10;
        const containerPadding = this.layoutStyleManager ? this.layoutStyleManager.getContainerPadding() : 10;
        
        // 카드 위치 계산
        cards.forEach((card) => {
            const cardId = card.file.path;
            
            // 카드 높이 결정 (이미 계산된 높이가 있으면 재사용, 없으면 계산)
            let contentHeight: number;
            if (this.cardHeights.has(cardId)) {
                contentHeight = this.cardHeights.get(cardId)!;
            } else {
                contentHeight = this.calculateEstimatedHeight(card);
                this.cardHeights.set(cardId, contentHeight);
            }
            
            // 가장 높이가 낮은 열 찾기
            const minHeightIndex = this.columnHeights.indexOf(Math.min(...this.columnHeights));
            
            // 카드 위치 계산 - 좌측 패딩만 고려하여 x좌표 계산
            const x = containerPadding + minHeightIndex * (newCardWidth + cardGap);
            
            // 상단 패딩 없이 y좌표 계산
            const y = this.columnHeights[minHeightIndex];
            
            // 위치 정보 저장
            positions.push({
                id: cardId,
                left: x,
                top: y,
                width: newCardWidth,
                height: contentHeight,
                column: minHeightIndex + 1 // CSS Grid에서 사용할 열 번호 (1부터 시작)
            });
            
            // 해당 열의 높이 업데이트
            this.columnHeights[minHeightIndex] += contentHeight + cardGap;
        });
        
        return positions;
    }
    
    /**
     * 카드의 예상 높이를 계산합니다.
     */
    private calculateEstimatedHeight(card: Card): number {
        // 기본 높이 설정
        const baseHeight = 100;
        
        // 카드 내용에 따라 높이 추정
        let estimatedHeight = baseHeight;
        
        // 파일 이름 표시 여부에 따른 높이 추가
        if (this.settings.showFileName) {
            estimatedHeight += 30;
        }
        
        // 첫 번째 헤더 표시 여부에 따른 높이 추가
        if (this.settings.showFirstHeader && card.firstHeader) {
            estimatedHeight += 40;
        }
        
        // 본문 표시 여부에 따른 높이 추가
        if (this.settings.showBody && card.body) {
            // 본문 길이에 따른 높이 추정
            const bodyLength = this.settings.bodyLengthLimit ? 
                Math.min(card.body.length, this.settings.bodyLength) : 
                card.body.length;
            
            // 글자당 평균 높이를 고려한 추정 (매우 단순화된 계산)
            const charsPerLine = Math.floor(this.cardWidth / 8); // 글자당 평균 8px로 가정
            const lines = Math.ceil(bodyLength / charsPerLine);
            const lineHeight = 20; // 줄 높이 20px로 가정
            
            estimatedHeight += lines * lineHeight;
        }
        
        return Math.max(estimatedHeight, baseHeight);
    }
    //#endregion

    //#region 레이아웃 속성 조회
    /**
     * 레이아웃 타입을 반환합니다.
     */
    getLayoutType(): CardNavigatorSettings['defaultLayout'] {
        return 'masonry';
    }
    
    /**
     * 열 수를 반환합니다.
     */
    public getColumnsCount(): number {
        return this.columns;
    }

    /**
     * 열 수를 설정합니다.
     */
    public setColumnsCount(columns: number): void {
        if (this.columns === columns) return; // 변경이 없으면 종료
        
        this.columns = columns;
        this.columnHeights = new Array(this.columns).fill(0);
        
        // 컨테이너에 CSS 변수 업데이트
        if (this.container) {
            this.container.style.setProperty('--masonry-columns', this.columns.toString());
        }
    }

    /**
     * 스크롤 방향을 반환합니다. (항상 수직)
     */
    getScrollDirection(): 'vertical' | 'horizontal' {
        return 'vertical';
    }

    /**
     * 컨테이너 너비 변화에 대응합니다.
     * 컨테이너 크기가 변경되면 카드 위치를 재계산합니다.
     */
    public handleContainerResize(newWidth: number): void {
        if (!this.container) return;
        
        // 레이아웃 스타일 매니저를 통해 카드 너비 계산
        let newCardWidth: number;
        if (this.layoutStyleManager) {
            newCardWidth = this.layoutStyleManager.calculateCardWidth(this.columns);
        } else {
            // 레이아웃 스타일 매니저가 없는 경우 직접 계산
            const cardGap = 10; // 기본값
            const containerPadding = 10; // 기본값
            const availableWidth = newWidth - (containerPadding * 2);
            const totalGapWidth = cardGap * (this.columns - 1);
            newCardWidth = Math.floor((availableWidth - totalGapWidth) / this.columns);
        }
        
        // 카드 너비가 변경되었는지 확인
        const widthChanged = Math.abs(this.cardWidth - newCardWidth) > 2; // 2px 이상 차이가 있을 때만 업데이트
        
        if (widthChanged) {
            // 카드 너비 업데이트 및 CSS 변수 설정
            this.setCardWidth(newCardWidth);
            
            // 컨테이너에 CSS 변수 업데이트
            this.container.style.setProperty('--masonry-card-width', `${newCardWidth}px`);
            
            // 컨테이너 크기 변경 시 카드 위치 재계산 필요 여부를 알리는 이벤트 발생
            const event = new CustomEvent('masonry-resize', { 
                detail: { 
                    needsRecalculation: true,
                    newCardWidth: newCardWidth
                } 
            });
            this.container.dispatchEvent(event);
        }
    }
    //#endregion
}
