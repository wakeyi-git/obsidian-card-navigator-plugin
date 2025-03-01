import { CardNavigatorSettings } from 'common/types';
import { LayoutConfig } from 'layouts/layoutConfig';
import { LayoutDirection } from 'layouts/layoutStrategy';
import { Component } from 'obsidian';
import { LayoutManager } from 'layouts/layoutManager';

/**
 * 스크롤 관련 기능을 제공하는 클래스
 * 
 * 이 클래스는 카드 컨테이너의 스크롤 동작을 관리합니다.
 * 스크롤 방향, 속도, 스냅 등의 기능을 제공합니다.
 */
export class Scroller extends Component {
    private container: HTMLElement;
    private settings: CardNavigatorSettings;
    private layoutConfig: LayoutConfig;
    private isScrolling: boolean = false;
    private scrollTimeout: NodeJS.Timeout | null = null;
    private lastScrollPosition: { left: number, top: number } = { left: 0, top: 0 };
    private scrollDirection: 'horizontal' | 'vertical' | null = null;
    private layoutManager: LayoutManager;
    
    // 성능 최적화를 위한 추가 속성
    private scrollThrottleTimeout: NodeJS.Timeout | null = null;
    private scrollEndTimeout: NodeJS.Timeout | null = null;
    private scrollListeners: Set<() => void> = new Set();
    private scrollEndListeners: Set<() => void> = new Set();
    private isPassiveSupported: boolean = false;
    private scrollThrottleDelay: number = 16; // 약 60fps에 해당하는 지연 시간

    constructor(container: HTMLElement, settings: CardNavigatorSettings, layoutConfig: LayoutConfig, layoutManager: LayoutManager) {
        super();
        this.container = container;
        this.settings = settings;
        this.layoutConfig = layoutConfig;
        this.layoutManager = layoutManager;
        
        // passive 이벤트 지원 여부 확인
        this.checkPassiveSupport();
        
        this.initScrollListeners();
    }
    
    /**
     * passive 이벤트 지원 여부를 확인합니다.
     */
    private checkPassiveSupport(): void {
        try {
            let isSupported = false;
            const options = {
                get passive(): boolean {
                    isSupported = true;
                    return true;
                }
            };
            
            // 테스트용 이벤트 리스너 등록 및 제거
            window.addEventListener('testpassive' as keyof WindowEventMap, null as any, options as EventListenerOptions);
            window.removeEventListener('testpassive' as keyof WindowEventMap, null as any, options as EventListenerOptions);
            
            this.isPassiveSupported = isSupported;
        } catch (e) {
            this.isPassiveSupported = false;
        }
    }

    /**
     * 스크롤 이벤트 리스너를 초기화합니다.
     */
    private initScrollListeners(): void {
        // 기존 이벤트 리스너 제거
        this.container.removeEventListener('scroll', this.handleScrollEvent);
        this.container.removeEventListener('wheel', this.handleWheel);
        
        // 새 이벤트 리스너 등록 - passive 옵션 사용
        const scrollOptions = this.isPassiveSupported ? { passive: true } : undefined;
        const wheelOptions = this.isPassiveSupported ? { passive: false } : undefined;
        
        this.container.addEventListener('scroll', this.handleScrollEvent, scrollOptions);
        this.container.addEventListener('wheel', this.handleWheel, wheelOptions);
    }

    /**
     * 설정을 업데이트합니다.
     */
    updateSettings(settings: CardNavigatorSettings): void {
        this.settings = settings;
    }

    /**
     * 레이아웃 설정을 업데이트합니다.
     */
    setLayoutConfig(layoutConfig: LayoutConfig): void {
        this.layoutConfig = layoutConfig;
    }

    /**
     * 스크롤 이벤트 핸들러를 등록합니다.
     */
    addScrollListener(listener: () => void): void {
        this.scrollListeners.add(listener);
    }

