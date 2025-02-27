import { App } from 'obsidian';
import { CardNavigatorSettings } from 'common/types';

/**
 * 레이아웃 설정을 중앙에서 관리하는 클래스
 * CSS 변수와 계산된 값들을 일관되게 제공합니다.
 */
export class LayoutConfig {
    //#region 클래스 속성
    private containerEl: HTMLElement;
    private settings: CardNavigatorSettings;
    private app: App;
    private previousColumns: number = 0;
    //#endregion

    constructor(app: App, containerEl: HTMLElement, settings: CardNavigatorSettings) {
        this.app = app;
        this.containerEl = containerEl;
        this.settings = settings;
    }

    //#region CSS 변수 가져오기
    /**
     * CSS 변수 값을 가져옵니다.
     */
    private getCSSVariable(variableName: string, defaultValue: number): number {
        if (!this.containerEl) return defaultValue;
        const valueStr = getComputedStyle(this.containerEl).getPropertyValue(variableName).trim();
        return parseInt(valueStr) || defaultValue;
    }

    /**
     * 카드 간격을 가져옵니다.
     */
    public getCardGap(): number {
        return this.getCSSVariable('--card-navigator-gap', 10);
    }

    /**
     * 컨테이너 패딩을 가져옵니다.
     */
    public getContainerPadding(): number {
        return this.getCSSVariable('--card-navigator-container-padding', 10);
    }
    //#endregion

    //#region 레이아웃 계산
    /**
     * 사용 가능한 컨테이너 너비를 계산합니다.
     */
    public getAvailableWidth(): number {
        if (!this.containerEl) return 0;
        
        const containerStyle = window.getComputedStyle(this.containerEl);
        const containerWidth = this.containerEl.offsetWidth;
        const paddingLeft = parseFloat(containerStyle.paddingLeft) || 0;
        const paddingRight = parseFloat(containerStyle.paddingRight) || 0;
        
        return containerWidth - paddingLeft - paddingRight;
    }

    /**
     * 자동 레이아웃의 열 수를 계산합니다.
     */
    public calculateAutoColumns(): number {
        const availableWidth = this.getAvailableWidth();
        const cardGap = this.getCardGap();
        const threshold = this.settings.cardWidthThreshold;
        
        // 히스테리시스 버퍼
        const upperBuffer = 40;
        const lowerBuffer = 20;
        
        // 현재 열 수 계산
        let columns = Math.max(1, Math.floor((availableWidth + cardGap) / (threshold + cardGap)));
        
        // 실제 카드 너비 계산
        const actualCardWidth = (availableWidth - (columns - 1) * cardGap) / columns;
        
        // 1열 강제 전환 조건
        if (actualCardWidth < threshold - lowerBuffer) {
            return 1;
        }
        
        // 2열 이상에서의 히스테리시스 적용
        if (columns >= 2 && this.previousColumns > 0) {
            // 이전 열 수에서의 카드 너비 계산
            const previousWidth = (availableWidth - (this.previousColumns - 1) * cardGap) / this.previousColumns;
            
            // 이전 상태가 유효하면 히스테리시스 적용
            if (previousWidth >= threshold - lowerBuffer && previousWidth <= threshold + upperBuffer) {
                return this.previousColumns;
            }
            
            // 열 수가 증가하는 경우 (컨테이너 너비 증가)
            if (columns > this.previousColumns) {
                // 새로운 열 수에서의 카드 너비가 임계값보다 충분히 큰 경우에만 열 수 증가
                if (actualCardWidth >= threshold + upperBuffer) {
                    return columns;
                } else {
                    // 그렇지 않으면 이전 열 수 유지
                    return this.previousColumns;
                }
            }
        }
        
        return columns;
    }

    /**
     * 카드 너비를 계산합니다.
     */
    public calculateCardWidth(columns: number): number {
        const availableWidth = this.getAvailableWidth();
        const cardGap = this.getCardGap();
        const totalGapWidth = cardGap * (columns - 1);
        
        return Math.floor((availableWidth - totalGapWidth) / columns);
    }

    /**
     * 카드 높이를 계산합니다.
     */
    public calculateCardHeight(layout: CardNavigatorSettings['defaultLayout']): number | 'auto' {
        // 그리드 레이아웃은 고정 높이 사용
        if (layout === 'grid') {
            return this.settings.gridCardHeight;
        }

        // 메이슨리 레이아웃은 자동 높이 사용
        if (layout === 'masonry') {
            return 200;
        }

        // 리스트 레이아웃 또는 자동 레이아웃
        if (layout === 'list' || layout === 'auto') {
            if (!this.settings.alignCardHeight) {
                return 'auto';
            }

            const containerHeight = this.containerEl?.offsetHeight || 0;
            const cardGap = this.getCardGap();
            const containerPadding = this.getContainerPadding() * 2;
                        
            // 사용 가능한 높이에서 모든 여백 제외
            const availableHeight = containerHeight - containerPadding;
            
            // 정수로 나누어 떨어지는 높이 계산
            const totalGaps = cardGap * (this.settings.cardsPerView - 1);
            const heightWithoutGaps = availableHeight - totalGaps;
            const cardHeight = Math.floor(heightWithoutGaps / this.settings.cardsPerView);
            
            // 마지막 1px 여유 확보
            return cardHeight - 1;
        }
        return 'auto';
    }

    /**
     * 컨테이너가 수직인지 확인합니다.
     */
    public isVerticalContainer(): boolean {
        // 항상 수직 레이아웃 사용 (세로 스크롤)
        return true;
    }
    //#endregion

    //#region 레이아웃 속성
    /**
     * 그리드 레이아웃의 열 수를 가져옵니다.
     */
    public getGridColumns(): number {
        return this.settings.gridColumns;
    }

    /**
     * 메이슨리 레이아웃의 열 수를 가져옵니다.
     */
    public getMasonryColumns(): number {
        return this.settings.masonryColumns;
    }
    //#endregion

    //#region 스타일 설정
    /**
     * 컨테이너 스타일을 가져옵니다.
     */
    public getContainerStyle(isVertical: boolean): Partial<CSSStyleDeclaration> {
        return {
            display: 'flex',
            flexDirection: isVertical ? 'column' : 'row',
            gap: `${this.getCardGap()}px`,
            alignItems: 'stretch',
            overflowY: isVertical ? 'auto' : 'hidden',
            overflowX: isVertical ? 'hidden' : 'auto',
            paddingLeft: `${this.getContainerPadding()}px`,
            paddingRight: `${this.getContainerPadding()}px`,
        };
    }

    /**
     * 카드 스타일을 가져옵니다.
     */
    public getCardStyle(isVertical: boolean, alignCardHeight: boolean): Partial<CSSStyleDeclaration> {
        const style: Partial<CSSStyleDeclaration> = {
            flexShrink: '0'
        };

        // 항상 최신 설정값 사용
        if (isVertical) {
            style.width = '100%';
            const height = this.calculateCardHeight(this.settings.defaultLayout);
            style.height = height === 'auto' ? 'auto' : `${height}px`;
        } else {
            const cardWidth = this.calculateCardWidth(this.settings.cardsPerView);
            style.width = `${cardWidth}px`;
            style.height = '100%';
        }

        return style;
    }
    //#endregion

    //#region 이전 열 수 업데이트
    public updatePreviousColumns(columns: number) {
        this.previousColumns = columns;
    }
    //#endregion

    /**
     * 설정을 업데이트합니다.
     */
    public updateSettings(settings: CardNavigatorSettings) {
        this.settings = settings;
    }
} 