import { TFile } from 'obsidian';
import { Card } from 'common/types';
import { CardMaker } from './cardMaker';
import { LayoutStrategy } from 'layouts/layoutStrategy';
import { ListLayout } from 'layouts/listLayout';
import { LayoutManager } from 'layouts/layoutManager';
import { LayoutConfig } from 'layouts/layoutConfig';
import { GridLayout } from 'layouts/gridLayout';
import { MasonryLayout } from 'layouts/masonryLayout';

export class CardRenderer {
    private layoutStrategy: LayoutStrategy;
    private layoutConfig: LayoutConfig;

    //#region 초기화 및 기본 설정
    // 생성자: 카드 렌더러 초기화
    constructor(
        private containerEl: HTMLElement,
        private cardMaker: CardMaker,
        private layoutManager: LayoutManager,
        private alignCardHeight: boolean,
        private cardsPerView: number
    ) {
        this.layoutStrategy = layoutManager.getLayoutStrategy();
        this.layoutConfig = layoutManager.getLayoutConfig();
    }

    // 레이아웃 전략 설정 메서드
    public setLayoutStrategy(layoutStrategy: LayoutStrategy) {
        this.layoutStrategy = layoutStrategy;
        this.updateContainerStyle();
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
    
        if (!cardsData || cardsData.length === 0) {
            console.warn('The card data is empty.');
            return;
        }

        this.updateContainerStyle();

        const containerEl = this.containerEl;
        
        // 컨테이너 크기 및 스타일 계산
        const containerRect = containerEl.getBoundingClientRect();
        const containerStyle = window.getComputedStyle(containerEl);
        const paddingLeft = parseFloat(containerStyle.paddingLeft) || 0;
        const paddingRight = parseFloat(containerStyle.paddingRight) || 0;
        const paddingTop = parseFloat(containerStyle.paddingTop) || 0;
        const availableWidth = containerRect.width - paddingLeft - paddingRight;

        // 리스트 레이아웃인 경우 특별한 스타일 적용
        if (this.layoutStrategy instanceof ListLayout) {
            const listContainerStyle = this.layoutStrategy.getContainerStyle();
            Object.assign(containerEl.style, listContainerStyle);
        } else {
            this.resetContainerStyle();
        }

        // 카드 위치 계산
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

        // 현재 스크롤 위치 저장
        const currentScrollTop = containerEl.scrollTop;
        const currentScrollLeft = containerEl.scrollLeft;
    
        // DocumentFragment를 사용하여 DOM 업데이트 최적화
        const fragment = document.createDocumentFragment();
    
        // 카드 생성 및 스타일 적용
        cardPositions.forEach((position, index) => {
            const card = cardsData[index];
            const cardEl = this.cardMaker.createCardElement(card);

            this.applyCardStyle(cardEl, position, paddingLeft, paddingTop);
            this.applyCardClasses(cardEl, card, focusedCardId, activeFile);

            fragment.appendChild(cardEl);
        });

        // 기존 카드 제거 및 새 카드 추가
        containerEl.empty();
        containerEl.appendChild(fragment);

        // 스크롤 위치 복원
        containerEl.scrollTop = currentScrollTop;
        containerEl.scrollLeft = currentScrollLeft;

        // 카드 크기가 올바르게 설정될 때까지 대기
        await this.ensureCardSizesAreSet();
    }

    private resetContainerStyle() {
        if (!this.containerEl) return;
        this.containerEl.style.display = '';
        this.containerEl.style.flexDirection = '';
        this.containerEl.style.gap = '';
        this.containerEl.style.alignItems = '';
        this.containerEl.style.overflowY = '';
        this.containerEl.style.height = '100%';
    }

    private applyCardStyle(cardEl: HTMLElement, position: any, paddingLeft: number, paddingTop: number) {
        if (this.layoutStrategy instanceof ListLayout) {
            const cardStyle = this.layoutConfig.getCardStyle(
                this.layoutStrategy.getScrollDirection() === 'vertical',
                this.alignCardHeight
            );
            Object.assign(cardEl.style, cardStyle);
        } else {
            cardEl.style.position = 'absolute';
            cardEl.style.left = `${position.x + paddingLeft}px`;
            cardEl.style.top = `${position.y + paddingTop}px`;
            cardEl.style.width = `${position.width}px`;
            cardEl.style.height = typeof position.height === 'number' ? `${position.height}px` : position.height;
        }
    }

    private applyCardClasses(cardEl: HTMLElement, card: Card, focusedCardId: string | null, activeFile: TFile | null) {
        cardEl.classList.add(this.layoutStrategy.getScrollDirection() === 'vertical' ? 'vertical' : 'horizontal');
        cardEl.classList.toggle('align-height', this.alignCardHeight);
        
        if (card.file.path === focusedCardId) {
            cardEl.classList.add('card-navigator-focused');
        }

        if (activeFile && card.file.path === activeFile.path) {
            cardEl.classList.add('card-navigator-active');
        }
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

    private updateContainerStyle() {
        if (!this.containerEl) return;
        
        // 레이아웃 타입에 따른 클래스 추가
        this.containerEl.classList.remove('list-layout', 'grid-layout', 'masonry-layout');
        if (this.layoutStrategy instanceof ListLayout) {
            this.containerEl.classList.add('list-layout');
        } else if (this.layoutStrategy instanceof GridLayout) {
            this.containerEl.classList.add('grid-layout');
        } else if (this.layoutStrategy instanceof MasonryLayout) {
            this.containerEl.classList.add('masonry-layout');
        }

        // 스크롤 방향에 따른 클래스 추가
        const isVertical = this.layoutStrategy.getScrollDirection() === 'vertical';
        this.containerEl.classList.toggle('vertical', isVertical);
        this.containerEl.classList.toggle('horizontal', !isVertical);

        // 카드 높이 정렬 클래스 추가
        this.containerEl.classList.toggle('align-height', this.alignCardHeight);
        this.containerEl.classList.toggle('flexible-height', !this.alignCardHeight);

        // CSS 변수 설정
        this.containerEl.style.setProperty('--cards-per-view', this.cardsPerView.toString());
        this.containerEl.style.setProperty('--card-navigator-gap', `${this.layoutConfig.getCardGap()}px`);
        this.containerEl.style.setProperty('--card-navigator-container-padding', `${this.layoutConfig.getContainerPadding()}px`);

        // 스크롤 방향 설정
        this.containerEl.style.overflowY = isVertical ? 'auto' : 'hidden';
        this.containerEl.style.overflowX = isVertical ? 'hidden' : 'auto';

        // 리스트 레이아웃인 경우 특별한 스타일 적용
        if (this.layoutStrategy instanceof ListLayout) {
            const listContainerStyle = this.layoutStrategy.getContainerStyle();
            Object.assign(this.containerEl.style, listContainerStyle);
        } else {
            this.resetContainerStyle();
        }
    }
} 