    /**
     * 스크롤 이벤트 핸들러를 제거합니다.
     */
    removeScrollListener(listener: () => void): void {
        this.scrollListeners.delete(listener);
    }

    /**
     * 스크롤 종료 이벤트 핸들러를 등록합니다.
     */
    addScrollEndListener(listener: () => void): void {
        this.scrollEndListeners.add(listener);
    }

    /**
     * 스크롤 종료 이벤트 핸들러를 제거합니다.
     */
    removeScrollEndListener(listener: () => void): void {
        this.scrollEndListeners.delete(listener);
    }

    /**
     * 스크롤 이벤트를 처리합니다.
     */
    private handleScrollEvent = (): void => {
        // 현재 스크롤 위치
        const scrollLeft = this.container.scrollLeft;
        const scrollTop = this.container.scrollTop;
        
        // 스크롤 방향 결정
        if (scrollLeft !== this.lastScrollPosition.left) {
            this.scrollDirection = 'horizontal';
        } else if (scrollTop !== this.lastScrollPosition.top) {
            this.scrollDirection = 'vertical';
        }
        
        // 스크롤 중 플래그 설정
        this.isScrolling = true;
        
        // 스로틀링 적용 - 성능 최적화
        if (this.scrollThrottleTimeout === null) {
            this.scrollThrottleTimeout = setTimeout(() => {
                // 스크롤 위치 업데이트
                this.lastScrollPosition = { left: scrollLeft, top: scrollTop };
                
                // 등록된 스크롤 리스너 호출
                this.scrollListeners.forEach(listener => listener());
                
                this.scrollThrottleTimeout = null;
            }, this.scrollThrottleDelay);
        }
        
        // 스크롤 종료 감지
        if (this.scrollEndTimeout) {
            clearTimeout(this.scrollEndTimeout);
        }
        
        this.scrollEndTimeout = setTimeout(() => {
            this.isScrolling = false;
            this.scrollDirection = null;
            
            // 스크롤이 끝나면 스냅 기능 적용
            if (this.settings.enableSnapToCard) {
                this.snapToCard();
            }
            
            // 등록된 스크롤 종료 리스너 호출
            this.scrollEndListeners.forEach(listener => listener());
        }, 150);
    };

    /**
     * 휠 이벤트를 처리합니다.
     * @param event 휠 이벤트
     */
    private handleWheel = (event: WheelEvent): void => {
        // 스크롤 방향 결정
        const isHorizontal = this.layoutConfig.getLayoutDirection() === 'horizontal';
        
        // 스크롤 델타 계산
        const delta = event.deltaY || event.deltaX;
        
        // 스크롤 방향에 따라 처리
        if (isHorizontal) {
            event.preventDefault();
            this.container.scrollLeft += delta;
        }
    };

    /**
     * 가장 가까운 카드로 스냅합니다.
     */
    private snapToCard(): void {
        const direction = this.layoutConfig.getLayoutDirection();
        const cardWidth = this.layoutConfig.getCardWidth();
        const cardHeight = this.layoutConfig.getCardHeight();
        const cardGap = this.layoutConfig.getCardGap();
        
        if (direction === 'horizontal') {
            this.snapHorizontal(cardWidth, cardGap);
        } else {
            this.snapVertical(typeof cardHeight === 'number' ? cardHeight : cardWidth, cardGap);
        }
    }

    /**
     * 가로 방향으로 스냅합니다.
     */
    private snapHorizontal(cardWidth: number, cardGap: number): void {
        const scrollLeft = this.container.scrollLeft;
        const cardUnit = cardWidth + cardGap;
        
        // 가장 가까운 카드 위치 계산
        const cardIndex = Math.round(scrollLeft / cardUnit);
        const targetScrollLeft = cardIndex * cardUnit;
        
        // 부드러운 스크롤 적용
        this.setScrollPosition(targetScrollLeft, this.container.scrollTop, this.settings.enableScrollAnimation);
    }

