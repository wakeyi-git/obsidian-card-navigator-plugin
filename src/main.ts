// main.ts
import { Plugin, Events, TFile, debounce, moment, WorkspaceLeaf, FileView } from 'obsidian';
import { CardNavigator, VIEW_TYPE_CARD_NAVIGATOR } from './ui/cardNavigator';
import { SettingTab } from './ui/settings/settingsTab';
import { CardNavigatorSettings, ScrollDirection, SortCriterion, SortOrder, DEFAULT_SETTINGS, globalSettingsKeys } from './common/types';
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

		this.initializeManagers();
		await this.initializePresets();

		await this.initializePlugin();
	
		this.ribbonIconEl = this.addRibbonIcon('layers-3', t('Open Card Navigator'), () => {
			this.activateView();
		});
	
		this.registerEvent(
			this.app.workspace.on('active-leaf-change', this.handleActiveLeafChange.bind(this))
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

    // Initialize plugin managers
	private initializeManagers() {
		this.presetManager = new PresetManager(this.app, this, this.settings);
		this.settingsManager = new SettingsManager(this, this.presetManager);
	}

	private async initializePresets() {
		await this.presetManager.initialize();
	}

    // Set up plugin components and functionality
	private async initializePlugin() {
        await this.initializeI18n();

		// // Initialize default preset
        // if (!this.settings.folderPresets['/'] || this.settings.folderPresets['/'].length === 0) {
        //     const defaultSettings = Object.fromEntries(
        //         Object.entries(DEFAULT_SETTINGS).filter(
        //             ([key]) => !globalSettingsKeys.includes(key as keyof CardNavigatorSettings)
        //         )
        //     );
        //     await this.settingsManager.saveAsNewPreset('default', defaultSettings);
        //     this.settings.folderPresets['/'] = ['default'];
        //     this.settings.activeFolderPresets['/'] = 'default';
        //     await this.saveSettings();
        // }

		// 기본 프리셋 초기화
		await this.presetManager.createDefaultPreset();

		// 기본 프리셋 적용
		const defaultPresetName = 'default';
		if (this.presetManager.getPreset(defaultPresetName)) {
			await this.applyPreset(defaultPresetName);
		}

		this.settingTab = new SettingTab(this.app, this);
		this.addSettingTab(this.settingTab);
	
        this.registerView(
            VIEW_TYPE_CARD_NAVIGATOR,
            (leaf) => new CardNavigator(leaf, this)
        );

        // Register plugin commands
        this.addCommand({
            id: 'open-card-navigator',
            name: t('Open Card Navigator'),
            callback: () => this.activateView(),
        });

		this.addCommand({
			id: 'focus-card-navigator',
			name: t('Move focus to Card Navigator'),
			callback: async () => {
				const cardNavigator = this.getFirstCardNavigator();
				if (cardNavigator) {
					// 플러그인의 리프로 초점을 맞추기
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
            name: t('Open card context menu'),
            callback: () => {
                const cardNavigator = this.getActiveCardNavigator();
                if (cardNavigator) {
                    cardNavigator.openContextMenu();
                }
            }
        });

        this.addScrollCommands();

        // Activate Card Navigator view when the layout is ready
        this.app.workspace.onLayoutReady(() => {
            this.activateView();
        });

        this.refreshDebounced = debounce(() => this.refreshViews(), 200);

        this.registerCentralizedEvents();

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

	// // Initialize folder presets if not already present
    // private async initializeFolderPresets() {
    //     if (!this.settings.folderPresets) {
    //         this.settings.folderPresets = {};
    //         this.settings.activeFolderPresets = {};
    //         await this.saveSettings();
    //     }
    // }

	// Determine if the active leaf is in file view, determine the parent folder of the file, and apply a preset for that folder
    private async handleActiveLeafChange(leaf: WorkspaceLeaf | null) {
        if (leaf?.view instanceof FileView) {
            const file = leaf.view.file;
            if (file?.parent) {
                const folderPath = file.parent.path;
                const activePreset = this.settings.activeFolderPresets[folderPath];
                if (activePreset) {
                    await this.applyPreset(activePreset);
                }
                this.refreshCardNavigator();
                this.refreshSettingsTab();
            }
        }
    }

	async applyPreset(presetName: string) {
		// 현재 설정을 로드합니다.
		const currentSettings = await this.loadData();
		const presetSettings = await this.settingsManager.loadPresetFromFile(presetName + '.json');
		if (presetSettings) {
			// 전역 설정은 제외하고 프리셋 설정만 적용
			const filteredSettings = Object.fromEntries(
				Object.entries(presetSettings).filter(
					([key]) => !globalSettingsKeys.includes(key as keyof CardNavigatorSettings)
				)
			);
			// 현재 설정과 프리셋 설정을 병합합니다.
			const newSettings = Object.assign({}, currentSettings, filteredSettings);
			this.settings = newSettings;
			// 변경된 설정을 저장합니다.
			await this.saveData(newSettings);
			this.refreshCardNavigator();
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

    // Initialize internationalization
    private async initializeI18n() {
        const resources = await this.loadLanguageResources();
        await i18next.init({
            lng: translationLanguage,
            fallbackLng: "en",
            resources,
        });
    }


    // Set up event listeners for file and workspace changes
    private registerCentralizedEvents() {
        this.registerEvent(
            this.app.vault.on('rename', (file) => {
                if (file instanceof TFile) {
                    this.refreshDebounced();
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

    // Add scroll-related commands
    private addScrollCommands() {
        const scrollCommands = [
            { id: 'scroll-up-one-card', name: t('Scroll up one card'), direction: 'up', count: 1 },
            { id: 'scroll-down-one-card', name: t('Scroll down one card'), direction: 'down', count: 1 },
            { id: 'scroll-left-one-card', name: t('Scroll left one card'), direction: 'left', count: 1 },
            { id: 'scroll-right-one-card', name: t('Scroll right one card'), direction: 'right', count: 1 },
            { id: 'scroll-up-page', name: t('Scroll up/left one page'), direction: 'up', count: this.settings.cardsPerView },
            { id: 'scroll-down-page', name: t('Scroll down/right one page'), direction: 'down', count: this.settings.cardsPerView },
            { id: 'center-active-card', name: t('Center active card'), direction: '', count: 0 },
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

    // Refresh all Card Navigator views
	refreshViews() {
		const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_CARD_NAVIGATOR);
		leaves.forEach(leaf => {
			if (leaf.view instanceof CardNavigator) {
				leaf.view.refresh();
			}
		});
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

    // Get the active Card Navigator view
	private getActiveCardNavigator(): CardNavigator | null {
		return this.app.workspace.getActiveViewOfType(CardNavigator);
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
}
