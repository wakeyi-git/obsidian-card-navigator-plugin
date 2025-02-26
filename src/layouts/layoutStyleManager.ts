import { App } from 'obsidian';
import { CardNavigatorSettings } from 'common/types';
import { LayoutStrategy } from './layoutStrategy';

/**
 * 레이아웃 스타일을 중앙에서 관리하는 클래스
 * 컨테이너와 카드의 스타일을 일관되게 적용합니다.
 */
export class LayoutStyleManager {
    constructor(
        private app: App,
        private containerEl: HTMLElement,
        private settings: CardNavigatorSettings
    ) {
        this.updateCSSVariables();
    }

    /**
     * 모든 CSS 변수를 설정합니다.
     */
    public updateCSSVariables(): void {
        if (!this.containerEl) return;

        // 기본 CSS 변수 설정
        this.containerEl.style.setProperty('--cards-per-view', this.settings.cardsPerView.toString());
        this.containerEl.style.setProperty('--card-navigator-gap', `${this.getCardGap()}px`);
        this.containerEl.style.setProperty('--card-navigator-container-padding', `${this.getContainerPadding()}px`);
        
        // 그리드 레이아웃 CSS 변수
        this.containerEl.style.setProperty('--grid-columns', this.settings.gridColumns.toString());
        this.containerEl.style.setProperty('--grid-card-height', `${this.settings.gridCardHeight}px`);
        
        // 메이슨리 레이아웃 CSS 변수
        this.containerEl.style.setProperty('--masonry-columns', this.settings.masonryColumns.toString());
        this.containerEl.style.setProperty('--masonry-gap', `${this.getCardGap()}px`);
    }

    /**
     * 레이아웃 타입에 따라 컨테이너 스타일을 적용합니다.
     */
    public applyContainerStyle(layoutStrategy: LayoutStrategy): void {
        if (!this.containerEl) return;
        
        // 기본 스타일 설정
        this.containerEl.style.position = 'relative';
        this.containerEl.style.overflow = 'auto';
        
        // 스크롤 방향에 따른 스타일 설정
        const scrollDirection = layoutStrategy.getScrollDirection();
        const isVertical = scrollDirection === 'vertical';
        
        // 레이아웃 타입에 따른 스타일 설정
        const layoutType = layoutStrategy.getLayoutType();
        
        // CSS 변수 업데이트
        this.updateCSSVariables();
        
        // 컨테이너 패딩 설정 - 좌우에만 패딩 적용
        const containerPadding = this.getContainerPadding();
        this.containerEl.style.padding = `0 ${containerPadding}px`; // 상하 패딩은 0, 좌우만 패딩 적용
        
        // 레이아웃 타입별 스타일 적용
        if (layoutType === 'list') {
            this.applyListLayoutStyle(isVertical);
        } else if (layoutType === 'grid') {
            this.applyGridLayoutStyle(layoutStrategy.getColumnsCount());
        } else if (layoutType === 'masonry') {
            this.applyMasonryLayoutStyle(layoutStrategy.getColumnsCount());
        }
    }

    /**
     * 리스트 레이아웃 스타일을 적용합니다.
     */
    private applyListLayoutStyle(isVertical: boolean): void {
        if (!this.containerEl) return;
        
        // 카드 간격 설정
        const cardGap = this.getCardGap();
        this.containerEl.style.gap = `${cardGap}px`;
        
        // 플렉스 레이아웃 설정
        this.containerEl.style.display = 'flex';
        this.containerEl.style.flexDirection = isVertical ? 'column' : 'row';
        this.containerEl.style.alignItems = 'stretch';
        this.containerEl.style.flexWrap = 'nowrap';
        this.containerEl.style.justifyContent = 'flex-start';
        
        // 스크롤 방향에 따른 오버플로우 설정
        this.containerEl.style.overflowX = isVertical ? 'hidden' : 'auto';
        this.containerEl.style.overflowY = isVertical ? 'auto' : 'hidden';
        
        // CSS 변수 설정
        this.containerEl.style.setProperty('--list-direction', isVertical ? 'column' : 'row');
        this.containerEl.style.setProperty('--list-gap', `${cardGap}px`);
    }

    /**
     * 그리드 레이아웃 스타일을 적용합니다.
     */
    private applyGridLayoutStyle(columns: number): void {
        if (!this.containerEl) return;
        
        // 그리드 레이아웃 설정
        this.containerEl.style.display = 'grid';
        
        // 카드 간격 가져오기
        const cardGap = this.getCardGap();
        
        // 그리드 레이아웃 CSS 변수 설정
        this.containerEl.style.setProperty('--grid-columns', columns.toString());
        this.containerEl.style.setProperty('--grid-card-height', `${this.settings.gridCardHeight}px`);
        
        // 그리드 템플릿 설정
        this.containerEl.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;
        this.containerEl.style.gap = `${cardGap}px`;
        this.containerEl.style.gridAutoRows = `${this.settings.gridCardHeight}px`;
        
        // 스크롤 설정 (그리드는 항상 수직 스크롤)
        this.containerEl.style.overflowX = 'hidden';
        this.containerEl.style.overflowY = 'auto';
    }

