// src/ui/cardNavigator.ts

import { ItemView, WorkspaceLeaf } from "obsidian";
import CardNavigatorPlugin from '../main';
import { Toolbar } from './toolbar/toolbar';
import { CardContainer } from './cardContainer/cardContainer';

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

    private handleKeyDown(event: KeyboardEvent) {
        if (this.containerEl && this.containerEl.contains(document.activeElement)) {
            switch (event.key) {
                case 'ArrowUp':
                    this.cardContainer.scrollUp();
                    event.preventDefault();
                    break;
                case 'ArrowDown':
                    this.cardContainer.scrollDown();
                    event.preventDefault();
                    break;
                case 'ArrowLeft':
                    this.cardContainer.scrollLeft();
                    event.preventDefault();
                    break;
                case 'ArrowRight':
                    this.cardContainer.scrollRight();
                    event.preventDefault();
                    break;
                case 'PageUp':
                    if (this.isVertical) {
                        this.cardContainer.scrollUp();
                    } else {
                        this.cardContainer.scrollLeft();
                    }
                    event.preventDefault();
                    break;
                case 'PageDown':
                    if (this.isVertical) {
                        this.cardContainer.scrollDown();
                    } else {
                        this.cardContainer.scrollRight();
                    }
                    event.preventDefault();
                    break;
                case 'Home':
                    this.cardContainer.scrollToCenter();
                    event.preventDefault();
                    break;
            }
        }
    }

    async onOpen() {
        const container = this.containerEl.children[1] as HTMLElement;
        container.empty();

        const toolbarEl = container.createDiv('card-navigator-toolbar');
        const cardContainerEl = container.createDiv('card-container');

        this.toolbar.initialize(toolbarEl);
        this.cardContainer.initialize(cardContainerEl);

        this.isVertical = this.calculateIsVertical();
        this.updateLayoutAndRefresh();
        this.resizeObserver.observe(this.leaf.view.containerEl);

        this.registerDomEvent(this.containerEl, 'keydown', this.handleKeyDown.bind(this));

        this.refresh();

		this.centerActiveCardOnOpen();
    }

	private centerActiveCardOnOpen() {
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

        this.containerEl.removeEventListener('keydown', this.handleKeyDown.bind(this));
    }

    refresh() {
        this.toolbar.refresh();
        this.cardContainer.refresh();
    }
}
