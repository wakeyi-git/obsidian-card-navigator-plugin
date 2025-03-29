import { Card } from './Card';

/**
 * 레이아웃 타입
 */
export type LayoutType = 'grid' | 'masonry';

/**
 * 레이아웃 방향
 */
export enum LayoutDirection {
  /** 가로 방향 */
  HORIZONTAL = 'HORIZONTAL',
  /** 세로 방향 */
  VERTICAL = 'VERTICAL'
}

/**
 * 레이아웃 설정
 */
export interface ILayoutConfig {
  type: LayoutType;
  cardWidth: number;
  cardHeight: number;
  gap: number;
  padding: number;
  viewportWidth: number;
  viewportHeight: number;
}

/**
 * 카드 위치
 */
export interface ICardPosition {
  cardId: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * 레이아웃 인터페이스
 */
export interface ILayout {
  id: string;
  config: ILayoutConfig;
  cardPositions: ICardPosition[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 레이아웃 클래스
 */
export class Layout implements ILayout {
  private _id: string;
  private _config: ILayoutConfig;
  private _cardPositions: ICardPosition[];
  private _createdAt: Date;
  private _updatedAt: Date;

  constructor(
    id: string,
    config: ILayoutConfig,
    cardPositions: ICardPosition[] = [],
    createdAt: Date = new Date(),
    updatedAt: Date = new Date()
  ) {
    this._id = id;
    this._config = config;
    this._cardPositions = cardPositions;
    this._createdAt = createdAt;
    this._updatedAt = updatedAt;
  }

  get id(): string {
    return this._id;
  }

  get config(): ILayoutConfig {
    return this._config;
  }

  get cardPositions(): ICardPosition[] {
    return this._cardPositions;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  set config(config: ILayoutConfig) {
    this._config = config;
    this._updatedAt = new Date();
  }

  /**
   * 레이아웃 설정 업데이트
   */
  updateConfig(config: Partial<ILayoutConfig>): void {
    this._config = { ...this._config, ...config };
    this._updatedAt = new Date();
  }

  updateViewport(width: number, height: number): void {
    this._config.viewportWidth = width;
    this._config.viewportHeight = height;
    this._updatedAt = new Date();
  }

  updateCardPosition(cardId: string, position: Omit<ICardPosition, 'cardId'>): void {
    const index = this._cardPositions.findIndex(p => p.cardId === cardId);
    if (index !== -1) {
      this._cardPositions[index] = { ...position, cardId };
      this._updatedAt = new Date();
    }
  }

  addCardPosition(position: ICardPosition): void {
    this._cardPositions.push(position);
    this._updatedAt = new Date();
  }

  removeCardPosition(cardId: string): void {
    this._cardPositions = this._cardPositions.filter(p => p.cardId !== cardId);
    this._updatedAt = new Date();
  }

  resetCardPositions(): void {
    this._cardPositions = [];
    this._updatedAt = new Date();
  }

  calculateLayout(cards: Card[]): void {
    const { type, cardWidth, cardHeight, gap, padding, viewportWidth, viewportHeight } = this._config;

    // 사용 가능한 공간 계산
    const availableWidth = viewportWidth - padding * 2;
    const availableHeight = viewportHeight - padding * 2;

    if (type === 'grid') {
      this.calculateGridLayout(cards, availableWidth, availableHeight, cardWidth, cardHeight, gap);
    } else {
      this.calculateMasonryLayout(cards, availableWidth, cardWidth, gap);
    }

    this._updatedAt = new Date();
  }

  private calculateGridLayout(
    cards: Card[],
    availableWidth: number,
    availableHeight: number,
    cardWidth: number,
    cardHeight: number,
    gap: number
  ): void {
    const { padding } = this._config;
    
    // 열 수 계산
    const columns = Math.floor((availableWidth + gap) / (cardWidth + gap));
    if (columns < 1) return;

    // 행 수 계산
    const rows = Math.ceil(cards.length / columns);

    // 가로 레이아웃인지 확인
    const isHorizontal = availableWidth > availableHeight;

    this._cardPositions = cards.map((card, index) => {
      if (isHorizontal) {
        // 가로 레이아웃
        const row = Math.floor(index / columns);
        const col = index % columns;
        return {
          cardId: card.id,
          x: padding + col * (cardWidth + gap),
          y: padding + row * (cardHeight + gap),
          width: cardWidth,
          height: cardHeight
        };
      } else {
        // 세로 레이아웃
        const col = Math.floor(index / rows);
        const row = index % rows;
        return {
          cardId: card.id,
          x: padding + col * (cardWidth + gap),
          y: padding + row * (cardHeight + gap),
          width: cardWidth,
          height: cardHeight
        };
      }
    });
  }

  private calculateMasonryLayout(
    cards: Card[],
    availableWidth: number,
    cardWidth: number,
    gap: number
  ): void {
    const { padding, cardHeight } = this._config;
    
    // 열 수 계산
    const columns = Math.floor((availableWidth + gap) / (cardWidth + gap));
    if (columns < 1) return;

    // 각 열의 현재 높이를 추적
    const columnHeights = new Array(columns).fill(0);
    const columnPositions: ICardPosition[] = [];

    // 각 카드를 가장 짧은 열에 배치
    cards.forEach(card => {
      // 가장 짧은 열 찾기
      const shortestColumn = columnHeights.indexOf(Math.min(...columnHeights));
      const x = padding + shortestColumn * (cardWidth + gap);
      const y = padding + columnHeights[shortestColumn];

      // 카드 위치 저장
      columnPositions.push({
        cardId: card.id,
        x,
        y,
        width: cardWidth,
        height: cardHeight
      });

      // 열 높이 업데이트
      columnHeights[shortestColumn] += cardHeight + gap;
    });

    this._cardPositions = columnPositions;
  }

  getCardPosition(cardId: string): ICardPosition | undefined {
    return this._cardPositions.find(p => p.cardId === cardId);
  }

  clone(): Layout {
    return new Layout(
      this._id,
      { ...this._config },
      this._cardPositions.map(p => ({ ...p })),
      new Date(this._createdAt),
      new Date(this._updatedAt)
    );
  }
} 