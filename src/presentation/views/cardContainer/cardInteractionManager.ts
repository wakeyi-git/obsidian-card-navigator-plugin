import { Menu, TFile, MarkdownView, Platform, Editor, WorkspaceLeaf, Notice } from 'obsidian';
import { CardNavigatorPlugin } from '@main';
import { Card } from '@domain/models/Card';
import { t } from 'i18next';
import { separateFrontmatterAndBody } from '@common/utils';
import { CardSection, CardSectionType } from '@domain/models/types';

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
            const touch = e.touches[0];
            touchStartTime = Date.now();
            isMoved = false;
            isLongPress = false;
            this.initialTouchPos = { x: touch.clientX, y: touch.clientY };

            this.touchTimeout = setTimeout(() => {
                if (!isMoved) {
                    isLongPress = true;
                    e.preventDefault();
                    this.showContextMenu(e, card.getFile());
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
            if (this.touchTimeout) {
                clearTimeout(this.touchTimeout);
                this.touchTimeout = null;
            }

            const touchDuration = Date.now() - touchStartTime;

            if (!isMoved && !isLongPress && touchDuration < 200) {
                e.preventDefault();
                await this.openFile(card.getFile());
            }

            this.initialTouchPos = null;
        };

        cardElement.addEventListener('touchstart', handleTouchStart, { passive: true });
        cardElement.addEventListener('touchmove', handleTouchMove, { passive: true });
        cardElement.addEventListener('touchend', handleTouchEnd, { passive: false });
    }

    private setupDesktopInteractions(cardElement: HTMLElement, card: Card) {
        cardElement.addEventListener('click', async () => {
            await this.openFile(card.getFile());
        });

        cardElement.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.showContextMenu(e, card.getFile());
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
                    this.getLink(card.getFile());
                e.dataTransfer.setData('text/plain', content);
                e.dataTransfer.effectAllowed = 'copy';

                // 드래그 이미지 생성
                const dragImage = cardElement.cloneNode(true) as HTMLElement;
                dragImage.style.position = 'fixed';
                dragImage.style.top = '-9999px';
                dragImage.style.left = '-9999px';
                dragImage.style.width = `${cardElement.offsetWidth}px`;
                dragImage.style.height = `${cardElement.offsetHeight}px`;
                dragImage.style.pointerEvents = 'none';
                dragImage.style.opacity = '0.7';
                document.body.appendChild(dragImage);

                e.dataTransfer.setDragImage(dragImage, 0, 0);
                this.currentDraggedCard = card;
                this.dragImage = dragImage;
            }
        });

        cardElement.addEventListener('dragend', () => {
            if (this.dragImage) {
                this.dragImage.remove();
                this.dragImage = null;
            }
            this.currentDraggedCard = null;
        });
    }

    //#region 유틸리티 메서드
    private getLink(file: TFile): string {
        return this.plugin.app.fileManager.generateMarkdownLink(file, '');
    }

    private async getCardContent(card: Card): Promise<string> {
        const fileContent = await this.plugin.app.vault.cachedRead(card.getFile());
        const { cleanBody } = separateFrontmatterAndBody(fileContent);
        return `# ${card.getFile().basename}\n\n${cleanBody}`;
    }

    private async createCardFromFile(file: TFile): Promise<Card> {
        const content = await this.plugin.app.vault.cachedRead(file);
        const { cleanBody } = separateFrontmatterAndBody(content);
        
        // 첫 번째 헤더 추출
        const firstHeaderMatch = cleanBody.match(/^#+\s+(.+)$/m);
        const firstHeader = firstHeaderMatch ? firstHeaderMatch[1].trim() : undefined;
        
        // 본문 내용 추출 및 CardSection[]로 변환
        const bodyContent = this.plugin.settings.showBody ? 
            cleanBody.replace(/^#+\s+(.+)$/m, '').trim() : '';
        
        const bodySections: CardSection[] = bodyContent ? [{
            type: 'text' as CardSectionType,
            content: bodyContent
        }] : [];

        // 헤더 섹션 생성
        const headerSections: CardSection[] = [];
        if (this.plugin.settings.showFileName) {
            headerSections.push({
                type: 'header' as CardSectionType,
                content: file.basename,
                level: 1
            });
        }
        if (this.plugin.settings.showFirstHeader && firstHeader) {
            headerSections.push({
                type: 'header' as CardSectionType,
                content: firstHeader,
                level: 1
            });
        }

        return new Card(
            file.path,
            file,
            {
                header: headerSections,
                body: bodySections,
                footer: []
            },
            {
                width: 0,
                height: 0,
                padding: 0,
                margin: 0,
                borderRadius: 0,
                backgroundColor: '',
                textColor: '',
                fontSize: 0,
                lineHeight: 0,
                borderWidth: 0,
                borderColor: '',
                boxShadow: ''
            },
            {
                left: 0,
                top: 0,
                width: 0,
                height: 0
            },
            this.plugin.app
        );
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