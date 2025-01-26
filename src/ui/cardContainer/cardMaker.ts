import { Menu, TFile, MarkdownRenderer, Platform, MarkdownView, WorkspaceLeaf } from 'obsidian';
import CardNavigatorPlugin from 'main';
import { Card } from 'common/types';
import { sortFiles, separateFrontmatterAndBody } from 'common/utils';
import { t } from 'i18next';

type CardElementTag = 'div' | 'h3' | 'h4';

export class CardMaker {
    private dragImage: HTMLElement | null = null;
    private currentDraggedCard: Card | null = null;

    constructor(
        private plugin: CardNavigatorPlugin
    ) {}

    async getCardsForActiveFile(activeFile: TFile): Promise<Card[]> {
        const folder = activeFile.parent;
        if (!folder) return [];
        
        const files = folder.children
            .filter((file): file is TFile => file instanceof TFile && file.extension === 'md');
        
        const sortedFiles = sortFiles(files, this.plugin.settings.sortCriterion, this.plugin.settings.sortOrder);
        return Promise.all(sortedFiles.map(file => this.createCard(file)));
    }

    public async createCard(file: TFile): Promise<Card> {
        try {
            const content = await this.plugin.app.vault.cachedRead(file);
            const { cleanBody } = separateFrontmatterAndBody(content);
            const firstHeader = this.plugin.settings.showFirstHeader ? this.findFirstHeader(cleanBody) : undefined;
            const body = this.plugin.settings.showBody ? 
                this.truncateBody(this.removeFirstHeader(cleanBody)) : undefined;

            return {
                file,
                fileName: this.plugin.settings.showFileName ? file.basename : undefined,
                firstHeader,
                body,
            };
        } catch (error) {
            console.error(`Failed to create card for file ${file.path}:`, error);
            throw error;
        }
    }

