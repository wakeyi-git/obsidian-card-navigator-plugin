import { TFile } from 'obsidian';
import { Card } from 'common/types';
import { CardMaker } from './cardMaker';
import { LayoutStrategy } from 'layouts/layoutStrategy';
import { ListLayout } from 'layouts/listLayout';
import { LayoutManager } from 'layouts/layoutManager';
import { LayoutConfig } from 'layouts/layoutConfig';
import { GridLayout } from 'layouts/gridLayout';
import { MasonryLayout } from 'layouts/masonryLayout';
import CardNavigatorPlugin from 'main';
import { MarkdownRenderer } from 'obsidian';

export class CardRenderer {
    private layoutStrategy: LayoutStrategy;
    private layoutConfig: LayoutConfig;
    private renderedCards: Set<string> = new Set(); // 렌더링된 카드 추적
    private renderingInProgress: boolean = false;
    private pendingRender: boolean = false;

    //#region 초기화 및 기본 설정
    // 생성자: 카드 렌더러 초기화
    constructor(
        private containerEl: HTMLElement,
        private cardMaker: CardMaker,
        private layoutManager: LayoutManager,
        private alignCardHeight: boolean,
        private cardsPerView: number,
        private plugin: CardNavigatorPlugin
    ) {
        this.layoutStrategy = layoutManager.getLayoutStrategy();
        this.layoutConfig = layoutManager.getLayoutConfig();
    }

    // 레이아웃 전략 설정 메서드
    public setLayoutStrategy(layoutStrategy: LayoutStrategy) {
        this.layoutStrategy = layoutStrategy;
        this.updateContainerStyle();
    }

    // 설정 업데이트 메서드
    public updateSettings(alignCardHeight: boolean, cardsPerView: number) {
        this.alignCardHeight = alignCardHeight;
        this.cardsPerView = cardsPerView;
        this.updateContainerStyle();
    }

    // 리소스 정리 메서드
    public cleanup(): void {
        if (this.containerEl) {
            this.containerEl.empty();
            this.renderedCards.clear();
        }
    }
    //#endregion

    //#region 카드 렌더링
    // 카드 렌더링 메서드
    public async renderCards(cardsData: Card[], focusedCardId: string | null = null, activeFile: TFile | null = null) {
        if (this.renderingInProgress) {
            this.pendingRender = true;
            return;
        }

        try {
            this.renderingInProgress = true;

            if (!this.containerEl || !cardsData || cardsData.length === 0) {
                console.warn('Invalid render state or empty card data.');
                return;
            }

            // 컨테이너 스타일 업데이트
            this.updateContainerStyle();

            const containerRect = this.containerEl.getBoundingClientRect();
            const containerStyle = window.getComputedStyle(this.containerEl);
            const paddingLeft = parseFloat(containerStyle.paddingLeft) || 0;
            const paddingRight = parseFloat(containerStyle.paddingRight) || 0;
            const paddingTop = parseFloat(containerStyle.paddingTop) || 0;
            const availableWidth = containerRect.width - paddingLeft - paddingRight;

            const cardPositions = this.layoutStrategy.arrange(
                cardsData,
                availableWidth,
                containerRect.height
            );

            if (cardPositions.length !== cardsData.length) {
                const minLength = Math.min(cardPositions.length, cardsData.length);
                cardsData = cardsData.slice(0, minLength);
                cardPositions.length = minLength;
            }

            // 현재 스크롤 위치와 렌더링된 카드 상태 저장
            const currentScrollTop = this.containerEl.scrollTop;
            const currentScrollLeft = this.containerEl.scrollLeft;
            const previouslyRenderedCards = new Set(this.renderedCards);

            const fragment = document.createDocumentFragment();
            const newRenderedCards = new Set<string>();

            // 카드 생성 및 스타일 적용
            cardPositions.forEach((position, index) => {
                const card = cardsData[index];
                const cardEl = this.cardMaker.createCardElement(card);

                // 레이아웃 타입에 따른 스타일 적용
                if (this.layoutStrategy instanceof ListLayout) {
                    const cardStyle = this.layoutConfig.getCardStyle(
                        this.layoutStrategy.getScrollDirection() === 'vertical',
                        this.alignCardHeight
                    );
                    Object.assign(cardEl.style, cardStyle);
                } else if (this.layoutStrategy instanceof GridLayout) {
                    // 그리드 레이아웃의 경우 고정 높이 적용
                    Object.assign(cardEl.style, {
                        height: `${this.plugin.settings.gridCardHeight}px`,
                        width: '100%',
                        boxSizing: 'border-box',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                        minHeight: 'unset',
                        maxHeight: `${this.plugin.settings.gridCardHeight}px`
                    });
                } else {
                    // 메이슨리 레이아웃의 경우 absolute 포지셔닝 사용
                    cardEl.style.position = 'absolute';
                    cardEl.style.transform = `translate3d(${position.left + paddingLeft}px, ${position.top + paddingTop}px, 0)`;
                    cardEl.style.width = `${position.width}px`;
                    cardEl.style.height = `${position.height}px`;
                    cardEl.style.minHeight = '100px';
                }

                // 레이아웃 변경에 따른 클래스 업데이트
                cardEl.classList.toggle('vertical', this.layoutStrategy.getScrollDirection() === 'vertical');
                cardEl.classList.toggle('horizontal', this.layoutStrategy.getScrollDirection() !== 'vertical');
                cardEl.classList.toggle('align-height', this.alignCardHeight);

                // 포커스 및 활성 상태 적용
                if (card.file.path === focusedCardId) {
                    cardEl.classList.add('card-navigator-focused');
                }
                if (activeFile && card.file.path === activeFile.path) {
                    cardEl.classList.add('card-navigator-active');
                }

                // 이전에 렌더링된 카드의 상태 유지
                if (previouslyRenderedCards.has(card.file.path)) {
                    newRenderedCards.add(card.file.path);
                }

                fragment.appendChild(cardEl);
            });

            this.containerEl.empty();
            this.containerEl.appendChild(fragment);

            // 스크롤 위치 복원
            this.containerEl.scrollTop = currentScrollTop;
            this.containerEl.scrollLeft = currentScrollLeft;

            this.renderedCards = newRenderedCards;
            await this.ensureCardSizesAreSet();

        } finally {
            this.renderingInProgress = false;
            
            // 대기 중인 렌더링이 있다면 실행
            if (this.pendingRender) {
                this.pendingRender = false;
                this.renderCards(cardsData, focusedCardId, activeFile);
            }
        }
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

        // 레이아웃별 스타일 적용
        if (this.layoutStrategy instanceof ListLayout) {
            const listContainerStyle = this.layoutStrategy.getContainerStyle();
            Object.assign(this.containerEl.style, listContainerStyle);
        } else if (this.layoutStrategy instanceof GridLayout) {
            const columns = this.layoutStrategy.getColumnsCount();
            const cardGap = this.layoutConfig.getCardGap();
            const containerPadding = this.layoutConfig.getContainerPadding();
            
            Object.assign(this.containerEl.style, {
                display: 'grid',
                gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                gridAutoRows: `${this.plugin.settings.gridCardHeight}px`,
                gap: `${cardGap}px`,
                position: 'relative',
                height: '100%',
                boxSizing: 'border-box',
                alignItems: 'stretch',
                alignContent: 'start'
            });
        } else {
            this.resetContainerStyle();
        }
    }
} 