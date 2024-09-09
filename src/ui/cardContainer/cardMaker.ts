//src/ui/cardContainer/cardMaker.ts

import { Menu, TFile, MarkdownRenderer, Notice } from 'obsidian';
import CardNavigatorPlugin from 'main';
import { Card } from 'common/types';
import { sortFiles, separateFrontmatterAndContent } from 'common/utils';
import { t } from 'i18next';

export class CardMaker {
    constructor(private plugin: CardNavigatorPlugin) {}

    async getCardsForActiveFile(activeFile: TFile): Promise<Card[]> {
        const folder = activeFile.parent;
        if (!folder) {
            return [];
        }
        const files = folder.children.filter((file): file is TFile => file instanceof TFile && file.extension === 'md');
        const sortedFiles = sortFiles(
            files, 
            this.plugin.settings.sortCriterion, 
            this.plugin.settings.sortOrder
        );
        return Promise.all(sortedFiles.map(file => this.createCard(file)));
    }

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

    private removeFirstHeader(content: string): string {
        const headerRegex = /^#+\s+(.+)$/m;
        return content.replace(headerRegex, '').trim();
    }

    private findFirstHeader(content: string): string | undefined {
        const headerRegex = /^#+\s+(.+)$/m;
        const match = content.match(headerRegex);
        return match ? match[1].trim() : undefined;
    }

	private truncateContent(content: string): string {
		if (this.plugin.settings.isContentLengthUnlimited) {
			return content;
		}
		const maxLength = this.plugin.settings.contentLength;
		return content.length <= maxLength ? content : `${content.slice(0, maxLength)}...`;
	}

	createCardElement(card: Card): HTMLElement {
		const cardElement = document.createElement('div');
		cardElement.className = 'card-navigator-card';
	
		if (this.plugin.settings.showFileName && card.fileName) {
			const fileNameEl = cardElement.createEl('h3', { text: card.fileName, cls: 'card-navigator-filename' });
			fileNameEl.style.setProperty('--file-name-font-size', `${this.plugin.settings.fileNameFontSize}px`);
		}
	
		if (this.plugin.settings.showFirstHeader && card.firstHeader) {
			const headerEl = cardElement.createEl('h4', { text: card.firstHeader, cls: 'card-navigator-first-header' });
			headerEl.style.setProperty('--first-header-font-size', `${this.plugin.settings.firstHeaderFontSize}px`);
		}
	
		if (this.plugin.settings.showContent && card.content) {
			const contentEl = cardElement.createEl('div', { cls: 'card-navigator-content' });
			contentEl.style.setProperty('--content-font-size', `${this.plugin.settings.contentFontSize}px`);
		
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
	
		this.addCardInteractions(cardElement, card);
	
		return cardElement;
	}

    private addCardInteractions(cardElement: HTMLElement, card: Card) {
        cardElement.addEventListener('click', () => this.openFile(card.file));
        this.setupDragAndDrop(cardElement, card);
        this.setupContextMenu(cardElement, card.file);
    }

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
        return `[[${card.file.name}]]`;
    }

    private setupContextMenu(cardElement: HTMLElement, file: TFile) {
        cardElement.addEventListener('contextmenu', (e: MouseEvent) => {
            e.preventDefault();
            const menu = new Menu();

            // 기존 옵시디언 파일 메뉴 항목 추가
            this.plugin.app.workspace.trigger('file-menu', menu, file, 'more-options');

            // 구분선 추가
            menu.addSeparator();

            // 링크 복사 메뉴 항목 추가
            menu.addItem((item) => {
                item
                    .setTitle(t('Copy as Link'))
                    .setIcon('link')
                    .onClick(() => {
                        this.copyLink(file);
                    });
            });

            // 카드 내용 복사 메뉴 항목 추가
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

    public copyLink(file: TFile) {
        const link = this.plugin.app.fileManager.generateMarkdownLink(file, '');
        navigator.clipboard.writeText(link).then(() => {
			new Notice(t('Link copied to clipboard'));
        }).catch(err => {
			console.error(t('Failed to copy link: '), err);
			new Notice(t('Failed to copy link'));
        });
    }

    public async copyCardContent(file: TFile) {
        try {
            const content = await this.plugin.app.vault.read(file);
            const { cleanContent } = separateFrontmatterAndContent(content);
            const truncatedContent = this.truncateContent(cleanContent);
            await navigator.clipboard.writeText(truncatedContent);
			new Notice(t('Card content copied to clipboard'));
        } catch (err) {
			console.error(t('Failed to copy card content: '), err);
			new Notice(t('Failed to copy card content'));
        }
    }

    private openFile(file: TFile) {
        this.plugin.app.workspace.getLeaf().openFile(file);
    }
}
