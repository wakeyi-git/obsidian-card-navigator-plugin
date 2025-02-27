import { App } from 'obsidian';
import { CardNavigatorSettings } from 'common/types';
import { LayoutStrategy } from './layoutStrategy';
import { LayoutConfig } from './layoutConfig';

/**
 * 레이아웃 스타일을 DOM 요소에 적용하는 클래스
 * LayoutConfig의 계산 결과를 사용하여 실제 DOM 요소에 스타일을 적용합니다.
 */
export class LayoutStyleManager {
    private layoutConfig: LayoutConfig;

    constructor(
        private app: App,
        private containerEl: HTMLElement,
        private settings: CardNavigatorSettings
    ) {
        this.layoutConfig = new LayoutConfig(app, containerEl, settings);
        this.updateCSSVariables();
    }

    /**
     * 모든 CSS 변수를 설정합니다.
     */
    public updateCSSVariables(): void {
        if (!this.containerEl) return;

        // 기본 CSS 변수 설정
        this.containerEl.style.setProperty('--cards-per-view', this.settings.cardsPerView.toString());
        this.containerEl.style.setProperty('--card-navigator-gap', `${this.layoutConfig.getCardGap()}px`);
        this.containerEl.style.setProperty('--card-navigator-container-padding', `${this.layoutConfig.getContainerPadding()}px`);
        
        // 그리드 레이아웃 CSS 변수
        this.containerEl.style.setProperty('--grid-columns', this.settings.gridColumns.toString());
        this.containerEl.style.setProperty('--grid-card-height', `${this.settings.gridCardHeight}px`);
        
        // 메이슨리 레이아웃 CSS 변수
        this.containerEl.style.setProperty('--masonry-columns', this.settings.masonryColumns.toString());
        this.containerEl.style.setProperty('--masonry-gap', `${this.layoutConfig.getCardGap()}px`);
    }

    /**
     * 레이아웃 타입에 따라 컨테이너 스타일을 적용합니다.
     */
    public applyContainerStyle(layoutStrategy: LayoutStrategy): void {
        if (!this.containerEl) return;
        
        // 컨테이너 크기 로깅
        const { width, height, ratio } = this.layoutConfig.getContainerSize();
        console.log(`[CardNavigator] applyContainerStyle - 컨테이너 크기: ${width}x${height}, 비율(w/h): ${ratio.toFixed(2)}`);
        
        // 기본 스타일 설정
        this.containerEl.style.position = 'relative';
        
        // 스크롤 방향에 따른 스타일 설정
        const scrollDirection = layoutStrategy.getScrollDirection();
        const isVertical = scrollDirection === 'vertical';
        
        console.log(`[CardNavigator] 컨테이너 스타일 적용: layoutType = ${layoutStrategy.getLayoutType()}, scrollDirection = ${scrollDirection}, isVertical = ${isVertical}`);
        
        // CSS 변수 업데이트
        this.updateCSSVariables();
        
        // 컨테이너 스타일 적용 (LayoutConfig에서 가져온 스타일 사용)
        const containerStyle = this.layoutConfig.getContainerStyle(isVertical);
        Object.assign(this.containerEl.style, containerStyle);
        
        // 레이아웃 타입별 추가 스타일 적용
        const layoutType = layoutStrategy.getLayoutType();
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
        
        // 컨테이너 크기 로깅
        const { width, height, ratio } = this.layoutConfig.getContainerSize();
        console.log(`[CardNavigator] applyListLayoutStyle - 컨테이너 크기: ${width}x${height}, 비율(w/h): ${ratio.toFixed(2)}`);
        
        // 카드 간격 설정
        const cardGap = this.layoutConfig.getCardGap();
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
        
        console.log(`[CardNavigator] 리스트 레이아웃 스타일 적용: isVertical = ${isVertical}, flexDirection = ${isVertical ? 'column' : 'row'}`);
    }

    /**
     * 그리드 레이아웃 스타일을 적용합니다.
     */
    private applyGridLayoutStyle(columns: number): void {
        if (!this.containerEl) return;
        
        // 그리드 레이아웃 설정
        this.containerEl.style.display = 'grid';
        
        // 카드 간격 가져오기
        const cardGap = this.layoutConfig.getCardGap();
        
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
        this.containerEl.style.setProperty('--masonry-gap', `${this.layoutConfig.getCardGap()}px`);
        
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
        
        console.log(`[CardNavigator] 카드 스타일 계산: layoutType = ${layoutType}, isVertical = ${isVertical}`);
        
        // LayoutConfig에서 카드 스타일 가져오기
        const style = this.layoutConfig.getCardStyle(isVertical, this.settings.alignCardHeight);
        
        // 레이아웃 타입별 추가 스타일 적용
        if (layoutType === 'grid') {
            // 그리드 레이아웃 추가 스타일
            style.display = 'flex';
            style.flexDirection = 'column';
            style.overflow = 'hidden';
        } else if (layoutType === 'masonry') {
            // 메이슨리 레이아웃 추가 스타일
            style.position = 'absolute';
            style.width = 'var(--masonry-card-width, 100%)';
            style.transition = 'left 0.3s ease, top 0.3s ease';
        }
        
        return style;
    }

    /**
     * 카드 너비를 계산합니다.
     */
    public calculateCardWidth(columns: number): number {
        return this.layoutConfig.calculateCardWidth(columns);
    }

    /**
     * 카드 높이를 계산합니다.
     */
    public calculateCardHeight(layout: CardNavigatorSettings['defaultLayout']): number | 'auto' {
        // 카드 객체와 너비는 전달하지 않음 (메이슨리 레이아웃에서만 필요)
        return this.layoutConfig.calculateCardHeight(layout, this.layoutConfig.isVerticalContainer());
    }

    /**
     * 사용 가능한 컨테이너 너비를 계산합니다.
     */
    public getAvailableWidth(): number {
        return this.layoutConfig.getAvailableWidth();
    }

    /**
     * LayoutConfig 인스턴스를 반환합니다.
     */
    public getLayoutConfig(): LayoutConfig {
        return this.layoutConfig;
    }

    /**
     * 설정을 업데이트합니다.
     */
    public updateSettings(settings: CardNavigatorSettings): void {
        this.settings = settings;
        this.layoutConfig.updateSettings(settings);
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
