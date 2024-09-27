import { Plugin, Events, TFile, debounce, moment, WorkspaceLeaf  } from 'obsidian';
import { CardNavigator, VIEW_TYPE_CARD_NAVIGATOR } from './ui/cardNavigator';
import { SettingTab } from './ui/settings/settingsTab';
import { CardNavigatorSettings, ScrollDirection, SortCriterion, SortOrder, DEFAULT_SETTINGS } from './common/types';
import { SettingsManager } from './ui/settings/settingsManager';
import { PresetManager } from './ui/settings/PresetManager';
import i18next from 'i18next';
import { t } from 'i18next';

// Define language resources for internationalization
export const languageResources = {
    en: () => import('./locales/en.json'),
    ko: () => import('./locales/ko.json'),
} as const;

// Set the translation language based on the user's locale, defaulting to English if not available
export const translationLanguage = Object.keys(languageResources).includes(moment.locale()) ? moment.locale() : "en";

export default class CardNavigatorPlugin extends Plugin {
    settings: CardNavigatorSettings = DEFAULT_SETTINGS;
    selectedFolder: string | null = null;
    settingsManager!: SettingsManager;
    presetManager!: PresetManager;
    settingTab!: SettingTab;
    private refreshDebounced = debounce(() => this.refreshViews(), 200);
    private ribbonIconEl: HTMLElement | null = null;
    public events: Events = new Events();

    // Plugin initialization
    async onload() {
        await this.loadSettings();
        this.presetManager = new PresetManager(this.app, this, this.settings);
        this.settingsManager = new SettingsManager(this, this.presetManager);
        await this.presetManager.initialize();
        await this.initializePlugin();

		this.ribbonIconEl = this.addRibbonIcon('layers-3', t('OPEN_CARD_NAVIGATOR'), () => {
			this.activateView();
		});

		this.registerEvent(
			this.app.workspace.on('file-open', (file) => {
				if (file instanceof TFile) {
					this.selectAndApplyPreset(file);
				}
			})
		);
    }

	// Plugin cleanup
	async onunload() {
		this.events.off('settings-updated', this.refreshDebounced);

		if (this.ribbonIconEl) {
			this.ribbonIconEl.detach();
		}
	}

	// Load plugin settings
	async loadSettings() {
		const loadedData = await this.loadData();
		this.settings = Object.assign({}, DEFAULT_SETTINGS, loadedData);
	}

	// Save plugin settings
	async saveSettings() {
		await this.saveData(this.settings);
		this.events.trigger('settings-updated');
	}

    // Apply a preset using the PresetManager
	async applyPreset(_presetName: string) {
		await this.presetManager.applyGlobalPreset(this.settings.GlobalPreset);
	}

	// Initialize plugin components and functionality
	private async initializePlugin() {
		await this.applyPreset(this.settings.GlobalPreset || 'default');
		await this.initializeFolderPresets();
		await this.initializeI18n();
	
		this.settingTab = new SettingTab(this.app, this);
		this.addSettingTab(this.settingTab);
	
		this.registerView(
			VIEW_TYPE_CARD_NAVIGATOR,
			(leaf) => new CardNavigator(leaf, this)
		);
	
		this.addCommands();
		this.addScrollCommands();
	
		this.refreshDebounced = debounce(() => this.refreshViews(), 200);
		this.registerCentralizedEvents();
	}

	// Initialize folder presets if not already present
	private async initializeFolderPresets() {
		if (!this.settings.folderPresets) {
			this.settings.folderPresets = {};
			this.settings.activeFolderPresets = {};
			await this.saveSettings();
		}
	}

	// Initialize internationalization
	private async initializeI18n() {
		const resources = await this.loadLanguageResources();
		await i18next.init({
			lng: translationLanguage,
			fallbackLng: "en",
			resources,
		});
	}

	// Load language resources
	private async loadLanguageResources() {
		const [en, ko] = await Promise.all([
			languageResources.en(),
			languageResources.ko()
		]);
		return {
			en: { translation: en.default },
			ko: { translation: ko.default },
		};
	}	

