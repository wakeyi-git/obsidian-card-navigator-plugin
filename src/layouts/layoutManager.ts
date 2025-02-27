import { CardNavigatorSettings } from "common/types";
import { CardMaker } from "ui/cardContainer/cardMaker";
import { GridLayout } from "./gridLayout";
import { ListLayout } from "./listLayout";
import { MasonryLayout } from "./masonryLayout";
import { LayoutStrategy } from "./layoutStrategy";
import { LayoutConfig } from './layoutConfig';
import CardNavigatorPlugin from 'main';

/**
 * 레이아웃 전략을 관리하는 클래스
 * 적절한 레이아웃 전략을 생성하고 관리하며, 컨테이너 크기 변화에 대응합니다.
 */
export class LayoutManager {
    private currentLayout: CardNavigatorSettings['defaultLayout'];
    private layoutStrategy: LayoutStrategy;
    private isVertical: boolean;
    private containerEl: HTMLElement;
    private layoutConfig: LayoutConfig;
    private savedCardHeights: Map<string, number> = new Map();
    private resizeObserver: ResizeObserver | null = null;
    private plugin: CardNavigatorPlugin;
    private cardMaker: CardMaker;

    constructor(
        plugin: CardNavigatorPlugin,
        containerEl: HTMLElement,
        cardMaker: CardMaker
    ) {
        this.plugin = plugin;
        this.containerEl = containerEl;
        this.cardMaker = cardMaker;
        this.layoutConfig = new LayoutConfig(this.plugin.app, containerEl, this.plugin.settings);
        this.currentLayout = this.plugin.settings.defaultLayout;
        this.isVertical = this.layoutConfig.isVerticalContainer();
        this.layoutStrategy = this.createLayoutStrategy();
        
        // 컨테이너 크기 변화 감지를 위한 ResizeObserver 설정
        this.setupResizeObserver();
    }

    /**
     * 컨테이너 크기 변화를 감지하기 위한 ResizeObserver를 설정합니다.
     */
    private setupResizeObserver(): void {
        if (!this.containerEl) return;
        
        // 기존 observer가 있으면 해제
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }
        
