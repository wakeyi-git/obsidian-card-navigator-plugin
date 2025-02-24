import { CardNavigatorSettings } from "common/types";
import { CardMaker } from "ui/cardContainer/cardMaker";
import { GridLayout } from "./gridLayout";
import { ListLayout } from "./listLayout";
import { MasonryLayout } from "./masonryLayout";
import { LayoutStrategy } from "./layoutStrategy";
import { LayoutConfig } from './layoutConfig';

export class LayoutManager {
    private currentLayout: CardNavigatorSettings['defaultLayout'];
    private layoutStrategy: LayoutStrategy;
    private isVertical: boolean;
    private cardGap: number;
    private containerEl: HTMLElement;
    private layoutConfig: LayoutConfig;

    constructor(
        private plugin: any,
        containerEl: HTMLElement,
        private cardMaker: CardMaker
    ) {
        this.containerEl = containerEl;
        this.layoutConfig = new LayoutConfig(plugin.app, containerEl, plugin.settings);
        this.currentLayout = plugin.settings.defaultLayout;
        this.isVertical = this.layoutConfig.isVerticalContainer();
        this.cardGap = this.layoutConfig.getCardGap();
        this.layoutStrategy = this.createLayoutStrategy();
    }

    public getCurrentLayout(): CardNavigatorSettings['defaultLayout'] {
        return this.currentLayout;
    }

    public getLayoutStrategy(): LayoutStrategy {
        return this.layoutStrategy;
    }

    public setLayout(layout: CardNavigatorSettings['defaultLayout']) {
        this.currentLayout = layout;
        this.layoutStrategy = this.createLayoutStrategy();
    }

    public updateLayout() {
        this.isVertical = this.layoutConfig.isVerticalContainer();
        this.layoutStrategy = this.createLayoutStrategy();
    }

    public getLayoutConfig(): LayoutConfig {
        return this.layoutConfig;
    }

    private createLayoutStrategy(): LayoutStrategy {
        if (!this.containerEl) {
            throw new Error('Container element is not initialized');
        }

        const availableWidth = this.layoutConfig.getAvailableWidth();
        
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
            layoutStrategy = new ListLayout(
                this.isVertical, 
                this.cardGap, 
                alignCardHeight,
                this.plugin.settings,
                this.layoutConfig
            );
        } else {
            // 카드 높이 정렬이 필요한 경우 그리드 레이아웃 사용
            if (alignCardHeight) {
                layoutStrategy = new GridLayout(
                    columns, 
                    this.cardGap, 
                    this.plugin.settings, 
                    this.layoutConfig
                );
            } else {
                layoutStrategy = new MasonryLayout(
                    this.plugin.settings,
                    this.cardMaker,
                    this.layoutConfig
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

    private createSpecificLayout(layout: CardNavigatorSettings['defaultLayout'], availableWidth: number): LayoutStrategy {
        const {
            alignCardHeight,
            gridColumns,
            masonryColumns,
        } = this.plugin.settings;

        let layoutStrategy: LayoutStrategy;

        switch (layout) {
            case 'list': {
                layoutStrategy = new ListLayout(
                    this.isVertical, 
                    this.cardGap, 
                    alignCardHeight,
                    this.plugin.settings,
                    this.layoutConfig
                );
                break;
            }
            case 'grid': {
                layoutStrategy = new GridLayout(
                    gridColumns, 
                    this.cardGap, 
                    this.plugin.settings, 
                    this.layoutConfig
                );
                break;
            }
            case 'masonry': {
                layoutStrategy = new MasonryLayout(
                    this.plugin.settings,
                    this.cardMaker,
                    this.layoutConfig
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
            layout === 'list' ? 1 : (layout === 'grid' ? gridColumns : masonryColumns)
        );
        layoutStrategy.setCardWidth(cardWidth);

        return layoutStrategy;
    }

    /**
     * 설정이 변경되었을 때 호출되는 메서드
     */
    public updateSettings(settings: CardNavigatorSettings) {
        this.plugin.settings = settings;
        this.layoutConfig.updateSettings(settings);
        
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
    }

    /**
     * 레이아웃을 다시 렌더링합니다.
     */
    public rerender() {
        if (!this.containerEl) return;
        
        // 현재 레이아웃 전략 재생성
        this.layoutStrategy = this.createLayoutStrategy();
        
        // 컨테이너 스타일 업데이트
        const containerStyle = this.layoutStrategy.getContainerStyle();
        Object.assign(this.containerEl.style, containerStyle);
    }
} 