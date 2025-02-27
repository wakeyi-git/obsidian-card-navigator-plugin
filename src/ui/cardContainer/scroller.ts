import { Card } from 'common/types';
import { LayoutStrategy } from 'layouts/layoutStrategy';
import CardNavigatorPlugin from 'main';
import { LayoutConfig } from 'layouts/layoutConfig';

export class Scroller {
    private layoutConfig: LayoutConfig;
    private currentAnimationFrame: number | null = null;

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

        // enableScrollAnimation 설정을 고려하여 애니메이션 적용 여부 결정
        const shouldAnimate = animate && this.plugin.settings.enableScrollAnimation;
        
        // 카드가 완전히 렌더링될 때까지 약간 지연 후 중앙 정렬 시도
        // 특히 HTML 렌더링이 활성화된 경우 중요
        if (this.plugin.settings.renderContentAsHtml) {
            // 즉시 한 번 중앙 정렬 시도
            this.centerCard(activeCard, shouldAnimate);
            
            // 약간의 지연 후 다시 중앙 정렬 시도 (렌더링 완료 후)
            setTimeout(() => {
                this.centerCard(activeCard, shouldAnimate);
                
                // 추가 보정을 위한 두 번째 시도 (특히 이미지가 있는 경우)
                setTimeout(() => {
                    this.centerCard(activeCard, shouldAnimate);
                }, 100);
            }, 50);
        } else {
            // HTML 렌더링이 비활성화된 경우 즉시 중앙 정렬
            this.centerCard(activeCard, shouldAnimate);
        }
    }

    // 카드 중앙 정렬 메서드
    public centerCard(card: HTMLElement, animate = true) {
        if (!this.containerEl) return;

        // 스크롤 조정 함수
        const adjustScroll = () => {
            const containerRect = this.containerEl.getBoundingClientRect();
            const cardRect = card.getBoundingClientRect();

            let offset = 0;
            let scrollProperty: 'scrollTop' | 'scrollLeft';
            const isVertical = this.getLayoutStrategy().getScrollDirection() === 'vertical';
            
            // 컨테이너 패딩 가져오기
            const containerPadding = this.layoutConfig.getContainerPadding();

            if (isVertical) {
                // 컨테이너의 실제 가시 영역 높이 (패딩 제외)
                const containerVisibleHeight = containerRect.height - (containerPadding * 2);
                
                // 카드의 중앙이 컨테이너의 중앙에 오도록 계산
                // 컨테이너 상단 + 패딩 + (가시 영역 높이 - 카드 높이) / 2 = 카드가 위치해야 할 곳
                const targetCardTop = containerRect.top + containerPadding + (containerVisibleHeight - cardRect.height) / 2;
                
                // 현재 카드 위치와 목표 위치의 차이 계산
                offset = cardRect.top - targetCardTop;
                scrollProperty = 'scrollTop';
            } else {
                // 컨테이너의 실제 가시 영역 너비 (패딩 제외)
                const containerVisibleWidth = containerRect.width - (containerPadding * 2);
                
                // 카드의 중앙이 컨테이너의 중앙에 오도록 계산
                // 컨테이너 좌측 + 패딩 + (가시 영역 너비 - 카드 너비) / 2 = 카드가 위치해야 할 곳
                const targetCardLeft = containerRect.left + containerPadding + (containerVisibleWidth - cardRect.width) / 2;
                
                // 현재 카드 위치와 목표 위치의 차이 계산
                offset = cardRect.left - targetCardLeft;
                scrollProperty = 'scrollLeft';
            }

            const newScrollPosition = this.containerEl[scrollProperty] + offset;

            // enableScrollAnimation 설정을 고려하여 애니메이션 적용 여부 결정
            if (animate && this.plugin.settings.enableScrollAnimation) {
                this.smoothScroll(scrollProperty, newScrollPosition);
            } else {
                this.containerEl[scrollProperty] = newScrollPosition;
            }
        };

        // 초기 스크롤 조정
        adjustScroll();

        // HTML 렌더링이 활성화되고 높이가 가변적인 경우에만 추가 보정
        if (this.plugin.settings.renderContentAsHtml && !this.plugin.settings.alignCardHeight) {
            let lastOffset = 0;
            let stabilityCount = 0;
            const MAX_STABILITY_COUNT = 3;  // 3프레임 동안 안정적이면 완료로 간주
            const MAX_ADJUSTMENT_TIME = 2000;  // 최대 2초 동안만 조정
            const startTime = Date.now();

            const recheckPosition = () => {
                const currentTime = Date.now();
                if (currentTime - startTime > MAX_ADJUSTMENT_TIME) {
                    return; // 최대 시간 초과
                }

                const containerRect = this.containerEl.getBoundingClientRect();
                const cardRect = card.getBoundingClientRect();
                
                // 컨테이너 패딩 가져오기
                const containerPadding = this.layoutConfig.getContainerPadding();
                
                // 스크롤 방향에 따라 중앙 위치 계산
                const isVertical = this.getLayoutStrategy().getScrollDirection() === 'vertical';
                const containerCenter = isVertical 
                    ? containerRect.top + containerPadding + (containerRect.height - containerPadding * 2) / 2
                    : containerRect.left + containerPadding + (containerRect.width - containerPadding * 2) / 2;
                
                const cardCenter = isVertical
                    ? cardRect.top + cardRect.height / 2
                    : cardRect.left + cardRect.width / 2;
                
                const currentOffset = cardCenter - containerCenter;

                // 오차 범위 내에서 위치가 안정적인지 확인
                if (Math.abs(currentOffset - lastOffset) < 1) {
                    stabilityCount++;
                    if (stabilityCount >= MAX_STABILITY_COUNT) {
                        return; // 안정화 완료
                    }
                } else {
                    stabilityCount = 0;
                }

                lastOffset = currentOffset;
                adjustScroll();
                requestAnimationFrame(recheckPosition);
            };

            // 다음 프레임에서 위치 재확인 시작
            requestAnimationFrame(recheckPosition);
        }
    }

    // 부드러운 스크롤 메서드
    private smoothScroll(scrollProperty: 'scrollTop' | 'scrollLeft', targetPosition: number) {
        if (!this.containerEl) return;

        // 이전 애니메이션이 있다면 취소
        if (this.currentAnimationFrame !== null) {
            cancelAnimationFrame(this.currentAnimationFrame);
        }

        const startPosition = this.containerEl[scrollProperty];
        const distance = targetPosition - startPosition;
        const duration = 300; // ms
        let startTime: number | null = null;

        const animation = (currentTime: number) => {
            if (startTime === null) startTime = currentTime;
            const timeElapsed = currentTime - startTime;
            const progress = Math.min(timeElapsed / duration, 1);

            // easeInOutCubic 이징 함수 사용
            const easeProgress = progress < 0.5
                ? 4 * progress * progress * progress
                : 1 - Math.pow(-2 * progress + 2, 3) / 2;

            if (this.containerEl) {
                this.containerEl[scrollProperty] = startPosition + distance * easeProgress;
            }

            if (progress < 1 && this.containerEl) {
                this.currentAnimationFrame = requestAnimationFrame(animation);
            } else {
                this.currentAnimationFrame = null;
            }
        };

        this.currentAnimationFrame = requestAnimationFrame(animation);
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

        // enableScrollAnimation 설정에 따라 스크롤 방식 결정
        const scrollProperty = isVertical ? 'scrollTop' : 'scrollLeft';
        if (this.plugin.settings.enableScrollAnimation) {
            this.smoothScroll(scrollProperty, targetScroll);
        } else {
            this.containerEl[scrollProperty] = targetScroll;
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