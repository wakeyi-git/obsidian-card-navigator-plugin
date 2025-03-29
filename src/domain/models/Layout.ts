import { Card } from './Card';
import { LayoutUtils } from '../utils/layoutUtils';

/**
 * 레이아웃 타입
 */
export enum LayoutType {
  GRID = 'grid',
  MASONRY = 'masonry'
}

/**
 * 레이아웃 방향
 */
export enum LayoutDirection {
  HORIZONTAL = 'horizontal',
  VERTICAL = 'vertical'
}

/**
 * 레이아웃 설정 인터페이스
 */
export interface ILayoutConfig {
  /**
   * 레이아웃 타입
   */
  type: LayoutType;

  /**
   * 레이아웃 방향 (그리드 레이아웃에서만 사용)
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
   * 열 수 (그리드/메이슨리 레이아웃)
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
    // 카드 위치 계산
    this._cardPositions = LayoutUtils.calculateLayout(
      cards.map(card => ({
        cardId: card.id,
        x: 0,
        y: 0,
        width: this._config.cardWidth,
        height: this._config.cardHeight
      })),
      this._config
    );
    this._updatedAt = new Date();
  }

  /**
   * 카드 위치 계산
   */
  private _calculateCardPositions(cards: Card[]): void {
    this.calculateLayout(cards);
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