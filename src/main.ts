import { Plugin, Events, TFile, debounce, moment, WorkspaceLeaf } from 'obsidian';
import { CardNavigator, VIEW_TYPE_CARD_NAVIGATOR } from './ui/cardNavigator';
import { SettingTab } from './ui/settingsTab';
import { CardNavigatorSettings, ScrollDirection, SortCriterion, SortOrder, DEFAULT_SETTINGS } from './common/types';
import { PresetManager } from './common/presetManager';
import { SettingsManager } from './common/settingsManager';
import i18next from 'i18next';
import { t } from 'i18next';

// Language resource configuration for translation
export const languageResources = {
    en: () => import('./locales/en.json'),
    ko: () => import('./locales/ko.json'),
} as const;

// Determine the translation language based on the user's locale, defaulting to English
export const translationLanguage = Object.keys(languageResources).includes(moment.locale()) ? moment.locale() : "en";

export default class CardNavigatorPlugin extends Plugin {
    settings: CardNavigatorSettings = DEFAULT_SETTINGS;
    selectedFolder: string | null = null;
    presetManager!: PresetManager;
    settingsManager!: SettingsManager;
    private refreshDebounced: () => void = () => {};
    public events: Events = new Events();

    async onload() {
        await this.loadSettings();
        this.initializeManagers();
        await this.initializePlugin();
    }

    async onunload() {
        this.events.off('settings-updated', this.refreshDebounced);

        const ribbonIconEl = this.addRibbonIcon('layers-3', t('Activate Card Navigator'), () => {
            this.activateView();
        });
        ribbonIconEl.detach();
    }

    async loadSettings() {
        const loadedData = await this.loadData();
        this.settings = Object.assign({}, DEFAULT_SETTINGS, loadedData);
    }

    async saveSettings() {
        await this.saveData(this.settings);
        this.events.trigger('settings-updated');
    }

    private initializeManagers() {
        this.settingsManager = new SettingsManager(this);
        this.presetManager = new PresetManager(this);
    }

    // Initialize the plugin, setting up views, commands, and event handlers
	private async initializePlugin() {
        await this.initializeI18n();

        this.addSettingTab(new SettingTab(this.app, this)); // Add the plugin's settings tab

        this.registerView(
            VIEW_TYPE_CARD_NAVIGATOR,
            (leaf) => new CardNavigator(leaf, this) // Register the Card Navigator view
        );

        this.addRibbonIcon('layers-3', t('Activate Card Navigator'), () => {
            this.activateView(); // Add a ribbon icon to activate the Card Navigator
        });

        // Register plugin commands (e.g., opening, focusing, and scrolling the Card Navigator)
        this.addCommand({
            id: 'open-card-navigator',
            name: t('Open Card Navigator'),
            callback: () => this.activateView(),
        });

        this.addCommand({
            id: 'focus-card-navigator',
            name: t('Focus Card Navigator'),
            callback: () => {
                const cardNavigator = this.getActiveCardNavigator();
                if (cardNavigator) {
                    cardNavigator.focusNavigator(); // Focus on the active Card Navigator
                }
            }
        });

        this.addCommand({
            id: 'open-card-context-menu',
            name: t('Open Card Context Menu'),
            callback: () => {
                const cardNavigator = this.getActiveCardNavigator();
                if (cardNavigator) {
                    cardNavigator.openContextMenu(); // Open context menu for the active card
                }
            }
        });

        this.addScrollCommands(); // Register scroll-related commands

        // Activate Card Navigator view when the layout is ready
        this.app.workspace.onLayoutReady(() => {
            this.activateView();
        });

        this.refreshDebounced = debounce(() => this.refreshViews(), 200); // Debounce the refresh function to avoid excessive calls

        this.registerCentralizedEvents(); // Register central events for handling file and workspace changes

		// Refresh card navigator when layout changes
		this.registerEvent(
			this.app.workspace.on('layout-change', () => {
				this.refreshCardNavigator();
			})
		);

		// Add this new event listener for settings changes
		this.events.on('settings-updated', () => {
			this.refreshCardNavigator();
		});
    }

