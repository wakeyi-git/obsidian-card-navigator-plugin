// src/main.ts

import { Plugin, TFile, debounce, moment } from 'obsidian';
import { CardNavigator, VIEW_TYPE_CARD_NAVIGATOR } from './ui/cardNavigator';
import { SettingTab } from './ui/settingsTab';
import { CardNavigatorSettings, ScrollDirection, SortCriterion, SortOrder } from './common/types';
import { DEFAULT_SETTINGS } from './common/settings';
import i18next from 'i18next';
import { t } from 'i18next';

// Define language resources for internationalization
export const languageResources = {
    en: () => import('./locales/en.json'),
    ko: () => import('./locales/ko.json'),
} as const;

// Set the translation language based on the current locale
export const translationLanguage = Object.keys(languageResources).includes(moment.locale()) ? moment.locale() : "en";

export default class CardNavigatorPlugin extends Plugin {
    settings: CardNavigatorSettings = DEFAULT_SETTINGS;
    selectedFolder: string | null = null;
    private refreshDebounced: () => void = () => {};

    async onload() {
        await this.loadSettings();

        // Initialize i18next for internationalization
        const resources = await this.loadLanguageResources();
        i18next.init({
            lng: translationLanguage,
            fallbackLng: "en",
            resources,
        });

        this.addSettingTab(new SettingTab(this.app, this));

        this.registerView(
            VIEW_TYPE_CARD_NAVIGATOR,
            (leaf) => new CardNavigator(leaf, this)
        );

        this.addRibbonIcon('layers-3', t('Activate Card Navigator'), () => {
            this.activateView();
        });

        this.addScrollCommands();

        this.app.workspace.onLayoutReady(() => {
            this.activateView();
        });

        // Initialize debounced refresh function
        this.refreshDebounced = debounce(() => this.refreshViews(), 200);
    }

    async onunload() {
        // Cleanup code can be added here if needed
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
        this.refreshDebounced();
    }

    private async loadLanguageResources() {
        const en = await languageResources.en();
        const ko = await languageResources.ko();
        return {
            en: { translation: en.default },
            ko: { translation: ko.default },
        };
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

    private async updateSortSettings(criterion: SortCriterion, order: SortOrder) {
        const validCriteria: SortCriterion[] = ["fileName", "lastModified", "created"];
        const validOrders: SortOrder[] = ["asc", "desc"];

        if (!validCriteria.includes(criterion) || !validOrders.includes(order)) {
            throw new Error('Invalid sort criterion or order');
        }
        this.settings.sortCriterion = criterion;
        this.settings.sortOrder = order;
        await this.saveSettings();
        this.refreshDebounced();
    }

    refreshViews() {
        const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_CARD_NAVIGATOR);
        leaves.forEach((leaf) => {
            if (leaf.view instanceof CardNavigator) {
                leaf.view.updateLayoutAndRefresh();
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
        let leaf = workspace.getLeavesOfType(VIEW_TYPE_CARD_NAVIGATOR)[0];

        if (!leaf) {
            const rightLeaf = workspace.getRightLeaf(false);
            if (rightLeaf) {
                await rightLeaf.setViewState({ type: VIEW_TYPE_CARD_NAVIGATOR, active: true });
                leaf = workspace.getLeavesOfType(VIEW_TYPE_CARD_NAVIGATOR)[0];
            }
        }

        if (leaf) {
            workspace.revealLeaf(leaf);
        }
    }

    triggerRefresh() {
        this.refreshDebounced();
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
