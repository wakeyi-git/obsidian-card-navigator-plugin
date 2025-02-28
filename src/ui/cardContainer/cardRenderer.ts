import { TFile } from 'obsidian';
import { Card } from 'common/types';
import { CardMaker } from './cardMaker';
import { LayoutManager } from 'layouts/layoutManager';
import CardNavigatorPlugin from 'main';
import { CardPosition } from 'layouts/layoutStrategy';

/**
 * 카드 렌더러 클래스
 */
export class CardRenderer {
    private renderedCards: Set<string> = new Set();
    private cardElements: Map<string, HTMLElement> = new Map();
    private isInitialized: boolean = false;

    constructor(
        private containerEl: HTMLElement,
        private cardMaker: CardMaker,
        private layoutManager: LayoutManager,
        private plugin: CardNavigatorPlugin
    ) {
        this.isInitialized = true;
    }

    public updateCardSettings(alignCardHeight: boolean, cardsPerColumn: number): void {
        this.layoutManager.updateCardSettings(alignCardHeight, cardsPerColumn);
    }

    public cleanup(): void {
        if (this.containerEl) {
            this.containerEl.empty();
            this.resetCardElements();
        }
    }

    public resetCardElements(): void {
        this.cardElements.forEach((element) => {
            if (element && element.parentNode) {
                element.remove();
            }
        });
        
        this.cardElements.clear();
        this.renderedCards.clear();
        
        if (this.containerEl) {
            const remainingCards = this.containerEl.querySelectorAll('.card-navigator-card');
            remainingCards.forEach(card => card.remove());
        }
    }

    public renderCards(cards: Card[], focusedCardId?: string | null, activeFile?: TFile): void {
        if (!this.isInitialized) {
            this.isInitialized = true;
        }
        
        if (!this.containerEl || !document.body.contains(this.containerEl)) {
            return;
        }
        
        if (!cards || cards.length === 0) {
            this.containerEl.empty();
            this.cardElements.clear();
            this.renderedCards.clear();
            return;
        }
        
        requestAnimationFrame(() => {
            this.updateCardElementsMap(cards);
            
            if (this.checkIfLayoutCalculationNeeded(cards)) {
                requestAnimationFrame(async () => {
                    try {
                        await this.layoutManager.calculateLayout(cards);
                        requestAnimationFrame(() => {
                            this.renderCardsBatched(cards, 0, 30, focusedCardId, activeFile);
                        });
                    } catch (error) {
                        this.renderCardsWithDefaultLayout(cards, focusedCardId?.toString(), activeFile);
                    }
                });
            } else {
                requestAnimationFrame(() => {
                    this.renderCardsBatched(cards, 0, 30, focusedCardId, activeFile);
                });
            }
            
            cards.forEach(card => this.renderedCards.add(card.id));
        });
    }
    
    private checkIfLayoutCalculationNeeded(cards: Card[]): boolean {
        if (this.renderedCards.size !== cards.length) {
            return true;
        }
        
        for (const card of cards) {
            if (!this.renderedCards.has(card.id)) {
                return true;
            }
        }
        
        return false;
    }
    
    private renderCardsBatched(
        cards: Card[], 
        startIndex: number, 
        batchSize: number, 
        focusedCardId?: string | null, 
        activeFile?: TFile
    ): void {
        const endIndex = Math.min(startIndex + batchSize, cards.length);
        const batch = cards.slice(startIndex, endIndex);
        
        batch.forEach((card) => {
            try {
                const position = this.layoutManager.getCardPosition(card.id);
                if (position) {
                    const cardElement = this.getOrCreateCardElement(card);
                    this.applyCardPosition(cardElement, position);
                    this.updateCardActiveState(cardElement, card, activeFile, focusedCardId?.toString());
                }
            } catch (error) {
                // 오류 무시하고 계속 진행
            }
        });
        
        if (endIndex < cards.length) {
            requestAnimationFrame(() => {
                this.renderCardsBatched(cards, endIndex, batchSize, focusedCardId, activeFile);
            });
        }
    }
    
    private applyCardPosition(cardEl: HTMLElement, position: CardPosition): void {
        cardEl.style.width = `${position.width}px`;
        
        if (typeof position.height === 'string' && position.height === 'auto') {
            cardEl.style.height = 'auto';
        } else {
            cardEl.style.height = `${position.height}px`;
        }
        
        cardEl.style.position = 'absolute';
        cardEl.style.left = `${position.left}px`;
        cardEl.style.top = `${position.top}px`;
        cardEl.style.visibility = 'visible';
        cardEl.style.opacity = '1';
        cardEl.style.transition = 'left 0.3s ease, top 0.3s ease, opacity 0.3s ease';
    }

