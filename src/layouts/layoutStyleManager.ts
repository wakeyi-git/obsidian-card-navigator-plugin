import { App } from 'obsidian';
import { CardNavigatorSettings } from 'common/types';
import { LayoutStrategy } from './layoutStrategy';
import { LayoutConfig } from './layoutConfig';

/**
 * 레이아웃 스타일을 DOM 요소에 적용하는 클래스
 * 모든 스타일 관리를 중앙화하여 스타일 충돌을 방지합니다.
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
        
        // 기존 스타일 속성 제거 (충돌 방지)
        this.clearContainerStyles();
        
        // 기본 스타일 설정
        this.containerEl.style.position = 'relative';
        
        // 스크롤 방향에 따른 스타일 설정
        const scrollDirection = layoutStrategy.getScrollDirection();
        const isVertical = scrollDirection === 'vertical';
        const layoutType = layoutStrategy.getLayoutType();
        
        console.log(`[CardNavigator] 컨테이너 스타일 적용: layoutType = ${layoutType}, scrollDirection = ${scrollDirection}, isVertical = ${isVertical}`);
        
        // CSS 변수 업데이트
        this.updateCSSVariables();
        
        // 레이아웃 타입별 스타일 적용
        if (layoutType === 'list') {
            this.applyListLayoutStyle(isVertical);
        } else if (layoutType === 'grid') {
            this.applyGridLayoutStyle(layoutStrategy.getColumnsCount());
            // 그리드 레이아웃 클래스 추가
            this.containerEl.classList.add('grid-layout');
        } else if (layoutType === 'masonry') {
            this.applyMasonryLayoutStyle(layoutStrategy.getColumnsCount());
            // 메이슨리 레이아웃 클래스 추가
            this.containerEl.classList.add('masonry-layout');
        }
        
        // 방향 클래스 추가 (리스트 레이아웃은 이미 applyListLayoutStyle에서 처리)
        if (layoutType !== 'list') {
            this.containerEl.classList.toggle('vertical-layout', isVertical);
            this.containerEl.classList.toggle('horizontal-layout', !isVertical);
        }
    }
    
    /**
     * 컨테이너의 기존 스타일 속성을 제거합니다.
     */
    private clearContainerStyles(): void {
        if (!this.containerEl) return;
        
        // 레이아웃 관련 클래스 제거
        this.containerEl.classList.remove('list-layout', 'grid-layout', 'masonry-layout', 'vertical-layout', 'horizontal-layout');
        
        // 스타일 속성 제거
        const stylesToRemove = [
            'display', 'flex-direction', 'gap', 'align-items', 'align-content',
            'justify-content', 'flex-wrap', 'overflow-x', 'overflow-y',
            'grid-template-columns', 'grid-auto-rows', 'padding-left', 'padding-right',
            'padding-top', 'padding-bottom'
        ];
        
        stylesToRemove.forEach(style => {
            this.containerEl.style.removeProperty(style);
        });
    }

    /**
     * 리스트 레이아웃 스타일을 적용합니다.
     */
    private applyListLayoutStyle(isVertical: boolean): void {
        if (!this.containerEl) return;
        
        // 카드 간격 설정
        const cardGap = this.layoutConfig.getCardGap();
        const containerPadding = this.layoutConfig.getContainerPadding();
        
        // 높이 정렬 설정 가져오기
        const alignCardHeight = this.settings.alignCardHeight;
        
        // 컨테이너 크기 로깅
        const { width, height } = this.layoutConfig.getContainerSize();
        console.log(`[CardNavigator] applyListLayoutStyle - 컨테이너 크기: ${width}x${height}, isVertical: ${isVertical}, alignCardHeight: ${alignCardHeight}`);
        
        // 리스트 레이아웃 클래스 추가
        this.containerEl.classList.add('list-layout');
        
        // 세로 모드에서 1열 리스트는 그리드 레이아웃으로 구현
        if (isVertical) {
            // 방향 클래스 추가
            this.containerEl.classList.add('vertical-layout');
            this.containerEl.classList.remove('horizontal-layout');
            
            // 그리드 레이아웃 설정 (1열 그리드)
            this.containerEl.style.display = 'grid';
            this.containerEl.style.gridTemplateColumns = '1fr';
            this.containerEl.style.gap = `${cardGap}px`;
            
            // 카드 높이 설정
            if (alignCardHeight) {
                // 높이 정렬이 활성화된 경우 고정 높이 사용
                const cardHeight = this.layoutConfig.calculateCardHeight(this.settings.defaultLayout, isVertical);
                if (cardHeight !== 'auto') {
                    this.containerEl.style.gridAutoRows = `${cardHeight}px`;
                    this.containerEl.style.setProperty('--card-height', `${cardHeight}px`);
                } else {
                    this.containerEl.style.gridAutoRows = 'auto';
                    this.containerEl.style.setProperty('--card-height', 'auto');
                }
            } else {
                // 높이 정렬이 비활성화된 경우 자동 높이 사용
                this.containerEl.style.gridAutoRows = 'auto';
                this.containerEl.style.setProperty('--card-height', 'auto');
            }
            
            // 스크롤 설정
            this.containerEl.style.overflowX = 'hidden';
            this.containerEl.style.overflowY = 'auto';
            
            // 패딩 설정
            this.containerEl.style.padding = `${containerPadding}px`;
        } else {
            // 방향 클래스 추가
            this.containerEl.classList.add('horizontal-layout');
            this.containerEl.classList.remove('vertical-layout');
            
            // 가로 모드에서는 그리드 레이아웃 설정 (1행 그리드)
            this.containerEl.style.display = 'grid';
            this.containerEl.style.gridTemplateRows = '1fr';
            this.containerEl.style.gridAutoFlow = 'column';
            this.containerEl.style.gap = `${cardGap}px`;
            
            // 카드 너비 설정
            const cardWidth = this.layoutConfig.calculateCardWidth(this.settings.cardsPerView);
            this.containerEl.style.setProperty('--card-fixed-width', `${cardWidth}px`);
            
            // 카드 높이 설정
            if (alignCardHeight) {
                this.containerEl.style.gridAutoColumns = `${cardWidth}px`;
                this.containerEl.style.setProperty('--card-height', '100%');
            } else {
                this.containerEl.style.gridAutoColumns = 'auto';
                this.containerEl.style.setProperty('--card-height', 'auto');
            }
            
            // 스크롤 설정
            this.containerEl.style.overflowX = 'auto';
            this.containerEl.style.overflowY = 'hidden';
            
            // 패딩 설정
            this.containerEl.style.paddingTop = `${containerPadding}px`;
            this.containerEl.style.paddingBottom = `${containerPadding}px`;
            this.containerEl.style.paddingLeft = '0';
            this.containerEl.style.paddingRight = '0';
        }
        
        // CSS 변수 설정
        this.containerEl.style.setProperty('--list-direction', isVertical ? 'column' : 'row');
        this.containerEl.style.setProperty('--list-gap', `${cardGap}px`);
        this.containerEl.style.setProperty('--align-card-height', alignCardHeight ? 'true' : 'false');
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
        const containerPadding = this.layoutConfig.getContainerPadding();
        
        // 그리드 레이아웃 CSS 변수 설정
        this.containerEl.style.setProperty('--grid-columns', columns.toString());
        this.containerEl.style.setProperty('--grid-card-height', `${this.settings.gridCardHeight}px`);
        
        // 그리드 템플릿 설정
        this.containerEl.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;
        this.containerEl.style.gap = `${cardGap}px`;
        this.containerEl.style.gridAutoRows = `${this.settings.gridCardHeight}px`;
        
        // 패딩 설정
        this.containerEl.style.padding = `${containerPadding}px`;
        
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
        this.containerEl.style.position = 'relative';
        
        // 카드 간격 및 패딩 가져오기
        const cardGap = this.layoutConfig.getCardGap();
        const containerPadding = this.layoutConfig.getContainerPadding();
        
        // 패딩 설정
        this.containerEl.style.padding = `${containerPadding}px`;
        
        // 메이슨리 레이아웃 CSS 변수 설정
        this.containerEl.style.setProperty('--masonry-columns', columns.toString());
        this.containerEl.style.setProperty('--masonry-gap', `${cardGap}px`);
        
        // 스크롤 설정 (메이슨리는 항상 수직 스크롤)
        this.containerEl.style.overflowX = 'hidden';
        this.containerEl.style.overflowY = 'auto';
    }

    /**
     * 카드 스타일을 적용합니다.
     */
    public applyCardStyle(
        cardEl: HTMLElement,
        layoutStrategy: LayoutStrategy,
        isActive: boolean,
        isFocused: boolean
    ): void {
        if (!cardEl) return;
        
        const layoutType = layoutStrategy.getLayoutType();
        const isVertical = layoutStrategy.getScrollDirection() === 'vertical';
        
        // 활성 및 포커스 상태 클래스 추가
        cardEl.classList.toggle('card-navigator-active', isActive);
        cardEl.classList.toggle('card-navigator-focused', isFocused);
        
        // 레이아웃 타입에 따른 스타일 적용
        if (layoutType === 'list') {
            // 리스트 레이아웃 카드 스타일
            if (isVertical) {
                // 세로 모드 리스트 카드
                cardEl.style.width = '100%';
                
                if (this.settings.alignCardHeight) {
                    const cardHeight = this.layoutConfig.calculateCardHeight('list', isVertical);
                    if (cardHeight !== 'auto') {
                        cardEl.style.height = `${cardHeight}px`;
                    }
                } else {
                    cardEl.style.height = 'auto';
                }
            } else {
                // 가로 모드 리스트 카드
                const cardWidth = this.layoutConfig.calculateCardWidth(this.settings.cardsPerView);
                cardEl.style.width = `${cardWidth}px`;
                
                if (this.settings.alignCardHeight) {
                    cardEl.style.height = '100%';
                } else {
                    cardEl.style.height = 'auto';
                }
            }
        } else if (layoutType === 'grid') {
            // 그리드 레이아웃 카드 스타일
            cardEl.style.width = '100%';
            
            if (this.settings.alignCardHeight) {
                cardEl.style.height = `${this.settings.gridCardHeight}px`;
            } else {
                cardEl.style.height = 'auto';
            }
        }
        // 메이슨리 레이아웃은 이미 위치와 크기가 설정되어 있으므로 추가 스타일 필요 없음
    }

    /**
     * 카드 스타일을 계산합니다.
     * 이 메서드는 레이아웃 전략에서 호출하여 카드 스타일을 가져갑니다.
     */
    public getCardStyle(layoutStrategy: LayoutStrategy): Partial<CSSStyleDeclaration> {
        const layoutType = layoutStrategy.getLayoutType();
        const isVertical = layoutStrategy.getScrollDirection() === 'vertical';
        
        console.log(`[CardNavigator] 카드 스타일 계산: layoutType = ${layoutType}, isVertical = ${isVertical}`);
        
        // 기본 카드 스타일 직접 생성
        const style: Partial<CSSStyleDeclaration> = {
            boxSizing: 'border-box',
            transition: 'transform 0.3s ease, width 0.3s ease, height 0.3s ease',
            padding: `var(--size-4-4)`,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            borderRadius: 'var(--radius-m)',
            border: 'var(--border-width) solid var(--background-modifier-border)',
            backgroundColor: 'var(--background-primary)'
        };
        
        // 레이아웃 타입별 추가 스타일
        if (layoutType === 'grid') {
            style.height = `${this.settings.gridCardHeight}px`;
        } else if (layoutType === 'masonry') {
            style.position = 'absolute';
            style.left = '0';
            style.top = '0';
            style.transition = 'transform 0.35s cubic-bezier(0.25, 0.1, 0.25, 1), width 0.35s cubic-bezier(0.25, 0.1, 0.25, 1)';
            style.willChange = 'transform, width';
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