    /**
     * 세로 방향으로 스냅합니다.
     */
    private snapVertical(cardHeight: number, cardGap: number): void {
        const scrollTop = this.container.scrollTop;
        const cardUnit = cardHeight + cardGap;
        
        // 가장 가까운 카드 위치 계산
        const cardIndex = Math.round(scrollTop / cardUnit);
        const targetScrollTop = cardIndex * cardUnit;
        
        // 부드러운 스크롤 적용
        this.setScrollPosition(this.container.scrollLeft, targetScrollTop, this.settings.enableScrollAnimation);
    }

    /**
     * 특정 카드로 스크롤합니다.
     * @param cardElement 스크롤할 카드 요소
     * @param smooth 부드러운 스크롤 여부
     */
    scrollToCard(cardElement: HTMLElement, smooth: boolean = true): void {
        if (!cardElement) return;
        
        console.log('[Scroller] 카드로 스크롤 시작');
        
        const direction = this.layoutConfig.getLayoutDirection();
        const containerRect = this.container.getBoundingClientRect();
        const cardRect = cardElement.getBoundingClientRect();
        
        let targetLeft = this.container.scrollLeft;
        let targetTop = this.container.scrollTop;
        
        if (direction === 'horizontal') {
            // 가로 스크롤 계산 - 카드를 정확히 중앙에 배치
            const cardLeft = cardRect.left - containerRect.left + this.container.scrollLeft;
            const cardCenter = cardLeft + (cardRect.width / 2);
            const containerCenter = containerRect.width / 2;
            targetLeft = cardCenter - containerCenter;
            
            console.log(`[Scroller] 가로 스크롤: ${targetLeft}px (카드 중앙: ${cardCenter}px, 컨테이너 중앙: ${containerCenter}px)`);
        } else {
            // 세로 스크롤 계산 - 카드를 정확히 중앙에 배치
            const cardTop = cardRect.top - containerRect.top + this.container.scrollTop;
            const cardCenter = cardTop + (cardRect.height / 2);
            const containerCenter = containerRect.height / 2;
            targetTop = cardCenter - containerCenter;
            
            console.log(`[Scroller] 세로 스크롤: ${targetTop}px (카드 중앙: ${cardCenter}px, 컨테이너 중앙: ${containerCenter}px)`);
        }
        
        // 스크롤 위치가 음수가 되지 않도록 보정
        targetLeft = Math.max(0, targetLeft);
        targetTop = Math.max(0, targetTop);
        
        // 스크롤 적용
        this.setScrollPosition(targetLeft, targetTop, smooth);
    }

    /**
     * 스크롤 위치를 설정합니다.
     * @param left 왼쪽 스크롤 위치
     * @param top 위쪽 스크롤 위치
     * @param smooth 부드러운 스크롤 여부
     */
    setScrollPosition(left: number, top: number, smooth: boolean = true): void {
        if (!this.container) return;
        
        try {
            // 스크롤 동작 설정
            if (smooth && 'scrollBehavior' in document.documentElement.style) {
                this.container.style.scrollBehavior = 'smooth';
            } else {
                this.container.style.scrollBehavior = 'auto';
            }
            
            // 스크롤 위치 설정
            this.container.scrollTo({
                left,
                top,
                behavior: smooth ? 'smooth' : 'auto'
            });
            
            // 스크롤 위치 업데이트
            this.lastScrollPosition = { left, top };
        } catch (error) {
            console.error('스크롤 위치 설정 중 오류 발생:', error);
            
            // 폴백: 기본 스크롤 메서드 사용
            this.container.scrollLeft = left;
            this.container.scrollTop = top;
        }
    }

    /**
     * 현재 스크롤 위치를 가져옵니다.
     */
    getScrollPosition(): { left: number, top: number } {
        return {
            left: this.container.scrollLeft,
            top: this.container.scrollTop
        };
    }

