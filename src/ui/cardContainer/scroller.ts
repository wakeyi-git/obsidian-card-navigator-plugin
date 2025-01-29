import { Card } from 'common/types';
import { LayoutStrategy } from 'layouts/layoutStrategy';
import CardNavigatorPlugin from 'main';
import { LayoutConfig } from 'layouts/layoutConfig';

export class Scroller {
    private layoutConfig: LayoutConfig;

    constructor(
        private containerEl: HTMLElement,
        private plugin: CardNavigatorPlugin,
        private getLayoutStrategy: () => LayoutStrategy,
        private getCardSize: () => { width: number, height: number }
    ) {
        this.layoutConfig = new LayoutConfig(plugin.app, containerEl, plugin.settings);
    }

    // 활성 카드로 스크롤 메서드
    public scrollToActiveCard(animate = true) {
        if (!this.containerEl) return;
        const activeCard = this.containerEl.querySelector('.card-navigator-active') as HTMLElement | null;
        if (!activeCard) return;

        this.centerCard(activeCard, animate);
    }

    // 카드 중앙 정렬 메서드
    public centerCard(card: HTMLElement, animate = true) {
        if (!this.containerEl) return;

        const containerRect = this.containerEl.getBoundingClientRect();
        const cardRect = card.getBoundingClientRect();

        let offset = 0;
        let scrollProperty: 'scrollTop' | 'scrollLeft';
        const isVertical = this.getLayoutStrategy().getScrollDirection() === 'vertical';

        if (isVertical) {
            const containerVisibleHeight = containerRect.height;
            offset = cardRect.top - containerRect.top - (containerVisibleHeight - cardRect.height) / 2;
            scrollProperty = 'scrollTop';
        } else {
            const containerVisibleWidth = containerRect.width;
            offset = cardRect.left - containerRect.left - (containerVisibleWidth - cardRect.width) / 2;
            scrollProperty = 'scrollLeft';
        }

        const newScrollPosition = this.containerEl[scrollProperty] + offset;

        if (animate && this.plugin.settings.enableScrollAnimation) {
            this.smoothScroll(scrollProperty, newScrollPosition);
        } else {
            this.containerEl[scrollProperty] = newScrollPosition;
        }
    }

    // 부드러운 스크롤 메서드
    private smoothScroll(scrollProperty: 'scrollTop' | 'scrollLeft', targetPosition: number) {
        if (!this.containerEl) return;

        const startPosition = this.containerEl[scrollProperty];
        const distance = targetPosition - startPosition;
        const duration = 300; // ms
        let startTime: number | null = null;

        const animation = (currentTime: number) => {
            if (startTime === null) startTime = currentTime;
            const timeElapsed = currentTime - startTime;
            const progress = Math.min(timeElapsed / duration, 1);
            const easeProgress = 0.5 - Math.cos(progress * Math.PI) / 2;

            if (this.containerEl) {
                this.containerEl[scrollProperty] = startPosition + distance * easeProgress;
            }

            if (timeElapsed < duration && this.containerEl) {
                requestAnimationFrame(animation);
            }
        };

        requestAnimationFrame(animation);
    }

    // 방향별 스크롤 메서드
    private scrollInDirection(direction: 'up' | 'down' | 'left' | 'right', count = 1, totalCards: number) {
        if (!this.containerEl) return;
        const { width, height } = this.getCardSize();
        const cardsPerView = this.plugin.settings.cardsPerView;
        const isVertical = this.getLayoutStrategy().getScrollDirection() === 'vertical';
        const cardGap = this.layoutConfig.getCardGap();
        
        const cardSize = (isVertical ? height : width) + cardGap;
        const currentScroll = isVertical ? this.containerEl.scrollTop : this.containerEl.scrollLeft;
        const totalSize = totalCards * cardSize;
        const containerSize = isVertical ? this.containerEl.clientHeight : this.containerEl.clientWidth;
        
        let targetScroll;
        if (count === cardsPerView) { // Page Up/Left or Page Down/Right
            const currentEdgeCard = Math.floor((currentScroll + (direction === 'down' || direction === 'right' ? containerSize : 0)) / cardSize);
            if (direction === 'up' || direction === 'left') {
                if (currentEdgeCard < cardsPerView) {
                    targetScroll = 0; // Scroll to the very start
                } else {
                    targetScroll = Math.max(0, (currentEdgeCard - cardsPerView) * cardSize);
                }
            } else { // down or right
                if (totalCards - currentEdgeCard < cardsPerView) {
                    targetScroll = totalSize - containerSize; // Scroll to the very end
                } else {
                    targetScroll = currentEdgeCard * cardSize;
                }
            }
        } else {
            const scrollAmount = cardSize * count;
            if (direction === 'up' || direction === 'left') {
                targetScroll = Math.max(0, currentScroll - scrollAmount);
            } else {
                targetScroll = Math.min(totalSize - containerSize, currentScroll + scrollAmount);
            }
        }

        if (this.plugin.settings.enableScrollAnimation) {
            this.containerEl.scrollTo({
                [isVertical ? 'top' : 'left']: targetScroll,
                behavior: 'smooth'
            });
        } else {
            this.containerEl[isVertical ? 'scrollTop' : 'scrollLeft'] = targetScroll;
        }
    }

    // 위로 스크롤 메서드
    public scrollUp(count = 1, totalCards: number) {
        this.scrollInDirection('up', count, totalCards);
    }

    // 아래로 스크롤 메서드
    public scrollDown(count = 1, totalCards: number) {
        this.scrollInDirection('down', count, totalCards);
    }

    // 왼쪽으로 스크롤 메서드
    public scrollLeft(count = 1, totalCards: number) {
        this.scrollInDirection('left', count, totalCards);
    }

    // 오른쪽으로 스크롤 메서드
    public scrollRight(count = 1, totalCards: number) {
        this.scrollInDirection('right', count, totalCards);
    }
} 