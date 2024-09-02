import { Plugin, TFile, debounce, moment } from 'obsidian';
import { CardNavigator, VIEW_TYPE_CARD_NAVIGATOR } from './ui/cardNavigator';
import { SettingTab } from './ui/settingsTab';
import { CardNavigatorSettings, ScrollDirection, SortCriterion, SortOrder } from './common/types';
import { DEFAULT_SETTINGS } from './common/settings';
import i18next from 'i18next';
import { t } from 'i18next';

import en from './locales/en.json'
import ko from './locales/ko.json';

// Define language resources for internationalization
export const languageResources = {
    en: { translation: en },
    ko: { translation: ko },
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
        i18next.init({
            lng: translationLanguage,
            fallbackLng: "en",
            resources: languageResources,
        });

        this.addSettingTab(new SettingTab(this.app, this));

        this.registerView(
            VIEW_TYPE_CARD_NAVIGATOR,
            (leaf) => new CardNavigator(leaf, this)
        );

        this.addRibbonIcon('layers-3', t('Activate Card Navigator'), () => {
            this.activateView();
        });

        // Add commands for scrolling and centering cards
        this.addCommand({
            id: 'scroll-up-one-card',
            name: t('Scroll Up One Card'),
            callback: () => this.scrollCards('up', 1)
        });

        this.addCommand({
            id: 'scroll-down-one-card',
            name: t('Scroll Down One Card'),
            callback: () => this.scrollCards('down', 1)
        });

        this.addCommand({
            id: 'scroll-left-one-card',
            name: t('Scroll Left One Card'),
            callback: () => this.scrollCards('left', 1)
        });

        this.addCommand({
            id: 'scroll-right-one-card',
            name: t('Scroll Right One Card'),
            callback: () => this.scrollCards('right', 1)
        });

        this.addCommand({
            id: 'scroll-up-page',
            name: t('Scroll Up/Left One Page'),
            callback: () => this.scrollCards('up', this.settings.cardsPerView)
        });

        this.addCommand({
            id: 'scroll-down-page',
            name: t('Scroll Down/Right One Page'),
            callback: () => this.scrollCards('down', this.settings.cardsPerView)
        });

        this.addCommand({
            id: 'center-active-card',
            name: t('Center Active Card'),
            callback: () => {
                const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_CARD_NAVIGATOR);
                for (const leaf of leaves) {
                    if (leaf.view instanceof CardNavigator) {
                        leaf.view.cardContainer.centerActiveCard();
                    }
                }
            }
        });

        this.app.workspace.onLayoutReady(() => {
            this.activateView();
        });

        // Initialize debounced refresh function
        this.refreshDebounced = debounce(this.refreshViews.bind(this), 100, true);
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

	private scrollCards(direction: ScrollDirection, count: number) {
		const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_CARD_NAVIGATOR);
		for (const leaf of leaves) {
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
		}
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
}
