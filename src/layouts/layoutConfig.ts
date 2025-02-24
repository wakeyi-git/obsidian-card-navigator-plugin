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
        if (layout === 'grid') {
            return this.settings.gridCardHeight;
        }

        if (!this.settings.alignCardHeight) {
            return 'auto';
        }

        const containerHeight = this.containerEl?.offsetHeight || 0;
        const cardGap = this.getCardGap();
        const containerPadding = this.getContainerPadding() * 2;
        const availableHeight = containerHeight - containerPadding;
        
        return Math.floor((availableHeight - (cardGap * (this.settings.cardsPerView - 1))) / this.settings.cardsPerView);
    }

    /**
     * 자동 레이아웃의 열 수를 계산합니다.
     */
    public calculateAutoColumns(): number {
        const availableWidth = this.getAvailableWidth();
        const cardGap = this.getCardGap();
        const threshold = this.settings.cardWidthThreshold;
        
        // 히스테리시스 버퍼 추가 (전환 지점에 안정성 추가)
        const upperBuffer = 40; // 더 큰 버퍼로 조정
        const lowerBuffer = 20; // 더 작은 버퍼 유지
        
        // 현재 열 수 계산
        const columns = Math.max(1, Math.floor((availableWidth + cardGap) / (threshold + cardGap)));
        
        // 실제 카드 너비 계산
        const actualCardWidth = (availableWidth - (columns - 1) * cardGap) / columns;
        
        // 히스테리시스 적용
        if (columns > 1) {
            // 현재 너비가 threshold + upperBuffer보다 작으면 열 수를 줄임
            if (actualCardWidth < threshold - lowerBuffer) {
                return columns - 1;
            }
            // 현재 너비가 threshold - lowerBuffer보다 크면 현재 열 수 유지
            else if (actualCardWidth > threshold + upperBuffer) {
                return columns;
            }
            // 그 사이 값이면 이전 상태 유지 (히스테리시스)
            else {
                return this.previousColumns || columns;
            }
        }
        
        return columns;
    }

    /**
     * 컨테이너가 수직인지 확인합니다.
     */
    public isVerticalContainer(): boolean {
        if (!this.containerEl) return true;
        const { width, height } = this.containerEl.getBoundingClientRect();
        return height > width;
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
            if (this.settings.alignCardHeight) {
                const containerHeight = this.containerEl?.offsetHeight || 0;
                const cardGap = this.getCardGap();
                const containerPadding = this.getContainerPadding() * 2;
                const availableHeight = containerHeight - containerPadding;
                const cardHeight = Math.floor((availableHeight - (cardGap * (this.settings.cardsPerView - 1))) / this.settings.cardsPerView);
                style.height = `${cardHeight}px`;
            } else {
                style.height = 'auto';
            }
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