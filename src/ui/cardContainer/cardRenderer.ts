import { TFile } from 'obsidian';
import { Card, CardNavigatorSettings } from 'common/types';
import { CardMaker } from './cardMaker';
import { LayoutManager } from 'layouts/layoutManager';
import CardNavigatorPlugin from 'main';
import { CardPosition } from 'layouts/layoutStrategy';
import { CardInteractionManager } from './cardInteractionManager';

/**
 * 카드 렌더러 클래스
 * 
 * 이 클래스는 카드 렌더링을 담당합니다.
 * 카드 요소 생성, 업데이트, 배치 등의 기능을 제공합니다.
 */
export class CardRenderer {
    private container: HTMLElement;
    private settings: CardNavigatorSettings;
    private layoutManager: LayoutManager;
    private cardMaker: CardMaker;
    private cards: Card[] = [];
    private cardElements: Map<string, HTMLElement> = new Map();
    private activeCardId: string | null = null;
    private focusedCardId: string | null = null;
    private isRendering: boolean = false;
    private renderedCards: Set<string> = new Set();
    private cardInteractionManager: CardInteractionManager | null = null;
    private plugin: CardNavigatorPlugin;

    constructor(
        container: HTMLElement,
        settings: CardNavigatorSettings,
        layoutManager: LayoutManager,
        cardMaker: CardMaker,
        cardInteractionManager?: CardInteractionManager
    ) {
        this.container = container;
        this.settings = settings;
        this.layoutManager = layoutManager;
        this.cardMaker = cardMaker;
        this.cardInteractionManager = cardInteractionManager || null;
        this.plugin = this.cardMaker.getPlugin();
    }

    /**
     * 설정을 업데이트합니다.
     */
    updateSettings(settings: CardNavigatorSettings): void {
        this.settings = settings;
    }

    /**
     * 카드 목록을 설정합니다.
     */
    setCards(cards: Card[]): void {
        this.cards = cards;
    }

    /**
     * 카드를 렌더링합니다.
     * @param cards 렌더링할 카드 목록 (제공되지 않으면 현재 카드 목록 사용)
     * @param focusedCardId 포커스된 카드 ID
     * @param activeFile 활성화된 파일
     */
    async renderCards(cards?: Card[], focusedCardId?: string | null, activeFile?: TFile): Promise<void> {
        if (this.isRendering) return;
        
        try {
            this.isRendering = true;
            
            // 카드 목록 설정
            if (cards) {
                this.cards = cards;
            }
            
            // 포커스된 카드 ID 설정
            if (focusedCardId !== undefined) {
                this.focusedCardId = focusedCardId;
            }
            
            // 활성 파일이 제공되지 않은 경우 현재 활성 파일 가져오기
            if (!activeFile) {
                const currentActiveFile = this.plugin.app.workspace.getActiveFile();
                if (currentActiveFile) {
                    activeFile = currentActiveFile;
                }
            }
            
            // 활성 파일에 해당하는 카드 ID 찾기
            if (activeFile) {
                const activeCard = this.cards.find(card => card.file?.path === activeFile?.path);
                if (activeCard && activeCard.id !== this.activeCardId) {
                    this.setActiveCard(activeCard.id);
                }
            }
            
            // 레이아웃 계산이 필요한지 확인
            const needsLayoutCalculation = this.checkIfLayoutCalculationNeeded(this.cards);
            
            if (needsLayoutCalculation) {
                // 레이아웃 계산
                await new Promise<void>((resolve) => {
                    this.layoutManager.arrangeAsync(resolve);
                });
            }
            
            // 기존 카드 ID 목록 생성
            const existingCardIds = new Set<string>();
            this.cardElements.forEach((_, cardId) => {
                existingCardIds.add(cardId);
            });
            
            // 카드 렌더링
            await Promise.all(this.cards.map(async (card) => {
                existingCardIds.delete(card.id);
                
                let cardElement = this.cardElements.get(card.id);
                
                if (!cardElement) {
                    // 새 카드 요소 생성
                    cardElement = await this.createCardElement(card);
                    if (cardElement) {
                        this.cardElements.set(card.id, cardElement);
                        this.container.appendChild(cardElement);
                    }
                } else {
                    // 기존 카드 요소 업데이트
                    await this.updateCardContent(cardElement, card);
                }
                
                if (cardElement) {
                    // 카드 위치 적용
                    const position = this.layoutManager.getCardPosition(card.id);
                    if (position) {
                        this.applyCardPosition(cardElement, position);
                    }
                    
                    // 활성/포커스 상태 업데이트
                    this.updateCardActiveState(cardElement, card, activeFile, this.focusedCardId);
                }
            }));
            
            // 제거된 카드 정리
            existingCardIds.forEach(cardId => {
                const element = this.cardElements.get(cardId);
                if (element && element.parentNode === this.container) {
                    this.container.removeChild(element);
                }
                this.cardElements.delete(cardId);
            });
        } catch (error) {
            console.error('카드 렌더링 중 오류 발생:', error);
        } finally {
            this.isRendering = false;
        }
    }

