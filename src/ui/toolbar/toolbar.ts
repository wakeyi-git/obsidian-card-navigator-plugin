import { setIcon, TFolder, FuzzySuggestModal, debounce } from 'obsidian';
import CardNavigatorPlugin from '../../main';
import { CardNavigatorView } from '../cardNavigatorView';
import { toggleSort, toggleSettings, debouncedSearch } from './toolbarActions';
import { t } from 'i18next';

// Class representing the toolbar for the Card Navigator plugin
export class Toolbar {
    private containerEl: HTMLElement | null = null;
    private settingsPopupOpen = false;
    private settingsIcon: HTMLElement | null = null;
    private popupObserver: MutationObserver | null = null;

    constructor(private plugin: CardNavigatorPlugin) {}

    // Initializes the toolbar with the given container element
    initialize(containerEl: HTMLElement) {
        this.containerEl = containerEl;
        this.createToolbar();
        this.setupPopupObserver();
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
            placeholder: t('SEARCH_PLACEHOLDER'),
            cls: 'card-navigator-search-input'
        });

        // 검색 중 로딩 표시를 위한 스피너
        const spinner = container.createDiv('search-spinner');
        spinner.hide();

        // 검색 입력 처리
        input.addEventListener('input', (e: Event) => {
            const searchTerm = (e.target as HTMLInputElement).value;
            if (this.containerEl) {
                debouncedSearch(searchTerm, this.plugin, this.containerEl);
            }
        });

        // ESC 키로 검색어 초기화
        input.addEventListener('keydown', (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                input.value = '';
                if (this.containerEl) {
                    debouncedSearch('', this.plugin, this.containerEl);
                }
            }
        });

        return container;
    }

	// Creates a separator element for the toolbar
	private createSeparator(): HTMLElement {
		return createDiv('toolbar-separator');
	}

	// Creates the container for action icons (folder select, sort, settings)
	private createActionIconsContainer(): HTMLElement {
		const container = createDiv('card-navigator-action-icons-container');
	
		const icons = [
			{ name: 'folder', label: t('SELECT_FOLDER'), action: () => this.openFolderSelector() },
			{ name: 'arrow-up-narrow-wide', label: t('SORT_CARDS'), action: () => toggleSort(this.plugin, this.containerEl) },
			{ name: 'settings', label: t('SETTINGS'), action: () => this.toggleSettingsPopup() },
		] as const;
	
		// Iterates over icon definitions to create toolbar icons
		icons.forEach(icon => {
			const iconElement = this.createToolbarIcon(icon.name, icon.label, icon.action);
			if (icon.name === 'settings') {
				this.settingsIcon = iconElement;
			}
			container.appendChild(iconElement);
		});
	
		return container;
	}

    // Helper function to create individual toolbar icons
    private createToolbarIcon(iconName: string, ariaLabel: string, action: () => void): HTMLElement {
        const icon = createDiv('clickable-icon');
        icon.ariaLabel = ariaLabel;
        
        // 정렬 아이콘인 경우 추가 클래스 부여
        if (iconName === 'arrow-up-narrow-wide') {
            icon.addClass('card-navigator-sort-button');
        }
    
        setIcon(icon, iconName);
        icon.addEventListener('click', () => action());
    
        return icon;
    }

    // Opens a folder selector modal and displays cards for the selected folder
    public openFolderSelector() {
        new FolderSuggestModal(this.plugin, (folder: TFolder) => {
            const view = this.plugin.app.workspace.getActiveViewOfType(CardNavigatorView);
            if (view) {
                view.cardContainer.displayCardsForFolder(folder);
            }
        }).open();
    }

    // Toggles the settings popup
    private toggleSettingsPopup() {
        if (this.settingsPopupOpen) {
            this.closeSettingsPopup();
        } else {
            this.openSettingsPopup();
        }
        this.updateIconStates();
    }

    // Opens the settings popup
    private openSettingsPopup() {
        this.settingsPopupOpen = true;
        toggleSettings(this.plugin, this.containerEl);
    }

    // Closes the settings popup
    private closeSettingsPopup() {
        this.settingsPopupOpen = false;
        const settingsPopup = this.containerEl?.querySelector('.card-navigator-settings-popup');
        if (settingsPopup) {
            settingsPopup.remove();
        }
    }

    // Updates the visual state of the icons based on popup open states
    private updateIconStates() {
        if (this.settingsIcon) {
            this.settingsIcon.classList.toggle('card-navigator-icon-active', this.settingsPopupOpen);
        }
    }

    // Sets up an observer to watch for popup removals
    private setupPopupObserver() {
        if (!this.containerEl) return;

        this.popupObserver = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    mutation.removedNodes.forEach((node) => {
                        if (node instanceof HTMLElement) {
                            if (node.classList.contains('card-navigator-settings-popup')) {
                                this.settingsPopupOpen = false;
                                this.updateIconStates();
                            }
                        }
                    });
                }
            });
        });

        this.popupObserver.observe(this.containerEl, { childList: true, subtree: true });
    }

    // Refreshes the toolbar (to be implemented if needed)
    refresh() {
        // Implement refresh logic if necessary
    }

    // Cleans up resources when the toolbar is closed
    onClose() {
        if (this.popupObserver) {
            this.popupObserver.disconnect();
        }
    }
}

// Modal for selecting folders in the toolbar
class FolderSuggestModal extends FuzzySuggestModal<TFolder> {
    constructor(private plugin: CardNavigatorPlugin, private onSelect: (folder: TFolder) => void) {
        super(plugin.app);
    }

    // Retrieve all folders in the vault
    getItems(): TFolder[] {
        return this.plugin.app.vault.getAllLoadedFiles()
            .filter((file): file is TFolder => file instanceof TFolder);
    }

    // Display the folder path as the item text
    getItemText(folder: TFolder): string {
        return folder.path;
    }

    // Handle folder selection
    onChooseItem(folder: TFolder): void {
        this.onSelect(folder);
    }
}