    private findFirstHeader(body: string): string | undefined {
        return body.match(/^#+\s+(.+)$/m)?.[1]?.trim();
    }

    private removeFirstHeader(body: string): string {
        return body.replace(/^#+\s+(.+)$/m, '').trim();
    }

    private truncateBody(body: string): string {
        if (!this.plugin.settings.bodyLengthLimit) return body;
        const maxLength = this.plugin.settings.bodyLength;
        return body.length <= maxLength ? body : `${body.slice(0, maxLength)}...`;
    }

    createCardElement(card: Card): HTMLElement {
        const cardElement = document.createElement('div');
        cardElement.className = 'card-navigator-card';
        cardElement.dataset.cardId = card.file.path;

        this.addCardContent(cardElement, card);
        this.setupCardInteractions(cardElement, card);

        return cardElement;
    }

    private addCardContent(cardElement: HTMLElement, card: Card) {
        const { settings } = this.plugin;
        
        if (settings.showFileName && card.fileName) {
            this.createContentElement(cardElement, 'h3', card.fileName, 'filename', settings.fileNameFontSize);
        }

        if (settings.showFirstHeader && card.firstHeader) {
            this.createContentElement(cardElement, 'h4', card.firstHeader, 'first-header', settings.firstHeaderFontSize);
        }

        if (settings.showBody && card.body) {
            const contentEl = this.createContentElement(cardElement, 'div', '', 'body', settings.bodyFontSize);
            
            if (settings.renderContentAsHtml) {
                MarkdownRenderer.render(this.plugin.app, card.body, contentEl, card.file.path, this.plugin);
            } else {
                contentEl.textContent = card.body;
                contentEl.addClass('ellipsis');
            }
        }
    }

    private createContentElement(parent: HTMLElement, tag: CardElementTag, text: string, type: string, fontSize: number): HTMLElement {
        const element = parent.createEl(tag, { 
            text, 
            cls: `card-navigator-${type}`
        });
        element.style.fontSize = `${fontSize}px`;
        return element;
    }

    private setupCardInteractions(cardElement: HTMLElement, card: Card) {
        this.setupClickHandler(cardElement, card);
        this.setupDragAndDrop(cardElement, card);
        this.setupContextMenu(cardElement, card.file);
    }

    private setupClickHandler(cardElement: HTMLElement, card: Card) {
        if (!Platform.isMobile) {
            cardElement.addEventListener('click', async () => {
                const leaf = this.plugin.app.workspace.getLeaf(false);
                if (leaf) await leaf.openFile(card.file);
            });
        }
    }

    private setupDragAndDrop(cardElement: HTMLElement, card: Card) {
        cardElement.setAttribute('draggable', 'true');
        
        if (Platform.isMobile) {
            this.setupMobileDragAndDrop(cardElement, card);
        } else {
            this.setupDesktopDragAndDrop(cardElement, card);
        }
    }

    private setupMobileDragAndDrop(cardElement: HTMLElement, card: Card) {
        let touchStartPos = { x: 0, y: 0 };
        let touchStartTime = 0;
        let longPressTimer: NodeJS.Timeout;
        let isDragging = false;
        let isMoved = false;
        let isScrolling = false;

        const updateDragImagePosition = (x: number, y: number) => {
            if (this.dragImage) {
                // 화면 경계를 벗어나지 않도록 위치 조정
                const rect = this.dragImage.getBoundingClientRect();
                const maxX = window.innerWidth - rect.width;
                const maxY = window.innerHeight - rect.height;
                const newX = Math.max(0, Math.min(maxX, x - rect.width / 2));
                const newY = Math.max(0, Math.min(maxY, y - rect.height / 2));
                
                this.dragImage.style.transform = `translate(${newX}px, ${newY}px) scale(0.8)`;
            }
        };

        cardElement.addEventListener('touchstart', (e: TouchEvent) => {
            const touch = e.touches[0];
            touchStartPos = { x: touch.pageX, y: touch.pageY };
            touchStartTime = Date.now();
            isMoved = false;
            isScrolling = false;

            longPressTimer = setTimeout(() => {
                if (!isMoved) {
                    this.setupContextMenu(cardElement, card.file);
                }
            }, 500);
        });

        cardElement.addEventListener('touchmove', (e: TouchEvent) => {
            clearTimeout(longPressTimer);
            const touch = e.touches[0];
            const deltaX = Math.abs(touch.pageX - touchStartPos.x);
            const deltaY = Math.abs(touch.pageY - touchStartPos.y);

            if (!isMoved) {
                isMoved = true;
                if (deltaY > deltaX) {
                    isScrolling = true;
                }
            }

            if (isScrolling) {
                return;
            }

            if (!isDragging && deltaX > 30) {
                isDragging = true;
                e.preventDefault();
                this.startDrag(cardElement, card);
            }

            if (isDragging) {
                updateDragImagePosition(touch.pageX, touch.pageY);
            }
        }, { passive: true });

        cardElement.addEventListener('touchend', async (e: TouchEvent) => {
            clearTimeout(longPressTimer);
            const touchEndTime = Date.now();
            const touchDuration = touchEndTime - touchStartTime;

            if (isDragging) {
                this.endDrag();
                isDragging = false;
            } else if (!isMoved && touchDuration < 200) {
                // 짧은 탭 동작일 경우에만 파일 열기
                const leaf = this.plugin.app.workspace.getLeaf(false);
                if (leaf) await leaf.openFile(card.file);
            }
        });
    }

    private setupDesktopDragAndDrop(cardElement: HTMLElement, card: Card) {
        cardElement.addEventListener('dragstart', (e: DragEvent) => {
            if (e.dataTransfer) {
                e.dataTransfer.setData('text/plain', this.getCardContent(card));
                e.dataTransfer.setDragImage(cardElement, 0, 0);
                this.currentDraggedCard = card;
            }
        });
    }

    private setupContextMenu(cardElement: HTMLElement, file: TFile) {
        const handler = (e: MouseEvent | TouchEvent) => {
            e.preventDefault();
            e.stopPropagation();
            
            const menu = new Menu();

            // 옵시디언의 기본 파일 메뉴 아이템 추가
            this.plugin.app.workspace.trigger('file-menu', menu, file, 'more-options');

            // 구분선 추가
            menu.addSeparator();

            // 커스텀 메뉴 아이템 추가
            menu.addItem(item => item
                .setTitle(t('COPY_AS_LINK'))
                .setIcon('link')
                .onClick(() => this.copyLink(file)));

            menu.addItem(item => item
                .setTitle(t('COPY_CARD_CONTENT'))
                .setIcon('file-text')
                .onClick(async () => {
                    await this.copyCardContent(file);
                }));

            const pos = e instanceof MouseEvent ? 
                { x: e.pageX, y: e.pageY } : 
                { x: e.touches[0].pageX, y: e.touches[0].pageY };

            menu.showAtPosition(pos);
        };

        if (!Platform.isMobile) {
            cardElement.addEventListener('contextmenu', handler);
        }
    }

    private getLink(file: TFile): string {
        return this.plugin.app.fileManager.generateMarkdownLink(file, '');
    }

    private getContent(card: Card): string {
        const parts = [];
        if (this.plugin.settings.showFileName && card.fileName) {
            parts.push(`## ${card.fileName}`);
        }
        if (this.plugin.settings.showFirstHeader && card.firstHeader) {
            parts.push(`# ${card.firstHeader}`);
        }
        if (this.plugin.settings.showBody && card.body) {
            parts.push(card.body);
        }

        return parts.length ? parts.join('\n\n') : this.getLink(card.file);
    }

    public getCardContent(card: Card): string {
        if (!this.plugin.settings.dragDropContent) {
            return this.getLink(card.file);
        }
        return this.getContent(card);
    }

    public copyLink(file: TFile) {
        const link = this.getLink(file);
        navigator.clipboard.writeText(link);
    }

    public async copyCardContent(file: TFile) {
        const card = await this.createCard(file);
        const content = this.getContent(card);
        navigator.clipboard.writeText(content);
    }

    private startDrag(cardElement: HTMLElement, card: Card) {
        // 드래그 이미지 생성
        this.dragImage = cardElement.cloneNode(true) as HTMLElement;
        
        // 드래그 이미지 스타일링
        Object.assign(this.dragImage.style, {
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%) scale(0.8)',
            opacity: '0.9',
            pointerEvents: 'none',
            zIndex: '1000',
            maxWidth: '200px',
            maxHeight: '150px',
            overflow: 'hidden',
            backgroundColor: 'var(--background-primary)',
            border: '2px solid var(--interactive-accent)',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            transition: 'transform 0.2s ease'
        });

        // 드래그 중임을 표시하는 아이콘 추가
        const dragIndicator = document.createElement('div');
        dragIndicator.innerHTML = `<svg viewBox="0 0 100 100" width="20" height="20" style="position: absolute; top: 8px; right: 8px; fill: var(--interactive-accent)">
            <path d="M25,35 L75,35 M25,50 L75,50 M25,65 L75,65"></path>
        </svg>`;
        this.dragImage.appendChild(dragIndicator);

        document.body.appendChild(this.dragImage);
        this.currentDraggedCard = card;
        
        if (Platform.isMobile) {
            this.plugin.app.workspace.rightSplit.collapse();
        }
    }

    private endDrag() {
        if (this.dragImage) {
            // 드래그 이미지 제거 시 애니메이션 효과
            this.dragImage.style.opacity = '0';
            this.dragImage.style.transform = 'translate(-50%, -50%) scale(0.5)';
            setTimeout(() => {
                this.dragImage?.remove();
                this.dragImage = null;
            }, 200);
        }

        const activeView = this.plugin.app.workspace.getActiveViewOfType(MarkdownView);
        if (activeView && this.currentDraggedCard) {
            const editor = activeView.editor;
            editor.replaceRange(
                this.getCardContent(this.currentDraggedCard),
                editor.getCursor()
            );
        }
        this.currentDraggedCard = null;
    }
}
