import { TFile } from 'obsidian';
import { Card, CardNavigatorSettings } from 'common/types';
import { CardMaker } from './cardMaker';
import { LayoutStrategy, CardPosition } from 'layouts/layoutStrategy';
import { LayoutManager } from 'layouts/layoutManager';
import CardNavigatorPlugin from 'main';

export class CardRenderer {
    private layoutStrategy: LayoutStrategy;
    private renderedCards: Set<string> = new Set(); // 렌더링된 카드 추적
    private renderingInProgress: boolean = false;
    private pendingRender: boolean = false;

    //#region 초기화 및 기본 설정
    // 생성자: 카드 렌더러 초기화
    constructor(
        private containerEl: HTMLElement,
        private cardMaker: CardMaker,
        private layoutManager: LayoutManager,
        private plugin: CardNavigatorPlugin
    ) {
        this.layoutStrategy = layoutManager.getLayoutStrategy();
    }

    // 레이아웃 전략 설정 메서드
    public setLayoutStrategy(layoutStrategy: LayoutStrategy) {
        this.layoutStrategy = layoutStrategy;
    }

    /**
     * 리소스 정리
     */
    public cleanup(): void {
        // 이벤트 리스너 제거 등 필요한 정리 작업 수행
        if (this.containerEl) {
            this.containerEl.innerHTML = '';
        }
    }
    //#endregion

    //#region 카드 렌더링
    /**
     * 카드를 렌더링합니다.
     */
    public renderCards(cards: Card[], focusedCardId: string | null = null, activeFile: TFile | null = null): void {
        if (!this.containerEl) return;
        
        // 렌더링 상태 업데이트
        this.renderingInProgress = true;
        
        // 현재 스크롤 위치 저장
        const scrollContainer = this.containerEl.closest('.card-navigator-scroll-container') as HTMLElement;
        const scrollLeft = scrollContainer ? scrollContainer.scrollLeft : 0;
        const scrollTop = scrollContainer ? scrollContainer.scrollTop : 0;
        
        // 기존 카드 요소 맵 생성
        const existingCardElements = new Map<string, HTMLElement>();
        this.containerEl.querySelectorAll('.card-navigator-card').forEach((element) => {
            const cardEl = element as HTMLElement;
            const cardId = cardEl.getAttribute('data-card-id');
            if (cardId) {
                existingCardElements.set(cardId, cardEl);
            }
        });
        
        // 카드 위치 계산
        const containerWidth = this.containerEl.offsetWidth;
        const containerHeight = this.containerEl.offsetHeight;
        const cardPositions = this.layoutManager.arrangeCards(cards, containerWidth, containerHeight);
        
        // 레이아웃 타입 가져오기
        const layoutType = this.layoutStrategy.getLayoutType();
        
        // 새로운 카드 ID 집합 생성
        const newCardIds = new Set(cards.map(card => card.file.path));
        
        // 더 이상 필요 없는 카드 요소 제거
        existingCardElements.forEach((cardEl, cardId) => {
            if (!newCardIds.has(cardId)) {
                cardEl.remove();
            }
        });
        
        // 카드 기본 스타일 가져오기
        const cardStyle = this.layoutManager.getCardStyle();
        
        // 카드 컨테이너 비우기 대신 개별 카드 업데이트
        const fragment = document.createDocumentFragment();
        const updatedCards = new Set<string>();
        
        // 카드 렌더링
        cardPositions.forEach((position) => {
            const card = cards.find(c => c.file.path === position.id);
            if (!card) return;
            
            // 카드 ID 저장
            updatedCards.add(position.id);
            
            // 기존 카드 요소 재사용 또는 새로 생성
            let cardEl: HTMLElement;
            if (existingCardElements.has(position.id)) {
                cardEl = existingCardElements.get(position.id)!;
                // 컨테이너에서 제거 (나중에 올바른 순서로 다시 추가)
                if (cardEl.parentElement === this.containerEl) {
                    cardEl.remove();
                }
                
                // 레이아웃 전환 시 이전 스타일 완전히 초기화
                this.resetCardStyle(cardEl);
                
                // 기존 카드 요소를 재사용할 때도 내용 업데이트
                this.cardMaker.updateCardContent(cardEl, card);
            } else {
                cardEl = this.cardMaker.createCardElement(card);
            }
            
            // 기본 카드 스타일 적용
            Object.assign(cardEl.style, cardStyle);
            
            // 레이아웃 타입에 따라 다른 위치 및 크기 스타일 적용
            this.applyCardPositionStyle(cardEl, position, layoutType);
            
            // 활성 파일 강조 - 두 클래스 모두 설정
            const isActive = activeFile && activeFile.path === card.file.path;
            cardEl.classList.toggle('active', isActive || false);
            cardEl.classList.toggle('card-navigator-active', isActive || false);
            
            // 포커스된 카드 강조
            const isFocused = focusedCardId === card.file.path;
            cardEl.classList.toggle('card-navigator-focused', isFocused);
            
            // 프래그먼트에 추가
            fragment.appendChild(cardEl);
        });
        
        // 컨테이너 비우기
        this.containerEl.innerHTML = '';
        
        // 모든 카드를 한 번에 추가
        this.containerEl.appendChild(fragment);
        
        // 스크롤 위치 복원
        if (scrollContainer) {
            scrollContainer.scrollLeft = scrollLeft;
            scrollContainer.scrollTop = scrollTop;
        }
        
        // 렌더링된 카드 추적
        this.renderedCards = new Set(cards.map(card => card.file.path));
        
        // 렌더링 상태 업데이트
        this.renderingInProgress = false;
    }

