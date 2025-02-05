import { TFile, MarkdownRenderer } from 'obsidian';
import CardNavigatorPlugin from 'main';
import { Card } from 'common/types';
import { sortFiles, separateFrontmatterAndBody } from 'common/utils';
import { CardInteractionManager } from './cardInteractionManager';

type CardElementTag = 'div' | 'h3' | 'h4';

export class CardMaker {
    private interactionManager: CardInteractionManager;

    constructor(private plugin: CardNavigatorPlugin) {
        this.interactionManager = new CardInteractionManager(plugin);
    }

    // 복사 기능을 위한 public 메서드
    public async copyLink(file: TFile) {
        await this.interactionManager.copyLink(file);
    }

    public async copyCardContent(file: TFile) {
        const card = await this.createCard(file);
        await this.interactionManager.copyCardContent(card);
    }

    //#region 카드 생성 및 내용 관리
    // 활성 파일의 카드 목록 가져오기 메서드
    async getCardsForActiveFile(activeFile: TFile): Promise<Card[]> {
        const folder = activeFile.parent;
        if (!folder) return [];
        
        const files = folder.children
            .filter((file): file is TFile => file instanceof TFile && file.extension === 'md');
        
        const sortedFiles = sortFiles(files, this.plugin.settings.sortCriterion, this.plugin.settings.sortOrder);
        return Promise.all(sortedFiles.map(file => this.createCard(file)));
    }

    // 카드 생성 메서드
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

    // 첫 번째 헤더 찾기 메서드
    private findFirstHeader(body: string): string | undefined {
        return body.match(/^#+\s+(.+)$/m)?.[1]?.trim();
    }

    // 첫 번째 헤더 제거 메서드
    private removeFirstHeader(body: string): string {
        return body.replace(/^#+\s+(.+)$/m, '').trim();
    }

    // 본문 길이 제한 메서드
    private truncateBody(body: string): string {
        if (!this.plugin.settings.bodyLengthLimit) return body;
        const maxLength = this.plugin.settings.bodyLength;
        return body.length <= maxLength ? body : `${body.slice(0, maxLength)}...`;
    }
    //#endregion

    //#region 카드 요소 생성
    // 카드 요소 생성 메서드
    createCardElement(card: Card): HTMLElement {
        const cardElement = document.createElement('div');
        cardElement.className = 'card-navigator-card';
        cardElement.dataset.cardId = card.file.path;

        this.addCardContent(cardElement, card);
        this.interactionManager.setupInteractions(cardElement, card);

        return cardElement;
    }

    // 카드 내용 추가 메서드
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

    // 컨텐츠 요소 생성 메서드
    private createContentElement(parent: HTMLElement, tag: CardElementTag, text: string, type: string, fontSize: number): HTMLElement {
        const element = parent.createEl(tag, { 
            text, 
            cls: `card-navigator-${type}`
        });
        element.style.fontSize = `${fontSize}px`;
        return element;
    }
    //#endregion
}