    /**
     * 카드 요소를 생성합니다.
     */
    private async createCardElement(card: Card): Promise<HTMLElement> {
        const cardElement = await this.cardMaker.createCardElement(card);
        
        // 카드 클릭 이벤트 처리
        cardElement.addEventListener('click', (event) => {
            this.handleCardClick(card.id, event);
        });
        
        // 카드 상호작용 설정
        if (this.cardInteractionManager) {
            this.cardInteractionManager.setupInteractions(cardElement, card);
        }
        
        return cardElement;
    }

    /**
     * 카드 내용을 업데이트합니다.
     */
    private async updateCardContent(cardEl: HTMLElement, card: Card): Promise<void> {
        await this.cardMaker.updateCardContent(cardEl, card);
    }

    /**
     * 카드 클릭 이벤트를 처리합니다.
     */
    private handleCardClick(cardId: string, event: MouseEvent): void {
        this.setActiveCard(cardId);
        
        // 클릭 이벤트 발생
        const clickEvent = new CustomEvent('cardClick', {
            detail: { cardId, originalEvent: event }
        });
        this.container.dispatchEvent(clickEvent);
    }

    /**
     * 활성 카드를 설정합니다.
     */
    setActiveCard(cardId: string | null): void {
        if (this.activeCardId === cardId) return;
        
        console.log(`[CardRenderer] 활성 카드 설정: ${cardId}`);
        
        // 이전 활성 카드 비활성화
        if (this.activeCardId) {
            const prevActiveElement = this.cardElements.get(this.activeCardId);
            if (prevActiveElement) {
                // 모든 활성 클래스 제거
                prevActiveElement.classList.remove('card-active');
                prevActiveElement.classList.remove('card-navigator-active');
                
                // 레이아웃 스타일 비활성화
                this.layoutManager.applyCardActiveStyle(prevActiveElement, false);
                
                // 이전 활성 카드의 스타일 속성 초기화
                prevActiveElement.style.removeProperty('box-shadow');
                prevActiveElement.style.removeProperty('z-index');
                prevActiveElement.style.removeProperty('transform');
                prevActiveElement.style.removeProperty('transition');
                
                // 내부 요소들의 색상 초기화
                const elements = prevActiveElement.querySelectorAll('.card-navigator-filename, .card-navigator-first-header, .card-navigator-body, .markdown-rendered');
                elements.forEach(el => {
                    (el as HTMLElement).style.removeProperty('color');
                });
            }
        }
        
        this.activeCardId = cardId;
        
        // 새 활성 카드 활성화
        if (cardId) {
            const newActiveElement = this.cardElements.get(cardId);
            if (newActiveElement) {
                // 활성 클래스 추가
                newActiveElement.classList.add('card-active');
                newActiveElement.classList.add('card-navigator-active');
                
                // 레이아웃 스타일 활성화
                this.layoutManager.applyCardActiveStyle(newActiveElement, true);
                
                // 활성 카드에 특별한 스타일 적용
                newActiveElement.style.boxShadow = '0 0 0 2px var(--interactive-accent)';
                newActiveElement.style.zIndex = '10'; // 다른 카드보다 위에 표시
            }
        }
    }