    private renderCardsWithDefaultLayout(cards: Card[], focusedCardId?: string, activeFile?: TFile): void {
        if (!this.containerEl) return;
        
        const containerWidth = this.containerEl.offsetWidth;
        const cardWidth = Math.min(300, containerWidth * 0.8);
        const cardHeight = 200;
        const cardMargin = 10;
        const cardsPerRow = Math.max(1, Math.floor(containerWidth / (cardWidth + cardMargin)));
        
        const batchSize = 20;
        const totalCards = cards.length;
        let processedCards = 0;
        
        const processBatch = () => {
            const endIdx = Math.min(processedCards + batchSize, totalCards);
            
            for (let i = processedCards; i < endIdx; i++) {
                const card = cards[i];
                const cardEl = this.getOrCreateCardElement(card);
                
                const row = Math.floor(i / cardsPerRow);
                const col = i % cardsPerRow;
                
                const left = col * (cardWidth + cardMargin);
                const top = row * (cardHeight + cardMargin);
                
                cardEl.style.position = 'absolute';
                cardEl.style.left = `${left}px`;
                cardEl.style.top = `${top}px`;
                cardEl.style.width = `${cardWidth}px`;
                cardEl.style.height = `${cardHeight}px`;
                cardEl.style.visibility = 'visible';
                cardEl.style.opacity = '1';
                
                this.updateCardActiveState(cardEl, card, activeFile, focusedCardId);
            }
            
            processedCards = endIdx;
            
            if (processedCards < totalCards) {
                requestAnimationFrame(processBatch);
            }
        };
        
        processBatch();
    }

    private getOrCreateCardElement(card: Card): HTMLElement {
        let cardEl = this.cardElements.get(card.id);
        
        if (!cardEl) {
            cardEl = this.createCardElement(card);
            this.cardElements.set(card.id, cardEl);
            this.containerEl.appendChild(cardEl);
        }
        
        this.renderedCards.add(card.id);
        
        return cardEl;
    }
    
    private createCardElement(card: Card): HTMLElement {
        const cardEl = document.createElement('div');
        cardEl.className = 'card-navigator-card';
        
        cardEl.dataset.cardId = card.id;
        
        const safeId = card.id.replace(/[^\w-]/g, '_');
        cardEl.setAttribute('data-safe-id', safeId);
        
        if (card.file && card.file.path) {
            cardEl.dataset.originalPath = card.file.path;
        }
        
        if (card.fileName) {
            cardEl.dataset.fileName = card.fileName;
        } else if (card.file && card.file.basename) {
            cardEl.dataset.fileName = card.file.basename;
        }
        
        const titleEl = document.createElement('div');
        titleEl.className = 'card-navigator-card-title';
        titleEl.textContent = card.fileName || card.file?.basename || '제목 없음';
        cardEl.appendChild(titleEl);
        
        const contentEl = document.createElement('div');
        contentEl.className = 'card-navigator-body';
        cardEl.appendChild(contentEl);
        
        this.updateCardContent(cardEl, card);
        
        cardEl.style.position = 'absolute';
        cardEl.style.visibility = 'hidden';
        cardEl.style.opacity = '0';
        
        return cardEl;
    }
    
    private updateCardContent(cardEl: HTMLElement, card: Card): void {
        const currentContent = cardEl.getAttribute('data-content-hash');
        const newContent = this.getContentHash(card);
        
        if (currentContent === newContent) {
            return;
        }
        
        cardEl.setAttribute('data-content-hash', newContent);
        
        // 제목 업데이트
        const titleEl = cardEl.querySelector('.card-navigator-card-title');
        if (titleEl) {
            titleEl.textContent = card.fileName || card.file?.basename || '제목 없음';
        }
        
        // 내용 업데이트
        const contentEl = cardEl.querySelector('.card-navigator-body');
        if (contentEl && card.body) {
            // 내용 저장
            cardEl.dataset.content = card.body;
            
            if (this.plugin?.settings?.renderContentAsHtml) {
                let markdownContainer = contentEl.querySelector('.markdown-rendered');
                if (!markdownContainer) {
                    markdownContainer = document.createElement('div');
                    markdownContainer.className = 'markdown-rendered';
                    contentEl.appendChild(markdownContainer);
                }
                
                // 비동기 렌더링은 cardMaker.ensureCardRendered에서 처리
            } else {
                contentEl.textContent = card.body;
            }
        }
        
        // 태그 업데이트
        let tagsContainer = cardEl.querySelector('.card-navigator-card-tags');
        if (!tagsContainer) {
            tagsContainer = document.createElement('div');
            tagsContainer.className = 'card-navigator-card-tags';
            cardEl.appendChild(tagsContainer);
        } else {
            tagsContainer.innerHTML = '';
        }
        
        let tags: string[] = [];
        if (card.tags && card.tags.length > 0) {
            tags = card.tags;
        } else if (card.file && this.plugin.app.metadataCache) {
            const fileCache = this.plugin.app.metadataCache.getFileCache(card.file);
            if (fileCache && fileCache.tags) {
                tags = fileCache.tags.map(tag => tag.tag);
            }
        }
        
        if (tags.length > 0) {
            tags.forEach((tag: string) => {
                const tagEl = document.createElement('span');
                tagEl.className = 'card-navigator-card-tag';
                tagEl.textContent = tag;
                tagsContainer.appendChild(tagEl);
            });
        }
    }
    
