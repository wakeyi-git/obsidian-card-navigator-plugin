import { CardNavigatorSettings, Card } from 'common/types';
import { LayoutDirection } from './layoutStrategy';

/**
 * 레이아웃 설정 및 계산을 담당하는 클래스
 * 
 * 이 클래스는 레이아웃 관련 설정을 관리하고 계산하는 역할을 담당합니다.
 * 컨테이너 크기, 카드 크기, 레이아웃 방향 등을 계산합니다.
 */
export class LayoutConfig {
    private settings: CardNavigatorSettings;
    private defaultContainerSize: { width: number; height: number } = { width: 800, height: 600 };
    private cachedColumns: number = 1;
    private layoutDirection: LayoutDirection;
    private containerWidth: number;
    private containerHeight: number;
    private cardWidth: number;
    private cardGap: number;
    private isVerticalContainer: boolean = true;
    private debugMode: boolean = true; // 디버그 모드 활성화
    private previousCardWidth: number = 0; // 이전 카드 너비 저장
    private transitionFactor: number = 0; // 부드러운 전환 비활성화 (0으로 설정하여 항상 새 값 사용)
    private lastCalculatedWidth: number = 0; // 마지막으로 계산된 너비 저장
    private lastColumnCount: number = 0; // 마지막 열 수 저장
    private stableCardWidth: number = 0; // 안정적인 카드 너비 저장
    private previousColumns: number = 0;
    private previousContainerWidth: number = 0; // 이전 컨테이너 너비 저장

    constructor(settings: CardNavigatorSettings) {
        this.settings = settings;
        
        // 기본 속성 초기화
        this.layoutDirection = 'vertical'; // 기본값으로 vertical 설정
        this.containerWidth = this.defaultContainerSize.width;
        this.containerHeight = this.defaultContainerSize.height;
        this.cardWidth = settings.cardThresholdWidth || 200;
        this.previousCardWidth = this.cardWidth; // 초기값 설정
        this.stableCardWidth = this.cardWidth; // 초기 안정적인 너비 설정
        this.cardGap = 10; // 기본 카드 간격 설정
        
        // 초기 열 수 계산
        this.cachedColumns = this.calculateAutoColumns();
        this.lastColumnCount = this.cachedColumns;
        
        this.logDebug('LayoutConfig 초기화', {
            layoutDirection: this.layoutDirection,
            containerWidth: this.containerWidth,
            containerHeight: this.containerHeight,
            cardWidth: this.cardWidth,
            columns: this.cachedColumns
        });
    }

    /**
     * 디버그 로그를 출력합니다.
     */
    private logDebug(message: string, data?: any): void {
        if (this.debugMode) {
            console.log(`[LayoutConfig] ${message}`, data ? data : '');
        }
    }

    /**
     * 설정을 업데이트합니다.
     */
    updateSettings(settings: CardNavigatorSettings): void {
        this.settings = settings;
    }

    /**
     * 현재 설정을 반환합니다.
     */
    getSettings(): CardNavigatorSettings {
        return this.settings;
    }

    /**
     * 레이아웃 방향을 계산합니다.
     */
    getLayoutDirection(): LayoutDirection {
        // 컨테이너 크기에 따라 방향 결정
        const direction = this.isVerticalContainer ? 'vertical' : 'horizontal';
        return direction;
    }

