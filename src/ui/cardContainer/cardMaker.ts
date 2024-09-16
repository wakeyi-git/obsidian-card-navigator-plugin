import { Menu, TFile, MarkdownRenderer } from 'obsidian';
import CardNavigatorPlugin from 'main';
import { Card } from 'common/types';
import { sortFiles, separateFrontmatterAndBody } from 'common/utils';
import { t } from 'i18next';

// Class responsible for creating and managing card elements
export class CardMaker {
	constructor(
		private plugin: CardNavigatorPlugin,
		private copyLinkCallback: (file: TFile) => void,
		private copyContentCallback: (file: TFile) => void
	) {}

    // Retrieve and create cards for all markdown files in the folder of the active file
    async getCardsForActiveFile(activeFile: TFile): Promise<Card[]> {
        const folder = activeFile.parent;
        if (!folder) {
            return [];
        }
        // Filter markdown files and sort them based on plugin settings
        const files = folder.children.filter((file): file is TFile => file instanceof TFile && file.extension === 'md');
        const sortedFiles = sortFiles(
            files, 
            this.plugin.settings.sortCriterion, 
            this.plugin.settings.sortOrder
        );
        return Promise.all(sortedFiles.map(file => this.createCard(file)));
    }

    // Create a card object from the file content
	public async createCard(file: TFile): Promise<Card> {
		try {
			const content = await this.plugin.app.vault.cachedRead(file);
			const { cleanBody } = separateFrontmatterAndBody(content); // Remove frontmatter from body
			const bodyWithoutHeader = this.removeFirstHeader(cleanBody); // Remove first header from body
    
			return {
				file,
				fileName: this.plugin.settings.showFileName ? file.basename : undefined,
				firstHeader: this.plugin.settings.showFirstHeader ? this.findFirstHeader(cleanBody) : undefined,
				body: this.plugin.settings.showBody ? this.truncateBody(bodyWithoutHeader) : undefined,
			};
		} catch (error) {
			console.error(`Failed to create card for file ${file.path}:`, error);
			throw error;
		}
	}

    // Remove the first header found in the body
    private removeFirstHeader(body: string): string {
        const headerRegex = /^#+\s+(.+)$/m;
        return body.replace(headerRegex, '').trim();
    }

    // Find the first header in the body, if any
    private findFirstHeader(body: string): string | undefined {
        const headerRegex = /^#+\s+(.+)$/m;
        const match = body.match(headerRegex);
        return match ? match[1].trim() : undefined;
    }

    // Truncate the body based on plugin settings
	private truncateBody(body: string): string {
		if (!this.plugin.settings.bodyLengthLimit) {
			return body;
		}
		const maxLength = this.plugin.settings.bodyLength;
		return body.length <= maxLength ? body : `${body.slice(0, maxLength)}...`;
	}

    // Create the card element and add it to the DOM
	createCardElement(card: Card): HTMLElement {
		const cardElement = document.createElement('div');
		cardElement.className = 'card-navigator-card';
	
		// Add file name if enabled in settings
		if (this.plugin.settings.showFileName && card.fileName) {
			const fileNameEl = cardElement.createEl('h3', { text: card.fileName, cls: 'card-navigator-filename' });
			fileNameEl.style.setProperty('--file-name-font-size', `${this.plugin.settings.fileNameFontSize}px`);
		}
	
		// Add first header if enabled in settings
		if (this.plugin.settings.showFirstHeader && card.firstHeader) {
			const headerEl = cardElement.createEl('h4', { text: card.firstHeader, cls: 'card-navigator-first-header' });
			headerEl.style.setProperty('--first-header-font-size', `${this.plugin.settings.firstHeaderFontSize}px`);
		}
	
		// Add body if enabled in settings
		if (this.plugin.settings.showBody && card.body) {
			const contentEl = cardElement.createEl('div', { cls: 'card-navigator-body' });
			contentEl.style.setProperty('--body-font-size', `${this.plugin.settings.bodyFontSize}px`);
		
			if (this.plugin.settings.renderContentAsHtml) {
				// Render content as HTML if enabled
				MarkdownRenderer.render(
					this.plugin.app,
					card.body,
					contentEl,
					card.file.path,
					this.plugin
				);
			} else {
				// Render content as plain text
				contentEl.textContent = card.body;
				contentEl.addClass('ellipsis');
			}
		}
	
		this.addCardInteractions(cardElement, card);
	
		return cardElement;
	}

    // Add interactions such as click, drag and drop, and context menu to the card element
    private addCardInteractions(cardElement: HTMLElement, card: Card) {
        cardElement.addEventListener('click', () => this.openFile(card.file));
        this.setupDragAndDrop(cardElement, card);
        this.setupContextMenu(cardElement, card.file);
    }

    // Setup drag and drop functionality for the card element
    private setupDragAndDrop(cardElement: HTMLElement, card: Card) {
        cardElement.setAttribute('draggable', 'true');
        cardElement.addEventListener('dragstart', (event: DragEvent) => {
            if (event.dataTransfer) {
                const dragContent = this.getDragContent(card);
                event.dataTransfer.setData('text/plain', dragContent);
                event.dataTransfer.setDragImage(cardElement, 0, 0);
            }
        });
    }

    // Determine the content to be dragged based on plugin settings
	private getDragContent(card: Card): string {
		if (this.plugin.settings.dragDropContent) {
			let content = '';
			if (this.plugin.settings.showFileName && card.fileName) {
				content += `## ${card.fileName}\n\n`;
			}
			if (this.plugin.settings.showFirstHeader && card.firstHeader) {
				content += `# ${card.firstHeader}\n\n`;
			}
			if (this.plugin.settings.showBody && card.body) {
				content += `${card.body}\n\n`;
			}
			return content.trim() || this.plugin.app.fileManager.generateMarkdownLink(card.file, '');
		}
		return this.plugin.app.fileManager.generateMarkdownLink(card.file, ''); // Default to file link
	}

    // Setup context menu for the card element with additional options
	private setupContextMenu(cardElement: HTMLElement, file: TFile) {
		cardElement.addEventListener('contextmenu', (e: MouseEvent) => {
			e.preventDefault();
			const menu = new Menu();

			// Add Obsidian's default file menu options
			this.plugin.app.workspace.trigger('file-menu', menu, file, 'more-options');

			// Add separator in the context menu
			menu.addSeparator();

			// Add option to copy link
			menu.addItem((item) => {
				item
					.setTitle(t('Copy as Link'))
					.setIcon('link')
					.onClick(() => {
						this.copyLinkCallback(file);
					});
			});

			// Add option to copy card content
			menu.addItem((item) => {
				item
					.setTitle(t('Copy Card Content'))
					.setIcon('file-text')
					.onClick(() => {
						this.copyContentCallback(file);
					});
			});

			menu.showAtPosition({ x: e.clientX, y: e.clientY });
		});
	}

    // Open the file in a new workspace leaf
    private openFile(file: TFile) {
        this.plugin.app.workspace.getLeaf().openFile(file);
    }
}
