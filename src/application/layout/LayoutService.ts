import { ILayout, LayoutType, LayoutOptions, LayoutDirection, ILayoutInfo } from '../../domain/layout/Layout';
import { ILayoutAdapter } from '../../infrastructure/adapters/ILayoutAdapter';
import { IEventBus } from '../../core/events/IEventBus';
import { EventType } from '../../core/events/EventTypes';
import { ICard } from '../../domain/card/Card';
import { DomainEventBus } from '../../core/events/DomainEventBus';
import { ILayoutSettings } from '../../domain/settings/Settings';
import { GridLayout } from './GridLayout';

/**
 * 레이아웃 서비스 인터페이스
 */
export interface ILayoutService {
  /**
   * 레이아웃 생성
   */
  createLayout(type: LayoutType, options?: Partial<LayoutOptions>): ILayout;

  /**
   * 레이아웃 초기화
   */
  initializeLayout(layoutId: string): void;

  /**
   * 레이아웃 타입 변경
   */
  setLayoutType(layoutId: string, type: LayoutType): void;

  /**
   * 레이아웃 옵션 변경
   */
  setLayoutOptions(layoutId: string, options: Partial<LayoutOptions>): void;

  /**
   * 카드 추가
   */
  addCard(layoutId: string, card: ICard): void;

  /**
   * 카드 제거
   */
  removeCard(layoutId: string, cardId: string): void;

  /**
   * 카드 업데이트
   */
  updateCard(layoutId: string, card: ICard): void;

  /**
   * 모든 카드 제거
   */
  clearCards(layoutId: string): void;

  /**
   * 레이아웃 업데이트
   */
  updateLayout(layoutId: string): void;

  /**
   * 레이아웃 가져오기
   */
  getLayout(layoutId: string): ILayout | null;

  /**
   * 모든 레이아웃 가져오기
   */
  getAllLayouts(): ILayout[];

  /**
   * 서비스 정리
   */
  destroy(): void;

  /**
   * 레이아웃 설정 업데이트
   * @param settings 새로운 레이아웃 설정
   */
  updateSettings(settings: ILayoutSettings): void;

  /**
   * 레이아웃 정보 계산
   * @param containerWidth 컨테이너 너비
   * @param containerHeight 컨테이너 높이
   * @param itemCount 아이템 개수
   * @returns 레이아웃 정보
   */
  calculateLayout(
    containerWidth: number,
    containerHeight: number,
    itemCount: number
  ): ILayoutInfo;

  /**
   * 간격 가져오기
   * @returns 간격 값
   */
  getGap(): number;

  /**
   * 패딩 가져오기
   * @returns 패딩 값
   */
  getPadding(): number;

  /**
   * 전환 효과 가져오기
   * @returns 전환 효과 문자열
   */
  getTransition(): string;
}

/**
 * 레이아웃 서비스 구현체
 */
export class LayoutService implements ILayoutService {
  private layouts: Map<string, ILayout> = new Map();
  private eventBus: DomainEventBus;
  private layout: GridLayout;

  constructor(
    private readonly layoutAdapter: ILayoutAdapter,
    settings: ILayoutSettings
  ) {
    this.eventBus = DomainEventBus.getInstance();
    this.layout = new GridLayout(settings);
  }

  /**
   * 레이아웃 생성
   */
  createLayout(type: LayoutType, options?: Partial<LayoutOptions>): ILayout {
    const layout: ILayout = {
      id: `layout-${Date.now()}`,
      type,
      options: {
        type,
        ...options
      },
      cards: [] as ICard[],
      direction: 'auto',
      gap: 16,
      padding: 16,
      transition: 'all 0.3s ease',
      metadata: {},
      created: Date.now(),
      updated: Date.now(),
      initialize() {
        this.layoutAdapter.createLayoutElement(this);
        this.eventBus.publish(EventType.LAYOUT_INITIALIZED, { layout: this.id });
      },
      setLayoutType(type: LayoutType) {
        this.type = type;
        this.options.type = type;
        this.eventBus.publish(EventType.LAYOUT_TYPE_CHANGED, { layout: this.id, type });
      },
      setLayoutOptions(options: Partial<LayoutOptions>) {
        this.options = { ...this.options, ...options };
        this.eventBus.publish(EventType.LAYOUT_OPTIONS_CHANGED, { layout: this.id, options });
      },
      addCard(card: ICard) {
        this.cards.push(card);
        this.eventBus.publish(EventType.CARD_ADDED, { layout: this.id, card: card.getId() });
      },
      removeCard(cardId: string) {
        this.cards = this.cards.filter(card => card.getId() !== cardId);
        this.eventBus.publish(EventType.CARD_REMOVED, { layout: this.id, card: cardId });
      },
      updateCard(card: ICard) {
        const index = this.cards.findIndex(c => c.getId() === card.getId());
        if (index !== -1) {
          this.cards[index] = card;
        }
      },
      clearCards() {
        this.cards = [];
        this.eventBus.publish(EventType.CARDS_CLEARED, { layout: this.id });
      },
      updateLayout() {
        this.layoutAdapter.updateLayoutElement(
          this.layoutAdapter.getLayoutElement(this.id)!,
          this
        );
        this.eventBus.publish(EventType.LAYOUT_UPDATED, { layout: this.id });
      },
      getId() {
        return this.id;
      },
      getType() {
        return this.type;
      },
      getOptions() {
        return this.options;
      },
      getCards() {
        return this.cards;
      },
      calculateLayout(containerWidth: number, containerHeight: number, itemCount: number) {
        return {
          columns: this.options.columns || 3,
          rows: Math.ceil(itemCount / (this.options.columns || 3)),
          itemWidth: this.options.cardWidth || 300,
          itemHeight: this.options.cardHeight || 200,
          fixedHeight: this.type === 'grid',
          direction: this.direction,
          scrollDirection: 'vertical',
          itemCount,
          containerWidth,
          containerHeight
        };
      },
      getDirection() {
        return this.direction;
      },
      getGap() {
        return this.gap;
      },
      getPadding() {
        return this.padding;
      },
      getTransition() {
        return this.transition;
      },
      getMetadata() {
        return this.metadata;
      },
      getCreated() {
        return this.created;
      },
      getUpdated() {
        return this.updated;
      },
      setDirection(direction: LayoutDirection) {
        this.direction = direction;
      },
      setGap(gap: number) {
        this.gap = gap;
      },
      setPadding(padding: number) {
        this.padding = padding;
      },
      setTransition(transition: string) {
        this.transition = transition;
      },
      setMetadata(metadata: Record<string, any>) {
        this.metadata = metadata;
      },
      reset() {
        this.cards = [];
        this.options = {
          type: this.type,
          columns: 3,
          spacing: 16,
          cardWidth: 300,
          cardHeight: 200
        };
      }
    };

    this.layouts.set(layout.id, layout);
    return layout;
  }

