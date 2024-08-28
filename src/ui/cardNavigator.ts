// src/ui/cardNavigator.ts

import { ItemView, WorkspaceLeaf } from "obsidian";
import CardNavigatorPlugin from '../main';
import { Toolbar } from './toolbar/toolbar';
import { CardContainer } from './cardContainer/cardContainer';
import { calculateCardSize } from '../common/utils';

export const VIEW_TYPE_CARD_NAVIGATOR = "card-navigator-view";

export class CardNavigator extends ItemView {
    private plugin: CardNavigatorPlugin;
    public toolbar: Toolbar;
    public cardContainer: CardContainer;
    private resizeObserver: ResizeObserver;
	private isVertical: boolean;

    constructor(leaf: WorkspaceLeaf, plugin: CardNavigatorPlugin) {
        super(leaf);
        this.plugin = plugin;
        this.toolbar = new Toolbar(this.plugin);
        this.cardContainer = new CardContainer(this.plugin, this.leaf);
		this.isVertical = this.calculateIsVertical();
        this.resizeObserver = new ResizeObserver(this.handleResize.bind(this));
    }

    getViewType() {
        return VIEW_TYPE_CARD_NAVIGATOR;
    }

    getDisplayText() {
        return "Card Navigator";
    }

    getIcon(): string {
        return "layers-3";
    }

    private calculateIsVertical(): boolean {
        const { width, height } = this.leaf.view.containerEl.getBoundingClientRect();
        return height > width;
    }

    private handleResize() {
        this.updateLayoutAndRefresh();
    }
    
	public updateLayoutAndRefresh() {
		this.isVertical = this.calculateIsVertical();
		const containerRect = this.leaf.view.containerEl.getBoundingClientRect();
		const { cardWidth, cardHeight } = calculateCardSize(this.isVertical, containerRect, this.plugin.settings.cardsPerView);
		
		this.cardContainer.setOrientation(this.isVertical);
		this.cardContainer.setCardSize(cardWidth, cardHeight);
		this.toolbar.setOrientation(this.isVertical);
		
		this.refresh();
	}

    async onOpen() {
        const container = this.containerEl.children[1] as HTMLElement;
        container.empty();

        const cardNavigatorContainerEl = container.createDiv('card-navigator');
        const toolbarEl = cardNavigatorContainerEl.createDiv('card-navigator-toolbar');
        const cardContainerEl = cardNavigatorContainerEl.createDiv('card-container');

        this.toolbar.initialize(toolbarEl);
        this.cardContainer.initialize(cardContainerEl);

		this.isVertical = this.calculateIsVertical();
        this.updateLayoutAndRefresh();
        this.resizeObserver.observe(this.leaf.view.containerEl);

        this.refresh();
    }

    async onClose() {
        this.resizeObserver.disconnect();
        this.toolbar.onClose();
        this.cardContainer.onClose();
    }

    refresh() {
        this.toolbar.refresh();
        this.cardContainer.refresh();
    }
}
