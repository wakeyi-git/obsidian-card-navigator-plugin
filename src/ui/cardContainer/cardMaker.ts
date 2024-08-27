// src/ui/cardContainer/cardMaker.ts

import { Menu, TFile, MarkdownRenderer } from 'obsidian';
import CardNavigatorPlugin from '../../main';
import { Card } from '../../common/types';
import { sortFiles, separateFrontmatterAndContent } from '../../common/utils';

export class CardMaker {
    constructor(private plugin: CardNavigatorPlugin) {}

    async getCardsForActiveFile(activeFile: TFile): Promise<Card[]> {
        const folder = activeFile.parent;
        if (!folder) {
            return [];
        }

        const files = folder.children.filter((file): file is TFile => file instanceof TFile);
        const userLocale = navigator.language || 'en'; 
        const sortedFiles = sortFiles(files, this.plugin.settings.sortCriterion, userLocale);
        return await Promise.all(sortedFiles.map(file => this.createCard(file)));
    }

    public async createCard(file: TFile): Promise<Card> {
        const content = await this.plugin.app.vault.cachedRead(file);
        const { cleanContent } = separateFrontmatterAndContent(content);
        const contentWithoutHeader = this.removeFirstHeader(cleanContent);
        return {
            file,
            fileName: this.plugin.settings.showFileName ? file.basename : undefined,
            firstHeader: this.plugin.settings.showFirstHeader ? this.findFirstHeader(cleanContent) : undefined,
            content: this.plugin.settings.showContent ? this.truncateContent(contentWithoutHeader) : undefined,
        };
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
        const maxLength = this.plugin.settings.contentLength * 100;
        return content.length <= maxLength ? content : content.slice(0, maxLength) + '...';
    }

    createCardElement(card: Card): HTMLElement {
        const cardElement = document.createElement('div');
        cardElement.className = 'card-navigator-card';

        if (this.plugin.settings.showFileName && card.fileName) {
            const fileNameEl = cardElement.createEl('h3', { text: card.fileName });
            fileNameEl.className = 'card-navigator-filename';
            fileNameEl.style.fontSize = `${this.plugin.settings.fileNameSize}px`;
        }

        if (this.plugin.settings.showFirstHeader && card.firstHeader) {
            const headerEl = cardElement.createEl('h4', { text: card.firstHeader });
            headerEl.className = 'card-navigator-first-header';
            headerEl.style.fontSize = `${this.plugin.settings.firstHeaderSize}px`;
        }

		if (this.plugin.settings.showContent && card.content) {
			const contentEl = cardElement.createEl('div');
			contentEl.className = 'card-navigator-content';
			contentEl.style.fontSize = `${this.plugin.settings.contentSize}px`;
		
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
				contentEl.style.overflow = 'hidden';
				contentEl.style.textOverflow = 'ellipsis';
				contentEl.style.display = '-webkit-box';
			}
		}

        if (this.plugin.app.workspace.getActiveFile() === card.file) {
            cardElement.addClass('card-navigator-active');
        }

        // 카드 생성 후 드래그 앤 드롭 및 다른 인터랙션 설정
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
        cardElement.addEventListener('dragstart', (event) => {
            if (event.dataTransfer) {
                let dragContent = '';

                if (this.plugin.settings.dragDropContent) {
                    // 카드에 표시되는 항목에 따라 드래그 앤 드롭 시 삽입할 내용 결정
                    if (this.plugin.settings.showFileName && card.fileName) {
                        dragContent += `## ${card.fileName}\n\n`; // 파일명 앞에 헤더 추가
                    }

                    if (this.plugin.settings.showFirstHeader && card.firstHeader) {
                        dragContent += `# ${card.firstHeader}\n\n`; // 첫 번째 헤더 앞에 헤더 추가
                    }

                    if (this.plugin.settings.showContent && card.content) {
                        dragContent += `${card.content}\n\n`; // 본문 내용 추가
                    }

                    if (dragContent === '') {
                        // 만약 표시 설정이 되어있지 않으면 기본 파일 링크 삽입
                        dragContent = `[[${card.file.name}]]`;
                    }
                } else {
                    // "Drag and Drop Content" 옵션이 비활성화된 경우 파일명 링크를 삽입
                    dragContent = `[[${card.file.name}]]`;
                }

                event.dataTransfer.setData('text/plain', dragContent.trim());
				event.dataTransfer.setDragImage(cardElement, 0, 0);
            }
        });
    }

    private setupContextMenu(cardElement: HTMLElement, file: TFile) {
        cardElement.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            const menu = new Menu();
            this.plugin.app.workspace.trigger('file-menu', menu, file, 'more-options');
            menu.showAtPosition({ x: e.clientX, y: e.clientY });
        });
    }

    private openFile(file: TFile) {
        this.plugin.app.workspace.getLeaf().openFile(file);
    }
}
