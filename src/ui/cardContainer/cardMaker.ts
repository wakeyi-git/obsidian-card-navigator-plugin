import { Menu, TFile, MarkdownRenderer } from 'obsidian';
import CardNavigatorPlugin from '../../main';
import { Card } from '../../common/types';
import { sortFiles, separateFrontmatterAndContent } from '../../common/utils';

export class CardMaker {
    constructor(private plugin: CardNavigatorPlugin) {}

    // Get cards for the active file's folder
    async getCardsForActiveFile(activeFile: TFile): Promise<Card[]> {
        const folder = activeFile.parent;
        if (!folder) {
            return [];
        }
        const files = folder.children.filter((file): file is TFile => file instanceof TFile);
        const sortedFiles = sortFiles(
            files, 
            this.plugin.settings.sortCriterion, 
            this.plugin.settings.sortOrder
        );
        return await Promise.all(sortedFiles.map(file => this.createCard(file)));
    }

    // Create a card object from a file
	public async createCard(file: TFile): Promise<Card> {
		try {
			const content = await this.plugin.app.vault.cachedRead(file);
			const { cleanContent } = separateFrontmatterAndContent(content);
			const contentWithoutHeader = this.removeFirstHeader(cleanContent);
	
			return {
				file,
				fileName: this.plugin.settings.showFileName ? file.basename : undefined,
				firstHeader: this.plugin.settings.showFirstHeader ? this.findFirstHeader(cleanContent) : undefined,
				content: this.plugin.settings.showContent ? this.truncateContent(contentWithoutHeader) : undefined,
			};
		} catch (error) {
			console.error(`Failed to create card for file ${file.path}:`, error);
			throw error;
		}
	}

    // Remove the first header from the content
    private removeFirstHeader(content: string): string {
        const headerRegex = /^#+\s+(.+)$/m;
        return content.replace(headerRegex, '').trim();
    }

    // Find the first header in the content
    private findFirstHeader(content: string): string | undefined {
        const headerRegex = /^#+\s+(.+)$/m;
        const match = content.match(headerRegex);
        return match ? match[1].trim() : undefined;
    }

    // Truncate content to the specified length
    private truncateContent(content: string): string {
        const maxLength = this.plugin.settings.contentLength;
        return content.length <= maxLength ? content : content.slice(0, maxLength) + '...';
    }

    // Create an HTML element for a card
    createCardElement(card: Card): HTMLElement {
        const cardElement = document.createElement('div');
        cardElement.className = 'card-navigator-card';

        if (this.plugin.settings.showFileName && card.fileName) {
            const fileNameEl = cardElement.createEl('h3', { text: card.fileName });
            fileNameEl.className = 'card-navigator-filename';
            fileNameEl.style.setProperty('--file-name-font-size', `${this.plugin.settings.fileNameSize}px`);
        }

        if (this.plugin.settings.showFirstHeader && card.firstHeader) {
            const headerEl = cardElement.createEl('h4', { text: card.firstHeader });
            headerEl.className = 'card-navigator-first-header';
            headerEl.style.setProperty('--first-header-font-size', `${this.plugin.settings.firstHeaderSize}px`);
        }

        if (this.plugin.settings.showContent && card.content) {
            const contentEl = cardElement.createEl('div', { cls: 'card-navigator-content' });
            contentEl.style.setProperty('--content-font-size', `${this.plugin.settings.contentSize}px`);
        
            if (this.plugin.settings.renderContentAsHtml) {
                MarkdownRenderer.render(
                    this.plugin.app,
                    card.content,
                    contentEl,
                    card.file.path,
                    this.plugin
                );
            } else {
                contentEl.textContent = card.content;
                contentEl.addClass('ellipsis');
            }
        }

        if (this.plugin.app.workspace.getActiveFile() === card.file) {
            cardElement.addClass('card-navigator-active');
        }

        // Set up card interactions
        this.addCardInteractions(cardElement, card);

        return cardElement;
    }

    // Add interactions to the card element
    private addCardInteractions(cardElement: HTMLElement, card: Card) {
        cardElement.addEventListener('click', () => this.openFile(card.file));
        this.setupDragAndDrop(cardElement, card);
        this.setupContextMenu(cardElement, card.file);
    }

    // Set up drag and drop functionality for the card
    private setupDragAndDrop(cardElement: HTMLElement, card: Card) {
        cardElement.setAttribute('draggable', 'true');
        cardElement.addEventListener('dragstart', (event) => {
            if (event.dataTransfer) {
                let dragContent = '';

                if (this.plugin.settings.dragDropContent) {
                    if (this.plugin.settings.showFileName && card.fileName) {
                        dragContent += `## ${card.fileName}\n\n`;
                    }

                    if (this.plugin.settings.showFirstHeader && card.firstHeader) {
                        dragContent += `# ${card.firstHeader}\n\n`;
                    }

                    if (this.plugin.settings.showContent && card.content) {
                        dragContent += `${card.content}\n\n`;
                    }

                    if (dragContent === '') {
                        dragContent = `[[${card.file.name}]]`;
                    }
                } else {
                    dragContent = `[[${card.file.name}]]`;
                }

                event.dataTransfer.setData('text/plain', dragContent.trim());
                event.dataTransfer.setDragImage(cardElement, 0, 0);
            }
        });
    }

    // Set up context menu for the card
    private setupContextMenu(cardElement: HTMLElement, file: TFile) {
        cardElement.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            const menu = new Menu();
            this.plugin.app.workspace.trigger('file-menu', menu, file, 'more-options');
            menu.showAtPosition({ x: e.clientX, y: e.clientY });
        });
    }

    // Open the file associated with the card
    private openFile(file: TFile) {
        this.plugin.app.workspace.getLeaf().openFile(file);
    }
}