  /**
   * 레이아웃 초기화
   */
  initializeLayout(layoutId: string): void {
    const layout = this.layouts.get(layoutId);
    if (layout) {
      layout.initialize();
    }
  }

  /**
   * 레이아웃 타입 변경
   */
  setLayoutType(layoutId: string, type: LayoutType): void {
    const layout = this.layouts.get(layoutId);
    if (layout) {
      layout.setLayoutType(type);
    }
  }

  /**
   * 레이아웃 옵션 변경
   */
  setLayoutOptions(layoutId: string, options: Partial<LayoutOptions>): void {
    const layout = this.layouts.get(layoutId);
    if (layout) {
      layout.setLayoutOptions(options);
    }
  }

  /**
   * 카드 추가
   */
  addCard(layoutId: string, card: ICard): void {
    const layout = this.layouts.get(layoutId);
    if (layout) {
      layout.addCard(card);
    }
  }

  /**
   * 카드 제거
   */
  removeCard(layoutId: string, cardId: string): void {
    const layout = this.layouts.get(layoutId);
    if (layout) {
      layout.removeCard(cardId);
    }
  }

  /**
   * 카드 업데이트
   */
  updateCard(layoutId: string, card: ICard): void {
    const layout = this.layouts.get(layoutId);
    if (layout) {
      layout.updateCard(card);
    }
  }

  /**
   * 모든 카드 제거
   */
  clearCards(layoutId: string): void {
    const layout = this.layouts.get(layoutId);
    if (layout) {
      layout.clearCards();
    }
  }

  /**
   * 레이아웃 업데이트
   */
  updateLayout(layoutId: string): void {
    const layout = this.layouts.get(layoutId);
    if (layout) {
      layout.updateLayout();
    }
  }

  /**
   * 레이아웃 가져오기
   */
  getLayout(layoutId: string): ILayout | null {
    return this.layouts.get(layoutId) || null;
  }

  /**
   * 모든 레이아웃 가져오기
   */
  getAllLayouts(): ILayout[] {
    return Array.from(this.layouts.values());
  }

  /**
   * 서비스 정리
   */
  destroy(): void {
    this.layouts.clear();
    this.eventBus.publish(EventType.CARD_SERVICE_DESTROYED, { layout: '' });
  }

  /**
   * 레이아웃 설정 업데이트
   * @param settings 새로운 레이아웃 설정
   */
  updateSettings(settings: ILayoutSettings): void {
    this.layout = new GridLayout(settings);
  }

  /**
   * 레이아웃 정보 계산
   * @param containerWidth 컨테이너 너비
   * @param containerHeight 컨테이너 높이
   * @param itemCount 아이템 개수
   * @returns 레이아웃 정보
   */
  calculateLayout(
    containerWidth: number,
    containerHeight: number,
    itemCount: number
  ): ILayoutInfo {
    return this.layout.calculateLayout(containerWidth, containerHeight, itemCount);
  }

  /**
   * 간격 가져오기
   * @returns 간격 값
   */
  getGap(): number {
    return this.layout.getGap();
  }

  /**
   * 패딩 가져오기
   * @returns 패딩 값
   */
  getPadding(): number {
    return this.layout.getPadding();
  }

  /**
   * 전환 효과 가져오기
   * @returns 전환 효과 문자열
   */
  getTransition(): string {
    return this.layout.getTransition();
  }
} 