    /**
     * 메이슨리 레이아웃 스타일을 적용합니다.
     */
    private applyMasonryLayoutStyle(columns: number): void {
        if (!this.containerEl) return;
        
        // 메이슨리 레이아웃은 블록 레이아웃 사용
        this.containerEl.style.display = 'block';
        
        // 메이슨리 레이아웃 CSS 변수 설정
        this.containerEl.style.setProperty('--masonry-columns', columns.toString());
        this.containerEl.style.setProperty('--masonry-gap', `${this.getCardGap()}px`);
        
        // 스크롤 설정 (메이슨리는 항상 수직 스크롤)
        this.containerEl.style.overflowX = 'hidden';
        this.containerEl.style.overflowY = 'auto';
    }

    /**
     * 카드 스타일을 계산합니다.
     */
    public getCardStyle(layoutStrategy: LayoutStrategy): Partial<CSSStyleDeclaration> {
        const layoutType = layoutStrategy.getLayoutType();
        const isVertical = layoutStrategy.getScrollDirection() === 'vertical';
        
        // 기본 스타일 설정 - position 속성은 각 레이아웃 타입별로 설정
        const style: Partial<CSSStyleDeclaration> = {
            boxSizing: 'border-box',
            transition: 'left 0.3s ease, top 0.3s ease, width 0.3s ease',
            padding: `var(--size-4-4)` // 모든 레이아웃에 동일한 패딩 적용
        };

        // 레이아웃 타입별 스타일 적용
        if (layoutType === 'list') {
            // 리스트 레이아웃 스타일
            style.position = 'relative';
            style.flexShrink = '0';
            
            if (isVertical) {
                style.width = '100%';
                const height = this.calculateCardHeight('list');
                style.height = height === 'auto' ? 'auto' : `${height}px`;
            } else {
                const cardWidth = this.calculateCardWidth(this.settings.cardsPerView);
                style.width = `${cardWidth}px`;
                style.height = '100%';
            }
        } else if (layoutType === 'grid') {
            // 그리드 레이아웃 스타일
            style.position = 'relative';
            style.height = `${this.settings.gridCardHeight}px`;
            style.width = '100%';
            style.display = 'flex';
            style.flexDirection = 'column';
            style.overflow = 'hidden';
        } else if (layoutType === 'masonry') {
            // 메이슨리 레이아웃 스타일
            style.position = 'absolute';
            style.width = 'var(--masonry-card-width, 100%)';
            style.transition = 'left 0.3s ease, top 0.3s ease';
        }

        return style;
    }

    /**
     * 카드 너비를 계산합니다.
     * 모든 레이아웃에서 일관되게 사용할 수 있는 통일된 계산 방식
     */
    public calculateCardWidth(columns: number): number {
        const containerWidth = this.containerEl?.offsetWidth || 0;
        const containerPadding = this.getContainerPadding();
        const cardGap = this.getCardGap();
        
        // 사용 가능한 너비 계산 (패딩 고려)
        const availableWidth = containerWidth - (containerPadding * 2);
        
        // 총 간격 너비 계산
        const totalGapWidth = cardGap * (columns - 1);
        
        // 카드 너비 계산 (정수로 내림)
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
            return 'auto';
        }

        // 리스트 레이아웃
        if (layout === 'list') {
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
            return Math.max(100, cardHeight - 1);
        }

        // 자동 레이아웃은 현재 설정에 따라 결정
        if (layout === 'auto') {
            const isVertical = this.containerEl ? 
                this.containerEl.offsetHeight > this.containerEl.offsetWidth : 
                true;
            
            if (isVertical) {
                return this.calculateCardHeight('list');
            } else {
                return 'auto';
            }
        }
        
        return 'auto';
    }

    /**
     * 사용 가능한 컨테이너 너비를 계산합니다.
     * 패딩을 고려한 실제 사용 가능한 너비를 반환합니다.
     */
    public getAvailableWidth(): number {
        if (!this.containerEl) return 0;
        
        const containerWidth = this.containerEl.offsetWidth;
        const containerPadding = this.getContainerPadding();
        
        return containerWidth - (containerPadding * 2);
    }

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

    /**
     * 설정을 업데이트합니다.
     */
    public updateSettings(settings: CardNavigatorSettings): void {
        this.settings = settings;
        this.updateCSSVariables();
    }

    /**
     * 초기 컨테이너 크기를 설정합니다.
     * 컨테이너 크기가 처음 설정될 때 호출됩니다.
     */
    public setInitialContainerSize(width: number, height: number): void {
        if (!this.containerEl) return;
        
        // 컨테이너 크기 정보를 CSS 변수로 저장
        this.containerEl.style.setProperty('--container-initial-width', `${width}px`);
        this.containerEl.style.setProperty('--container-initial-height', `${height}px`);
        
        // 방향 정보 저장 (높이가 너비보다 크면 세로 방향)
        const isVertical = height >= width;
        this.containerEl.style.setProperty('--container-orientation', isVertical ? 'vertical' : 'horizontal');
        
        console.log(`[CardNavigator] 초기 컨테이너 크기 설정: ${width}x${height}, 방향: ${isVertical ? '세로' : '가로'}`);
    }
} 
