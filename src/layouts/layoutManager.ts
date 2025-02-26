import { CardNavigatorSettings, Card } from "common/types";
import { CardMaker } from "ui/cardContainer/cardMaker";
import { GridLayout } from "./gridLayout";
import { ListLayout } from "./listLayout";
import { MasonryLayout } from "./masonryLayout";
import { LayoutStrategy, CardPosition } from "./layoutStrategy";
import { LayoutStyleManager } from "./layoutStyleManager";

export class LayoutManager {
    private currentLayout: CardNavigatorSettings['defaultLayout'];
    private layoutStrategy: LayoutStrategy;
    private layoutStyleManager: LayoutStyleManager;
    private containerEl: HTMLElement;
    private lastContainerWidth: number = 0;
    private lastContainerHeight: number = 0;

    constructor(
        private plugin: any,
        containerEl: HTMLElement,
        private cardMaker: CardMaker
    ) {
        this.containerEl = containerEl;
        this.layoutStyleManager = new LayoutStyleManager(plugin.app, containerEl, plugin.settings);
        this.currentLayout = plugin.settings.defaultLayout;
        this.lastContainerWidth = containerEl.offsetWidth;
        this.lastContainerHeight = containerEl.offsetHeight;
        this.layoutStrategy = this.createLayoutStrategy();
        
        // 초기 스타일 적용
        this.layoutStyleManager.applyContainerStyle(this.layoutStrategy);
    }

    /**
     * 현재 레이아웃 타입을 반환합니다.
     */
    public getCurrentLayout(): CardNavigatorSettings['defaultLayout'] {
        return this.currentLayout;
    }

    /**
     * 현재 레이아웃 전략을 반환합니다.
     */
    public getLayoutStrategy(): LayoutStrategy {
        return this.layoutStrategy;
    }

    /**
     * 레이아웃 타입을 설정합니다.
     */
    public setLayout(layout: CardNavigatorSettings['defaultLayout']) {
        const oldLayout = this.currentLayout;
        this.currentLayout = layout;
        
        const oldLayoutStrategy = this.layoutStrategy;
        const oldLayoutType = oldLayoutStrategy.getLayoutType();
        
        this.layoutStrategy = this.createLayoutStrategy();
        const newLayoutType = this.layoutStrategy.getLayoutType();
        
        // 레이아웃 스타일 적용
        this.layoutStyleManager.applyContainerStyle(this.layoutStrategy);
        
        // 레이아웃 타입이 변경된 경우 이벤트 발생
        if (oldLayoutType !== newLayoutType) {
            // 레이아웃 타입 변경 이벤트 발생
            const event = new CustomEvent('layout-type-changed', { 
                detail: { 
                    oldType: oldLayoutType,
                    newType: newLayoutType
                } 
            });
            this.containerEl.dispatchEvent(event);
        }
    }

    /**
     * 컨테이너 방향 변경 시 레이아웃을 업데이트합니다.
     */
    public updateLayout() {
        const oldLayoutType = this.layoutStrategy.getLayoutType();
        this.layoutStrategy = this.createLayoutStrategy();
        const newLayoutType = this.layoutStrategy.getLayoutType();
        
        // 레이아웃 타입이 변경된 경우에만 스타일 다시 적용
        if (oldLayoutType !== newLayoutType) {
            this.layoutStyleManager.applyContainerStyle(this.layoutStrategy);
        }
    }

    /**
     * 카드를 배치합니다.
     */
    public arrangeCards(cards: Card[], containerWidth?: number, containerHeight?: number): CardPosition[] {
        if (!containerWidth) {
            containerWidth = this.containerEl.offsetWidth;
        }
        if (!containerHeight) {
            containerHeight = this.containerEl.offsetHeight;
        }
        
        // 컨테이너 크기 저장
        this.lastContainerWidth = containerWidth;
        this.lastContainerHeight = containerHeight;
        
        return this.layoutStrategy.calculatePositions(cards, containerWidth, containerHeight);
    }

