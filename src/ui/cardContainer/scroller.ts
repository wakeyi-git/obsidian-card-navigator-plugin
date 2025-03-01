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

    constructor(container: HTMLElement, settings: CardNavigatorSettings, layoutConfig: LayoutConfig, layoutManager: LayoutManager) {
        super();
        this.container = container;
        this.settings = settings;
        this.layoutConfig = layoutConfig;
        this.layoutManager = layoutManager;
        this.initScrollListeners();
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
     * 스크롤 리스너를 초기화합니다.
     */
    private initScrollListeners(): void {
        this.container.addEventListener('wheel', this.handleWheel.bind(this), { passive: false });
        this.container.addEventListener('scroll', this.handleScroll.bind(this));
    }

    /**
     * 스크롤 이벤트를 처리합니다.
     */
    private handleScroll(): void {
        const currentPosition = {
            left: this.container.scrollLeft,
            top: this.container.scrollTop
        };

        // 스크롤 방향 감지
        if (currentPosition.left !== this.lastScrollPosition.left) {
            this.scrollDirection = 'horizontal';
        } else if (currentPosition.top !== this.lastScrollPosition.top) {
            this.scrollDirection = 'vertical';
        }

        this.lastScrollPosition = currentPosition;
    }

    /**
     * 휠 이벤트를 처리합니다.
     * @param event 휠 이벤트
     */
    private handleWheel(event: WheelEvent): void {
        // 스크롤 방향 결정
        const isHorizontal = this.layoutConfig.getLayoutDirection() === 'horizontal';
        
        // 스크롤 델타 계산
        const delta = event.deltaY || event.deltaX;
        
        // 스크롤 방향에 따라 처리
        if (isHorizontal) {
            event.preventDefault();
            this.container.scrollLeft += delta;
        }
    }

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
        const { scrollLeft } = this.container;
        const itemWidth = cardWidth + cardGap;
        const index = Math.round(scrollLeft / itemWidth);
        const targetScrollLeft = index * itemWidth;
        
        this.setScrollPosition(targetScrollLeft, this.container.scrollTop, true);
    }

    /**
     * 세로 방향으로 스냅합니다.
     */
    private snapVertical(cardHeight: number, cardGap: number): void {
        const { scrollTop } = this.container;
        const itemHeight = cardHeight + cardGap;
        const index = Math.round(scrollTop / itemHeight);
        const targetScrollTop = index * itemHeight;
        
        this.setScrollPosition(this.container.scrollLeft, targetScrollTop, true);
    }

    /**
     * 특정 카드로 스크롤합니다.
     * @param cardElement 스크롤할 카드 요소
     * @param smooth 부드러운 스크롤 여부
     */
    scrollToCard(cardElement: HTMLElement, smooth: boolean = true): void {
        if (!cardElement) return;
        
        const direction = this.layoutConfig.getLayoutDirection();
        const containerRect = this.container.getBoundingClientRect();
        const cardRect = cardElement.getBoundingClientRect();
        
        let targetLeft = this.container.scrollLeft;
        let targetTop = this.container.scrollTop;
        
        if (direction === 'horizontal') {
            // 가로 스크롤 계산
            const cardLeft = cardRect.left - containerRect.left + this.container.scrollLeft;
            targetLeft = cardLeft - (containerRect.width - cardRect.width) / 2;
        } else {
            // 세로 스크롤 계산
            const cardTop = cardRect.top - containerRect.top + this.container.scrollTop;
            targetTop = cardTop - (containerRect.height - cardRect.height) / 2;
        }
        
        this.container.scrollTo({
            left: targetLeft,
            top: targetTop,
            behavior: smooth ? 'smooth' : 'auto'
        });
    }

    /**
     * 스크롤 방향을 가져옵니다.
     */
    getScrollDirection(): 'horizontal' | 'vertical' | null {
        return this.scrollDirection;
    }

    /**
     * 현재 스크롤 중인지 여부를 반환합니다.
     */
    isCurrentlyScrolling(): boolean {
        return this.isScrolling;
    }

    /**
     * 스크롤 위치를 가져옵니다.
     */
    getScrollPosition(): { left: number, top: number } {
        return {
            left: this.container.scrollLeft,
            top: this.container.scrollTop
        };
    }

    /**
     * 스크롤 위치를 설정합니다.
     */
    setScrollPosition(left: number, top: number, smooth: boolean = false): void {
        this.container.scrollTo({
            left,
            top,
            behavior: smooth ? 'smooth' : 'auto'
        });
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
     * 스크롤 이벤트 리스너를 등록합니다.
     */
    registerScrollEvents(): void {
        this.container.addEventListener('wheel', this.handleWheel.bind(this));
    }

    /**
     * 스크롤 이벤트 리스너를 제거합니다.
     */
    unregisterScrollEvents(): void {
        this.container.removeEventListener('wheel', this.handleWheel.bind(this));
    }

    public cleanup() {
        this.container.removeEventListener('wheel', this.handleWheel.bind(this));
        this.container.removeEventListener('scroll', this.handleScroll.bind(this));
    }
} 