    /**
     * 컨테이너 크기를 업데이트합니다.
     * 
     * @param width 컨테이너 너비
     * @param height 컨테이너 높이
     */
    updateContainerSize(width: number, height: number): void {
        // 컨테이너 크기 업데이트
        const prevWidth = this.containerWidth;
        const prevHeight = this.containerHeight;
        
        // 소수점 때문에 흔들리는 문제를 해결하기 위해 Math.floor 사용
        this.containerWidth = Math.floor(width) || this.defaultContainerSize.width;
        this.containerHeight = Math.floor(height) || this.defaultContainerSize.height;
        
        // 컨테이너 방향 결정 (너비가 높이보다 크면 수평, 아니면 수직)
        const prevIsVertical = this.isVerticalContainer;
        this.isVerticalContainer = this.containerHeight > this.containerWidth;
        
        // 레이아웃 방향 업데이트
        const prevDirection = this.layoutDirection;
        this.layoutDirection = this.getLayoutDirection();
        
        // 이전 카드 너비 저장
        this.previousCardWidth = this.cardWidth;
        
        // 열 수 재계산
        const prevColumns = this.cachedColumns;
        this.cachedColumns = this.calculateAutoColumns();
        
        // 카드 너비 계산 로직 개선
        // 열 수가 변경되었거나 레이아웃 방향이 변경된 경우에만 카드 너비 재계산
        if (prevColumns !== this.cachedColumns || prevDirection !== this.layoutDirection) {
            // 카드 너비 재계산
            this.cardWidth = this.calculateCardWidthInternal();
            this.stableCardWidth = this.cardWidth; // 새로운 안정적인 너비 설정
            this.previousContainerWidth = this.containerWidth;
            this.previousColumns = this.cachedColumns;
            
            this.logDebug('열 수 또는 방향 변경으로 카드 너비 재계산', {
                prevColumns,
                newColumns: this.cachedColumns,
                prevDirection,
                newDirection: this.layoutDirection,
                prevWidth: this.previousCardWidth,
                newWidth: this.cardWidth
            });
        } else {
            // 컨테이너 너비 변화가 크면 (100px 이상) 카드 너비 재계산
            const containerWidthChange = Math.abs(this.containerWidth - this.previousContainerWidth);
            
            if (containerWidthChange > 100) {
                this.cardWidth = this.calculateCardWidthInternal();
                this.stableCardWidth = this.cardWidth;
                this.previousContainerWidth = this.containerWidth;
                
                this.logDebug('컨테이너 너비 변화가 커서 카드 너비 재계산', {
                    containerWidthChange,
                    prevCardWidth: this.previousCardWidth,
                    newCardWidth: this.cardWidth
                });
            } else {
                // 작은 변화는 무시하고 안정적인 너비 유지
                this.logDebug('작은 변화 무시, 카드 너비 유지', {
                    containerWidthChange,
                    stableCardWidth: this.stableCardWidth
                });
            }
        }
        
        this.cardGap = this.getCardGap();
        
        // 중요한 변경사항만 로깅
        if (prevDirection !== this.layoutDirection || 
            prevColumns !== this.cachedColumns || 
            Math.abs(this.previousCardWidth - this.cardWidth) > 10) {
            this.logDebug('중요 레이아웃 변경', {
                containerSize: { 
                    prev: { width: prevWidth, height: prevHeight },
                    current: { width: this.containerWidth, height: this.containerHeight }
                },
                direction: { prev: prevDirection, current: this.layoutDirection },
                columns: { prev: prevColumns, current: this.cachedColumns },
                cardWidth: { prev: this.previousCardWidth, current: this.cardWidth }
            });
        }
    }

    /**
     * 컨테이너 방향을 계산합니다.
     * @returns 컨테이너가 수직인지 여부
     */
    calculateContainerOrientation(): { isVertical: boolean } {
        return { isVertical: this.isVerticalContainer };
    }

    /**
     * 사용 가능한 너비를 계산합니다.
     */
    getAvailableWidth(containerWidth: number): number {
        const padding = this.getContainerPadding();
        const availableWidth = containerWidth - (padding * 2);
        return availableWidth;
    }

    /**
     * 사용 가능한 높이를 계산합니다.
     */
    getAvailableHeight(containerHeight: number): number {
        const padding = this.getContainerPadding();
        const availableHeight = containerHeight - (padding * 2);
        return availableHeight;
    }

    /**
     * 컨테이너 패딩을 가져옵니다.
     * CSS 변수에서 값을 가져오거나 기본값을 사용합니다.
     */
    getContainerPadding(): number {
        // CSS 변수에서 값을 가져오기
        const cssValue = getComputedStyle(document.documentElement).getPropertyValue('--container-padding');
        let padding = 10; // 기본값
        
        if (cssValue) {
            const value = parseInt(cssValue);
            if (!isNaN(value)) {
                padding = value;
            }
        }
        
        return padding;
    }

    /**
     * 카드 간격을 가져옵니다.
     * CSS 변수에서 값을 가져오거나 기본값을 사용합니다.
     */
    getCardGap(): number {
        // CSS 변수에서 값을 가져오기
        const cssValue = getComputedStyle(document.documentElement).getPropertyValue('--card-gap');
        let gap = 10; // 기본값
        
        if (cssValue) {
            const value = parseInt(cssValue);
            if (!isNaN(value)) {
                gap = value;
            }
        }
        
        return gap;
    }

