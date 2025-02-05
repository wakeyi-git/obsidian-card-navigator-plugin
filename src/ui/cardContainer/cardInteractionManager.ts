import { Menu, TFile, MarkdownView, Platform, Editor, WorkspaceLeaf, Notice } from 'obsidian';
import CardNavigatorPlugin from 'main';
import { Card } from 'common/types';
import { t } from 'i18next';
import { separateFrontmatterAndBody } from 'common/utils';

export class CardInteractionManager {
    private dragImage: HTMLElement | null = null;
    private currentDraggedCard: Card | null = null;
    private lastCursorUpdate: number | null = null;
    private touchTimeout: NodeJS.Timeout | null = null;
    private initialTouchPos: { x: number; y: number } | null = null;

    constructor(
        private plugin: CardNavigatorPlugin
    ) {}

    //#region 카드 상호작용 설정
    public setupInteractions(cardElement: HTMLElement, card: Card) {
        if (Platform.isMobile) {
            this.setupMobileInteractions(cardElement, card);
        } else {
            this.setupDesktopInteractions(cardElement, card);
        }
    }

    private setupMobileInteractions(cardElement: HTMLElement, card: Card) {
        let touchStartTime = 0;
        let isMoved = false;
        let isLongPress = false;

        const handleTouchStart = (e: TouchEvent) => {
            e.preventDefault();
            const touch = e.touches[0];
            touchStartTime = Date.now();
            isMoved = false;
            isLongPress = false;
            this.initialTouchPos = { x: touch.clientX, y: touch.clientY };

            this.touchTimeout = setTimeout(() => {
                if (!isMoved) {
                    isLongPress = true;
                    this.showContextMenu(e, card.file);
                }
            }, 500);
        };

        const handleTouchMove = (e: TouchEvent) => {
            if (!this.initialTouchPos) return;

            const touch = e.touches[0];
            const deltaX = Math.abs(touch.clientX - this.initialTouchPos.x);
            const deltaY = Math.abs(touch.clientY - this.initialTouchPos.y);

            if (deltaX > 10 || deltaY > 10) {
                isMoved = true;
                if (this.touchTimeout) {
                    clearTimeout(this.touchTimeout);
                    this.touchTimeout = null;
                }
            }
        };

        const handleTouchEnd = async (e: TouchEvent) => {
            e.preventDefault();
            if (this.touchTimeout) {
                clearTimeout(this.touchTimeout);
                this.touchTimeout = null;
            }

            const touchDuration = Date.now() - touchStartTime;

            if (!isMoved && !isLongPress && touchDuration < 200) {
                await this.openFile(card.file);
            }

            this.initialTouchPos = null;
        };

        cardElement.addEventListener('touchstart', handleTouchStart, { passive: false });
        cardElement.addEventListener('touchmove', handleTouchMove, { passive: true });
        cardElement.addEventListener('touchend', handleTouchEnd, { passive: false });
    }

    private setupDesktopInteractions(cardElement: HTMLElement, card: Card) {
        cardElement.addEventListener('click', async () => {
            await this.openFile(card.file);
        });

        cardElement.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.showContextMenu(e, card.file);
        });

        this.setupDesktopDragAndDrop(cardElement, card);
    }

    private async openFile(file: TFile) {
        try {
            const leaf = this.plugin.app.workspace.getLeaf(false);
            await leaf.openFile(file, { active: true });
        } catch (error) {
            this.showError('FILE_OPEN_FAILED', error);
        }
    }

    private showContextMenu(event: MouseEvent | TouchEvent, file: TFile) {
        const menu = new Menu();
        
        // 기본 파일 작업 메뉴 추가
        this.plugin.app.workspace.trigger('file-menu', menu, file, 'more-options');
        
        menu.addSeparator();

        // 링크 복사 옵션
        menu.addItem((item) => 
            item.setTitle(t('COPY_AS_LINK'))
                .setIcon('link')
                .onClick(() => this.copyLink(file))
        );

        // 내용 복사 옵션
        menu.addItem((item) => 
            item.setTitle(t('COPY_CARD_CONTENT'))
                .setIcon('file-text')
                .onClick(async () => {
                    try {
                        const card = await this.createCardFromFile(file);
                        await this.copyCardContent(card);
                    } catch (error) {
                        this.showError('COPY_FAILED', error);
                    }
                })
        );

        // 메뉴 위치 설정
        const position = this.getMenuPosition(event);
        menu.showAtPosition(position);
    }

    private getMenuPosition(event: MouseEvent | TouchEvent) {
        if (event instanceof MouseEvent) {
            return { x: event.pageX, y: event.pageY };
        } else {
            const touch = event.touches[0] || event.changedTouches[0];
            return { x: touch.pageX, y: touch.pageY };
        }
    }

    private setupDesktopDragAndDrop(cardElement: HTMLElement, card: Card) {
        cardElement.setAttribute('draggable', 'true');
        
        cardElement.addEventListener('dragstart', async (e: DragEvent) => {
            if (e.dataTransfer) {
                const content = this.plugin.settings.dragDropContent ? 
                    await this.getCardContent(card) : 
                    this.getLink(card.file);
                e.dataTransfer.setData('text/plain', content);
                e.dataTransfer.effectAllowed = 'copy';
                e.dataTransfer.setDragImage(cardElement, 0, 0);
                this.currentDraggedCard = card;
            }
        });

        cardElement.addEventListener('dragend', () => {
            this.currentDraggedCard = null;
        });
    }

    //#region 유틸리티 메서드
    private getLink(file: TFile): string {
        return this.plugin.app.fileManager.generateMarkdownLink(file, '');
    }

    private async getCardContent(card: Card): Promise<string> {
        const fileContent = await this.plugin.app.vault.cachedRead(card.file);
        const { cleanBody } = separateFrontmatterAndBody(fileContent);
        return `# ${card.file.basename}\n\n${cleanBody}`;
    }

    private async createCardFromFile(file: TFile): Promise<Card> {
        const content = await this.plugin.app.vault.cachedRead(file);
        const { cleanBody } = separateFrontmatterAndBody(content);
        return {
            file,
            fileName: this.plugin.settings.showFileName ? file.basename : undefined,
            firstHeader: this.plugin.settings.showFirstHeader ? 
                cleanBody.match(/^#+\s+(.+)$/m)?.[1]?.trim() : undefined,
            body: this.plugin.settings.showBody ? 
                cleanBody.replace(/^#+\s+(.+)$/m, '').trim() : undefined
        };
    }

    private showError(messageKey: string, error: any) {
        console.error(`${t(messageKey)}:`, error);
        new Notice(t(messageKey));
    }

    private async copyToClipboard(content: string, successKey: string) {
        try {
            await navigator.clipboard.writeText(content);
            new Notice(t(successKey));
        } catch (error) {
            this.showError('COPY_FAILED', error);
        }
    }
    //#endregion

    //#region 복사 기능
    public async copyLink(file: TFile) {
        const link = this.getLink(file);
        await this.copyToClipboard(link, 'LINK_COPIED');
    }

    public async copyCardContent(card: Card) {
        const content = await this.getCardContent(card);
        await this.copyToClipboard(content, 'CONTENT_COPIED');
    }
    //#endregion
} 