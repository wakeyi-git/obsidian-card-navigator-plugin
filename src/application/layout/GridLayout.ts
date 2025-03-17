import { ILayout, LayoutType, LayoutOptions, LayoutDirection, ILayoutInfo } from '../../domain/layout/Layout';
import { ICard } from '../../domain/card/Card';
import { ILayoutSettings } from '../../domain/settings/Settings';
import { DomainEventBus } from '../../core/events/DomainEventBus';
import { EventType } from '../../core/events/EventTypes';

/**
 * 그리드 레이아웃 구현체
 * 컨테이너 크기에 따라 자동으로 가로/세로 모드를 전환하는 레이아웃입니다.
 */
export class GridLayout implements ILayout {
  id: string;
  type: LayoutType;
  options: LayoutOptions;
  cards: ICard[];
  direction: LayoutDirection;
  gap: number;
  padding: number;
  transition: string;
  metadata: Record<string, any>;
  created: number;
  updated: number;
  layoutAdapter?: any;
  eventBus: DomainEventBus;

  constructor(settings: ILayoutSettings) {
    this.id = `grid-layout-${Date.now()}`;
    this.type = 'grid';
    this.options = {
      type: 'grid',
      columns: 3,
      spacing: settings.gap,
      cardWidth: 300,
      cardHeight: 200
    };
    this.cards = [];
    this.direction = 'auto';
    this.gap = settings.gap;
    this.padding = settings.padding;
    this.transition = 'all 0.3s ease';
    this.metadata = {};
    this.created = Date.now();
    this.updated = Date.now();
    this.eventBus = DomainEventBus.getInstance();
  }

  initialize(): void {
    this.layoutAdapter?.createLayoutElement(this);
    this.eventBus.publish(EventType.LAYOUT_INITIALIZED, { layout: this.id });
  }

  setLayoutType(type: LayoutType): void {
    this.type = type;
    this.options.type = type;
    this.eventBus.publish(EventType.LAYOUT_TYPE_CHANGED, { layout: this.id, type });
  }

  setLayoutOptions(options: Partial<LayoutOptions>): void {
    this.options = { ...this.options, ...options };
    this.eventBus.publish(EventType.LAYOUT_OPTIONS_CHANGED, { layout: this.id, options });
  }

  addCard(card: ICard): void {
    this.cards.push(card);
    this.eventBus.publish(EventType.CARD_ADDED, { layout: this.id, card: card.getId() });
  }

  removeCard(cardId: string): void {
    this.cards = this.cards.filter(card => card.getId() !== cardId);
    this.eventBus.publish(EventType.CARD_REMOVED, { layout: this.id, card: cardId });
  }

  updateCard(card: ICard): void {
    const index = this.cards.findIndex(c => c.getId() === card.getId());
    if (index !== -1) {
      this.cards[index] = card;
    }
  }

  clearCards(): void {
    this.cards = [];
    this.eventBus.publish(EventType.CARDS_CLEARED, { layout: this.id });
  }

  updateLayout(): void {
    this.layoutAdapter?.updateLayoutElement(
      this.layoutAdapter.getLayoutElement(this.id)!,
      this
    );
    this.eventBus.publish(EventType.LAYOUT_UPDATED, { layout: this.id });
  }

  getId(): string {
    return this.id;
  }

  getType(): LayoutType {
    return this.type;
  }

  getOptions(): LayoutOptions {
    return this.options;
  }

  getCards(): ICard[] {
    return this.cards;
  }

  calculateLayout(
    containerWidth: number,
    containerHeight: number,
    itemCount: number
  ): ILayoutInfo {
    // 컨테이너의 실제 사용 가능한 너비와 높이 계산
    const availableWidth = containerWidth - (this.padding * 2);
    const availableHeight = containerHeight - (this.padding * 2);

    // 컨테이너의 가로 세로 비율에 따라 레이아웃 결정
    const isWide = availableWidth > availableHeight;
    this.direction = isWide ? 'horizontal' : 'vertical';

    if (isWide) {
      // 가로 모드: 높이 기준으로 열 수 계산
      const itemHeight = Math.min(availableHeight, 200); // 최대 높이 제한
      const columns = Math.floor(availableWidth / (itemHeight + this.gap));
      const rows = Math.ceil(itemCount / columns);

      return {
        columns,
        rows,
        itemWidth: itemHeight,
        itemHeight,
        fixedHeight: true,
        direction: this.direction,
        scrollDirection: 'horizontal',
        itemCount,
        containerWidth,
        containerHeight
      };
    } else {
      // 세로 모드: 너비 기준으로 열 수 계산
      const itemWidth = Math.min(availableWidth / 3, 200); // 최대 너비 제한
      const columns = Math.floor(availableWidth / (itemWidth + this.gap));
      const rows = Math.ceil(itemCount / columns);

      return {
        columns,
        rows,
        itemWidth,
        itemHeight: itemWidth,
        fixedHeight: true,
        direction: this.direction,
        scrollDirection: 'vertical',
        itemCount,
        containerWidth,
        containerHeight
      };
    }
  }

  getDirection(): LayoutDirection {
    return this.direction;
  }

  getGap(): number {
    return this.gap;
  }

  getPadding(): number {
    return this.padding;
  }

  getTransition(): string {
    return this.transition;
  }

  getMetadata(): Record<string, any> {
    return this.metadata;
  }

  getCreated(): number {
    return this.created;
  }

  getUpdated(): number {
    return this.updated;
  }

  setDirection(direction: LayoutDirection): void {
    this.direction = direction;
  }

  setGap(gap: number): void {
    this.gap = gap;
  }

  setPadding(padding: number): void {
    this.padding = padding;
  }

  setTransition(transition: string): void {
    this.transition = transition;
  }

  setMetadata(metadata: Record<string, any>): void {
    this.metadata = metadata;
  }

  reset(): void {
    this.cards = [];
    this.options = {
      type: this.type,
      columns: 3,
      spacing: this.gap,
      cardWidth: 300,
      cardHeight: 200
    };
  }
} 