    /**
     * 컨테이너 크기 변경 처리
     */
    public handleContainerResize(newWidth: number, newHeight?: number): void {
        if (!newHeight) {
            newHeight = this.containerEl.offsetHeight;
        }
        
        // 컨테이너 크기 변경 여부 확인
        const widthChanged = Math.abs(this.lastContainerWidth - newWidth) > 2;
        const heightChanged = Math.abs(this.lastContainerHeight - newHeight) > 2;
        
        if (!widthChanged && !heightChanged) {
            return; // 크기 변경이 없으면 처리 중단
        }
        
        // 컨테이너 크기 저장
        this.lastContainerWidth = newWidth;
        this.lastContainerHeight = newHeight;
        
        // 자동 레이아웃 모드에서 레이아웃 타입 변경 여부 확인
        if (this.plugin.settings.defaultLayout === 'auto') {
            const shouldUpdate = this.shouldUpdateLayoutType(this.layoutStrategy);
            if (shouldUpdate) {
                // 레이아웃 타입 변경이 필요한 경우 새로운 레이아웃 전략 생성
                const oldLayoutType = this.layoutStrategy.getLayoutType();
                this.layoutStrategy = this.createLayoutStrategy();
                const newLayoutType = this.layoutStrategy.getLayoutType();
                
                // 레이아웃 타입이 변경된 경우에만 스타일 다시 적용
                if (oldLayoutType !== newLayoutType) {
                    this.layoutStyleManager.applyContainerStyle(this.layoutStrategy);
                    
                    // 레이아웃 타입 변경 이벤트 발생
                    const event = new CustomEvent('layout-type-changed', { 
                        detail: { 
                            oldType: oldLayoutType,
                            newType: newLayoutType
                        } 
                    });
                    this.containerEl.dispatchEvent(event);
                    
                    return; // 레이아웃 타입이 변경되었으므로 여기서 종료
                }
            } else {
                // 레이아웃 타입은 변경되지 않지만 열 수가 변경될 수 있음
                const availableWidth = this.layoutStyleManager.getAvailableWidth();
                const cardWidthThreshold = this.plugin.settings.cardWidthThreshold || 300;
                const cardGap = this.layoutStyleManager.getCardGap();
                
                // 현재 열 수 계산
                const columns = Math.max(1, Math.floor(availableWidth / (cardWidthThreshold + cardGap)));
                const currentColumns = this.layoutStrategy.getColumnsCount();
                
                // 열 수가 변경된 경우 현재 레이아웃 전략의 열 수 업데이트
                if (columns !== currentColumns) {
                    if (this.layoutStrategy instanceof GridLayout || this.layoutStrategy instanceof MasonryLayout) {
                        this.layoutStrategy.setColumnsCount(columns);
                    }
                }
            }
        }
        
        // 레이아웃 타입별 처리
        const layoutType = this.layoutStrategy.getLayoutType();
        
        // 모든 레이아웃 타입에 대해 컨테이너 크기 변경 처리
        this.layoutStrategy.handleContainerResize(newWidth);
        
        // 레이아웃 스타일 매니저 업데이트
        this.layoutStyleManager.updateCSSVariables();
    }

    /**
     * 레이아웃 타입 변경 여부를 확인합니다.
     */
    private shouldUpdateLayoutType(currentStrategy: LayoutStrategy): boolean {
        const isVertical = this.isVerticalContainer();
        const settings = this.plugin.settings;
        
        // 자동 레이아웃이 아닌 경우 변경 불필요
        if (settings.defaultLayout !== 'auto') {
            return false;
        }
        
        // 컨테이너 너비에 따른 열 수 계산
        const availableWidth = this.layoutStyleManager.getAvailableWidth();
        const cardWidthThreshold = settings.cardWidthThreshold || 300; // 기본값 300px
        const cardGap = this.layoutStyleManager.getCardGap();
        
        // 현재 열 수 계산 - 더 안정적인 계산 방식 사용
        // 카드 너비와 간격을 고려하여 컨테이너에 맞는 열 수 계산
        const columns = Math.max(1, Math.floor(availableWidth / (cardWidthThreshold + cardGap)));
        
        // 현재 전략의 열 수와 비교
        const currentColumns = currentStrategy.getColumnsCount();
        
        // 열 수가 변경되었거나 방향이 변경된 경우 레이아웃 업데이트 필요
        const columnsChanged = columns !== currentColumns;
        const directionChanged = 
            (currentStrategy instanceof ListLayout && 
             currentStrategy.getScrollDirection() !== (isVertical ? 'vertical' : 'horizontal'));
        
        // 레이아웃 타입 변경 여부 확인
        // 1. 열 수가 1에서 2 이상으로 변경되거나 그 반대인 경우 (리스트 <-> 그리드/메이슨리)
        // 2. 현재 그리드 레이아웃인데 alignCardHeight가 false로 변경된 경우 (그리드 -> 메이슨리)
        // 3. 현재 메이슨리 레이아웃인데 alignCardHeight가 true로 변경된 경우 (메이슨리 -> 그리드)
        const layoutTypeChangeNeeded = 
            (columnsChanged && ((currentColumns === 1 && columns > 1) || (currentColumns > 1 && columns === 1))) ||
            (currentStrategy instanceof GridLayout && !settings.alignCardHeight) ||
            (currentStrategy instanceof MasonryLayout && settings.alignCardHeight);
        
        return layoutTypeChangeNeeded || directionChanged;
    }

    /**
     * 컨테이너가 수직인지 확인합니다.
     */
    private isVerticalContainer(): boolean {
        if (!this.containerEl) return true;
        const { width, height } = this.containerEl.getBoundingClientRect();
        return height > width;
    }

    /**
     * 사용 가능한 컨테이너 너비를 계산합니다.
     */
    private getAvailableWidth(): number {
        return this.layoutStyleManager.getAvailableWidth();
    }

