import { Menu, TFile, MarkdownRenderer, Platform } from 'obsidian';
import CardNavigatorPlugin from 'main';
import { Card } from 'common/types';
import { sortFiles, separateFrontmatterAndBody } from 'common/utils';
import { t } from 'i18next';

export class CardMaker {
    constructor(
        private plugin: CardNavigatorPlugin,
        private copyLinkCallback: (file: TFile) => void,
        private copyContentCallback: (file: TFile) => void
    ) {}

    async getCardsForActiveFile(activeFile: TFile): Promise<Card[]> {
        const folder = activeFile.parent;
        if (!folder) return [];
        
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
            const { cleanBody } = separateFrontmatterAndBody(content);
            const bodyWithoutHeader = this.removeFirstHeader(cleanBody);
    
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

    private removeFirstHeader(body: string): string {
        return body.replace(/^#+\s+(.+)$/m, '').trim();
    }

    private findFirstHeader(body: string): string | undefined {
        const match = body.match(/^#+\s+(.+)$/m);
        return match ? match[1].trim() : undefined;
    }

    private truncateBody(body: string): string {
        if (!this.plugin.settings.bodyLengthLimit) return body;
        const maxLength = this.plugin.settings.bodyLength;
        return body.length <= maxLength ? body : `${body.slice(0, maxLength)}...`;
    }

    createCardElement(card: Card): HTMLElement {
        const cardElement = document.createElement('div');
        cardElement.className = 'card-navigator-card';
        cardElement.dataset.cardId = card.file.path; // Add unique identifier

        this.addCardContent(cardElement, card);
        this.addCardInteractions(cardElement, card);

        return cardElement;
    }

	private addCardContent(cardElement: HTMLElement, card: Card) {
		if (this.plugin.settings.showFileName && card.fileName) {
			this.addElement(cardElement, 'h3', card.fileName, 'card-navigator-filename', this.plugin.settings.fileNameFontSize);
		}
	
		if (this.plugin.settings.showFirstHeader && card.firstHeader) {
			this.addElement(cardElement, 'h4', card.firstHeader, 'card-navigator-first-header', this.plugin.settings.firstHeaderFontSize);
		}
	
		if (this.plugin.settings.showBody && card.body) {
			const contentEl = this.addElement(cardElement, 'div', '', 'card-navigator-body', this.plugin.settings.bodyFontSize);
			
			if (this.plugin.settings.renderContentAsHtml) {
				MarkdownRenderer.render(
					this.plugin.app,
					card.body,
					contentEl,
					card.file.path,
					this.plugin
				);
			} else {
				contentEl.textContent = card.body;
				contentEl.addClass('ellipsis');
			}
		}
	}

	private addElement(parent: HTMLElement, tag: 'div' | 'h3' | 'h4', text: string, className: string, fontSize: number): HTMLElement {
		const element = parent.createEl(tag, { text, cls: className });
		element.style.fontSize = `${fontSize}px`;
		return element;
	}

    private addCardInteractions(cardElement: HTMLElement, card: Card) {
        cardElement.addEventListener('click', () => this.openFile(card.file));
        this.setupDragAndDrop(cardElement, card);
        this.setupContextMenu(cardElement, card.file);
    }

    // private setupDragAndDrop(cardElement: HTMLElement, card: Card) {
    //     cardElement.setAttribute('draggable', 'true');
    //     cardElement.addEventListener('dragstart', (event: DragEvent) => {
    //         if (event.dataTransfer) {
    //             const dragContent = this.getDragContent(card);
    //             event.dataTransfer.setData('text/plain', dragContent);
    //             event.dataTransfer.setDragImage(cardElement, 0, 0);
    //         }
    //     });
    // }
	
	private setupDragAndDrop(cardElement: HTMLElement, card: Card) {
		cardElement.setAttribute('draggable', 'true');
	
		let isDragging = false;
		let longPressTimer: NodeJS.Timeout;
		const longPressDuration = 500; // 0.5초
	
		cardElement.addEventListener('touchstart', (e: TouchEvent) => {
			longPressTimer = setTimeout(() => {
				// 길게 누르기 동작 (컨텍스트 메뉴 열기 등)
				if (!isDragging) {
					this.openContextMenu(e, card.file);
				}
			}, longPressDuration);
		});
	
		cardElement.addEventListener('touchmove', () => {
			clearTimeout(longPressTimer);
			isDragging = true;
			
			// 드래그가 시작되면 사이드바 닫기
			if (Platform.isMobile) {
				this.plugin.app.workspace.rightSplit.collapse();
			}
		});
	
		cardElement.addEventListener('touchend', () => {
			clearTimeout(longPressTimer);
			isDragging = false;
		});
	
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
            if (this.plugin.settings.showBody && card.body) {
                content += `${card.body}\n\n`;
            }
            return content.trim() || this.plugin.app.fileManager.generateMarkdownLink(card.file, '');
        }
        return this.plugin.app.fileManager.generateMarkdownLink(card.file, '');
    }

	// private setupContextMenu(cardElement: HTMLElement, file: TFile) {
	// 	cardElement.addEventListener('contextmenu', (e: MouseEvent) => {
	// 		e.preventDefault();
	// 		const menu = new Menu();
	
	// 		this.plugin.app.workspace.trigger('file-menu', menu, file, 'more-options');
	
	// 		menu.addSeparator();
	
	// 		menu.addItem((item) => {
	// 			item
	// 				.setTitle(t('COPY_AS_LINK'))
	// 				.setIcon('link')
	// 				.onClick(() => this.copyLinkCallback(file));
	// 		});
	
	// 		menu.addItem((item) => {
	// 			item
	// 				.setTitle(t('COPY_CARD_CONTENT'))
	// 				.setIcon('file-text')
	// 				.onClick(() => this.copyContentCallback(file));
	// 		});
	
	// 		menu.showAtPosition({ x: e.clientX, y: e.clientY });
	// 	});
	// }

	private setupContextMenu(cardElement: HTMLElement, file: TFile) {
		// 데스크톱에서는 우클릭 이벤트 사용
		cardElement.addEventListener('contextmenu', (e) => this.openContextMenu(e, file));
	
		// 모바일에서는 길게 누르기(long press) 이벤트 사용
		if (Platform.isMobile) {
			let longPressTimer: NodeJS.Timeout;
			const longPressDuration = 500; // 0.5초
	
			cardElement.addEventListener('touchstart', (e) => {
				longPressTimer = setTimeout(() => this.openContextMenu(e, file), longPressDuration);
			});
	
			cardElement.addEventListener('touchend', () => {
				clearTimeout(longPressTimer);
			});
	
			cardElement.addEventListener('touchmove', () => {
				clearTimeout(longPressTimer);
			});
		}
	}
	
	private openContextMenu(e: MouseEvent | TouchEvent, file: TFile) {
		e.preventDefault();
		const menu = new Menu();
	
		this.plugin.app.workspace.trigger('file-menu', menu, file, 'more-options');
	
		menu.addSeparator();
	
		menu.addItem((item) => {
			item
				.setTitle(t('COPY_AS_LINK'))
				.setIcon('link')
				.onClick(() => this.copyLinkCallback(file));
		});
	
		menu.addItem((item) => {
			item
				.setTitle(t('COPY_CARD_CONTENT'))
				.setIcon('file-text')
				.onClick(() => this.copyContentCallback(file));
		});
	
		// 마우스 이벤트와 터치 이벤트를 구분하여 위치 설정
		if (e instanceof MouseEvent) {
			menu.showAtPosition({ x: e.pageX, y: e.pageY });
		} else if (e instanceof TouchEvent) {
			const touch = e.touches[0] || e.changedTouches[0];
			menu.showAtPosition({ x: touch.pageX, y: touch.pageY });
		}
	}

    private openFile(file: TFile) {
        this.plugin.app.workspace.getLeaf().openFile(file);
    }
}