    /**
     * 포커스 카드를 설정합니다.
     */
    setFocusedCard(cardId: string | null): void {
        if (this.focusedCardId === cardId) return;
        
        // 이전 포커스 카드 포커스 해제
        if (this.focusedCardId) {
            const prevFocusedElement = this.cardElements.get(this.focusedCardId);
            if (prevFocusedElement) {
                this.layoutManager.applyCardFocusStyle(prevFocusedElement, false);
            }
        }
        
        this.focusedCardId = cardId;
        
        // 새 포커스 카드 포커스 설정
        if (cardId) {
            const newFocusedElement = this.cardElements.get(cardId);
            if (newFocusedElement) {
                this.layoutManager.applyCardFocusStyle(newFocusedElement, true);
            }
        }
    }

    /**
     * 카드 요소를 가져옵니다.
     */
    public getCardElement(cardId: string): HTMLElement | undefined {
        return this.cardElements.get(cardId);
    }

    /**
     * 모든 카드 요소를 가져옵니다.
     */
    getAllCardElements(): Map<string, HTMLElement> {
        return this.cardElements;
    }

    /**
     * 활성 카드 ID를 가져옵니다.
     * @returns 활성 카드 ID 또는 null
     */
    getActiveCardId(): string | null {
        return this.activeCardId;
    }

    /**
     * 포커스된 카드 ID를 가져옵니다.
     */
    getFocusedCardId(): string | null {
        return this.focusedCardId;
    }

    /**
     * 카드 요소를 새로고침합니다.
     */
    async refreshCardElement(cardId: string): Promise<void> {
        const card = this.cards.find(c => c.id === cardId);
        const cardElement = this.cardElements.get(cardId);
        
        if (card && cardElement) {
            await this.updateCardContent(cardElement, card);
        }
    }

    /**
     * 모든 카드를 새로고침합니다.
     */
    async refreshAllCards(): Promise<void> {
        await this.renderCards();
    }

    /**
     * 카드 상호작용 관리자를 설정합니다.
     */
    public setCardInteractionManager(cardInteractionManager: CardInteractionManager): void {
        this.cardInteractionManager = cardInteractionManager;
    }

    /**
     * 카드 설정을 업데이트합니다.
     */
    public updateCardSettings(alignCardHeight: boolean, cardsPerColumn: number): void {
        this.layoutManager.updateCardSettings(alignCardHeight, cardsPerColumn);
    }

    /**
     * 리소스를 정리합니다.
     */
    public cleanup(): void {
        if (this.container) {
            this.container.empty();
            this.resetCardElements();
        }
    }

    /**
     * 카드 요소를 초기화합니다.
     */
    public resetCardElements(): void {
        this.cardElements.forEach((element) => {
            if (element && element.parentNode) {
                element.remove();
            }
        });
        
        this.cardElements.clear();
        this.renderedCards.clear();
        
        if (this.container) {
            const remainingCards = this.container.querySelectorAll('.card-navigator-card');
            remainingCards.forEach(card => card.remove());
        }
    }

    /**
     * 포커스된 카드를 초기화합니다.
     */
    public clearFocusedCards() {
        if (!this.container) return;
        Array.from(this.container.children).forEach((card) => {
            card.classList.remove('card-navigator-focused');
        });
    }

    /**
     * 카드 요소에서 파일을 가져옵니다.
     */
    public getFileFromCard(cardElement: HTMLElement, cards: Card[]): TFile | null {
        if (!this.container) return null;
        const cardIndex = Array.from(this.container.children).indexOf(cardElement);
        if (cardIndex !== -1 && cardIndex < cards.length) {
            return cards[cardIndex].file;
        }
        return null;
    }