    private getContentHash(card: Card): string {
        let tagString = '';
        if (card.tags && card.tags.length > 0) {
            tagString = card.tags.join(',');
        } else if (card.file && this.plugin.app.metadataCache) {
            const fileCache = this.plugin.app.metadataCache.getFileCache(card.file);
            if (fileCache && fileCache.tags) {
                tagString = fileCache.tags.map(tag => tag.tag).join(',');
            }
        }
        
        return `${card.id}-${card.fileName}-${card.body?.substring(0, 100)}-${tagString}`;
    }
    
    private updateCardActiveState(cardEl: HTMLElement, card: Card, activeFile?: TFile, focusedCardId?: string): void {
        if (focusedCardId && card.id === focusedCardId) {
            cardEl.classList.add('card-focused');
        } else {
            cardEl.classList.remove('card-focused');
        }
        
        if (activeFile && card.file && card.file.path === activeFile.path) {
            cardEl.classList.add('card-active');
        } else {
            cardEl.classList.remove('card-active');
        }
    }
    
    private updateCardElementsMap(cards: Card[]): void {
        const currentCardIds = new Set(cards.map(card => card.id));
        
        for (const [cardId, cardEl] of this.cardElements.entries()) {
            if (!currentCardIds.has(cardId)) {
                cardEl.remove();
                this.cardElements.delete(cardId);
                this.renderedCards.delete(cardId);
            }
        }
    }

    public getCardElement(cardId: string): HTMLElement | undefined {
        return this.cardElements.get(cardId);
    }

    public clearFocusedCards() {
        if (!this.containerEl) return;
        Array.from(this.containerEl.children).forEach((card) => {
            card.classList.remove('card-navigator-focused');
        });
    }

    public getFileFromCard(cardElement: HTMLElement, cards: Card[]): TFile | null {
        if (!this.containerEl) return null;
        const cardIndex = Array.from(this.containerEl.children).indexOf(cardElement);
        if (cardIndex !== -1 && cardIndex < cards.length) {
            return cards[cardIndex].file;
        }
        return null;
    }

    public getCardSize(): { width: number, height: number } {
        return this.layoutManager.getCardSize();
    }

    private convertMarkdownToHtml(markdown: string): string {
        if (!markdown) return '';
        
        let html = markdown;
        
        html = html.replace(/\n/g, '<br>');
        html = html.replace(/#{1,6}\s+([^\n]+)/g, (match, text) => {
            const level = match.trim().indexOf(' ');
            return `<h${level}>${text.trim()}</h${level}>`;
        });
        
        html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
        html = html.replace(/>\s+([^\n]+)/g, '<blockquote>$1</blockquote>');
        html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
        html = html.replace(/^\s*-\s+([^\n]+)/gm, '<li>$1</li>');
        html = html.replace(/<li>([^<]+)<\/li>/g, '<ul><li>$1</li></ul>');
        
        return html;
    }

    private processLinks(container: HTMLElement, filePath: string): void {
        container.querySelectorAll('a').forEach((link) => {
            if (link.href.startsWith('http')) {
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
                return;
            }
            
            link.addEventListener('click', (event) => {
                event.preventDefault();
                
                const href = link.getAttribute('href');
                if (!href) return;
                
                const basePath = filePath.substring(0, filePath.lastIndexOf('/') + 1);
                const targetPath = href.startsWith('/') ? href.substring(1) : basePath + href;
                
                const targetFile = this.plugin.app.vault.getAbstractFileByPath(targetPath);
                if (targetFile && targetFile instanceof TFile) {
                    this.plugin.app.workspace.openLinkText(targetPath, filePath);
                }
            });
        });
    }
} 