	private addCommands() {
		this.addCommand({
			id: 'open-card-navigator',
			name: t('OPEN_CARD_NAVIGATOR'),
			callback: () => this.activateView(),
		});

		this.addCommand({
			id: 'focus-card-navigator',
			name: t('MOVE_FOCUS_TO_CARD_NAVIGATOR'),
			callback: async () => {
				const cardNavigator = this.getFirstCardNavigator();
				if (cardNavigator) {
					const leaf = this.app.workspace.getLeaf();
					if (leaf) {
						leaf.view.containerEl.focus();
						await new Promise(resolve => setTimeout(resolve, 0));
						cardNavigator.focusNavigator();
					}
				}
			}
		});

		this.addCommand({
			id: 'open-card-context-menu',
			name: t('OPEN_CARD_CONTEXT_MENU'),
			callback: () => {
				const cardNavigator = this.getActiveCardNavigator();
				if (cardNavigator) {
					cardNavigator.openContextMenu();
				}
			}
		});
	}
    // Refresh all Card Navigator views
	refreshViews() {
		const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_CARD_NAVIGATOR);
		leaves.forEach(leaf => {
			if (leaf.view instanceof CardNavigator) {
				leaf.view.refresh();
			}
		});
	}

    // Activate or create a Card Navigator view
	async activateView() {
		const { workspace } = this.app;
		let leaf: WorkspaceLeaf | null = null;
	
		// First, look for an existing Card Navigator view
		const existingLeaf = workspace.getLeavesOfType(VIEW_TYPE_CARD_NAVIGATOR)[0];
		if (existingLeaf) {
			leaf = existingLeaf;
		} else {
			// Create a new leaf in the right sidebar
			leaf = workspace.getRightLeaf(false);
			if (leaf) {
				await leaf.setViewState({ type: VIEW_TYPE_CARD_NAVIGATOR, active: true });
			}
		}
	
		if (leaf) {
			// Reveal the leaf and set it as active
			workspace.revealLeaf(leaf);
			if (workspace.activeLeaf) {
				await workspace.activeLeaf.setViewState(leaf.getViewState());
			}
		} else {
			console.error("Failed to activate Card Navigator view");
		}
	}

	private getFirstCardNavigator(): CardNavigator | null {
		const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_CARD_NAVIGATOR);
		for (const leaf of leaves) {
			if (leaf.view instanceof CardNavigator) {
				return leaf.view;
			}
		}
		return null;
	}

    // Display filtered cards in the active Card Navigator
	displayFilteredCards(filteredFiles: TFile[]) {
		const cardNavigator = this.app.workspace.getActiveViewOfType(CardNavigator);
		if (cardNavigator) {
			cardNavigator.cardContainer.displayCards(filteredFiles);
		}
	}

    // Sort cards based on the specified criterion and order
	sortCards(criterion: SortCriterion, order: SortOrder) {
		const cardNavigator = this.app.workspace.getActiveViewOfType(CardNavigator);
		if (cardNavigator) {
			cardNavigator.cardContainer.sortCards(criterion, order);
		}
	}

    // Get the active Card Navigator view
	private getActiveCardNavigator(): CardNavigator | null {
		return this.app.workspace.getActiveViewOfType(CardNavigator);
	}

	private async selectAndApplyPreset(file: TFile) {
        if (this.settings.autoApplyPresets) {
            if (this.settings.autoApplyFolderPresets && file.parent) {
                await this.presetManager.applyFolderPreset(file.parent.path);
            } else {
                await this.presetManager.applyGlobalPreset(this.settings.GlobalPreset);
            }
        } else {
            // 현재 설정(data.json의 설정값)을 유지
        }
    }

	async selectAndApplyPresetForCurrentFile() {
        const currentFile = this.app.workspace.getActiveFile();
        if (currentFile) {
            await this.selectAndApplyPreset(currentFile);
        }
    }

	// Refreshes the Card Navigator settings tab
	refreshSettingsTab() {
		if (this.settingTab instanceof SettingTab) {
			this.settingTab.display();
		}
	}

	// Refresh Card Navigator instances
	refreshCardNavigator() {
		const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_CARD_NAVIGATOR);
		leaves.forEach((leaf) => {
			if (leaf.view instanceof CardNavigator) {
				leaf.view.cardContainer.handleResize();
				leaf.view.refresh();
			}
		});
	}

	// Update layout for all Card Navigator instances
	public updateCardNavigatorLayout(layout: CardNavigatorSettings['defaultLayout']) {
		const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_CARD_NAVIGATOR);
		leaves.forEach((leaf) => {
			if (leaf.view instanceof CardNavigator) {
				leaf.view.cardContainer.setLayout(layout);
				leaf.view.refresh();
			}
		});
		this.saveSettings();
	}

    // Center the active card in all Card Navigator views
	centerActiveCard() {
		const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_CARD_NAVIGATOR);
		leaves.forEach(leaf => {
			if (leaf.view instanceof CardNavigator) {
				leaf.view.cardContainer.centerActiveCard();
			}
		});
	}

    // Add scroll-related commands
	private addScrollCommands() {
		const scrollCommands = [
			{ id: 'scroll-up-one-card', name: t('SCROLL_UP_ONE_CARD'), direction: 'up', count: 1 },
			{ id: 'scroll-down-one-card', name: t('SCROLL_DOWN_ONE_CARD'), direction: 'down', count: 1 },
			{ id: 'scroll-left-one-card', name: t('SCROLL_LEFT_ONE_CARD'), direction: 'left', count: 1 },
			{ id: 'scroll-right-one-card', name: t('SCROLL_RIGHT_ONE_CARD'), direction: 'right', count: 1 },
			{ id: 'scroll-up-page', name: t('SCROLL_UP_LEFT_ONE_PAGE'), direction: 'up', count: this.settings.cardsPerView },
			{ id: 'scroll-down-page', name: t('SCROLL_DOWN_RIGHT_ONE_PAGE'), direction: 'down', count: this.settings.cardsPerView },
			{ id: 'center-active-card', name: t('CENTER_ACTIVE_CARD'), direction: '', count: 0 },
		];

        scrollCommands.forEach(({ id, name, direction, count }) => {
            this.addCommand({
                id,
                name,
                callback: () => {
                    if (id === 'center-active-card') {
                        this.centerActiveCard();
                    } else {
                        this.scrollCards(direction as ScrollDirection, count);
                    }
                },
            });
        });
    }

    // Scroll cards in the specified direction
	scrollCards(direction: ScrollDirection, count: number) {
		const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_CARD_NAVIGATOR);
		leaves.forEach(leaf => {
			if (leaf.view instanceof CardNavigator) {
				const { cardContainer } = leaf.view;
				const isVertical = cardContainer.isVertical;
	
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

	// Set up event listeners for file and workspace changes
	private registerCentralizedEvents() {

		// Refresh card navigator on layout changes
		this.registerEvent(
			this.app.workspace.on('layout-change', () => {
				this.refreshCardNavigator();
			})
		);

		// Refresh card navigator on settings updates
		this.events.on('settings-updated', () => {
			this.refreshCardNavigator();
		});

		this.registerEvent(
			this.app.vault.on('rename', (file) => {
				if (file instanceof TFile) {
					this.refreshDebounced();
				}
			})
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
}