    /**
     * 카드 크기를 가져옵니다.
     */
    public getCardSize(): { width: number, height: number } {
        const size = this.layoutManager.getCardSize();
        return { 
            width: size.width, 
            height: typeof size.height === 'number' ? size.height : 0 
        };
    }

    /**
     * 카드의 활성 상태를 업데이트합니다.
     */
    private updateCardActiveState(cardEl: HTMLElement, card: Card, activeFile?: TFile, focusedCardId?: string | null): void {
        const isActive = activeFile !== undefined && card.file !== null && card.file !== undefined && card.file.path === activeFile.path;
        const isFocused = focusedCardId !== undefined && focusedCardId !== null && card.id === focusedCardId;
        
        // 포커스 상태 업데이트
        if (isFocused) {
            cardEl.classList.add('card-focused');
            cardEl.classList.add('card-navigator-focused');
        } else {
            cardEl.classList.remove('card-focused');
            cardEl.classList.remove('card-navigator-focused');
        }
        
        // 활성 상태 업데이트
        if (isActive) {
            cardEl.classList.add('card-active');
            cardEl.classList.add('card-navigator-active');
            
            // 활성 카드에 특별한 스타일 적용
            cardEl.style.boxShadow = '0 0 0 2px var(--interactive-accent)';
            cardEl.style.zIndex = '10';
        } else {
            cardEl.classList.remove('card-active');
            cardEl.classList.remove('card-navigator-active');
            
            // 활성 카드가 아닌 경우 스타일 속성 초기화
            cardEl.style.removeProperty('box-shadow');
            cardEl.style.removeProperty('z-index');
        }
        
        // 레이아웃 스타일 적용
        if (this.layoutManager) {
            this.layoutManager.applyCardActiveStyle(cardEl, isActive === true);
            this.layoutManager.applyCardFocusStyle(cardEl, isFocused === true);
        }
    }

    /**
     * 마크다운 내용을 렌더링합니다.
     */
    private async renderMarkdownContent(container: Element, content: string): Promise<void> {
        try {
            container.empty();
            // Obsidian API를 사용하여 마크다운 렌더링
            await this.plugin.app.workspace.trigger('markdown:render', content, container, '', this.plugin);
        } catch (error) {
            console.error('마크다운 렌더링 중 오류 발생:', error);
            container.textContent = content;
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

    /**
     * 레이아웃 계산이 필요한지 확인합니다.
     */
    private checkIfLayoutCalculationNeeded(cards: Card[]): boolean {
        return this.layoutManager.isLayoutCalculationNeeded();
    }

    /**
     * 카드 위치를 적용합니다.
     */
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

    /**
     * 화면에 보이는 카드만 렌더링합니다.
     * 성능 최적화를 위해 사용됩니다.
     */
    async renderVisibleCards(): Promise<void> {
        if (this.isRendering) return;
        
        try {
            this.isRendering = true;
            
            // 컨테이너의 뷰포트 영역 계산
            const containerRect = this.container.getBoundingClientRect();
            
            // 화면에 보이는 카드만 렌더링
            await Promise.all(this.cards.map(async (card) => {
                const cardElement = this.cardElements.get(card.id);
                if (!cardElement) return;
                
                // 카드가 화면에 보이는지 확인
                const cardRect = cardElement.getBoundingClientRect();
                const isVisible = (
                    cardRect.top < containerRect.bottom &&
                    cardRect.bottom > containerRect.top &&
                    cardRect.left < containerRect.right &&
                    cardRect.right > containerRect.left
                );
                
                // 화면에 보이는 카드만 업데이트
                if (isVisible) {
                    await this.updateCardContent(cardElement, card);
                    
                    // 카드 위치 적용
                    const position = this.layoutManager.getCardPosition(card.id);
                    if (position) {
                        this.applyCardPosition(cardElement, position);
                    }
                }
            }));
        } catch (error) {
            console.error('화면에 보이는 카드 렌더링 중 오류 발생:', error);
        } finally {
            this.isRendering = false;
        }
    }
} 