    /**
     * 레이아웃 타입에 따라 카드 위치 스타일을 적용합니다.
     */
    private applyCardPositionStyle(cardEl: HTMLElement, position: CardPosition, layoutType: CardNavigatorSettings['defaultLayout']): void {
        // 먼저 이전 레이아웃의 스타일 속성을 초기화
        cardEl.style.position = '';
        cardEl.style.left = '';
        cardEl.style.top = '';
        cardEl.style.gridColumn = '';
        cardEl.style.gridRow = '';
        
        if (layoutType === 'grid') {
            // 그리드 레이아웃은 그리드 아이템으로 배치
            cardEl.style.position = 'relative';
            if (position.column) {
                cardEl.style.gridColumn = position.column.toString();
            } else {
                cardEl.style.gridColumn = `${Math.floor(position.left / position.width) + 1}`;
            }
            
            const rowIndex = Math.floor(position.top / position.height) + 1;
            cardEl.style.gridRow = rowIndex.toString();
            
            // 그리드 레이아웃에서는 width/height를 100%로 설정
            cardEl.style.width = '100%';
            cardEl.style.height = '100%';
        } else if (layoutType === 'masonry') {
            // 메이슨리 레이아웃은 절대 위치 사용
            cardEl.style.position = 'absolute';
            cardEl.style.left = `${position.left}px`;
            cardEl.style.top = `${position.top}px`;
            cardEl.style.width = `${position.width}px`;
            cardEl.style.height = typeof position.height === 'string' ? position.height : `${position.height}px`;
            
            // 카드 인덱스와 열 정보 저장 (나중에 위치 조정에 사용)
            if (position.column) {
                cardEl.setAttribute('data-column', position.column.toString());
            }
        } else {
            // 리스트 레이아웃은 플렉스박스 흐름 사용
            cardEl.style.position = 'relative';
            cardEl.style.width = `${position.width}px`;
            
            // 높이 설정: position.height가 0이면 auto로 설정, 그렇지 않으면 픽셀 값 사용
            if (position.height === 0) {
                cardEl.style.height = 'auto';
            } else {
                cardEl.style.height = typeof position.height === 'string' ? position.height : `${position.height}px`;
            }
            
            cardEl.style.flexShrink = '0'; // 크기 축소 방지
            
            // 위치 속성은 설정하지 않음 - 플렉스박스의 자연스러운 흐름 사용
        }
    }

    /**
     * 카드 요소의 스타일을 초기화합니다.
     */
    private resetCardStyle(cardEl: HTMLElement): void {
        // 레이아웃 관련 스타일 속성 초기화
        cardEl.style.position = '';
        cardEl.style.left = '';
        cardEl.style.top = '';
        cardEl.style.width = '';
        cardEl.style.height = '';
        cardEl.style.gridColumn = '';
        cardEl.style.gridRow = '';
        cardEl.style.display = '';
        cardEl.style.flexDirection = '';
        cardEl.style.overflow = '';
        cardEl.style.flexShrink = '';
        cardEl.style.transition = '';
        cardEl.style.padding = '';
    }
    //#endregion

    //#region 카드 상태 및 정보 관리
    // 카드 크기 가져오기 메서드
    public getCardSize(): { width: number, height: number } {
        if (!this.containerEl) return { width: 0, height: 0 };
        const firstCard = this.containerEl.querySelector('.card-navigator-card') as HTMLElement;
        if (!firstCard) return { width: 0, height: 0 };

        const computedStyle = getComputedStyle(this.containerEl);
        const gap = parseInt(computedStyle.getPropertyValue('--card-navigator-gap') || '0', 10);

        return {
            width: firstCard.offsetWidth + gap,
            height: firstCard.offsetHeight + gap
        };
    }

    // 포커스된 카드 초기화 메서드
    public clearFocusedCards() {
        if (!this.containerEl) return;
        Array.from(this.containerEl.children).forEach((card) => {
            card.classList.remove('card-navigator-focused');
        });
    }

    // 카드 요소에서 파일 가져오기 메서드
    public getFileFromCard(cardElement: HTMLElement, cards: Card[]): TFile | null {
        if (!this.containerEl) return null;
        const cardIndex = Array.from(this.containerEl.children).indexOf(cardElement);
        if (cardIndex !== -1 && cardIndex < cards.length) {
            return cards[cardIndex].file;
        }
        return null;
    }

    /**
     * 활성 카드 상태만 업데이트합니다.
     * 전체 렌더링 없이 활성 카드 클래스만 변경합니다.
     */
    public updateActiveCard(activeFile: TFile | null, focusedCardId: string | null = null): boolean {
        if (!this.containerEl || !activeFile) return false;
        
        let activeCardFound = false;
        
        // 모든 카드 요소를 순회하며 활성 상태 업데이트
        this.containerEl.querySelectorAll('.card-navigator-card').forEach((element) => {
            const cardEl = element as HTMLElement;
            const cardId = cardEl.getAttribute('data-card-id');
            
            if (!cardId) return;
            
            // 활성 파일 강조 - 두 클래스 모두 설정
            const isActive = activeFile && activeFile.path === cardId;
            cardEl.classList.toggle('active', isActive);
            cardEl.classList.toggle('card-navigator-active', isActive);
            
            // 포커스된 카드 강조
            const isFocused = focusedCardId === cardId;
            cardEl.classList.toggle('card-navigator-focused', isFocused);
            
            if (isActive) {
                activeCardFound = true;
            }
        });
        
        return activeCardFound;
    }
    //#endregion
} 