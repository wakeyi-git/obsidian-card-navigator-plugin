// src/main.ts

import { Plugin, Events, TFile, debounce, moment, WorkspaceLeaf } from 'obsidian';
import { CardNavigator, VIEW_TYPE_CARD_NAVIGATOR } from './ui/cardNavigator';
import { SettingTab } from './ui/settingsTab';
import { CardNavigatorSettings, ScrollDirection, SortCriterion, SortOrder, DEFAULT_SETTINGS } from './common/types';
import { PresetManager } from './common/presetManager';
import { SettingsManager } from './common/settingsManager';
import i18next from 'i18next';
import { t } from 'i18next';

export const languageResources = {
    en: () => import('./locales/en.json'),
    ko: () => import('./locales/ko.json'),
} as const;

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
		this.presetManager.initializeTempPreset();
    }

	async onunload() {
		this.events.off('settings-updated', this.refreshDebounced);
		this.presetManager.saveLastActivePreset();
	
		const ribbonIconEl = this.addRibbonIcon('layers-3', t('Activate Card Navigator'), () => {
			this.activateView();
		});
		ribbonIconEl.detach();
	}

    private async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    private initializeManagers() {
        this.presetManager = new PresetManager(this);
        this.settingsManager = new SettingsManager(this);
    }

    private async initializePlugin() {
        await this.initializeI18n();

        this.addSettingTab(new SettingTab(this.app, this));

        this.registerView(
            VIEW_TYPE_CARD_NAVIGATOR,
            (leaf) => new CardNavigator(leaf, this)
        );

        this.addRibbonIcon('layers-3', t('Activate Card Navigator'), () => {
            this.activateView();
        });

        this.addCommand({
            id: 'open-card-navigator',
            name: t('Open Card Navigator'),
            callback: () => this.activateView(),
        });

		this.addCommand({
			id: 'focus-card-navigator',
			name: t('Focus Card Navigator'),
			callback: () => {
				const cardNavigator = this.app.workspace.getLeavesOfType(VIEW_TYPE_CARD_NAVIGATOR)[0]?.view as CardNavigator;
				if (cardNavigator) {
					cardNavigator.cardContainer.focusNavigator();
				}
			}
		});
		
		// this.addCommand({
		// 	id: 'blur-card-navigator',
		// 	name: t('Blur Card Navigator'),
		// 	callback: () => {
		// 		const cardNavigator = this.app.workspace.getLeavesOfType(VIEW_TYPE_CARD_NAVIGATOR)[0]?.view as CardNavigator;
		// 		if (cardNavigator) {
		// 			cardNavigator.cardContainer.blurNavigator();
		// 		}
		// 	}
		// });

        // this.addCommand({
        //     id: 'open-card-context-menu',
        //     name: t('Open Card Context Menu'),
        //     callback: () => {
        //         const cardNavigator = this.getActiveCardNavigator();
        //         if (cardNavigator) {
        //             cardNavigator.openContextMenu();
        //         }
        //     }
        // });

        this.addScrollCommands();

        this.app.workspace.onLayoutReady(() => {
            this.activateView();
        });

        this.refreshDebounced = debounce(() => this.refreshViews(), 200);

        this.registerCentralizedEvents();
    }

    private async initializeI18n() {
        const resources = await this.loadLanguageResources();
        await i18next.init({
            lng: translationLanguage,
            fallbackLng: "en",
            resources,
        });
    }

    private async loadLanguageResources() {
        const en = await languageResources.en();
        const ko = await languageResources.ko();
        return {
            en: { translation: en.default },
            ko: { translation: ko.default },
        };
    }

    async saveSettings() {
        await this.saveData(this.settings);
        this.events.trigger('settings-updated');
        this.refreshDebounced();
    }

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

	triggerRefresh() {
        this.refreshDebounced();
    }

    private scrollCards(direction: ScrollDirection, count: number) {
        const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_CARD_NAVIGATOR);
        leaves.forEach((leaf) => {
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

    refreshViews() {
        const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_CARD_NAVIGATOR);
        leaves.forEach((leaf) => {
            if (leaf.view instanceof CardNavigator) {
                leaf.view.refresh();
            }
        });
    }

    displayFilteredCards(filteredFiles: TFile[]) {
        const view = this.app.workspace.getLeavesOfType(VIEW_TYPE_CARD_NAVIGATOR)[0]?.view as CardNavigator;
        if (view) {
            view.cardContainer.displayCards(filteredFiles);
        }
    }

    sortCards(criterion: SortCriterion, order: SortOrder) {
        const view = this.app.workspace.getLeavesOfType(VIEW_TYPE_CARD_NAVIGATOR)[0]?.view as CardNavigator;
        if (view) {
            view.cardContainer.sortCards(criterion, order);
        }
    }

	async activateView() {
		const { workspace } = this.app;
		let leaf: WorkspaceLeaf | null = null;
		
		const leaves = workspace.getLeavesOfType(VIEW_TYPE_CARD_NAVIGATOR);
		
		if (leaves.length > 0) {
			leaf = leaves[0];
		} else {
			leaf = workspace.getRightLeaf(false);
			if (leaf) {
				await leaf.setViewState({ type: VIEW_TYPE_CARD_NAVIGATOR, active: true });
			}
		}
	
		if (leaf) {
			workspace.revealLeaf(leaf);
		} else {
			console.error("Failed to activate Card Navigator view");
		}
	}

    private getActiveCardNavigator(): CardNavigator | null {
        const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_CARD_NAVIGATOR);
        if (leaves.length > 0) {
            return leaves[0].view as CardNavigator;
        }
        return null;
    }

    private centerActiveCard() {
        const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_CARD_NAVIGATOR);
        leaves.forEach((leaf) => {
            if (leaf.view instanceof CardNavigator) {
                leaf.view.cardContainer.centerActiveCard();
            }
        });
    }
}
