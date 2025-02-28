import { TFile } from 'obsidian';
import { Card } from 'common/types';
import { CardMaker } from './cardMaker';
import { LayoutManager } from 'layouts/layoutManager';
import CardNavigatorPlugin from 'main';
import { CardPosition } from 'layouts/layoutStrategy';
import { CardInteractionManager } from './cardInteractionManager';

/**
 * 카드 렌더러 클래스
 */
export class CardRenderer {
    private renderedCards: Set<string> = new Set();
    private cardElements: Map<string, HTMLElement> = new Map();
    private isInitialized: boolean = false;
    private cardInteractionManager: CardInteractionManager | null = null;

    constructor(
        private containerEl: HTMLElement,
        private cardMaker: CardMaker,
        private layoutManager: LayoutManager,
        private plugin: CardNavigatorPlugin,
        cardInteractionManager?: CardInteractionManager
    ) {
        this.isInitialized = true;
        this.cardInteractionManager = cardInteractionManager || null;
    }

    public setCardInteractionManager(cardInteractionManager: CardInteractionManager): void {
        this.cardInteractionManager = cardInteractionManager;
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

    /**
     * 카드 목록을 렌더링합니다.
     * @param cards 렌더링할 카드 목록
     * @param focusedCardId 포커스된 카드 ID
     * @param activeFile 활성화된 파일
     */
    public async renderCards(cards: Card[], focusedCardId?: string | null, activeFile?: TFile): Promise<void> {
        if (!this.containerEl || !this.isInitialized) {
            return;
        }
        
        try {
            // 레이아웃 계산이 필요한지 확인
            const needsLayoutCalculation = this.checkIfLayoutCalculationNeeded(cards);
            
            if (needsLayoutCalculation) {
                // 레이아웃 계산
                this.layoutManager.calculateLayout(cards);
            }
            
            // 카드 렌더링
            const batchSize = 10;
            await this.renderCardsBatched(cards, 0, batchSize, focusedCardId, activeFile);
            
            // 컨테이너 크기 업데이트
            const containerSize = this.layoutManager.getLayoutConfig().getContainerSize();
            if (containerSize) {
                this.containerEl.style.height = `${containerSize.height}px`;
                this.containerEl.style.width = `${containerSize.width}px`;
            }
            
            // 더 이상 표시되지 않는 카드 제거
            this.removeUnusedCards(cards);
        } catch (error) {
            console.error('카드 렌더링 중 오류 발생:', error);
        }
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
    
    private async renderCardsBatched(
        cards: Card[], 
        startIndex: number, 
        batchSize: number, 
        focusedCardId?: string | null, 
        activeFile?: TFile
    ): Promise<void> {
        const endIndex = Math.min(startIndex + batchSize, cards.length);
        const batch = cards.slice(startIndex, endIndex);
        
        for (const card of batch) {
            try {
                const position = this.layoutManager.getCardPosition(card.id);
                if (position) {
                    const cardElement = await this.getOrCreateCardElement(card);
                    this.applyCardPosition(cardElement, position);
                    this.updateCardActiveState(cardElement, card, activeFile, focusedCardId?.toString());
                    
                    // 카드 상호작용 설정
                    if (this.cardInteractionManager) {
                        this.cardInteractionManager.setupInteractions(cardElement, card);
                    }
                    
                    this.renderedCards.add(card.id);
                }
            } catch (error) {
                // 오류 무시하고 계속 진행
                console.error('카드 렌더링 중 오류:', error);
            }
        }
        
        if (endIndex < cards.length) {
            requestAnimationFrame(async () => {
                await this.renderCardsBatched(cards, endIndex, batchSize, focusedCardId, activeFile);
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


    private async getOrCreateCardElement(card: Card): Promise<HTMLElement> {
        if (this.cardElements.has(card.id)) {
            const existingElement = this.cardElements.get(card.id);
            if (existingElement) {
                await this.updateCardContent(existingElement, card);
                return existingElement;
            }
        }
        
        const cardEl = document.createElement('div');
        cardEl.className = 'card-navigator-card';
        cardEl.dataset.cardId = card.id;
        cardEl.draggable = true;
        
        this.containerEl.appendChild(cardEl);
        this.cardElements.set(card.id, cardEl);
        
        // 제목 요소 추가
        const titleEl = document.createElement('div');
        titleEl.className = 'card-navigator-card-title';
        titleEl.textContent = card.fileName || card.file?.basename || '제목 없음';
        cardEl.appendChild(titleEl);
        
        // 내용 요소 추가
        const contentEl = document.createElement('div');
        contentEl.className = 'card-navigator-body';
        cardEl.appendChild(contentEl);
        
        // 태그 컨테이너 추가 (내용 요소 다음에 추가하여 하단에 표시)
        const tagsEl = document.createElement('div');
        tagsEl.className = 'card-navigator-card-tags';
        tagsEl.style.marginTop = 'auto'; // 자동 마진으로 하단에 배치
        cardEl.appendChild(tagsEl);
        
        await this.updateCardContent(cardEl, card);
        
        cardEl.style.position = 'absolute';
        cardEl.style.visibility = 'hidden';
        cardEl.style.opacity = '0';
        
        return cardEl;
    }
    
    private async updateCardContent(cardEl: HTMLElement, card: Card): Promise<void> {
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
            // 마크다운 내용 준비
            let markdownContent = '';
            
            // 첫 번째 헤더가 있으면 추가
            if (card.firstHeader && card.firstHeader.trim() !== '') {
                markdownContent += `## ${card.firstHeader}\n\n`;
            }
            
            // 본문 추가
            markdownContent += card.body;
            
            // 내용 저장
            cardEl.dataset.content = markdownContent;
            
            if (this.plugin?.settings?.renderContentAsHtml) {
                let markdownContainer = contentEl.querySelector('.markdown-rendered');
                if (!markdownContainer) {
                    markdownContainer = document.createElement('div');
                    markdownContainer.className = 'markdown-rendered';
                    contentEl.appendChild(markdownContainer);
                }
                
                // 비동기 렌더링은 cardMaker.ensureCardRendered에서 처리
                await this.cardMaker.ensureCardRendered(cardEl);
            } else {
                contentEl.textContent = markdownContent;
            }
        }
        
        // 태그 업데이트
        const tagsEl = cardEl.querySelector('.card-navigator-card-tags');
        if (tagsEl && card.file) {
            tagsEl.innerHTML = '';
            
            const fileCache = this.plugin.app.metadataCache.getFileCache(card.file);
            if (fileCache) {
                // 태그 목록 초기화
                let tags: { tag: string }[] = [];
                
                // 인라인 태그 추출 (#태그)
                if (fileCache.tags) {
                    tags = [...fileCache.tags];
                }
                
                // frontmatter에서 태그 추출
                if (fileCache.frontmatter) {
                    // tags 배열 형태로 정의된 태그 추출
                    const frontmatterTags = fileCache.frontmatter.tags;
                    if (frontmatterTags) {
                        if (Array.isArray(frontmatterTags)) {
                            // 배열인 경우 각 항목을 태그로 추가
                            frontmatterTags.forEach(tag => {
                                // 태그가 문자열인지 확인
                                if (typeof tag === 'string') {
                                    // '#' 접두사가 없으면 추가
                                    const formattedTag = tag.startsWith('#') ? tag : `#${tag}`;
                                    // 중복 확인
                                    if (!tags.some(t => t.tag === formattedTag)) {
                                        tags.push({ tag: formattedTag });
                                    }
                                }
                            });
                        } else if (typeof frontmatterTags === 'string') {
                            // 쉼표로 구분된 문자열인 경우 분리하여 추가
                            const tagArray = frontmatterTags.split(',').map(t => t.trim());
                            tagArray.forEach(tag => {
                                if (tag) {
                                    const formattedTag = tag.startsWith('#') ? tag : `#${tag}`;
                                    if (!tags.some(t => t.tag === formattedTag)) {
                                        tags.push({ tag: formattedTag });
                                    }
                                }
                            });
                        }
                    }
                    
                    // tag 단일 값으로 정의된 태그 추출
                    const frontmatterTag = fileCache.frontmatter.tag;
                    if (frontmatterTag && typeof frontmatterTag === 'string') {
                        // 쉼표로 구분된 문자열인 경우 분리하여 추가
                        const tagArray = frontmatterTag.split(',').map(t => t.trim());
                        tagArray.forEach(tag => {
                            if (tag) {
                                const formattedTag = tag.startsWith('#') ? tag : `#${tag}`;
                                if (!tags.some(t => t.tag === formattedTag)) {
                                    tags.push({ tag: formattedTag });
                                }
                            }
                        });
                    }
                }
                
                // 태그 렌더링
                tags.forEach(tag => {
                    const tagEl = document.createElement('span');
                    tagEl.className = 'card-navigator-card-tag';
                    tagEl.textContent = tag.tag;
                    
                    // 태그 클릭 이벤트 추가
                    tagEl.addEventListener('click', (event) => {
                        // 이벤트 버블링 방지
                        event.stopPropagation();
                        event.preventDefault();
                        
                        // 태그 이름에서 '#' 제거
                        const tagName = tag.tag.replace('#', '');
                        
                        // 검색 이벤트 발생
                        this.triggerTagSearch(tagName);
                    });
                    
                    tagsEl.appendChild(tagEl);
                });
            }
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

    /**
     * 더 이상 표시되지 않는 카드를 제거합니다.
     */
    private removeUnusedCards(cards: Card[]): void {
        const currentCardIds = new Set(cards.map(card => card.id));
        
        // 현재 표시된 카드 중 더 이상 필요하지 않은 카드 제거
        for (const [cardId, cardEl] of this.cardElements.entries()) {
            if (!currentCardIds.has(cardId)) {
                cardEl.remove();
                this.cardElements.delete(cardId);
                this.renderedCards.delete(cardId);
            }
        }
    }

    /**
     * 태그 검색 트리거 메서드
     * @param tagName 태그 이름
     */
    private triggerTagSearch(tagName: string): void {
        // 커스텀 이벤트 생성
        const event = new CustomEvent('card-navigator-tag-search', {
            detail: { tagName }
        });
        
        // 이벤트 발생
        document.dispatchEvent(event);
    }
} 