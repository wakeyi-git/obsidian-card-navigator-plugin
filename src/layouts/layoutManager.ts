import { CardNavigatorSettings } from "common/types";
import { CardMaker } from "ui/cardContainer/cardMaker";
import { GridLayout } from "./gridLayout";
import { ListLayout } from "./listLayout";
import { MasonryLayout } from "./masonryLayout";
import { LayoutStrategy } from "./layoutStrategy";

export class LayoutManager {
    private currentLayout: CardNavigatorSettings['defaultLayout'];
    private layoutStrategy: LayoutStrategy;
    private isVertical: boolean;
    private cardGap: number;
    private containerEl: HTMLElement;

    constructor(
        private plugin: any,
        containerEl: HTMLElement,
        private cardMaker: CardMaker
    ) {
        this.containerEl = containerEl;
        this.currentLayout = plugin.settings.defaultLayout;
        this.isVertical = this.calculateIsVertical();
        this.cardGap = this.getCSSVariable('--card-navigator-gap', 10);
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
        this.isVertical = this.calculateIsVertical();
        this.layoutStrategy = this.createLayoutStrategy();
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
        const columns = Math.max(1, Math.floor((availableWidth + this.cardGap) / (cardWidthThreshold + this.cardGap)));
        const cardWidth = Math.floor((availableWidth - (columns - 1) * this.cardGap) / columns);

        if (columns === 1) {
            const listLayout = new ListLayout(this.isVertical, this.cardGap, alignCardHeight);
            listLayout.setCardWidth(cardWidth);
            return listLayout;
        } else if (alignCardHeight) {
            const gridLayout = new GridLayout(columns, this.cardGap, this.plugin.settings);
            gridLayout.setCardWidth(cardWidth);
            return gridLayout;
        } else {
            const masonryLayout = new MasonryLayout(
                columns,
                this.cardGap,
                this.plugin.settings,
                this.cardMaker
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
                const listLayout = new ListLayout(this.isVertical, this.cardGap, alignCardHeight);
                listLayout.setCardWidth(availableWidth);
                return listLayout;
            }
            case 'grid': {
                const gridLayout = new GridLayout(gridColumns, this.cardGap, this.plugin.settings);
                const cardWidth = Math.floor((availableWidth - (gridColumns - 1) * this.cardGap) / gridColumns);
                gridLayout.setCardWidth(cardWidth);
                return gridLayout;
            }
            case 'masonry': {
                const masonryLayout = new MasonryLayout(
                    masonryColumns,
                    this.cardGap,
                    this.plugin.settings,
                    this.cardMaker
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

    private calculateIsVertical(): boolean {
        if (!this.containerEl) return true;
        const { width, height } = this.containerEl.getBoundingClientRect();
        return height > width;
    }

    private getCSSVariable(variableName: string, defaultValue: number): number {
        if (!this.containerEl) return defaultValue;
        const valueStr = getComputedStyle(this.containerEl).getPropertyValue(variableName).trim();
        return parseInt(valueStr) || defaultValue;
    }
} 