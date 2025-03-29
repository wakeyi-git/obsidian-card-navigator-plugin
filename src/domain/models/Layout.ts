import { Card } from './Card';

/**
 * 레이아웃 타입
 */
export type LayoutType = 'grid' | 'masonry';

/**
 * 레이아웃 방향
 */
export type LayoutDirection = 'horizontal' | 'vertical';

/**
 * 레이아웃 설정 인터페이스
 */
export interface ILayoutConfig {
  /**
   * 레이아웃 타입
   */
  type: LayoutType;

  /**
   * 레이아웃 방향
   */
  direction: LayoutDirection;

  /**
   * 카드 높이 고정 여부
   */
  fixedHeight: boolean;

  /**
   * 카드 임계 너비
   */
  minCardWidth: number;

  /**
   * 카드 임계 높이
   */
  minCardHeight: number;

  /**
   * 카드 너비
   */
  cardWidth: number;

  /**
   * 카드 높이
   */
  cardHeight: number;

  /**
   * 카드 간격
   */
  gap: number;

  /**
   * 여백
   */
  padding: number;

  /**
   * 뷰포트 너비
   */
  viewportWidth: number;

  /**
   * 뷰포트 높이
   */
  viewportHeight: number;

  /**
   * 열 수 (그리드 레이아웃)
   */
  columns?: number;

  /**
   * 행 수 (그리드 레이아웃)
   */
  rows?: number;
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
  name: string;
  description: string;
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
  private _name: string;
  private _description: string;
  private _config: ILayoutConfig;
  private _cardPositions: ICardPosition[];
  private _createdAt: Date;
  private _updatedAt: Date;

  constructor(
    id: string,
    name: string,
    description: string,
    config: ILayoutConfig,
    cardPositions: ICardPosition[] = [],
    createdAt: Date = new Date(),
    updatedAt: Date = new Date()
  ) {
    this._id = id;
    this._name = name;
    this._description = description;
    this._config = config;
    this._cardPositions = cardPositions;
    this._createdAt = createdAt;
    this._updatedAt = updatedAt;
  }

  get id(): string {
    return this._id;
  }

  get name(): string {
    return this._name;
  }

  get description(): string {
    return this._description;
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

  set name(name: string) {
    this._name = name;
    this._updatedAt = new Date();
  }

  set description(description: string) {
    this._description = description;
    this._updatedAt = new Date();
  }

  set config(config: ILayoutConfig) {
    this._config = config;
    this._updatedAt = new Date();
  }

  /**
   * 레이아웃 계산
   */
  calculateLayout(cards: Card[]): void {
    const { type, direction, fixedHeight, minCardWidth, minCardHeight, gap, padding, viewportWidth, viewportHeight } = this._config;

    // 사용 가능한 공간 계산
    const availableWidth = viewportWidth - padding * 2;
    const availableHeight = viewportHeight - padding * 2;

    if (type === 'masonry') {
      // 메이슨리 레이아웃 계산
      const columns = Math.floor(availableWidth / (minCardWidth + gap));
      this._config.columns = Math.max(1, columns);
      this._config.cardWidth = availableWidth / this._config.columns - gap;
      this._config.cardHeight = minCardHeight;
    } else {
      // 그리드 레이아웃 계산
      if (direction === 'horizontal') {
        // 가로 레이아웃
        const rows = Math.floor(availableHeight / (minCardHeight + gap));
        this._config.rows = Math.max(1, rows);
        this._config.columns = Math.ceil(cards.length / this._config.rows);
        this._config.cardWidth = availableWidth / this._config.columns - gap;
        this._config.cardHeight = fixedHeight ? minCardHeight : availableHeight / this._config.rows - gap;
      } else {
        // 세로 레이아웃
        const columns = Math.floor(availableWidth / (minCardWidth + gap));
        this._config.columns = Math.max(1, columns);
        this._config.rows = Math.ceil(cards.length / this._config.columns);
        this._config.cardWidth = availableWidth / this._config.columns - gap;
        this._config.cardHeight = fixedHeight ? minCardHeight : availableHeight / this._config.rows - gap;
      }
    }

    // 카드 위치 계산
    this._calculateCardPositions(cards);
    this._updatedAt = new Date();
  }

  /**
   * 카드 위치 계산
   */
  private _calculateCardPositions(cards: Card[]): void {
    const { type, direction, cardWidth, cardHeight, gap, padding } = this._config;

    if (type === 'grid') {
      this._calculateGridPositions(cards, cardWidth, cardHeight, gap, padding);
    } else {
      this._calculateMasonryPositions(cards, cardWidth, cardHeight, gap, padding);
    }
  }

  /**
   * 그리드 레이아웃 카드 위치 계산
   */
  private _calculateGridPositions(
    cards: Card[],
    cardWidth: number,
    cardHeight: number,
    gap: number,
    padding: number
  ): void {
    const { direction, columns, rows } = this._config;
    
    // columns와 rows가 undefined인 경우 기본값 설정
    const gridColumns = columns ?? 1;
    const gridRows = rows ?? 1;
    
    this._cardPositions = cards.map((card, index) => {
      if (direction === 'horizontal') {
        const row = Math.floor(index / gridColumns);
        const col = index % gridColumns;
        return {
          cardId: card.id,
          x: padding + col * (cardWidth + gap),
          y: padding + row * (cardHeight + gap),
          width: cardWidth,
          height: cardHeight
        };
      } else {
        const col = Math.floor(index / gridRows);
        const row = index % gridRows;
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

  /**
   * 메이슨리 레이아웃 카드 위치 계산
   */
  private _calculateMasonryPositions(
    cards: Card[],
    cardWidth: number,
    cardHeight: number,
    gap: number,
    padding: number
  ): void {
    const { columns } = this._config;
    
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

  getCardPosition(cardId: string): ICardPosition | undefined {
    return this._cardPositions.find(p => p.cardId === cardId);
  }

  /**
   * 레이아웃 복제
   */
  clone(): Layout {
    return new Layout(
      this._id,
      this._name,
      this._description,
      { ...this._config },
      this._cardPositions.map(p => ({ ...p })),
      new Date(this._createdAt),
      new Date(this._updatedAt)
    );
  }
} 