    /**
     * 위로 스크롤합니다.
     * @param count 스크롤할 단위 수
     */
    scrollUp(count: number = 1): void {
        const direction = this.layoutConfig.getLayoutDirection();
        const cardHeight = this.layoutConfig.getCardHeight();
        const cardGap = this.layoutConfig.getCardGap();
        
        const scrollUnit = (typeof cardHeight === 'number' ? cardHeight : 200) + cardGap;
        const currentPosition = this.getScrollPosition();
        
        this.setScrollPosition(
            currentPosition.left,
            Math.max(0, currentPosition.top - scrollUnit * count),
            this.settings.enableScrollAnimation
        );
    }

    /**
     * 아래로 스크롤합니다.
     * @param count 스크롤할 단위 수
     */
    scrollDown(count: number = 1): void {
        const direction = this.layoutConfig.getLayoutDirection();
        const cardHeight = this.layoutConfig.getCardHeight();
        const cardGap = this.layoutConfig.getCardGap();
        
        const scrollUnit = (typeof cardHeight === 'number' ? cardHeight : 200) + cardGap;
        const currentPosition = this.getScrollPosition();
        
        this.setScrollPosition(
            currentPosition.left,
            currentPosition.top + scrollUnit * count,
            this.settings.enableScrollAnimation
        );
    }

    /**
     * 왼쪽으로 스크롤합니다.
     * @param count 스크롤할 단위 수
     */
    scrollLeft(count: number = 1): void {
        const cardWidth = this.layoutConfig.getCardWidth();
        const cardGap = this.layoutConfig.getCardGap();
        
        const scrollUnit = cardWidth + cardGap;
        const currentPosition = this.getScrollPosition();
        
        this.setScrollPosition(
            Math.max(0, currentPosition.left - scrollUnit * count),
            currentPosition.top,
            this.settings.enableScrollAnimation
        );
    }

    /**
     * 오른쪽으로 스크롤합니다.
     * @param count 스크롤할 단위 수
     */
    scrollRight(count: number = 1): void {
        const cardWidth = this.layoutConfig.getCardWidth();
        const cardGap = this.layoutConfig.getCardGap();
        
        const scrollUnit = cardWidth + cardGap;
        const currentPosition = this.getScrollPosition();
        
        this.setScrollPosition(
            currentPosition.left + scrollUnit * count,
            currentPosition.top,
            this.settings.enableScrollAnimation
        );
    }

    /**
     * 페이지 단위로 위로 스크롤합니다.
     */
    pageUp(): void {
        const containerHeight = this.container.clientHeight;
        const currentPosition = this.getScrollPosition();
        
        this.setScrollPosition(
            currentPosition.left,
            Math.max(0, currentPosition.top - containerHeight),
            this.settings.enableScrollAnimation
        );
    }

    /**
     * 페이지 단위로 아래로 스크롤합니다.
     */
    pageDown(): void {
        const containerHeight = this.container.clientHeight;
        const currentPosition = this.getScrollPosition();
        
        this.setScrollPosition(
            currentPosition.left,
            currentPosition.top + containerHeight,
            this.settings.enableScrollAnimation
        );
    }

    /**
     * 리소스를 정리합니다.
     */
    onunload(): void {
        // 이벤트 리스너 제거
        this.container.removeEventListener('scroll', this.handleScrollEvent);
        this.container.removeEventListener('wheel', this.handleWheel);
        
        // 타임아웃 정리
        if (this.scrollTimeout) {
            clearTimeout(this.scrollTimeout);
            this.scrollTimeout = null;
        }
        
        if (this.scrollThrottleTimeout) {
            clearTimeout(this.scrollThrottleTimeout);
            this.scrollThrottleTimeout = null;
        }
        
        if (this.scrollEndTimeout) {
            clearTimeout(this.scrollEndTimeout);
            this.scrollEndTimeout = null;
        }
        
        // 리스너 목록 정리
        this.scrollListeners.clear();
        this.scrollEndListeners.clear();
    }
}