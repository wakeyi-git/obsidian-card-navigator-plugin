// src/main.ts

import { Plugin, TFile, debounce } from 'obsidian';
import { CardNavigator, VIEW_TYPE_CARD_NAVIGATOR } from './ui/cardNavigator';
import { SettingTab } from './ui/settingsTab';
import { CardNavigatorSettings, SortCriterion } from './common/types';
import { DEFAULT_SETTINGS } from './common/settings';

export default class CardNavigatorPlugin extends Plugin {
    settings: CardNavigatorSettings = DEFAULT_SETTINGS;
    selectedFolder: string | null = null;
    public containerEl: HTMLElement | undefined;
    private refreshDebounced: () => void = () => {};

    async onload() {
        await this.loadSettings();

        this.registerView(
            VIEW_TYPE_CARD_NAVIGATOR,
            (leaf) => new CardNavigator(leaf, this)
        );

        this.addSettingTab(new SettingTab(this.app, this));

        this.addRibbonIcon('layers-3', 'Activate Card Navigator', () => {
            this.activateView();
        });

        this.addCommand({
            id: 'scroll-up-one-card',
            name: 'Scroll Up One Card',
            callback: () => this.scrollCards('up', 1),
            hotkeys: [{ modifiers: ['Ctrl', 'Mod'], key: 'ArrowUp' }]
        });

        this.addCommand({
            id: 'scroll-down-one-card',
            name: 'Scroll Down One Card',
            callback: () => this.scrollCards('down', 1),
            hotkeys: [{ modifiers: ['Ctrl', 'Mod'], key: 'ArrowDown' }]
        });

        this.addCommand({
            id: 'scroll-left-one-card',
            name: 'Scroll Left One Card',
            callback: () => this.scrollCards('left', 1),
            hotkeys: [{ modifiers: ['Ctrl', 'Mod'], key: 'ArrowLeft' }]
        });

        this.addCommand({
            id: 'scroll-right-one-card',
            name: 'Scroll Right One Card',
            callback: () => this.scrollCards('right', 1),
            hotkeys: [{ modifiers: ['Ctrl', 'Mod'], key: 'ArrowRight' }]
        });

        this.addCommand({
            id: 'scroll-up-page',
            name: 'Scroll Up One Page',
            callback: () => this.scrollCards('up', this.settings.cardsPerView),
            hotkeys: [{ modifiers: ['Ctrl', 'Mod'], key: 'PageUp' }]
        });

        this.addCommand({
            id: 'scroll-down-page',
            name: 'Scroll Down One Page',
            callback: () => this.scrollCards('down', this.settings.cardsPerView),
            hotkeys: [{ modifiers: ['Ctrl', 'Mod'], key: 'PageDown' }]
        });

        this.addCommand({
            id: 'center-active-card',
            name: 'Center Active Card',
            callback: () => {
                const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_CARD_NAVIGATOR);
                for (const leaf of leaves) {
                    if (leaf.view instanceof CardNavigator) {
                        leaf.view.cardContainer.centerActiveCard();
                    }
                }
            },
            hotkeys: this.settings.centerActiveCardHotkey ? [this.settings.centerActiveCardHotkey] : []
        });

        this.app.workspace.onLayoutReady(() => {
            this.activateView();
        });

        // Initialize debounced refresh function
        this.refreshDebounced = debounce(this.refreshViews.bind(this), 100, true);
    }

    async onunload() {
        this.app.workspace.detachLeavesOfType(VIEW_TYPE_CARD_NAVIGATOR);
    }

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
		this.updateHotkey();
	}

    async saveSettings() {
        await this.saveData(this.settings);
        this.refreshDebounced();
		this.updateHotkey();
    }

    private updateHotkey() {
        // @ts-ignore
        const command = this.app.commands.commands['card-navigator-plugin:center-active-card'];
        if (command) {
            command.hotkeys = this.settings.centerActiveCardHotkey ? [this.settings.centerActiveCardHotkey] : [];
        }
    }

	private scrollCards(direction: 'up' | 'down' | 'left' | 'right', count: number) {
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

    sortCards(criterion: SortCriterion, order: 'asc' | 'desc') {
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