    /**
     * 컨테이너 너비에 따라 자동으로 열 수를 계산합니다.
     * 
     * @returns 계산된 열 수
     */
    calculateAutoColumns(): number {
        // 레이아웃 방향이 가로인 경우 항상 1열 반환
        if (this.layoutDirection === 'horizontal') {
            return 1;
        }
        
        // 세로 레이아웃의 경우 컨테이너 너비와 카드 너비를 기반으로 계산
        const containerWidth = this.containerWidth;
        const cardThresholdWidth = this.settings.cardThresholdWidth || 200; // 카드 임계 너비 사용
        const cardGap = this.getCardGap();
        
        // 컨테이너에 맞는 최대 열 수 계산
        const maxColumns = Math.max(1, Math.floor((containerWidth + cardGap) / (cardThresholdWidth + cardGap)));
        
        this.logDebug('열 수 계산', { 
            containerWidth, 
            cardThresholdWidth, 
            formula: `Math.floor((${containerWidth} + ${cardGap}) / (${cardThresholdWidth} + ${cardGap}))`,
            columns: maxColumns 
        });
        
        return maxColumns;
    }

    /**
     * 열 수를 가져옵니다.
     */
    getColumns(): number {
        const columns = this.cachedColumns || 1;
        return columns;
    }

    /**
     * 카드 너비를 계산합니다 (내부 계산용).
     */
    private calculateCardWidthInternal(): number {
        const columns = this.getColumns();
        const availableWidth = this.getAvailableWidth(this.containerWidth);
        const cardGap = this.getCardGap();
        
        // 사용 가능한 너비에서 간격을 뺀 후 열 수로 나눔
        const totalGapWidth = (columns - 1) * cardGap;
        
        // 카드 너비 계산 - 열 너비의 100%로 설정
        let calculatedWidth = Math.floor((availableWidth - totalGapWidth) / columns);
        calculatedWidth = Math.floor(calculatedWidth / 2) * 2; // 짝수로 만들기
        
        this.logDebug('카드 너비 내부 계산 (열 너비 100%)', {
            availableWidth,
            columns,
            cardGap,
            totalGapWidth,
            calculatedWidth
        });
        
        return calculatedWidth;
    }

    /**
     * 카드 너비를 가져옵니다.
     */
    getCardWidth(): number {
        // 이미 계산된 카드 너비 반환 (안정적인 값 유지)
        return this.cardWidth;
    }

    /**
     * 카드 높이를 계산합니다.
     */
    getCardHeight(): number | 'auto' {
        // 카드 높이 정렬이 비활성화된 경우 'auto' 반환
        if (!this.settings.alignCardHeight) {
            return 'auto';
        }
        
        // 고정 높이 사용 여부에 따라 높이 결정
        if (this.settings.useFixedHeight) {
            const height = Math.floor(this.settings.fixedCardHeight || 200);
            // 높이를 짝수로 만들어 안정적인 레이아웃 보장
            return Math.floor(height / 2) * 2;
        } else {
            // 뷰당 카드 수에 따라 높이 계산
            const availableHeight = this.getAvailableHeight(this.containerHeight);
            const cardsPerColumn = this.settings.cardsPerColumn || 3;
            const cardGap = this.getCardGap();
            
            // 최소 높이 보장
            let calculatedHeight = (availableHeight - (cardGap * (cardsPerColumn - 1))) / cardsPerColumn;
            let height = Math.max(100, Math.floor(calculatedHeight)); // 최소 100px 보장
            // 높이를 짝수로 만들어 안정적인 레이아웃 보장
            height = Math.floor(height / 2) * 2;
            
            this.logDebug('카드 높이 계산', { 
                useFixedHeight: false, 
                cardsPerColumn, 
                height
            });
            
            return height;
        }
    }

    /**
     * 카드 렌더링 방식 설정을 가져옵니다.
     */
    public shouldRenderContentAsHtml(): boolean {
        return this.settings.renderContentAsHtml;
    }

    /**
     * 스크롤 애니메이션 활성화 여부를 가져옵니다.
     */
    public isScrollAnimationEnabled(): boolean {
        return this.settings.enableScrollAnimation;
    }

    /**
     * 열당 카드 수를 가져옵니다.
     */
    public getCardsPerColumn(): number {
        return this.settings.cardsPerColumn;
    }
} 