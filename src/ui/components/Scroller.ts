import { Card } from '@/domain/models/Card';
import { ILayoutConfig } from '@/domain/models/Layout';

/**
 * 스크롤러 설정 인터페이스
 */
interface IScrollerConfig {
  containerHeight: number;
  cardHeight: number;
  cardGap: number;
  overscan: number;
}

/**
 * 스크롤러 클래스
 * 카드 스크롤 및 포커스 관련 기능을 관리하는 클래스
 */
export class Scroller {
  private container: HTMLElement | null = null;
  private config: IScrollerConfig;
  private cards: Card[] = [];
  private visibleRange: { start: number; end: number } = { start: 0, end: 0 };
  private scrollTop: number = 0;
  private isScrolling: boolean = false;
  private scrollTimeout: number | null = null;
  private cardCache: Map<string, HTMLElement> = new Map();
  private layoutConfig: ILayoutConfig | null = null;

  constructor() {
    this.config = {
      containerHeight: 0,
      cardHeight: 0,
      cardGap: 0,
      overscan: 5 // 화면에 보이지 않는 카드의 수
    };
  }

  /**
   * 스크롤러 초기화
   */
  public initialize(container: HTMLElement, layoutConfig: ILayoutConfig): void {
    this.container = container;
    this.layoutConfig = layoutConfig;
    this.updateConfig();
    this.setupScrollListener();
  }

  /**
   * 설정 업데이트
   */
  private updateConfig(): void {
    if (!this.layoutConfig) return;

    this.config = {
      containerHeight: this.container?.clientHeight || 0,
      cardHeight: this.layoutConfig.cardHeight,
      cardGap: this.layoutConfig.gap,
      overscan: 5
    };
  }

  /**
   * 스크롤 리스너 설정
   */
  private setupScrollListener(): void {
    if (!this.container) return;

    this.container.addEventListener('scroll', () => {
      if (this.scrollTimeout) {
        window.clearTimeout(this.scrollTimeout);
      }

      this.scrollTimeout = window.setTimeout(() => {
        this.handleScroll();
      }, 16); // 약 60fps
    });
  }

  /**
   * 스크롤 이벤트 처리
   */
  private handleScroll(): void {
    if (!this.container) return;

    this.scrollTop = this.container.scrollTop;
    this.updateVisibleRange();
    this.renderVisibleCards();
  }

  /**
   * 보이는 범위 업데이트
   */
  private updateVisibleRange(): void {
    const { containerHeight, cardHeight, cardGap, overscan } = this.config;
    const totalItemHeight = cardHeight + cardGap;

    // 현재 보이는 카드의 시작과 끝 인덱스 계산
    const startIndex = Math.max(0, Math.floor(this.scrollTop / totalItemHeight) - overscan);
    const visibleCount = Math.ceil(containerHeight / totalItemHeight) + overscan * 2;
    const endIndex = Math.min(this.cards.length - 1, startIndex + visibleCount);

    this.visibleRange = { start: startIndex, end: endIndex };
  }

  /**
   * 보이는 카드 렌더링
   */
  private renderVisibleCards(): void {
    if (!this.container) return;

    const { start, end } = this.visibleRange;
    const fragment = document.createDocumentFragment();

    // 보이지 않는 카드 제거
    this.cardCache.forEach((element, id) => {
      const card = this.cards.find(c => c.id === id);
      if (!card || this.isCardVisible(card)) {
        return;
      }
      element.remove();
      this.cardCache.delete(id);
    });

    // 보이는 카드 렌더링
    for (let i = start; i <= end; i++) {
      const card = this.cards[i];
      if (!card) continue;

      let element = this.cardCache.get(card.id);
      if (!element) {
        element = this.createCardElement(card);
        this.cardCache.set(card.id, element);
      }

      // 카드 위치 업데이트
      this.updateCardPosition(element, i);
      fragment.appendChild(element);
    }

    this.container.appendChild(fragment);
  }

  /**
   * 카드 요소 생성
   */
  private createCardElement(card: Card): HTMLElement {
    const element = document.createElement('div');
    element.className = 'card-navigator-card';
    element.dataset.cardId = card.id;
    // 카드 내용 렌더링 로직 추가
    return element;
  }

  /**
   * 카드 위치 업데이트
   */
  private updateCardPosition(element: HTMLElement, index: number): void {
    const { cardHeight, cardGap } = this.config;
    const top = index * (cardHeight + cardGap);
    element.style.transform = `translateY(${top}px)`;
  }

  /**
   * 카드가 보이는지 확인
   */
  private isCardVisible(card: Card): boolean {
    const index = this.cards.findIndex(c => c.id === card.id);
    if (index === -1) return false;

    const { start, end } = this.visibleRange;
    return index >= start && index <= end;
  }

  /**
   * 카드 목록 업데이트
   */
  public updateCards(cards: Card[]): void {
    this.cards = cards;
    this.updateVisibleRange();
    this.renderVisibleCards();
  }

  /**
   * 레이아웃 설정 업데이트
   */
  public updateLayoutConfig(layoutConfig: ILayoutConfig): void {
    this.layoutConfig = layoutConfig;
    this.updateConfig();
    this.updateVisibleRange();
    this.renderVisibleCards();
  }

  /**
   * 스크롤 위치 업데이트
   */
  public scrollTo(index: number): void {
    if (!this.container) return;

    const { cardHeight, cardGap } = this.config;
    const scrollTop = index * (cardHeight + cardGap);
    this.container.scrollTop = scrollTop;
  }

  /**
   * 스크롤러 정리
   */
  public cleanup(): void {
    if (this.scrollTimeout) {
      window.clearTimeout(this.scrollTimeout);
    }
    this.cardCache.clear();
    this.container = null;
  }
} 