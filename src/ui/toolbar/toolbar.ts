import { setIcon, TFolder, debounce } from 'obsidian';
import CardNavigatorPlugin from '../../main';
import { CardNavigator } from '../cardNavigator';
import { FolderSuggestModal } from './toolbarActions';
import { toggleSort, toggleSettings } from './toolbarActions';
import { t } from 'i18next';

export class Toolbar {
    private containerEl: HTMLElement | null = null;
    private isVertical = false;

    constructor(private plugin: CardNavigatorPlugin) {}

    // Initializes the toolbar with the given container element
    initialize(containerEl: HTMLElement) {
        this.containerEl = containerEl;
        this.createToolbar();
    }

    // Creates the toolbar UI elements
    private createToolbar() {
        if (!this.containerEl) return;

        this.containerEl.empty();

        const toolbarContainer = this.containerEl.createDiv('card-navigator-toolbar-container');

        toolbarContainer.appendChild(this.createSearchContainer());
        toolbarContainer.appendChild(this.createSeparator());
        toolbarContainer.appendChild(this.createActionIconsContainer());
    }

    // Creates the search input container
    private createSearchContainer(): HTMLElement {
        const container = createDiv('card-navigator-search-container');

        const input = container.createEl('input', {
            type: 'text',
            placeholder: t('Search...'),
            cls: 'card-navigator-search-input'
        });

        // Adds event listener to handle search input with debounce
        input.addEventListener('input', debounce(async (e: Event) => {
            const searchTerm = (e.target as HTMLInputElement).value;
            const view = this.plugin.app.workspace.getActiveViewOfType(CardNavigator);
            if (view) {
                await view.cardContainer.searchCards(searchTerm);
            }
        }, 300));

        return container;
    }

    // Creates the container for action icons (folder select, sort, settings)
    private createActionIconsContainer(): HTMLElement {
        const container = createDiv('card-navigator-action-icons-container');

        const icons = [
            { name: 'folder', label: t('Select folder'), action: () => this.openFolderSelector() },
            { name: 'arrow-up-narrow-wide', label: t('Sort cards'), action: () => toggleSort(this.plugin) },
            { name: 'settings', label: t('Settings'), action: () => toggleSettings(this.plugin) },
        ] as const;

        // Iterates over icon definitions to create toolbar icons
        icons.forEach(icon => {
            const iconElement = this.createToolbarIcon(icon.name, icon.label, icon.action);
            if (icon.name === 'arrow-up-narrow-wide') {
                iconElement.classList.toggle('active', 
                    this.plugin.settings.sortCriterion !== 'fileName' || 
                    this.plugin.settings.sortOrder !== 'asc'
                );
            }
            container.appendChild(iconElement);
        });

        return container;
    }

    // Helper function to create individual toolbar icons
    private createToolbarIcon(iconName: string, ariaLabel: string, action: (e: MouseEvent) => void): HTMLElement {
        const icon = createDiv('clickable-icon');
        icon.ariaLabel = ariaLabel;

        setIcon(icon, iconName);
        icon.addEventListener('click', action);

        return icon;
    }
    
    // Creates a separator element for the toolbar
    private createSeparator(): HTMLElement {
        return createDiv('toolbar-separator');
    }

    // Opens a folder selector modal and displays cards for the selected folder
    public openFolderSelector() {
        new FolderSuggestModal(this.plugin, (folder: TFolder) => {
            const view = this.plugin.app.workspace.getActiveViewOfType(CardNavigator);
            if (view) {
                view.cardContainer.displayCardsForFolder(folder);
            }
        }).open();
    }

    // Refreshes the toolbar (to be implemented if needed)
    refresh() {
        // Implement refresh logic if necessary
    }

    // Cleans up resources when the toolbar is closed
    onClose() {
        // Cleanup toolbar-related resources
    }
}