        // 새 observer 생성
        this.resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                if (entry.target === this.containerEl) {
                    // 컨테이너 크기가 변경되면 레이아웃 업데이트
                    this.updateLayout();
                }
            }
        });
        
        // 컨테이너 관찰 시작
        this.resizeObserver.observe(this.containerEl);
    }

    /**
     * 리소스 정리를 위한 메서드
     */
    public destroy(): void {
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
            this.resizeObserver = null;
        }
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
     * 레이아웃 타입을 설정하고 새 레이아웃 전략을 생성합니다.
     */
    public setLayout(layout: CardNavigatorSettings['defaultLayout']) {
        this.currentLayout = layout;
        this.layoutStrategy = this.createLayoutStrategy();
    }

    /**
     * 컨테이너 크기 변화에 대응하여 레이아웃을 업데이트합니다.
     */
    public updateLayout() {
        // 컨테이너 크기 로깅
        const { width, height, ratio } = this.layoutConfig.getContainerSize();
        console.log(`[CardNavigator] updateLayout - 컨테이너 크기: ${width}x${height}, 비율(w/h): ${ratio.toFixed(2)}`);
        
        // 컨테이너 크기가 유효한지 확인
        if (width === 0 || height === 0) {
            console.log(`[CardNavigator] 컨테이너 크기가 아직 계산되지 않음. 대체 방법 시도`);
            
            // CSS 변수에서 크기 정보 가져오기 시도
            const containerWidth = this.getCSSVariableAsNumber('--container-width', 0);
            const containerHeight = this.getCSSVariableAsNumber('--container-height', 0);
            
            if (containerWidth > 0 && containerHeight > 0) {
                console.log(`[CardNavigator] CSS 변수에서 크기 정보 가져옴: ${containerWidth}x${containerHeight}`);
                
                // CSS 변수 기반으로 레이아웃 업데이트 진행
                this.updateLayoutWithSize(containerWidth, containerHeight);
                return;
            }
            
            // 컨테이너 크기가 계산될 때까지 지연
            setTimeout(() => {
                const newSize = this.layoutConfig.getContainerSize();
                
                if (newSize.width > 0 && newSize.height > 0) {
                    console.log(`[CardNavigator] 컨테이너 크기 계산됨: ${newSize.width}x${newSize.height}. 레이아웃 업데이트 재시도`);
                    this.updateLayout();
                } else {
                    // 여전히 크기가 0이면 기본 크기 사용
                    console.log(`[CardNavigator] 컨테이너 크기를 계산할 수 없음. 기본 크기 사용`);
                    this.updateLayoutWithSize(400, 600);
                }
            }, 150); // 지연 시간 증가
            return;
        }
        
        // 정상적인 크기로 레이아웃 업데이트
        this.updateLayoutWithSize(width, height);
    }

    /**
     * 지정된 크기로 레이아웃을 업데이트합니다.
     */
    private updateLayoutWithSize(width: number, height: number) {
        // 레이아웃 방향 업데이트 (isVerticalContainer 메서드 호출)
        const newIsVertical = this.layoutConfig.isVerticalContainer();
        
        // 방향이 변경된 경우에만 레이아웃 전략 재생성
        if (this.isVertical !== newIsVertical) {
            console.log(`[CardNavigator] 레이아웃 방향 변경: ${this.isVertical} -> ${newIsVertical}`);
            this.isVertical = newIsVertical;
            
            // 현재 메이슨리 레이아웃의 카드 높이 정보 저장
            this.saveCardHeights();
            
            // 레이아웃 전략 재생성
            this.layoutStrategy = this.createLayoutStrategy();
            
            // 저장된 카드 높이 정보 복원
            this.restoreCardHeights();
        } else {
            // 방향은 같지만 크기가 변경된 경우 컨테이너 너비 업데이트
            this.updateContainerWidth();
        }
    }

    /**
     * CSS 변수 값을 숫자로 가져옵니다.
     */
    private getCSSVariableAsNumber(variableName: string, defaultValue: number): number {
        if (!this.containerEl) return defaultValue;
        
        const value = getComputedStyle(this.containerEl).getPropertyValue(variableName);
        if (!value) return defaultValue;
        
        // px 단위 제거 후 숫자로 변환
        const numValue = parseFloat(value.replace('px', ''));
        return isNaN(numValue) ? defaultValue : numValue;
    }

    /**
     * 컨테이너 너비 변화에 대응하여 레이아웃 전략을 업데이트합니다.
     * 레이아웃 전략 인스턴스를 재생성하지 않고 너비 변화만 처리합니다.
     */
    public updateContainerWidth(): void {
        const availableWidth = this.layoutConfig.getAvailableWidth();
        
        // Auto 레이아웃 모드에서 열 수 계산 및 업데이트
        if (this.plugin.settings.defaultLayout === 'auto') {
            const newColumns = this.layoutConfig.calculateAutoColumns();
            // 현재 열 수 저장
            this.layoutConfig.updatePreviousColumns(newColumns);
        }
        
        // 메이슨리 레이아웃인 경우 직접 너비 업데이트 메서드 호출
        if (this.layoutStrategy instanceof MasonryLayout) {
            this.layoutStrategy.updateContainerWidth(availableWidth);
        } 
        // 그리드 레이아웃인 경우 카드 너비 업데이트
        else if (this.layoutStrategy instanceof GridLayout) {
            const columns = this.layoutStrategy.getColumnsCount();
            const cardWidth = this.layoutConfig.calculateCardWidth(columns);
            this.layoutStrategy.setCardWidth(cardWidth);
        }
        // 리스트 레이아웃인 경우 카드 너비 업데이트
        else if (this.layoutStrategy instanceof ListLayout) {
            this.layoutStrategy.updateContainerWidth(availableWidth);
        }
    }

    /**
     * LayoutConfig 인스턴스를 반환합니다.
     */
    public getLayoutConfig(): LayoutConfig {
        return this.layoutConfig;
    }

    /**
     * 레이아웃 전략을 생성합니다.
     * 설정과 컨테이너 크기에 따라 적절한 레이아웃 전략을 생성합니다.
     */
    private createLayoutStrategy(): LayoutStrategy {
        if (!this.containerEl) {
            throw new Error('Container element is not initialized');
        }

        const availableWidth = this.layoutConfig.getAvailableWidth();
        const cardGap = this.layoutConfig.getCardGap();
        
        const {
            alignCardHeight,
            defaultLayout,
        } = this.plugin.settings;

        // 자동이 아닌 레이아웃의 경우 해당 레이아웃 전략 반환
        if (defaultLayout !== 'auto') {
            return this.createSpecificLayout(defaultLayout, availableWidth);
        }

        // 오토 레이아웃의 경우 컨테이너 너비에 따라 동적으로 결정
        const columns = this.layoutConfig.calculateAutoColumns();
        const cardWidth = this.layoutConfig.calculateCardWidth(columns);
        
        // 현재 열 수 저장
        this.layoutConfig.updatePreviousColumns(columns);

        let layoutStrategy: LayoutStrategy;

        if (columns === 1) {
            // auto 레이아웃에서 1열인 경우 리스트 레이아웃 사용
            layoutStrategy = new ListLayout(
                this.isVertical, // isVerticalContainer 메서드의 결과 사용
                alignCardHeight,
                this.plugin.settings,
                this.layoutConfig
            );
        } else {
            // 카드 높이 정렬이 필요한 경우 그리드 레이아웃 사용
            if (alignCardHeight) {
                layoutStrategy = new GridLayout(
                    columns, 
                    this.plugin.settings, 
                    this.layoutConfig
                );
            } else {
                layoutStrategy = new MasonryLayout(
                    columns,     // 명시적으로 열 수 전달
                    this.layoutConfig,
                    this.plugin.settings,
                    this.cardMaker
                );
            }
        }

        // 공통 설정 적용
        if (layoutStrategy instanceof MasonryLayout) {
            layoutStrategy.setContainer(this.containerEl);
        }
        layoutStrategy.setCardWidth(cardWidth);

        return layoutStrategy;
    }

    /**
     * 특정 레이아웃 타입에 맞는 레이아웃 전략을 생성합니다.
     */
    private createSpecificLayout(layout: CardNavigatorSettings['defaultLayout'], availableWidth: number): LayoutStrategy {
        const {
            alignCardHeight,
            gridColumns,
            masonryColumns,
        } = this.plugin.settings;
        
        const cardGap = this.layoutConfig.getCardGap();

        let layoutStrategy: LayoutStrategy;

        switch (layout) {
            case 'list': {
                layoutStrategy = new ListLayout(
                    this.isVertical,
                    alignCardHeight,
                    this.plugin.settings,
                    this.layoutConfig
                );
                break;
            }
            case 'grid': {
                layoutStrategy = new GridLayout(
                    gridColumns, 
                    this.plugin.settings, 
                    this.layoutConfig
                );
                break;
            }
            case 'masonry': {
                layoutStrategy = new MasonryLayout(
                    masonryColumns,  // 명시적으로 열 수 전달
                    this.layoutConfig,
                    this.plugin.settings,
                    this.cardMaker
                );
                break;
            }
            default:
                throw new Error(`지원하지 않는 레이아웃 타입: ${layout}`);
        }

        // 공통 설정 적용
        if (layoutStrategy instanceof MasonryLayout) {
            layoutStrategy.setContainer(this.containerEl);
        }
        const cardWidth = this.layoutConfig.calculateCardWidth(
            layout === 'list' ? (this.isVertical ? 1 : this.plugin.settings.cardsPerView) : 
            (layout === 'grid' ? gridColumns : masonryColumns)
        );
        layoutStrategy.setCardWidth(cardWidth);

        return layoutStrategy;
    }

    /**
     * 설정이 변경되었을 때 호출되는 메서드
     * 레이아웃 전략을 업데이트하고 필요한 경우 재생성합니다.
     */
    public updateSettings(settings: CardNavigatorSettings) {
        this.plugin.settings = settings;
        this.layoutConfig.updateSettings(settings);
        
        // 현재 메이슨리 레이아웃의 카드 높이 정보 저장
        this.saveCardHeights();
        
        // 레이아웃 방향 업데이트
        this.isVertical = this.layoutConfig.isVerticalContainer();
        
        // 모든 레이아웃 전략의 설정 업데이트
        if (this.layoutStrategy instanceof ListLayout) {
            this.layoutStrategy.updateSettings(settings);
        } else if (this.layoutStrategy instanceof GridLayout) {
            this.layoutStrategy.updateSettings(settings);
        } else if (this.layoutStrategy instanceof MasonryLayout) {
            this.layoutStrategy.updateSettings(settings);
        }
        
        // 레이아웃 전략 재생성
        this.layoutStrategy = this.createLayoutStrategy();
        
        // 저장된 카드 높이 정보 복원
        this.restoreCardHeights();
    }

    /**
     * 레이아웃을 다시 렌더링합니다.
     * 레이아웃 전략을 재생성하고 컨테이너 스타일을 업데이트합니다.
     */
    public rerender() {
        if (!this.containerEl) return;
        
        // 현재 메이슨리 레이아웃의 카드 높이 정보 저장
        this.saveCardHeights();
        
        // 레이아웃 방향 업데이트
        this.isVertical = this.layoutConfig.isVerticalContainer();
        
        // 현재 레이아웃 전략 재생성
        this.layoutStrategy = this.createLayoutStrategy();
        
        // 저장된 카드 높이 정보 복원
        this.restoreCardHeights();
        
        // 컨테이너 스타일 업데이트 (getContainerStyle이 있는 경우에만)
        if (this.layoutStrategy.getContainerStyle) {
            const containerStyle = this.layoutStrategy.getContainerStyle();
            Object.assign(this.containerEl.style, containerStyle);
        }
    }

    /**
     * 현재 메이슨리 레이아웃의 카드 높이 정보를 저장합니다.
     */
    private saveCardHeights(): void {
        if (this.layoutStrategy instanceof MasonryLayout) {
            this.savedCardHeights = this.layoutStrategy.getCardHeights();
        }
    }

    /**
     * 저장된 카드 높이 정보를 새 레이아웃에 복원합니다.
     */
    private restoreCardHeights(): void {
        if (this.layoutStrategy instanceof MasonryLayout && this.savedCardHeights.size > 0) {
            this.layoutStrategy.setCardHeights(this.savedCardHeights);
        }
    }

    /**
     * 현재 레이아웃이 세로 방향인지 여부를 반환합니다.
     */
    public getIsVertical(): boolean {
        return this.isVertical;
    }
} 