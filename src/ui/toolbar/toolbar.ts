import { setIcon, TFolder, debounce } from 'obsidian';
import CardNavigatorPlugin from '../../main';
import { CardNavigator } from '../cardNavigator';
import { FolderSuggestModal } from './toolbarActions';
import { toggleSort, toggleSettings } from './toolbarActions';
import { t } from 'i18next';

export class Toolbar {
    private containerEl: HTMLElement | undefined = undefined;
    private isVertical: boolean;

    constructor(private plugin: CardNavigatorPlugin) {
        this.isVertical = false;
    }

    // Initialize the toolbar
    initialize(containerEl: HTMLElement) {
        this.containerEl = containerEl;
        this.createToolbar();
    }

    // Set the orientation of the toolbar
    setOrientation(isVertical: boolean) {
        if (this.isVertical !== isVertical) {
            this.isVertical = isVertical;
            this.updateToolbarStyle();
            this.createToolbar();
        }
    }

    // Update toolbar style based on orientation
    private updateToolbarStyle() {
        if (this.containerEl) {
            this.containerEl.classList.toggle('vertical', this.isVertical);
            this.containerEl.classList.toggle('horizontal', !this.isVertical);
        }
    }

    // Create the main toolbar structure
    private createToolbar() {
        if (!this.containerEl) {
            return;
        }

        this.containerEl.empty();

        const toolbarContainer = document.createElement('div');
        toolbarContainer.className = 'card-navigator-toolbar-container';

        const searchContainer = this.createSearchContainer();
        const separator = this.createSeparator();
        const actionIconsContainer = this.createActionIconsContainer();

        toolbarContainer.appendChild(searchContainer);
        toolbarContainer.appendChild(separator);
        toolbarContainer.appendChild(actionIconsContainer);

        this.containerEl.appendChild(toolbarContainer);
    }

    // Create the search container with input field
    private createSearchContainer(): HTMLElement {
        const container = document.createElement('div');
        container.className = 'card-navigator-search-container';

        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = 'Search...';
        input.className = 'card-navigator-search-input';

        input.addEventListener('input', debounce(async (e: Event) => {
            const searchTerm = (e.target as HTMLInputElement).value;
            const view = this.plugin.app.workspace.getLeavesOfType('card-navigator-view')[0].view as CardNavigator;
            await view.cardContainer.searchCards(searchTerm);
        }, 300));

        container.appendChild(input);
        return container;
    }

    // Create the container for action icons
    private createActionIconsContainer(): HTMLElement {
        const container = document.createElement('div');
        container.className = 'card-navigator-action-icons-container';

        const icons = [
            { name: 'folder', label: t('Select folder'), action: () => this.openFolderSelector() },
            { name: 'arrow-up-narrow-wide', label: t('Sort cards'), action: () => toggleSort(this.plugin) },
            { name: 'settings', label: t('Settings'), action: () => toggleSettings(this.plugin) },
        ];

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

    // Create a toolbar icon
    private createToolbarIcon(iconName: string, ariaLabel: string, action: (e: MouseEvent) => void): HTMLElement {
        const icon = document.createElement('div');
        icon.className = 'clickable-icon';
        icon.setAttribute('aria-label', ariaLabel);

        setIcon(icon, iconName);
        icon.addEventListener('click', action);

        return icon;
    }
    
    // Create a separator element
    private createSeparator(): HTMLElement {
        const separator = document.createElement('div');
        separator.className = 'toolbar-separator';
        return separator;
    }

    // Open the folder selector modal
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
