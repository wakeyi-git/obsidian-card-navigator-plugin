import { Menu, TFile, MarkdownView, Platform, Editor } from 'obsidian';
import CardNavigatorPlugin from 'main';
import { Card } from 'common/types';
import { t } from 'i18next';

export class CardInteractionManager {
    private dragImage: HTMLElement | null = null;
    private currentDraggedCard: Card | null = null;
    private lastCursorUpdate: number | null = null;

    constructor(
        private plugin: CardNavigatorPlugin,
        private getCardContent: (card: Card) => string,
        private getLink: (file: TFile) => string
    ) {}

    //#region 카드 상호작용 설정
    public setupInteractions(cardElement: HTMLElement, card: Card) {
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

    private setupContextMenu(cardElement: HTMLElement, file: TFile) {
        const handler = (e: MouseEvent | TouchEvent) => {
            e.preventDefault();
            e.stopPropagation();
            
            const menu = new Menu();

            this.plugin.app.workspace.trigger('file-menu', menu, file, 'more-options');

            menu.addSeparator();

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
    //#endregion

    //#region 드래그 앤 드롭 설정
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
        let activeEditor: Editor | null = null;
        let dragStarted = false;

        const resetDragState = () => {
            isDragging = false;
            isMoved = false;
            dragStarted = false;
            if (activeEditor) {
                activeEditor.blur();
                activeEditor = null;
            }
            this.lastCursorUpdate = null;
        };

        const updateDragImagePosition = (touch: Touch) => {
            if (this.dragImage) {
                const offset = 30;
                this.dragImage.style.left = `${touch.clientX}px`;
                this.dragImage.style.top = `${touch.clientY - offset}px`;
                this.dragImage.style.transform = `translate(-50%, -100%) scale(${this.calculateDragImageScale()})`;
            }

            const activeView = this.plugin.app.workspace.getActiveViewOfType(MarkdownView);
            if (!activeView?.editor) return;

            const editorEl = activeView.contentEl.querySelector('.cm-content');
            if (!editorEl) return;

            if (!activeEditor) {
                activeEditor = activeView.editor;
                setTimeout(() => {
                    activeEditor?.focus();
                }, 10);
            }

            const editorRect = editorEl.getBoundingClientRect();
            
            if (touch.clientX >= editorRect.left && touch.clientX <= editorRect.right &&
                touch.clientY >= editorRect.top && touch.clientY <= editorRect.bottom) {
                
                const cursorOffsetX = 20;
                const x = touch.clientX - cursorOffsetX - editorRect.left;
                const y = touch.clientY - editorRect.top;

                const lines = editorEl.querySelectorAll('.cm-line');
                let targetLine = 0;
                let found = false;

                const scrollTop = editorEl.scrollTop;
                const relativeY = y + scrollTop;

                for (let i = 0; i < lines.length; i++) {
                    const lineEl = lines[i] as HTMLElement;
                    const lineRect = lineEl.getBoundingClientRect();
                    const lineTop = lineEl.offsetTop;
                    const lineBottom = lineTop + lineRect.height;

                    if (relativeY >= lineTop && relativeY <= lineBottom) {
                        targetLine = i;
                        found = true;
                        break;
                    }
                }

                if (!found) {
                    targetLine = Math.min(
                        Math.max(0, Math.floor(relativeY / 24)),
                        activeEditor.lastLine()
                    );
                }

                const lineText = activeEditor.getLine(targetLine);
                if (!lineText) return;

                const relativeX = Math.max(0, Math.min(1, x / editorRect.width));
                const ch = Math.floor(relativeX * lineText.length);

                activeEditor.setCursor({
                    line: targetLine,
                    ch: ch
                });
            }
        };

        cardElement.addEventListener('touchstart', (e: TouchEvent) => {
            if (dragStarted || this.dragImage) return;

            const touch = e.touches[0];
            touchStartPos = { x: touch.clientX, y: touch.clientY };
            touchStartTime = Date.now();
            isMoved = false;
            activeEditor = null;

            longPressTimer = setTimeout(() => {
                if (!isMoved && !dragStarted) {
                    isDragging = true;
                    dragStarted = true;
                    this.startDrag(cardElement, card, touch);
                    updateDragImagePosition(touch);
                    
                    this.plugin.app.workspace.leftSplit.collapse();
                    this.plugin.app.workspace.rightSplit.collapse();
                }
            }, 500);
        });

        cardElement.addEventListener('touchmove', (e: TouchEvent) => {
            const touch = e.touches[0];
            const deltaX = Math.abs(touch.clientX - touchStartPos.x);
            const deltaY = Math.abs(touch.clientY - touchStartPos.y);

            if (deltaX > 5 || deltaY > 5) {
                isMoved = true;
                clearTimeout(longPressTimer);
            }

            if (isDragging) {
                e.preventDefault();
                if (!this.lastCursorUpdate || Date.now() - this.lastCursorUpdate > 100) {
                    requestAnimationFrame(() => {
                        updateDragImagePosition(touch);
                        this.lastCursorUpdate = Date.now();
                    });
                } else {
                    requestAnimationFrame(() => {
                        if (this.dragImage) {
                            const offset = 30;
                            this.dragImage.style.left = `${touch.clientX}px`;
                            this.dragImage.style.top = `${touch.clientY - offset}px`;
                        }
                    });
                }
            }
        }, { passive: false });

        cardElement.addEventListener('touchend', async (e: TouchEvent) => {
            clearTimeout(longPressTimer);
            const touchEndTime = Date.now();
            const touchDuration = touchEndTime - touchStartTime;

            if (isDragging) {
                const activeView = this.plugin.app.workspace.getActiveViewOfType(MarkdownView);
                if (activeView?.editor && this.currentDraggedCard) {
                    const content = this.getCardContent(this.currentDraggedCard);
                    const cursorPos = activeView.editor.getCursor();
                    activeView.editor.replaceRange(content, cursorPos);
                }
                this.endDrag();
                resetDragState();
            } else if (!isMoved && touchDuration < 200) {
                const leaf = this.plugin.app.workspace.getLeaf(false);
                if (leaf) await leaf.openFile(card.file);
            }
        });

        cardElement.addEventListener('touchcancel', () => {
            clearTimeout(longPressTimer);
            this.endDrag();
            resetDragState();
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
    //#endregion

    //#region 드래그 앤 드롭 유틸리티
    private startDrag(cardElement: HTMLElement, card: Card, touch: Touch) {
        if (this.dragImage) return;

        this.dragImage = cardElement.cloneNode(true) as HTMLElement;
        
        const { width: maxWidth, height: maxHeight } = this.calculateDragImageMaxSize();
        
        Object.assign(this.dragImage.style, {
            position: 'fixed',
            transform: `translate(-50%, -100%) scale(${this.calculateDragImageScale()})`,
            opacity: '0.9',
            pointerEvents: 'none',
            zIndex: '1000',
            maxWidth: `${maxWidth}px`,
            maxHeight: `${maxHeight}px`,
            overflow: 'hidden',
            backgroundColor: 'var(--background-primary)',
            border: '2px solid var(--interactive-accent)',
            borderRadius: '6px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
            transition: 'opacity 0.2s ease'
        });

        if (window.navigator.vibrate) {
            window.navigator.vibrate(50);
        }

        document.body.appendChild(this.dragImage);
        this.currentDraggedCard = card;

        const activeView = this.plugin.app.workspace.getActiveViewOfType(MarkdownView);
        if (activeView?.editor) {
            const editorEl = activeView.contentEl.querySelector('.cm-content');
            if (!editorEl) return;

            const editorRect = editorEl.getBoundingClientRect();
            if (touch.clientX >= editorRect.left && touch.clientX <= editorRect.right &&
                touch.clientY >= editorRect.top && touch.clientY <= editorRect.bottom) {
                
                const lines = editorEl.querySelectorAll('.cm-line');
                const y = touch.clientY - editorRect.top + editorEl.scrollTop;
                let targetLine = 0;
                let found = false;

                for (let i = 0; i < lines.length; i++) {
                    const lineEl = lines[i] as HTMLElement;
                    const lineTop = lineEl.offsetTop;
                    const lineHeight = lineEl.offsetHeight;
                    const lineBottom = lineTop + lineHeight;

                    if (y >= lineTop && y <= lineBottom) {
                        targetLine = i;
                        found = true;
                        break;
                    }
                }

                if (!found) {
                    const lastLine = lines[lines.length - 1] as HTMLElement;
                    const lineHeight = lastLine ? lastLine.offsetHeight : 24;
                    targetLine = Math.min(
                        Math.max(0, Math.floor(y / lineHeight)),
                        activeView.editor.lastLine()
                    );
                }

                activeView.editor.focus();
                activeView.editor.setCursor({ line: targetLine, ch: 0 });
            }
        }
    }

    private endDrag() {
        if (this.dragImage) {
            this.dragImage.style.opacity = '0';
            this.dragImage.style.transform = 'translate(-50%, -50%) scale(0.5)';
            setTimeout(() => {
                this.dragImage?.remove();
                this.dragImage = null;
            }, 200);
        }

        this.currentDraggedCard = null;
    }

    private calculateDragImageScale(): number {
        const screenWidth = window.innerWidth;
        return screenWidth < 768 ? 0.5 : 0.6;
    }

    private calculateDragImageMaxSize(): { width: number, height: number } {
        const screenWidth = window.innerWidth;
        const baseWidth = screenWidth < 768 ? 150 : 200;
        const baseHeight = screenWidth < 768 ? 100 : 150;
        return { width: baseWidth, height: baseHeight };
    }
    //#endregion

    //#region 복사 기능
    public copyLink(file: TFile) {
        const link = this.getLink(file);
        navigator.clipboard.writeText(link);
    }

    public async copyCardContent(file: TFile) {
        const content = await this.plugin.app.vault.cachedRead(file);
        navigator.clipboard.writeText(content);
    }
    //#endregion
} 