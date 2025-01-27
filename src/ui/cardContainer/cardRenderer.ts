import { TFile } from 'obsidian';
import { Card } from 'common/types';
import { CardMaker } from './cardMaker';
import { LayoutStrategy } from 'layouts/layoutStrategy';
import { ListLayout } from 'layouts/listLayout';

export class CardRenderer {
    //#region 초기화 및 기본 설정
    // 생성자: 카드 렌더러 초기화
    constructor(
        private containerEl: HTMLElement,
        private cardMaker: CardMaker,
        private layoutStrategy: LayoutStrategy,
        private alignCardHeight: boolean,
        private cardsPerView: number
    ) {}

    // 레이아웃 전략 설정 메서드
    public setLayoutStrategy(layoutStrategy: LayoutStrategy) {
        this.layoutStrategy = layoutStrategy;
    }

    // 리소스 정리 메서드
    public cleanup(): void {
        if (this.containerEl) {
            this.containerEl.empty();
        }
    }
    //#endregion

    //#region 카드 렌더링
    // 카드 렌더링 메서드
    public async renderCards(cardsData: Card[], focusedCardId: string | null = null, activeFile: TFile | null = null) {
        if (!this.containerEl) return;
    
        this.containerEl.classList.remove('visible');
        
        if (!cardsData || cardsData.length === 0) {
            console.warn('The card data is empty.');
            return;
        }

        if (!this.layoutStrategy) {
            console.error('The layout strategy has not been set.');
            return;
        }

        const containerEl = this.containerEl;
        const currentScrollTop = containerEl.scrollTop;
        const currentScrollLeft = containerEl.scrollLeft;
    
        const containerRect = containerEl.getBoundingClientRect();
        const containerStyle = window.getComputedStyle(this.containerEl);
        const paddingLeft = parseFloat(containerStyle.paddingLeft) || 0;
        const paddingRight = parseFloat(containerStyle.paddingRight) || 0;
        const paddingTop = parseFloat(containerStyle.paddingTop) || 0;
        const availableWidth = containerRect.width - paddingLeft - paddingRight;

        // 리스트 레이아웃 스타일 적용
        if (this.layoutStrategy instanceof ListLayout) {
            const listContainerStyle = this.layoutStrategy.getContainerStyle();
            Object.assign(containerEl.style, listContainerStyle);
        } else {
            // 다른 레이아웃의 경우 스타일 초기화
            containerEl.style.display = '';
            containerEl.style.flexDirection = '';
            containerEl.style.gap = '';
            containerEl.style.alignItems = '';
            containerEl.style.overflowY = '';
            containerEl.style.height = '100%';
        }

        const cardPositions = this.layoutStrategy.arrange(
            cardsData,
            availableWidth,
            containerRect.height,
            this.cardsPerView
        );
	
        if (cardPositions.length !== cardsData.length) {
            console.warn('Card positions and card data length mismatch. Adjusting...');
            const minLength = Math.min(cardPositions.length, cardsData.length);
            cardsData = cardsData.slice(0, minLength);
            cardPositions.length = minLength;
        }
	
        containerEl.empty();
    
        cardPositions.forEach((position, index) => {
            const card = cardsData[index];
            const cardEl = this.cardMaker.createCardElement(card);

            if (this.layoutStrategy instanceof ListLayout) {
                const cardStyle = this.layoutStrategy.getCardStyle();
                Object.assign(cardEl.style, cardStyle);
            } else {
                cardEl.style.position = 'absolute';
                cardEl.style.left = `${position.x + paddingLeft}px`;
                cardEl.style.top = `${position.y + paddingTop}px`;
                cardEl.style.width = `${position.width}px`;
                cardEl.style.height = typeof position.height === 'number' ? `${position.height}px` : position.height;
            }

            cardEl.classList.add(this.layoutStrategy.getScrollDirection() === 'vertical' ? 'vertical' : 'horizontal');
            cardEl.classList.toggle('align-height', this.alignCardHeight);
            
            if (card.file.path === focusedCardId) {
                cardEl.classList.add('card-navigator-focused');
            }

            if (activeFile && card.file.path === activeFile.path) {
                cardEl.classList.add('card-navigator-active');
            }

            containerEl.appendChild(cardEl);
        });

        containerEl.scrollTop = currentScrollTop;
        containerEl.scrollLeft = currentScrollLeft;

        this.updateScrollDirection();
        await this.ensureCardSizesAreSet();
        
        requestAnimationFrame(() => {
            this.containerEl?.classList.add('visible');
        });
    }

    // 스크롤 방향 업데이트 메서드
    private updateScrollDirection() {
        if (!this.containerEl) return;
        const scrollDirection = this.layoutStrategy.getScrollDirection();
        this.containerEl.style.overflowY = scrollDirection === 'vertical' ? 'auto' : 'hidden';
        this.containerEl.style.overflowX = scrollDirection === 'horizontal' ? 'auto' : 'hidden';
    }

    // 카드 크기 설정 확인 메서드
    private async ensureCardSizesAreSet(): Promise<void> {
        return new Promise((resolve) => {
            const checkSizes = () => {
                const firstCard = this.containerEl?.querySelector('.card-navigator-card') as HTMLElement;
                if (firstCard && firstCard.offsetWidth > 0 && firstCard.offsetHeight > 0) {
                    resolve();
                } else {
                    requestAnimationFrame(checkSizes);
                }
            };
            checkSizes();
        });
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
    //#endregion
} 