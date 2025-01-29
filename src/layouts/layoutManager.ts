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

        const containerStyle = window.getComputedStyle(this.containerEl);
        const containerWidth = this.containerEl.offsetWidth;
        const paddingLeft = parseFloat(containerStyle.paddingLeft) || 0;
        const paddingRight = parseFloat(containerStyle.paddingRight) || 0;
        const availableWidth = containerWidth - paddingLeft - paddingRight;
        
        const {
            alignCardHeight,
            cardWidthThreshold,
            defaultLayout,
            gridColumns,
            masonryColumns,
        } = this.plugin.settings;

        // 자동이 아닌 레이아웃의 경우 해당 레이아웃 전략 반환
        if (defaultLayout !== 'auto') {
            return this.createSpecificLayout(defaultLayout, availableWidth);
        }

        // 오토 레이아웃의 경우 컨테이너 너비에 따라 동적으로 결정
        const columns = this.layoutConfig.calculateAutoColumns();
        const cardWidth = Math.floor((availableWidth - (columns - 1) * this.cardGap) / columns);

        if (columns === 1) {
            const listLayout = new ListLayout(this.isVertical, this.cardGap, alignCardHeight, this.layoutConfig);
            listLayout.setCardWidth(cardWidth);
            return listLayout;
        } else if (alignCardHeight) {
            const gridLayout = new GridLayout(columns, this.cardGap, this.plugin.settings, this.layoutConfig);
            gridLayout.setCardWidth(cardWidth);
            return gridLayout;
        } else {
            const masonryLayout = new MasonryLayout(
                columns,
                this.cardGap,
                this.plugin.settings,
                this.cardMaker,
                this.layoutConfig
            );
            masonryLayout.setContainer(this.containerEl);
            masonryLayout.setCardWidth(cardWidth);
            return masonryLayout;
        }
    }

    private createSpecificLayout(layout: CardNavigatorSettings['defaultLayout'], availableWidth: number): LayoutStrategy {
        const {
            alignCardHeight,
            gridColumns,
            masonryColumns,
        } = this.plugin.settings;

        switch (layout) {
            case 'list': {
                const listLayout = new ListLayout(
                    this.isVertical, 
                    this.cardGap, 
                    this.plugin.settings.alignCardHeight,
                    this.layoutConfig
                );
                listLayout.setCardWidth(availableWidth);
                return listLayout;
            }
            case 'grid': {
                const gridLayout = new GridLayout(gridColumns, this.cardGap, this.plugin.settings, this.layoutConfig);
                const cardWidth = Math.floor((availableWidth - (gridColumns - 1) * this.cardGap) / gridColumns);
                gridLayout.setCardWidth(cardWidth);
                return gridLayout;
            }
            case 'masonry': {
                const masonryLayout = new MasonryLayout(
                    masonryColumns,
                    this.cardGap,
                    this.plugin.settings,
                    this.cardMaker,
                    this.layoutConfig
                );
                masonryLayout.setContainer(this.containerEl);
                const cardWidth = Math.floor((availableWidth - (masonryColumns - 1) * this.cardGap) / masonryColumns);
                masonryLayout.setCardWidth(cardWidth);
                return masonryLayout;
            }
            default:
                throw new Error(`Unsupported layout type: ${layout}`);
        }
    }
} 