    /**
     * 레이아웃 스타일 매니저를 반환합니다.
     */
    public getLayoutStyleManager(): LayoutStyleManager {
        return this.layoutStyleManager;
    }

    /**
     * 카드 스타일을 계산합니다.
     */
    public getCardStyle(): Partial<CSSStyleDeclaration> {
        return this.layoutStyleManager.getCardStyle(this.layoutStrategy);
    }

    /**
     * 레이아웃 전략을 생성합니다.
     */
    private createLayoutStrategy(): LayoutStrategy {
        const settings = this.plugin.settings;
        let layoutStrategy: LayoutStrategy;

        // 자동 레이아웃 처리
        if (settings.defaultLayout === 'auto') {
            const isVertical = this.isVerticalContainer();
            const availableWidth = this.layoutStyleManager.getAvailableWidth();
            const cardWidthThreshold = settings.cardWidthThreshold || 300; // 기본값 300px
            const cardGap = this.layoutStyleManager.getCardGap();
            
            // 사용 가능한 너비에 따라 열 수 계산 - 더 안정적인 계산 방식 사용
            const columns = Math.max(1, Math.floor(availableWidth / (cardWidthThreshold + cardGap)));
            
            // 컨테이너 방향과 크기에 따라 적절한 레이아웃 선택
            if (columns === 1) {
                // 1열인 경우 항상 리스트 레이아웃 사용
                layoutStrategy = new ListLayout(isVertical, settings, this.plugin.app, this.containerEl);
            } else if (isVertical) {
                // 세로 방향이고 여러 열이 가능한 경우
                if (settings.alignCardHeight) {
                    // 카드 높이 정렬이 활성화된 경우 그리드 레이아웃 사용
                    layoutStrategy = new GridLayout(columns, settings);
                    if (layoutStrategy instanceof GridLayout) {
                        layoutStrategy.setContainer(this.containerEl);
                    }
                } else {
                    // 카드 높이 정렬이 비활성화된 경우 메이슨리 레이아웃 사용
                    layoutStrategy = new MasonryLayout(settings, this.cardMaker, this.plugin.app, this.containerEl);
                    // 메이슨리 레이아웃의 열 수 설정
                    if (layoutStrategy instanceof MasonryLayout) {
                        layoutStrategy.setColumnsCount(columns);
                    }
                }
            } else {
                // 가로 방향인 경우 항상 리스트 레이아웃 사용 (가로 스크롤)
                layoutStrategy = new ListLayout(false, settings, this.plugin.app, this.containerEl);
            }
        } else if (settings.defaultLayout === 'grid') {
            // 그리드 레이아웃
            const columns = settings.gridColumns;
            layoutStrategy = new GridLayout(columns, settings);
            if (layoutStrategy instanceof GridLayout) {
                layoutStrategy.setContainer(this.containerEl);
            }
        } else if (settings.defaultLayout === 'masonry') {
            // 메이슨리 레이아웃
            layoutStrategy = new MasonryLayout(settings, this.cardMaker, this.plugin.app, this.containerEl);
            // 메이슨리 레이아웃의 열 수 설정
            if (layoutStrategy instanceof MasonryLayout) {
                layoutStrategy.setColumnsCount(settings.masonryColumns);
            }
        } else {
            // 리스트 레이아웃 (기본값)
            const isVertical = this.isVerticalContainer();
            layoutStrategy = new ListLayout(isVertical, settings, this.plugin.app, this.containerEl);
        }

        return layoutStrategy;
    }

    /**
     * 설정이 변경되었을 때 호출되는 메서드
     */
    public updateSettings(settings: CardNavigatorSettings) {
        this.plugin.settings = settings;
        this.layoutStyleManager.updateSettings(settings);
        
        // 레이아웃 전략의 설정 업데이트
        this.layoutStrategy.updateSettings(settings);
        
        // 현재 레이아웃 타입 저장
        const oldLayoutType = this.layoutStrategy.getLayoutType();
        
        // 레이아웃 전략 재생성
        this.layoutStrategy = this.createLayoutStrategy();
        
        // 새 레이아웃 타입 가져오기
        const newLayoutType = this.layoutStrategy.getLayoutType();
        
        // 컨테이너 스타일 업데이트
        this.layoutStyleManager.applyContainerStyle(this.layoutStrategy);
        
        // 레이아웃 타입이 변경된 경우 이벤트 발생
        if (oldLayoutType !== newLayoutType) {
            const event = new CustomEvent('layout-type-changed', { 
                detail: { 
                    oldType: oldLayoutType,
                    newType: newLayoutType
                } 
            });
            this.containerEl.dispatchEvent(event);
        }
    }

    /**
     * 레이아웃을 다시 렌더링합니다.
     */
    public rerender() {
        if (!this.containerEl) return;
        
        // 현재 레이아웃 전략 재생성
        this.layoutStrategy = this.createLayoutStrategy();
        
        // 컨테이너 스타일 업데이트
        this.layoutStyleManager.applyContainerStyle(this.layoutStrategy);
    }
} 