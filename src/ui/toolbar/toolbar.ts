// src/ui/toolbar/toolbar.ts

import { setIcon, TFolder } from 'obsidian';
import CardNavigatorPlugin from '../../main';
import { CardNavigator } from '../cardNavigator';
import { FolderSuggestModal } from './toolbarActions';
import { moveCards, toggleSearch, toggleSort, toggleSettings } from './toolbarActions';

export class Toolbar {
    private containerEl: HTMLElement | undefined = undefined;
	private isVertical: boolean;

    constructor(private plugin: CardNavigatorPlugin) {
		this.isVertical = false;
	}

    initialize(containerEl: HTMLElement) {
        this.containerEl = containerEl;
        this.createToolbar();
    }

	setOrientation(isVertical: boolean) {
        if (this.isVertical !== isVertical) {
            this.isVertical = isVertical;
            this.updateToolbarStyle();
            this.createToolbar();
        }
    }

	private updateToolbarStyle() {
        if (this.containerEl) {
            this.containerEl.classList.toggle('vertical', this.isVertical);
            this.containerEl.classList.toggle('horizontal', !this.isVertical);
        }
    }

    private createToolbar() {
        if (!this.containerEl) {
            return;
        }

        this.containerEl.empty();

        const toolbarContainer = document.createElement('div');
        toolbarContainer.className = 'card-navigator-toolbar-container';

        const moveIconsContainer = this.isVertical ? this.createVerticalMoveIconsContainer() : this.createHorizontalMoveIconsContainer();
        const separator = this.createSeparator();
        const actionIconsContainer = this.createActionIconsContainer();

        toolbarContainer.appendChild(moveIconsContainer);
        toolbarContainer.appendChild(separator);
        toolbarContainer.appendChild(actionIconsContainer);

        this.containerEl.appendChild(toolbarContainer);
    }

    private getMode(): 'vertical' | 'horizontal' {
        const view = this.plugin.app.workspace.getLeavesOfType('card-navigator-view')[0].view;
        return view.containerEl.clientHeight > view.containerEl.clientWidth ? 'vertical' : 'horizontal';
    }

    private createVerticalMoveIconsContainer(): HTMLElement {
        const container = document.createElement('div');
        container.className = 'card-navigator-move-icons-container';

        const icons = [
            { name: 'chevrons-up', label: 'Move up multiple', action: () => moveCards('up', this.plugin, 'multiple') },
            { name: 'chevron-up', label: 'Move up single', action: () => moveCards('up', this.plugin, 'single') },
            { name: 'chevrons-down-up', label: 'Center active card', action: () => moveCards('center', this.plugin) },
            { name: 'chevron-down', label: 'Move down single', action: () => moveCards('down', this.plugin, 'single') },
            { name: 'chevrons-down', label: 'Move down multiple', action: () => moveCards('down', this.plugin, 'multiple') },
        ];

        icons.forEach(icon => {
            const iconElement = this.createToolbarIcon(icon.name, icon.label, icon.action);
            container.appendChild(iconElement);
        });

        return container;
    }

    private createHorizontalMoveIconsContainer(): HTMLElement {
        const container = document.createElement('div');
        container.className = 'card-navigator-move-icons-container';

        const icons = [
            { name: 'chevrons-left', label: 'Move left multiple', action: () => moveCards('left', this.plugin, 'multiple') },
            { name: 'chevron-left', label: 'Move left single', action: () => moveCards('left', this.plugin, 'single') },
            { name: 'chevrons-right-left', label: 'Center active card', action: () => moveCards('center', this.plugin) },
            { name: 'chevron-right', label: 'Move right single', action: () => moveCards('right', this.plugin, 'single') },
            { name: 'chevrons-right', label: 'Move right multiple', action: () => moveCards('right', this.plugin, 'multiple') },
        ];

        icons.forEach(icon => {
            const iconElement = this.createToolbarIcon(icon.name, icon.label, icon.action);
            container.appendChild(iconElement);
        });

        return container;
    }

    private createActionIconsContainer(): HTMLElement {
        const container = document.createElement('div');
        container.className = 'card-navigator-action-icons-container';

        const icons = [
            { name: 'search', label: 'Search', action: () => toggleSearch(this.plugin) },
			{ name: 'folder', label: 'Select folder', action: () => this.openFolderSelector() },
            { name: 'arrow-up-narrow-wide', label: 'Sort cards', action: () => toggleSort(this.plugin) },
            { name: 'settings', label: 'Settings', action: () => toggleSettings(this.plugin) },
        ];

        icons.forEach(icon => {
            const iconElement = this.createToolbarIcon(icon.name, icon.label, icon.action);
            container.appendChild(iconElement);
        });

        return container;
    }

    private createSeparator(): HTMLElement {
        const separator = document.createElement('div');
        separator.className = 'toolbar-separator';
        return separator;
    }

    private createToolbarIcon(iconName: string, ariaLabel: string, action: () => void): HTMLElement {
        const icon = document.createElement('div');
        icon.className = 'clickable-icon';
        icon.setAttribute('aria-label', ariaLabel);

        setIcon(icon, iconName);
        icon.addEventListener('click', action);

        return icon;
    }
	
	public openFolderSelector() {
		new FolderSuggestModal(this.plugin, (folder: TFolder) => {
			const view = this.plugin.app.workspace.getActiveViewOfType(CardNavigator);
			if (view) {
				view.cardContainer.displayCardsForFolder(folder);
			}
		}).open();
	}

    refresh() {
        // Implement refresh logic if necessary
    }

    onClose() {
        // Cleanup toolbar-related resources
    }
}
