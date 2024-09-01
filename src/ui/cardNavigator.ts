import { ItemView, WorkspaceLeaf } from "obsidian";
import CardNavigatorPlugin from '../main';
import { Toolbar } from './toolbar/toolbar';
import { CardContainer } from './cardContainer/cardContainer';
import { t } from "i18next";

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

    // Return the unique identifier for this view
    getViewType() {
        return VIEW_TYPE_CARD_NAVIGATOR;
    }

    // Return the display name for this view
    getDisplayText() {
        return t("Card Navigator");
    }

    // Return the icon name for this view
    getIcon(): string {
        return "layers-3";
    }

    // Calculate whether the view should be vertical based on its dimensions
    private calculateIsVertical(): boolean {
        const { width, height } = this.leaf.view.containerEl.getBoundingClientRect();
        const isVertical = height > width;
        this.cardContainer.setOrientation(isVertical);
        return isVertical;
    }

    // Handle resize events and update orientation if necessary
    private handleResize() {
        const newIsVertical = this.calculateIsVertical();
        if (newIsVertical !== this.isVertical) {
            this.isVertical = newIsVertical;
            this.cardContainer.setOrientation(this.isVertical);
        }
    }

    // Update layout and refresh the view
    public updateLayoutAndRefresh() {
        this.isVertical = this.calculateIsVertical();
        this.cardContainer.setOrientation(this.isVertical);
        this.toolbar.setOrientation(this.isVertical);
        this.refresh();
    }

    // Initialize the view when it's opened
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

        this.centerActiveCardOnOpen();
    }

    // Center the active card when opening the view, if enabled in settings
    private centerActiveCardOnOpen() {
        if (this.plugin.settings.centerActiveCardOnOpen) {
            setTimeout(() => {
                this.cardContainer.centerActiveCard();
            }, 300);
        }
    }

    // Clean up when the view is closed
    async onClose() {
        this.resizeObserver.disconnect();
        this.toolbar.onClose();
        this.cardContainer.onClose();
    }

    // Refresh the view
    refresh() {
        this.toolbar.refresh();
        this.cardContainer.refresh();
    }
}
