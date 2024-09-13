import { Menu, TFile, MarkdownRenderer, Notice } from 'obsidian';
import CardNavigatorPlugin from 'main';
import { Card } from 'common/types';
import { sortFiles, separateFrontmatterAndContent } from 'common/utils';
import { t } from 'i18next';

export class CardMaker {
    constructor(private plugin: CardNavigatorPlugin) {}

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

    // Create a card from the file content
    public async createCard(file: TFile): Promise<Card> {
        try {
            const content = await this.plugin.app.vault.cachedRead(file);
            const { cleanContent } = separateFrontmatterAndContent(content); // Remove frontmatter from content
            const contentWithoutHeader = this.removeFirstHeader(cleanContent); // Remove first header from content
    
            return {
                file,
                fileName: this.plugin.settings.showFileName ? file.basename : undefined, // Show file name if enabled
                firstHeader: this.plugin.settings.showFirstHeader ? this.findFirstHeader(cleanContent) : undefined, // Show first header if enabled
                content: this.plugin.settings.showContent ? this.truncateContent(contentWithoutHeader) : undefined, // Show truncated content if enabled
            };
        } catch (error) {
            console.error(`Failed to create card for file ${file.path}:`, error);
            throw error;
        }
    }

    // Remove the first header found in the content
    private removeFirstHeader(content: string): string {
        const headerRegex = /^#+\s+(.+)$/m;
        return content.replace(headerRegex, '').trim();
    }

    // Find the first header in the content, if any
    private findFirstHeader(content: string): string | undefined {
        const headerRegex = /^#+\s+(.+)$/m;
        const match = content.match(headerRegex);
        return match ? match[1].trim() : undefined;
    }

    // Truncate the content based on plugin settings
	private truncateContent(content: string): string {
		if (this.plugin.settings.isContentLengthUnlimited) {
			return content;
		}
		const maxLength = this.plugin.settings.contentLength;
		return content.length <= maxLength ? content : `${content.slice(0, maxLength)}...`;
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
	
		// Add content if enabled in settings
		if (this.plugin.settings.showContent && card.content) {
			const contentEl = cardElement.createEl('div', { cls: 'card-navigator-content' });
			contentEl.style.setProperty('--content-font-size', `${this.plugin.settings.contentFontSize}px`);
		
			if (this.plugin.settings.renderContentAsHtml) {
				// Render content as HTML if enabled
				MarkdownRenderer.render(
					this.plugin.app,
					card.content,
					contentEl,
					card.file.path,
					this.plugin
				);
			} else {
				// Render content as plain text
				contentEl.textContent = card.content;
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
                const dragContent = this.getDragContent(card); // Get the content to be dragged
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
            if (this.plugin.settings.showContent && card.content) {
                content += `${card.content}\n\n`;
            }
            return content.trim() || `[[${card.file.name}]]`;
        }
        return `[[${card.file.name}]]`; // Default to file link
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
                        this.copyLink(file);
                    });
            });

            // Add option to copy card content
            menu.addItem((item) => {
                item
                    .setTitle(t('Copy Card Content'))
                    .setIcon('file-text')
                    .onClick(() => {
                        this.copyCardContent(file);
                    });
            });

            menu.showAtPosition({ x: e.clientX, y: e.clientY });
        });
    }

    // Copy the file link to clipboard
    public copyLink(file: TFile) {
        const link = `[[${file.basename}]]`;
        navigator.clipboard.writeText(link).then(() => {
            new Notice(t('Link copied to clipboard'));
        }).catch(err => {
            console.error(t('Failed to copy link: '), err);
            new Notice(t('Failed to copy link'));
        });
    }
    

    // Copy the card content to clipboard
    public async copyCardContent(file: TFile) {
        try {
            const content = await this.plugin.app.vault.read(file);
            const { cleanContent } = separateFrontmatterAndContent(content); // Remove frontmatter
            const truncatedContent = this.truncateContent(cleanContent); // Truncate the content
            await navigator.clipboard.writeText(truncatedContent);
			new Notice(t('Card content copied to clipboard'));
        } catch (err) {
			console.error(t('Failed to copy card content: '), err);
			new Notice(t('Failed to copy card content'));
        }
    }

    // Open the file in a new workspace leaf
    private openFile(file: TFile) {
        this.plugin.app.workspace.getLeaf().openFile(file);
    }
}
