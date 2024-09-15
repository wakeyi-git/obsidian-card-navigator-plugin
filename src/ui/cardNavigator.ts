import { ItemView, WorkspaceLeaf, Menu } from "obsidian";
import CardNavigatorPlugin from '../main';
import { Toolbar } from './toolbar/toolbar';
import { CardContainer } from './cardContainer/cardContainer';
import { KeyboardNavigator } from "../common/keyboardNavigator";
import { t } from 'i18next';

export const VIEW_TYPE_CARD_NAVIGATOR = "card-navigator-view";

export class CardNavigator extends ItemView {
    public toolbar: Toolbar;
    public cardContainer: CardContainer;
    private resizeObserver: ResizeObserver;
    private isVertical: boolean;
    private keyboardNavigator: KeyboardNavigator;

    constructor(leaf: WorkspaceLeaf, private plugin: CardNavigatorPlugin) {
        super(leaf);
        this.toolbar = new Toolbar(this.plugin); // Initialize toolbar
        this.cardContainer = new CardContainer(this.plugin, this.leaf); // Initialize card container
        this.isVertical = this.calculateIsVertical(); // Determine if the layout is vertical
        this.resizeObserver = new ResizeObserver(this.handleResize.bind(this)); // Observer to detect resize events
        this.keyboardNavigator = new KeyboardNavigator(this.plugin, this.cardContainer, this.containerEl.children[1] as HTMLElement); // Keyboard navigation for the cards
    }

    getViewType(): string {
        return VIEW_TYPE_CARD_NAVIGATOR; // Return the view type identifier
    }

    getDisplayText(): string {
        return t("Card Navigator"); // Displayed name for the view
    }

    getIcon(): string {
        return "layers-3"; // Icon for the view
    }

    private calculateIsVertical(): boolean {
        const { width, height } = this.leaf.view.containerEl.getBoundingClientRect();
        return height > width; // Check if the layout should be vertical based on dimensions
    }

    private handleResize() {
        const newIsVertical = this.calculateIsVertical();
        if (newIsVertical !== this.isVertical) {
            this.isVertical = newIsVertical;
            this.updateLayoutAndRefresh(); // Update layout if orientation has changed
        }
    }

    public openContextMenu() {
        const focusedCard = this.getFocusedCard(); // Get the currently focused card
        if (!focusedCard) return;

        const file = this.cardContainer.getFileFromCard(focusedCard); // Get the file associated with the card
        if (!file) return;

        const menu = new Menu();

        // Trigger the default Obsidian file menu
        this.plugin.app.workspace.trigger('file-menu', menu, file, 'more-options');

        // Add a separator in the context menu
        menu.addSeparator();

        // Add a menu item for copying as a link
        menu.addItem((item) => {
            item
                .setTitle(t('Copy as Link'))
                .setIcon('link')
                .onClick(() => {
                    this.cardContainer.copyLink(file); // Copy link to the card's file
                });
        });

        // Add a menu item for copying the card's content
        menu.addItem((item) => {
            item
                .setTitle(t('Copy Card Content'))
                .setIcon('file-text')
                .onClick(() => {
                    this.cardContainer.copyCardContent(file); // Copy the card's content
                });
        });

        // Display the menu at the card's location
        const rect = focusedCard.getBoundingClientRect();
        menu.showAtPosition({ x: rect.left, y: rect.bottom });
    }

	public focusNavigator() {
        this.keyboardNavigator.focusNavigator(); // Focus the keyboard navigator
    }

    private getFocusedCard(): HTMLElement | null {
        return this.containerEl.querySelector('.card-navigator-card.card-navigator-focused'); // Get the currently focused card element
    }

    async refresh() {
        await this.toolbar.refresh();
        await this.cardContainer.refresh();
        this.updateLayoutAndRefresh();
    }

    updateLayoutAndRefresh() {
        const currentSettings = this.plugin.settings.currentSettings;
        if (currentSettings.defaultLayout) {
            this.cardContainer.setLayout(currentSettings.defaultLayout);
        } else {
            // 기본값 설정 (예: 'auto')
            this.cardContainer.setLayout('auto');
        }
        this.cardContainer.updateSettings(currentSettings);
        this.cardContainer.refresh();
    }

    async onOpen() {
        const container = this.containerEl.children[1] as HTMLElement;
        container.empty(); // Clear container content

        const navigatorEl = container.createDiv('card-navigator');
    
        const toolbarEl = navigatorEl.createDiv('card-navigator-toolbar'); // Create toolbar element
        const cardContainerEl = navigatorEl.createDiv('card-navigator-container'); // Create card container element

        this.toolbar.initialize(toolbarEl); // Initialize the toolbar
        this.cardContainer.initialize(cardContainerEl); // Initialize the card container
        this.keyboardNavigator = new KeyboardNavigator(this.plugin, this.cardContainer, cardContainerEl); // Initialize keyboard navigation

        this.isVertical = this.calculateIsVertical(); // Check initial layout orientation
        this.updateLayoutAndRefresh(); // Update layout and refresh
        this.resizeObserver.observe(this.leaf.view.containerEl); // Start observing for resize events

        await this.refresh(); // Refresh the view
        await this.centerActiveCardOnOpen(); // Center the active card when the view opens
    }

    private async centerActiveCardOnOpen() {
        if (this.plugin.settings.centerActiveCardOnOpen) {
            setTimeout(() => {
                this.cardContainer.centerActiveCard(); // Center the active card after a delay
            }, 200);
        }
    }

    async onClose() {
        this.resizeObserver.disconnect(); // Stop observing resize events
        this.toolbar.onClose(); // Clean up toolbar
        this.cardContainer.onClose(); // Clean up card container
		this.keyboardNavigator.blurNavigator(); // Remove focus from keyboard navigation
    }
}
