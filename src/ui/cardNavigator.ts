//src/ui/cardNavigator.ts

import { ItemView, WorkspaceLeaf } from "obsidian";
import CardNavigatorPlugin from '../main';
import { Toolbar } from './toolbar/toolbar';
import { CardContainer } from './cardContainer/cardContainer';
import { t } from 'i18next';

export const VIEW_TYPE_CARD_NAVIGATOR = "card-navigator-view";

export class CardNavigator extends ItemView {
    public toolbar: Toolbar;
    public cardContainer: CardContainer;
    private resizeObserver: ResizeObserver;
    private isVertical: boolean;

    constructor(leaf: WorkspaceLeaf, private plugin: CardNavigatorPlugin) {
        super(leaf);
        this.toolbar = new Toolbar(this.plugin);
        this.cardContainer = new CardContainer(this.plugin, this.leaf);
        this.isVertical = this.calculateIsVertical();
        this.resizeObserver = new ResizeObserver(this.handleResize.bind(this));
    }

    getViewType(): string {
        return VIEW_TYPE_CARD_NAVIGATOR;
    }

    getDisplayText(): string {
        return t("Card Navigator");
    }

    getIcon(): string {
        return "layers-3";
    }

    private calculateIsVertical(): boolean {
        const { width, height } = this.leaf.view.containerEl.getBoundingClientRect();
        const isVertical = height > width;
        this.cardContainer.setOrientation(isVertical);
        return isVertical;
    }

    private handleResize() {
        const newIsVertical = this.calculateIsVertical();
        if (newIsVertical !== this.isVertical) {
            this.isVertical = newIsVertical;
            this.cardContainer.setOrientation(this.isVertical);
        }
    }

    public updateLayoutAndRefresh() {
        this.isVertical = this.calculateIsVertical();
        this.cardContainer.setOrientation(this.isVertical);
        this.toolbar.setOrientation(this.isVertical);
        this.refresh();
    }

    async onOpen() {
        const container = this.containerEl.children[1] as HTMLElement;
        container.empty();

        const toolbarEl = container.createDiv('card-navigator-toolbar');
        const cardContainerEl = container.createDiv('card-navigator-container');

        this.toolbar.initialize(toolbarEl);
        this.cardContainer.initialize(cardContainerEl);

        this.isVertical = this.calculateIsVertical();
        this.updateLayoutAndRefresh();
        this.resizeObserver.observe(this.leaf.view.containerEl);

        this.refresh();

        await this.centerActiveCardOnOpen();
    }

    private async centerActiveCardOnOpen() {
        if (this.plugin.settings.centerActiveCardOnOpen) {
            setTimeout(() => {
                this.cardContainer.centerActiveCard();
            }, 300);
        }
    }

    async onClose() {
        this.resizeObserver.disconnect();
        this.toolbar.onClose();
        this.cardContainer.onClose();
        this.plugin.app.workspace.off('active-leaf-change', this.plugin.triggerRefresh);
        this.plugin.app.vault.off('modify', this.plugin.triggerRefresh);
    }

    refresh() {
        this.toolbar.refresh();
        this.cardContainer.refresh();
    }
}
