import { TFile } from 'obsidian';
import { Card, CardNavigatorSettings } from 'common/types';
import { CardMaker } from './cardMaker';
import { LayoutManager } from 'layouts/layoutManager';
import CardNavigatorPlugin from 'main';
import { CardPosition } from 'common/interface';
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
    
    // 가상 스크롤링을 위한 속성 추가
    private visibleCardIds: Set<string> = new Set();
    private scrollHandler: () => void;
    private resizeObserver: ResizeObserver | null = null;
    private renderThrottleTimeout: NodeJS.Timeout | null = null;
    private lastScrollPosition: { top: number, left: number } = { top: 0, left: 0 };
    private isScrolling: boolean = false;
    private scrollEndTimeout: NodeJS.Timeout | null = null;
    private cardPositionCache: Map<string, CardPosition> = new Map();
    private visibilityMargin: number = 200; // 화면 밖에서도 미리 로드할 여백 픽셀

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
        
        // 스크롤 이벤트 핸들러 정의
        this.scrollHandler = this.throttle(() => {
            this.handleScroll();
        }, 100);
        
        // 스크롤 이벤트 리스너 등록
        this.container.addEventListener('scroll', this.scrollHandler);
        
        // ResizeObserver 설정
        this.setupResizeObserver();
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
        if (this.isRendering) {
            console.log('[CardRenderer] 이미 렌더링 중입니다. 요청 무시');
            return;
        }
        
        try {
            this.isRendering = true;
            console.log('[CardRenderer] 카드 렌더링 시작');
            const startTime = performance.now();
            
            // 카드 목록 설정
            if (cards) {
                this.cards = cards;
                // 카드 목록이 변경되면 캐시 초기화
                this.cardPositionCache.clear();
            }
            
            // 카드가 없으면 빠르게 종료
            if (!this.cards.length) {
                console.log('[CardRenderer] 렌더링할 카드가 없습니다.');
                return;
            }
            
            console.log(`[CardRenderer] 렌더링할 카드 수: ${this.cards.length}`);
            
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
            const needsLayoutCalculation = this.layoutManager.isLayoutCalculationNeeded();
            
            if (needsLayoutCalculation) {
                console.log('[CardRenderer] 레이아웃 계산 시작');
                const layoutStartTime = performance.now();
                
                // 레이아웃 계산
                await new Promise<void>((resolve) => {
                    this.layoutManager.arrangeAsync(resolve);
                });
                
                // 레이아웃 계산 후 카드 위치 캐시 업데이트
                this.cards.forEach(card => {
                    const position = this.layoutManager.getCardPosition(card.id);
                    if (position) {
                        this.cardPositionCache.set(card.id, position);
                    }
                });
                
                console.log(`[CardRenderer] 레이아웃 계산 완료 (${Math.round(performance.now() - layoutStartTime)}ms)`);
            }
            
            // 가상 스크롤링 사용 - 화면에 보이는 카드만 렌더링
            this.calculateVisibleCards();
            
            // 기존 카드 ID 목록 생성
            const existingCardIds = new Set<string>();
            this.cardElements.forEach((_, cardId) => {
                existingCardIds.add(cardId);
            });
            
            // 카드 렌더링 - 배치 처리로 성능 최적화
            const BATCH_SIZE = 10; // 한 번에 처리할 카드 수
            const visibleCards = this.cards.filter(card => this.visibleCardIds.has(card.id));
            
            console.log(`[CardRenderer] 화면에 보이는 카드 수: ${visibleCards.length}`);
            
            for (let i = 0; i < visibleCards.length; i += BATCH_SIZE) {
                const batch = visibleCards.slice(i, i + BATCH_SIZE);
                
                // 각 배치를 병렬로 처리
                await Promise.all(batch.map(async (card) => {
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
                        // 기존 카드 요소 업데이트 - 스크롤 중에는 최소한의 업데이트만 수행
                        if (!this.isScrolling) {
                            await this.updateCardContent(cardElement, card);
                        }
                    }
                    
                    if (cardElement) {
                        // 카드 위치 적용 - 캐시된 위치 사용
                        const position = this.cardPositionCache.get(card.id) || this.layoutManager.getCardPosition(card.id);
                        if (position) {
                            this.applyCardPosition(cardElement, position);
                            cardElement.style.visibility = 'visible';
                        }
                        
                        // 활성/포커스 상태 업데이트
                        this.updateCardActiveState(cardElement, card, activeFile, this.focusedCardId);
                    }
                }));
                
                // 배치 처리 사이에 UI 업데이트를 위한 짧은 지연
                if (i + BATCH_SIZE < visibleCards.length) {
                    await new Promise(resolve => setTimeout(resolve, 0));
                }
            }
            
            // 화면에 보이지 않는 카드는 숨김 처리
            this.cardElements.forEach((element, cardId) => {
                if (!this.visibleCardIds.has(cardId) && !existingCardIds.has(cardId)) {
                    element.style.visibility = 'hidden';
                }
            });
            
            // 제거된 카드 정리 - 실제 DOM에서 제거하지 않고 숨김 처리
            existingCardIds.forEach(cardId => {
                const element = this.cardElements.get(cardId);
                if (element) {
                    // DOM에서 완전히 제거하는 대신 숨김 처리
                    element.style.visibility = 'hidden';
                    
                    // 카드가 더 이상 존재하지 않는 경우에만 제거
                    if (!this.cards.some(card => card.id === cardId)) {
                        if (element.parentNode === this.container) {
                            this.container.removeChild(element);
                        }
                        this.cardElements.delete(cardId);
                    }
                }
            });
            
            console.log(`[CardRenderer] 카드 렌더링 완료 (${Math.round(performance.now() - startTime)}ms)`);
            
            // 스크롤 중이 아닐 때 고품질 렌더링 수행
            if (!this.isScrolling) {
                setTimeout(() => {
                    this.renderVisibleCardsHighQuality();
                }, 100);
            }
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
            // 스크롤 이벤트 리스너 제거
            this.container.removeEventListener('scroll', this.scrollHandler);
            
            // ResizeObserver 정리
            if (this.resizeObserver) {
                this.resizeObserver.disconnect();
                this.resizeObserver = null;
            }
            
            // 타임아웃 정리
            if (this.renderThrottleTimeout) {
                clearTimeout(this.renderThrottleTimeout);
                this.renderThrottleTimeout = null;
            }
            
            if (this.scrollEndTimeout) {
                clearTimeout(this.scrollEndTimeout);
                this.scrollEndTimeout = null;
            }
            
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
    private updateCardActiveState(cardEl: HTMLElement, card: Card, activeFile?: TFile | null, focusedCardId?: string | null): void {
        // 카드 ID 가져오기
        const cardId = card.id;
        
        // 활성 카드 여부 확인
        let isActive = false;
        if (activeFile && card.file) {
            isActive = activeFile.path === card.file.path;
        }
        
        // 포커스된 카드 여부 확인
        const isFocused = focusedCardId === cardId;
        
        // 활성 카드 클래스 토글
        cardEl.toggleClass('is-active', isActive);
        
        // 포커스된 카드 클래스 토글
        cardEl.toggleClass('is-focused', isFocused);
        
        // 활성 카드 ID 업데이트
        if (isActive && this.activeCardId !== cardId) {
            this.activeCardId = cardId;
        } else if (!isActive && this.activeCardId === cardId) {
            this.activeCardId = null;
        }
        
        // 포커스된 카드 ID 업데이트
        if (isFocused && this.focusedCardId !== cardId) {
            this.focusedCardId = cardId;
        } else if (!isFocused && this.focusedCardId === cardId) {
            this.focusedCardId = null;
        }
        
        // 레이아웃 매니저를 통해 스타일 적용
        this.layoutManager.applyCardActiveStyle(cardEl, isActive);
        this.layoutManager.applyCardFocusStyle(cardEl, isFocused);
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
        // 새로운 가상 스크롤링 메서드 사용
        this.updateVisibleCards();
    }

    /**
     * 모든 카드 요소를 제거합니다.
     * 활성 폴더 변경 시 이전 카드를 즉시 제거하기 위해 사용됩니다.
     */
    public clearAllCards(): void {
        console.log('[CardRenderer] 모든 카드 요소 제거');
        
        // 컨테이너 요소가 있으면 카드 요소만 제거
        if (this.container) {
            const cardElements = this.container.querySelectorAll('.card-navigator-card');
            cardElements.forEach(el => el.remove());
        }
        
        // 카드 요소 맵 초기화
        this.cardElements.clear();
        
        // 활성 카드와 포커스된 카드 초기화
        this.activeCardId = null;
        this.focusedCardId = null;
    }

    /**
     * 스로틀 함수 - 짧은 시간 내에 여러 번 호출되는 함수의 실행 빈도를 제한합니다.
     */
    private throttle(func: Function, delay: number): () => void {
        let lastCall = 0;
        return () => {
            const now = Date.now();
            if (now - lastCall >= delay) {
                lastCall = now;
                func();
            }
        };
    }

    /**
     * ResizeObserver를 설정합니다.
     */
    private setupResizeObserver(): void {
        if (typeof ResizeObserver !== 'undefined') {
            this.resizeObserver = new ResizeObserver(this.throttle(() => {
                this.updateVisibleCards();
            }, 200));
            
            this.resizeObserver.observe(this.container);
        }
    }

    /**
     * 스크롤 이벤트를 처리합니다.
     */
    private handleScroll(): void {
        // 현재 스크롤 위치 저장
        const currentScrollTop = this.container.scrollTop;
        const currentScrollLeft = this.container.scrollLeft;
        
        // 스크롤 위치가 변경되었는지 확인
        if (currentScrollTop !== this.lastScrollPosition.top || 
            currentScrollLeft !== this.lastScrollPosition.left) {
            
            // 스크롤 위치 업데이트
            this.lastScrollPosition = { 
                top: currentScrollTop, 
                left: currentScrollLeft 
            };
            
            // 스크롤 중 플래그 설정
            this.isScrolling = true;
            
            // 가시성 업데이트
            this.updateVisibleCards();
            
            // 스크롤 종료 감지를 위한 타임아웃 설정
            if (this.scrollEndTimeout) {
                clearTimeout(this.scrollEndTimeout);
            }
            
            this.scrollEndTimeout = setTimeout(() => {
                this.isScrolling = false;
                this.onScrollEnd();
            }, 150);
        }
    }

    /**
     * 스크롤이 끝났을 때 호출됩니다.
     */
    private onScrollEnd(): void {
        // 스크롤이 끝나면 보이는 카드의 내용을 더 높은 품질로 렌더링
        this.renderVisibleCardsHighQuality();
    }

    /**
     * 화면에 보이는 카드를 고품질로 렌더링합니다.
     */
    private async renderVisibleCardsHighQuality(): Promise<void> {
        if (this.isRendering) return;
        
        try {
            this.isRendering = true;
            
            // 보이는 카드만 고품질로 렌더링
            const promises = Array.from(this.visibleCardIds).map(async (cardId) => {
                const card = this.cards.find(c => c.id === cardId);
                const cardElement = this.cardElements.get(cardId);
                
                if (card && cardElement) {
                    // 카드 내용 업데이트 (고품질 렌더링)
                    await this.updateCardContent(cardElement, card);
                }
            });
            
            await Promise.all(promises);
        } catch (error) {
            console.error('고품질 카드 렌더링 중 오류 발생:', error);
        } finally {
            this.isRendering = false;
        }
    }

    /**
     * 화면에 보이는 카드를 업데이트합니다.
     */
    private updateVisibleCards(): void {
        if (this.isRendering) return;
        
        // 렌더링 스로틀링
        if (this.renderThrottleTimeout) {
            clearTimeout(this.renderThrottleTimeout);
        }
        
        this.renderThrottleTimeout = setTimeout(() => {
            this.calculateVisibleCards();
            this.renderOnlyVisibleCards();
        }, this.isScrolling ? 100 : 0); // 스크롤 중이면 지연 적용
    }

    /**
     * 화면에 보이는 카드를 계산합니다.
     */
    private calculateVisibleCards(): void {
        // 이전 가시성 상태 저장
        const prevVisibleCardIds = new Set(this.visibleCardIds);
        this.visibleCardIds.clear();
        
        // 컨테이너의 뷰포트 영역 계산
        const containerRect = this.container.getBoundingClientRect();
        const extendedRect = {
            top: containerRect.top - this.visibilityMargin,
            bottom: containerRect.bottom + this.visibilityMargin,
            left: containerRect.left - this.visibilityMargin,
            right: containerRect.right + this.visibilityMargin
        };
        
        // 각 카드의 가시성 확인
        this.cards.forEach(card => {
            const position = this.layoutManager.getCardPosition(card.id);
            if (!position) return;
            
            // 카드 위치 캐싱
            this.cardPositionCache.set(card.id, position);
            
            // 카드의 화면상 위치 계산
            const cardRect = {
                top: containerRect.top + position.top - this.container.scrollTop,
                bottom: containerRect.top + position.top + (typeof position.height === 'number' ? position.height : 0) - this.container.scrollTop,
                left: containerRect.left + position.left - this.container.scrollLeft,
                right: containerRect.left + position.left + position.width - this.container.scrollLeft
            };
            
            // 카드가 화면에 보이는지 확인
            const isVisible = (
                cardRect.bottom >= extendedRect.top &&
                cardRect.top <= extendedRect.bottom &&
                cardRect.right >= extendedRect.left &&
                cardRect.left <= extendedRect.right
            );
            
            if (isVisible) {
                this.visibleCardIds.add(card.id);
            }
        });
        
        // 가시성 변경 로깅
        const newlyVisible = Array.from(this.visibleCardIds).filter(id => !prevVisibleCardIds.has(id));
        const newlyHidden = Array.from(prevVisibleCardIds).filter(id => !this.visibleCardIds.has(id));
        
        if (newlyVisible.length > 0 || newlyHidden.length > 0) {
            console.log(`[CardRenderer] 가시성 변경: ${this.visibleCardIds.size}개 카드 보임, ${newlyVisible.length}개 새로 보임, ${newlyHidden.length}개 숨겨짐`);
        }
    }

    /**
     * 화면에 보이는 카드만 렌더링합니다.
     */
    private async renderOnlyVisibleCards(): Promise<void> {
        if (this.isRendering) return;
        
        try {
            this.isRendering = true;
            
            // 화면에 보이는 카드만 처리
            for (const cardId of this.visibleCardIds) {
                const card = this.cards.find(c => c.id === cardId);
                if (!card) continue;
                
                let cardElement = this.cardElements.get(cardId);
                
                if (!cardElement) {
                    // 새 카드 요소 생성
                    cardElement = await this.createCardElement(card);
                    if (cardElement) {
                        this.cardElements.set(cardId, cardElement);
                        this.container.appendChild(cardElement);
                        
                        // 카드 위치 적용
                        const position = this.cardPositionCache.get(cardId) || this.layoutManager.getCardPosition(cardId);
                        if (position) {
                            this.applyCardPosition(cardElement, position);
                        }
                        
                        // 활성/포커스 상태 업데이트
                        const activeFile = this.plugin.app.workspace.getActiveFile();
                        this.updateCardActiveState(cardElement, card, activeFile, this.focusedCardId);
                    }
                } else {
                    // 카드가 이미 존재하면 위치만 업데이트
                    const position = this.cardPositionCache.get(cardId) || this.layoutManager.getCardPosition(cardId);
                    if (position) {
                        this.applyCardPosition(cardElement, position);
                    }
                }
            }
            
            // 스크롤 중이 아닐 때만 화면 밖 카드 처리
            if (!this.isScrolling) {
                // 화면에 보이지 않는 카드는 DOM에서 제거하지 않고 숨김 처리
                this.cardElements.forEach((element, cardId) => {
                    if (!this.visibleCardIds.has(cardId)) {
                        // 화면 밖으로 이동시키는 대신 visibility 속성 사용
                        element.style.visibility = 'hidden';
                    } else {
                        element.style.visibility = 'visible';
                    }
                });
            }
        } catch (error) {
            console.error('가시 카드 렌더링 중 오류 발생:', error);
        } finally {
            this.isRendering = false;
        }
    }
}