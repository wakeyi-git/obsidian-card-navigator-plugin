import { ItemView, WorkspaceLeaf, Menu } from "obsidian";
import CardNavigatorPlugin from '../main';
import { Toolbar } from './toolbar/toolbar';
import { CardContainer } from './cardContainer/cardContainer';
import { KeyboardNavigator } from "../common/keyboardNavigator";
import { t } from 'i18next';

// Unique identifier for the Card Navigator view
export const VIEW_TYPE_CARD_NAVIGATOR = "card-navigator-view";

// Main class for the Card Navigator view
export class CardNavigator extends ItemView {
    public toolbar: Toolbar;
    public cardContainer: CardContainer;
    private resizeObserver: ResizeObserver;
    private isVertical: boolean;
    private keyboardNavigator: KeyboardNavigator;

    constructor(leaf: WorkspaceLeaf, private plugin: CardNavigatorPlugin) {
        super(leaf);
        this.toolbar = new Toolbar(this.plugin);
        this.cardContainer = new CardContainer(this.plugin, this.leaf);
        this.isVertical = this.calculateIsVertical();
        this.resizeObserver = new ResizeObserver(this.handleResize.bind(this));
        this.keyboardNavigator = new KeyboardNavigator(this.plugin, this.cardContainer, this.containerEl.children[1] as HTMLElement);
    }

    // Return the unique identifier for this view
    getViewType(): string {
        return VIEW_TYPE_CARD_NAVIGATOR;
    }

    // Return the display name for this view
    getDisplayText(): string {
        return t("Card Navigator");
    }

    // Return the icon name for this view
    getIcon(): string {
        return "layers-3";
    }

    // Determine if the view should be displayed vertically
    private calculateIsVertical(): boolean {
        const { width, height } = this.leaf.view.containerEl.getBoundingClientRect();
        return height > width;
    }

    // Handle resize events and update layout if necessary
    private handleResize() {
        const newIsVertical = this.calculateIsVertical();
        if (newIsVertical !== this.isVertical) {
            this.isVertical = newIsVertical;
            this.updateLayoutAndRefresh();
        }
    }

    // Open the context menu for the focused card
    public openContextMenu() {
        const focusedCard = this.getFocusedCard();
        if (!focusedCard) return;

        const file = this.cardContainer.getFileFromCard(focusedCard);
        if (!file) return;

        const menu = new Menu();

        // Add default Obsidian file menu items
        this.plugin.app.workspace.trigger('file-menu', menu, file, 'more-options');

        menu.addSeparator();

        // Add custom menu items
        menu.addItem((item) => {
            item
                .setTitle(t('Copy as Link'))
                .setIcon('link')
                .onClick(() => {
                    this.cardContainer.copyLink(file);
                });
        });

        menu.addItem((item) => {
            item
                .setTitle(t('Copy Card Content'))
                .setIcon('file-text')
                .onClick(() => {
                    this.cardContainer.copyCardContent(file);
                });
        });

        // Show the menu at the card's position
        const rect = focusedCard.getBoundingClientRect();
        menu.showAtPosition({ x: rect.left, y: rect.bottom });
    }

    // Focus the keyboard navigator
	public focusNavigator() {
        this.keyboardNavigator.focusNavigator();
    }

    // Get the currently focused card element
    private getFocusedCard(): HTMLElement | null {
        return this.containerEl.querySelector('.card-navigator-card.card-navigator-focused');
    }

    // Refresh the toolbar and card container
    async refresh() {
        await this.toolbar.refresh();
        await this.cardContainer.refresh();
        this.updateLayoutAndRefresh();
    }

    // Update layout settings and refresh the view
    updateLayoutAndRefresh() {
        const settings = this.plugin.settings;
        if (settings.defaultLayout) {
            this.cardContainer.setLayout(settings.defaultLayout);
        } else {
            this.cardContainer.setLayout('auto');
        }
        this.cardContainer.updateSettings(settings);
        this.cardContainer.refresh();
    }

    // Set up the view when it's opened
    async onOpen() {
        const container = this.containerEl.children[1] as HTMLElement;
        container.empty();

        const navigatorEl = container.createDiv('card-navigator');
    
        const toolbarEl = navigatorEl.createDiv('card-navigator-toolbar');
        const cardContainerEl = navigatorEl.createDiv('card-navigator-container');

        this.toolbar.initialize(toolbarEl);
        this.cardContainer.initialize(cardContainerEl);
        this.keyboardNavigator = new KeyboardNavigator(this.plugin, this.cardContainer, cardContainerEl);

        this.isVertical = this.calculateIsVertical();
        this.updateLayoutAndRefresh();
        this.resizeObserver.observe(this.leaf.view.containerEl);

        await this.refresh();
        await this.centerActiveCardOnOpen();
    }

    // Center the active card when opening the view, if enabled in settings
    private async centerActiveCardOnOpen() {
        if (this.plugin.settings.centerActiveCardOnOpen) {
            setTimeout(() => {
                this.cardContainer.centerActiveCard();
            }, 200);
        }
    }

    // Clean up when the view is closed
    async onClose() {
        this.resizeObserver.disconnect();
        this.toolbar.onClose();
        this.cardContainer.onClose();
		this.keyboardNavigator.blurNavigator();
    }
}
