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
    public calculateCardHeight(containerHeight: number, cardsPerView: number): number {
        const cardGap = this.getCardGap();
        return Math.floor((containerHeight - (cardGap * (cardsPerView - 1))) / cardsPerView);
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

    /**
     * 자동 레이아웃의 열 수를 계산합니다.
     */
    public calculateAutoColumns(): number {
        const availableWidth = this.getAvailableWidth();
        const cardGap = this.getCardGap();
        const threshold = this.settings.cardWidthThreshold;
        
        return Math.max(1, Math.floor((availableWidth + cardGap) / (threshold + cardGap)));
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
            height: '100%',
            width: 'calc(100% + var(--size-4-3))',
            paddingRight: 'var(--size-4-3)'
        };
    }

    /**
     * 카드 스타일을 가져옵니다.
     */
    public getCardStyle(isVertical: boolean, alignCardHeight: boolean): Partial<CSSStyleDeclaration> {
        const style: Partial<CSSStyleDeclaration> = {
            flexShrink: '0'
        };

        if (isVertical) {
            style.width = '100%';
            style.height = alignCardHeight
                ? `calc((100% - var(--card-navigator-gap) * (var(--cards-per-view) - 1)) / var(--cards-per-view))`
                : 'auto';
        } else {
            style.width = `calc((100% - var(--card-navigator-gap) * (var(--cards-per-view) - 1)) / var(--cards-per-view))`;
            style.height = '100%';
        }

        return style;
    }
    //#endregion
} 