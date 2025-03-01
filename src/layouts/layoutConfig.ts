import { App } from 'obsidian';
import { CardNavigatorSettings, Card } from 'common/types';
import { LayoutDirection } from './layoutStrategy';

/**
 * 레이아웃 설정을 관리하는 클래스
 * 
 * 이 클래스는 카드 레이아웃에 필요한 설정값을 계산하고 관리합니다.
 * 컨테이너 크기, 카드 간격, 방향 등의 설정을 처리합니다.
 */
export class LayoutConfig {
    private container: HTMLElement | null = null;
    private settings: CardNavigatorSettings;
    private isInitialized: boolean = false;
    private defaultContainerSize: { width: number; height: number } = { width: 800, height: 600 };

    constructor(settings: CardNavigatorSettings) {
        this.settings = settings;
    }

    /**
     * 컨테이너를 설정합니다.
     */
    async setContainer(container: HTMLElement): Promise<void> {
        this.container = container;
        if (container) {
            this.isInitialized = true;
        }
    }

    /**
     * 설정을 업데이트합니다.
     */
    updateSettings(settings: CardNavigatorSettings): void {
        this.settings = settings;
    }

    /**
     * 레이아웃 방향을 가져옵니다.
     */
    public getLayoutDirection(): LayoutDirection {
        const { isVertical } = this.calculateContainerOrientation();
        return isVertical ? 'vertical' : 'horizontal';
    }

    /**
     * 컨테이너 방향을 계산합니다.
     */
    public calculateContainerOrientation(): { ratio: number, isVertical: boolean } {
        const { width, height } = this.getContainerSize();
        const ratio = width / height;
        
        let isVertical = true;
        
        if (this.settings.layoutDirection === 'auto') {
            isVertical = ratio < 1.2;
        } else {
            isVertical = this.settings.layoutDirection === 'vertical';
        }
        
        return { ratio, isVertical };
    }

    /**
     * 카드 간격을 가져옵니다.
     */
    getCardGap(): number {
        return this.settings.cardGap;
    }

    /**
     * CSS 변수 값을 가져옵니다.
     */
    public getCSSVariable(variableName: string, defaultValue: number): number {
        if (!this.container) return defaultValue;
        const valueStr = getComputedStyle(this.container).getPropertyValue(variableName).trim();
        return parseInt(valueStr) || defaultValue;
    }

    /**
     * 컨테이너 패딩을 가져옵니다.
     */
    public getContainerPadding(): number {
        return this.settings.containerPadding;
    }

    /**
     * 컨테이너 크기를 가져옵니다.
     */
    getContainerSize(): { width: number, height: number } {
        if (!this.container || !document.body.contains(this.container)) {
            return this.defaultContainerSize;
        }

        try {
            // 방법 1: getBoundingClientRect 사용
            const rect = this.container.getBoundingClientRect();
            let width = rect.width;
            let height = rect.height;

            if (width > 0 && height > 0) {
                return { width, height };
            }

            // 방법 2: offsetWidth/offsetHeight 사용
            width = this.container.offsetWidth;
            height = this.container.offsetHeight;

            if (width > 0 && height > 0) {
                return { width, height };
            }

            // 방법 3: CSS 변수 확인
            const containerWidthVar = getComputedStyle(this.container).getPropertyValue('--container-width');
            const containerHeightVar = getComputedStyle(this.container).getPropertyValue('--container-height');
            
            if (containerWidthVar && containerHeightVar) {
                const parsedWidth = parseFloat(containerWidthVar);
                const parsedHeight = parseFloat(containerHeightVar);
                
                if (!isNaN(parsedWidth) && parsedWidth > 0 && !isNaN(parsedHeight) && parsedHeight > 0) {
                    return { width: parsedWidth, height: parsedHeight };
                }
            }

            return this.defaultContainerSize;
        } catch (error) {
            return this.defaultContainerSize;
        }
    }
    
    /**
     * 사용 가능한 너비를 계산합니다.
     */
    public getAvailableWidth(): number {
        const { width } = this.getContainerSize();
        const padding = this.getContainerPadding() * 2;
        return Math.max(0, width - padding);
    }

    /**
     * 사용 가능한 높이를 계산합니다.
     */
    public getAvailableHeight(): number {
        const { height } = this.getContainerSize();
        const padding = this.getContainerPadding() * 2;
        const availableHeight = Math.max(0, height - padding);
        
        const maxReasonableHeight = 10000;
        return Math.min(availableHeight, maxReasonableHeight);
    }

    /**
     * 컨테이너 너비에 따라 자동으로 열 수를 계산합니다.
     */
    public calculateAutoColumns(): number {
        const availableWidth = this.getAvailableWidth();
        const gap = this.getCardGap();
        const cardThresholdWidth = this.settings.cardThresholdWidth;
        const hysteresisBuffer = 50;
        const currentColumns = this.isInitialized ? (this.settings.cardsPerColumn || 1) : 1;
        
        const maxPossibleColumns = Math.max(1, Math.floor((availableWidth + gap) / (cardThresholdWidth + gap)));
        
        const shouldIncrease = maxPossibleColumns > currentColumns && 
            availableWidth >= (currentColumns + 1) * cardThresholdWidth + currentColumns * gap + hysteresisBuffer;
        
        const shouldDecrease = currentColumns > 1 && (
            maxPossibleColumns < currentColumns || 
            availableWidth < currentColumns * cardThresholdWidth + (currentColumns - 1) * gap - hysteresisBuffer
        );
        
        let newColumns = currentColumns;
        
        if (shouldIncrease) {
            newColumns = Math.min(maxPossibleColumns, currentColumns + 1);
        } else if (shouldDecrease) {
            newColumns = Math.max(1, maxPossibleColumns);
        }
        
        return newColumns;
    }

    /**
     * 카드 너비를 계산합니다.
     */
    public calculateCardWidth(columns: number): number {
        const availableWidth = this.getAvailableWidth();
        const cardGap = this.getCardGap();
        const totalGapWidth = cardGap * (columns - 1);
        
        return (availableWidth - totalGapWidth) / columns;
    }

    /**
     * 카드 높이를 계산합니다.
     */
    public calculateCardHeight(direction: LayoutDirection, card?: Card, cardWidth?: number): number | 'auto' {
        if (!this.settings.alignCardHeight) {
            return 'auto';
        }
        
        if (this.settings.useFixedHeight && this.settings.fixedCardHeight > 0) {
            return this.settings.fixedCardHeight;
        }
        
        if (!this.settings.useFixedHeight && this.settings.cardsPerColumn > 0) {
            const availableHeight = this.getAvailableHeight();
            const cardGap = this.getCardGap();
            const totalGapHeight = (this.settings.cardsPerColumn - 1) * cardGap;
            return Math.floor((availableHeight - totalGapHeight) / this.settings.cardsPerColumn);
        }
        
        return 'auto';
    }

    /**
     * 열 수를 가져옵니다.
     */
    public getColumns(): number {
        return this.calculateAutoColumns();
    }
    
    /**
     * 카드 크기를 가져옵니다.
     */
    public getCardSize(): { width: number, height: number } {
        const columns = this.getColumns();
        const cardWidth = this.calculateCardWidth(columns);
        const cardHeight = this.calculateCardHeight(this.getLayoutDirection());
        
        return {
            width: cardWidth,
            height: typeof cardHeight === 'number' ? cardHeight : 200
        };
    }
} 