	// Updates the layout of all Card Navigator instances
	public updateCardNavigatorLayout(layout: CardNavigatorSettings['defaultLayout']) {
		const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_CARD_NAVIGATOR);
		leaves.forEach((leaf) => {
			if (leaf.view instanceof CardNavigator) {
				leaf.view.cardContainer.setLayout(layout);
				leaf.view.refresh(); // Refresh the view to apply the new layout
			}
		});
		this.saveSettings(); // Save the new layout setting
	}

	// Refresh card navigator when layout changes
	refreshCardNavigator() {
		const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_CARD_NAVIGATOR);
		leaves.forEach((leaf) => {
			if (leaf.view instanceof CardNavigator) {
				leaf.view.cardContainer.handleResize();
				leaf.view.refresh(); // Refresh the view after handling resize
			}
		});
	}

    // Initialize the translation system (i18n)
    private async initializeI18n() {
        const resources = await this.loadLanguageResources();
        await i18next.init({
            lng: translationLanguage,
            fallbackLng: "en",
            resources,
        });
    }

    // Load language resources for English and Korean
    private async loadLanguageResources() {
        const en = await languageResources.en();
        const ko = await languageResources.ko();
        return {
            en: { translation: en.default },
            ko: { translation: ko.default },
        };
    }

    // Register event handlers for file and workspace changes
    private registerCentralizedEvents() {
        this.registerEvent(
            this.app.vault.on('rename', (file) => {
                if (file instanceof TFile) {
                    this.refreshDebounced(); // Refresh views if a file is renamed
                }
            })
        );

        this.registerEvent(
            this.app.workspace.on('active-leaf-change', this.refreshDebounced)
        );

        this.registerEvent(
            this.app.vault.on('modify', this.refreshDebounced)
        );

        this.events.on('settings-updated', this.refreshDebounced);
    }

    // Manually trigger a refresh of the views
    triggerRefresh() {
        this.refreshDebounced();
        this.app.workspace.trigger('layout-change');
    }

    // Scroll through the cards in the specified direction by a certain number of cards
    private scrollCards(direction: ScrollDirection, count: number) {
        const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_CARD_NAVIGATOR);
        leaves.forEach((leaf) => {
            if (leaf.view instanceof CardNavigator) {
                const { cardContainer } = leaf.view;
                const isVertical = cardContainer.isVertical;

                // Scroll the card container in the specified direction
                switch (direction) {
                    case 'up':
                        isVertical ? cardContainer.scrollUp(count) : cardContainer.scrollLeft(count);
                        break;
                    case 'down':
                        isVertical ? cardContainer.scrollDown(count) : cardContainer.scrollRight(count);
                        break;
                    case 'left':
                        cardContainer.scrollLeft(count);
                        break;
                    case 'right':
                        cardContainer.scrollRight(count);
                        break;
                }
            }
        });
    }

    // Add commands for scrolling and centering cards
    private addScrollCommands() {
        const scrollCommands = [
            { id: 'scroll-up-one-card', name: t('Scroll Up One Card'), direction: 'up', count: 1 },
            { id: 'scroll-down-one-card', name: t('Scroll Down One Card'), direction: 'down', count: 1 },
            { id: 'scroll-left-one-card', name: t('Scroll Left One Card'), direction: 'left', count: 1 },
            { id: 'scroll-right-one-card', name: t('Scroll Right One Card'), direction: 'right', count: 1 },
            { id: 'scroll-up-page', name: t('Scroll Up/Left One Page'), direction: 'up', count: this.settings.cardsPerView },
            { id: 'scroll-down-page', name: t('Scroll Down/Right One Page'), direction: 'down', count: this.settings.cardsPerView },
            { id: 'center-active-card', name: t('Center Active Card'), direction: '', count: 0 },
        ];

        // Register each scroll command
        scrollCommands.forEach(({ id, name, direction, count }) => {
            this.addCommand({
                id,
                name,
                callback: () => {
                    if (id === 'center-active-card') {
                        this.centerActiveCard(); // Center the active card
                    } else {
                        this.scrollCards(direction as ScrollDirection, count); // Scroll in the specified direction
                    }
                },
            });
        });
    }

    // Refresh all Card Navigator views
    refreshViews() {
        const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_CARD_NAVIGATOR);
        leaves.forEach((leaf) => {
            if (leaf.view instanceof CardNavigator) {
                leaf.view.refresh();
            }
        });
    }

    // Display filtered cards in the active Card Navigator
    displayFilteredCards(filteredFiles: TFile[]) {
        const view = this.app.workspace.getLeavesOfType(VIEW_TYPE_CARD_NAVIGATOR)[0]?.view as CardNavigator;
        if (view) {
            view.cardContainer.displayCards(filteredFiles); // Display the filtered set of cards
        }
    }

    // Sort the cards in the Card Navigator based on the specified criterion and order
    sortCards(criterion: SortCriterion, order: SortOrder) {
        const view = this.app.workspace.getLeavesOfType(VIEW_TYPE_CARD_NAVIGATOR)[0]?.view as CardNavigator;
        if (view) {
            view.cardContainer.sortCards(criterion, order); // Sort the cards
        }
    }

    // Activate the Card Navigator view in the workspace
    async activateView() {
        const { workspace } = this.app;
        let leaf: WorkspaceLeaf | null = null;

        // Check if there's already an active Card Navigator view
        const leaves = workspace.getLeavesOfType(VIEW_TYPE_CARD_NAVIGATOR);

        if (leaves.length > 0) {
            leaf = leaves[0];
        } else {
            // Open a new Card Navigator view in the right pane
            leaf = workspace.getRightLeaf(false);
            if (leaf) {
                await leaf.setViewState({ type: VIEW_TYPE_CARD_NAVIGATOR, active: true });
            }
        }

        if (leaf) {
            workspace.revealLeaf(leaf); // Bring the leaf into focus
        } else {
            console.error("Failed to activate Card Navigator view");
        }
    }

    // Get the active Card Navigator view
    private getActiveCardNavigator(): CardNavigator | null {
        const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_CARD_NAVIGATOR);
        if (leaves.length > 0) {
            return leaves[0].view as CardNavigator; // Return the active Card Navigator view
        }
        return null;
    }

    // Center the active card in the Card Navigator
    private centerActiveCard() {
        const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_CARD_NAVIGATOR);
        leaves.forEach((leaf) => {
            if (leaf.view instanceof CardNavigator) {
                leaf.view.cardContainer.centerActiveCard(); // Center the active card
            }
        });
    }
}
