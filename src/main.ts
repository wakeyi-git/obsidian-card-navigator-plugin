// src/main.ts

import { Plugin, TFile } from 'obsidian';
import { CardNavigator, VIEW_TYPE_CARD_NAVIGATOR } from './ui/cardNavigator';
import { SettingTab } from './ui/settingsTab';
import { CardNavigatorSettings } from './common/types';
import { DEFAULT_SETTINGS } from './common/settings';

export default class CardNavigatorPlugin extends Plugin {
    settings: CardNavigatorSettings = DEFAULT_SETTINGS;
	selectedFolder: string | null = null;
	public containerEl: HTMLElement | undefined;

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
            id: 'activate-card-navigator',
            name: 'Activate Card Navigator',
            callback: () => {
                this.activateView();
            },
        });

		this.addCommand({
            id: 'select-folder',
            name: 'Select folder for Card Navigator',
            callback: () => {
                const view = this.app.workspace.getActiveViewOfType(CardNavigator);
                if (view) {
                    view.toolbar.openFolderSelector();
                }
            }
        });

        this.app.workspace.onLayoutReady(() => {
            this.activateView();
        });
    }

    async onunload() {
        this.app.workspace.detachLeavesOfType(VIEW_TYPE_CARD_NAVIGATOR);
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
        this.refreshViews();
    }

	setSelectedFolder(folderPath: string) {
        this.selectedFolder = folderPath;
        this.settings.selectedFolder = folderPath;
        this.saveSettings();
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
        const view = this.app.workspace.getLeavesOfType(VIEW_TYPE_CARD_NAVIGATOR)[0].view as CardNavigator;
        view.cardContainer.displayCards(filteredFiles);
    }
	
	sortCards(criterion: 'fileName' | 'lastModified' | 'created', order: 'asc' | 'desc') {
		const view = this.app.workspace.getLeavesOfType(VIEW_TYPE_CARD_NAVIGATOR)[0].view as CardNavigator;
		view.cardContainer.sortCards(criterion, order);
	}

	async activateView() {
		const { workspace } = this.app;
		let leaves = workspace.getLeavesOfType(VIEW_TYPE_CARD_NAVIGATOR);
		let leaf = leaves[0];
	
		if (!leaf) {
			const rightLeaf = workspace.getRightLeaf(false);
			if (rightLeaf) {
				await rightLeaf.setViewState({ type: VIEW_TYPE_CARD_NAVIGATOR, active: true });
				leaves = workspace.getLeavesOfType(VIEW_TYPE_CARD_NAVIGATOR); // 다시 가져오기
				leaf = leaves[0];
			}
		}
	
		if (leaf) {
			workspace.revealLeaf(leaf);
		}
	}
	
}
