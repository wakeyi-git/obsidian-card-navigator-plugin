import { Layout, ILayoutConfig } from '@/domain/models/Layout';
import { DomainEventDispatcher } from '@/domain/events/DomainEventDispatcher';
import { LayoutUpdatedEvent } from '@/domain/events/LayoutEvents';
import { Card } from '@/domain/models/Card';
import { App } from 'obsidian';
import { CardSet } from '@/domain/models/CardSet';
import { LoggingService } from '@/infrastructure/services/LoggingService';
import { ILayoutService } from '@/domain/services/ILayoutService';
import { LayoutServiceError } from '@/domain/errors/LayoutServiceError';
import { ICardService } from '@/domain/services/ICardService';

/**
 * 레이아웃 서비스 클래스
 */
export class LayoutService implements ILayoutService {
  private layouts: Map<string, Layout> = new Map();
  private readonly loggingService: LoggingService;
  private currentLayoutId: string | null = null;

  constructor(
    private readonly app: App,
    private readonly eventDispatcher: DomainEventDispatcher,
    private readonly cardService: ICardService
  ) {
    this.loggingService = new LoggingService(app);
  }

  /**
   * 서비스 초기화
   */
  initialize(): void {
    this.loggingService.info('LayoutService 초기화');
  }

  /**
   * 서비스 정리
   */
  cleanup(): void {
    this.loggingService.info('LayoutService 정리');
    this.layouts.clear();
  }

  /**
   * 레이아웃 설정 조회
   */
  getLayoutConfig(): ILayoutConfig {
    if (!this.currentLayoutId) {
      throw new LayoutServiceError('현재 레이아웃이 설정되지 않았습니다.');
    }

    const layout = this.layouts.get(this.currentLayoutId);
    if (!layout) {
      throw new LayoutServiceError(`레이아웃을 찾을 수 없습니다: ${this.currentLayoutId}`);
    }

    return layout.config;
  }

  /**
   * 레이아웃 설정 업데이트
   */
  updateLayoutConfig(config: ILayoutConfig): void {
    if (!this.currentLayoutId) {
      throw new LayoutServiceError('현재 레이아웃이 설정되지 않았습니다.');
    }

    const layout = this.layouts.get(this.currentLayoutId);
    if (!layout) {
      throw new LayoutServiceError(`레이아웃을 찾을 수 없습니다: ${this.currentLayoutId}`);
    }

    layout.config = config;
    this.layouts.set(this.currentLayoutId, layout);
  }

  /**
   * 레이아웃 생성
   */
  async createLayout(name: string, description: string, config: ILayoutConfig): Promise<Layout> {
    try {
      const id = crypto.randomUUID();
      const layout = new Layout(id, name, description, config);
      this.layouts.set(id, layout);
      this.currentLayoutId = id;
      await this.eventDispatcher.dispatch(new LayoutUpdatedEvent(layout));
      return layout;
    } catch (error) {
      throw new LayoutServiceError(`레이아웃 생성 실패: ${error.message}`);
    }
  }

  /**
   * 레이아웃을 업데이트합니다.
   */
  async updateLayout(layout: Layout): Promise<void> {
    const existingLayout = this.layouts.get(layout.id);
    if (!existingLayout) {
      throw new LayoutServiceError(`레이아웃을 찾을 수 없습니다: ${layout.id}`);
    }

    // 레이아웃이 실제로 변경되었는지 확인
    if (this.areLayoutsEqual(existingLayout, layout)) {
      return;
    }

    this.layouts.set(layout.id, layout);
    this.currentLayoutId = layout.id;
    await this.saveLayout(layout);

    // 레이아웃 업데이트 이벤트 발생
    const event = new LayoutUpdatedEvent(layout);
    await this.eventDispatcher.dispatch(event);
  }

  /**
   * 레이아웃 삭제
   */
  async deleteLayout(id: string): Promise<void> {
    try {
      if (!this.layouts.has(id)) {
        throw new LayoutServiceError(`레이아웃을 찾을 수 없습니다: ${id}`);
      }
      this.layouts.delete(id);
      if (this.currentLayoutId === id) {
        this.currentLayoutId = null;
      }
    } catch (error) {
      throw new LayoutServiceError(`레이아웃 삭제 실패: ${error.message}`);
    }
  }

  /**
   * 레이아웃 조회
   */
  async getLayout(id: string): Promise<Layout | undefined> {
    return this.layouts.get(id);
  }

  /**
   * 모든 레이아웃 조회
   */
  async getAllLayouts(): Promise<Layout[]> {
    return Array.from(this.layouts.values());
  }

  /**
   * 뷰포트 크기 업데이트
   */
  async updateViewportDimensions(layoutId: string, width: number, height: number): Promise<void> {
    try {
      const layout = await this._getLayoutOrThrow(layoutId);
      layout.config.viewportWidth = width;
      layout.config.viewportHeight = height;
      
      // 현재 레이아웃의 카드셋 가져오기
      const cardSet = await this._getCurrentCardSet();
      if (cardSet) {
        await this.calculateLayout(cardSet, width, height);
      }
    } catch (error) {
      throw new LayoutServiceError(`뷰포트 크기 업데이트 실패: ${error.message}`);
    }
  }

  /**
   * 현재 레이아웃 가져오기
   */
  private _getCurrentLayout(): Layout | undefined {
    if (!this.currentLayoutId) {
      return undefined;
    }
    return this.layouts.get(this.currentLayoutId);
  }

  /**
   * 카드 위치 업데이트
   */
  updateCardPosition(card: Card, x: number, y: number): void {
    try {
      this.loggingService.debug('카드 위치 업데이트:', { cardId: card.id, x, y });
      const layout = this._getCurrentLayout();
      if (!layout) {
        throw new LayoutServiceError('현재 레이아웃이 없습니다.');
      }
      const position = layout.getCardPosition(card.id);
      if (!position) {
        throw new LayoutServiceError(`카드 위치를 찾을 수 없습니다: ${card.id}`);
      }
      layout.updateCardPosition(card.id, {
        x,
        y,
        width: position.width,
        height: position.height
      });
      this.loggingService.debug('카드 위치 업데이트 완료:', { cardId: card.id });
    } catch (error) {
      this.loggingService.error('카드 위치 업데이트 실패:', error);
      throw error;
    }
  }

  /**
   * 카드 크기 업데이트
   */
  updateCardSize(card: Card, width: number, height: number): void {
    try {
      this.loggingService.debug('카드 크기 업데이트:', { cardId: card.id, width, height });
      const layout = this._getCurrentLayout();
      if (!layout) {
        throw new LayoutServiceError('현재 레이아웃이 없습니다.');
      }
      const position = layout.getCardPosition(card.id);
      if (!position) {
        throw new LayoutServiceError(`카드 위치를 찾을 수 없습니다: ${card.id}`);
      }
      layout.updateCardPosition(card.id, {
        ...position,
        width,
        height
      });
      this.loggingService.debug('카드 크기 업데이트 완료:', { cardId: card.id });
    } catch (error) {
      this.loggingService.error('카드 크기 업데이트 실패:', error);
      throw error;
    }
  }

  /**
   * 카드 Z-인덱스 업데이트
   */
  updateCardZIndex(card: Card, zIndex: number): void {
    try {
      this.loggingService.debug('카드 Z-인덱스 업데이트:', { cardId: card.id, zIndex });
      const layout = this._getCurrentLayout();
      if (!layout) {
        throw new LayoutServiceError('현재 레이아웃이 없습니다.');
      }
      const position = layout.getCardPosition(card.id);
      if (!position) {
        throw new LayoutServiceError(`카드 위치를 찾을 수 없습니다: ${card.id}`);
      }
      layout.updateCardPosition(card.id, {
        ...position,
        zIndex
      });
      this.loggingService.debug('카드 Z-인덱스 업데이트 완료:', { cardId: card.id });
    } catch (error) {
      this.loggingService.error('카드 Z-인덱스 업데이트 실패:', error);
      throw error;
    }
  }

  /**
   * 카드 위치 초기화
   */
  async resetCardPositions(layoutId: string): Promise<void> {
    try {
      const layout = await this._getLayoutOrThrow(layoutId);
      layout.resetCardPositions();
      
      // 현재 레이아웃의 카드셋 가져오기
      const cardSet = await this._getCurrentCardSet();
      if (cardSet) {
        await this.calculateLayout(cardSet, layout.config.viewportWidth, layout.config.viewportHeight);
      }
    } catch (error) {
      throw new LayoutServiceError(`카드 위치 초기화 실패: ${error.message}`);
    }
  }

  /**
   * 현재 카드셋 가져오기
   */
  private async _getCurrentCardSet(): Promise<CardSet | null> {
    if (!this.currentLayoutId) {
      return null;
    }

    const layout = this.layouts.get(this.currentLayoutId);
    if (!layout) {
      return null;
    }

    // TODO: CardSetRepository를 통해 현재 카드셋 가져오기
    return null;
  }

  /**
   * 레이아웃 계산
   */
  calculateLayout(cardSet: CardSet, containerWidth: number, containerHeight: number): void {
    if (!this.currentLayoutId) {
      throw new LayoutServiceError('현재 레이아웃이 설정되지 않았습니다.');
    }

    const layout = this.layouts.get(this.currentLayoutId);
    if (!layout) {
      throw new LayoutServiceError(`레이아웃을 찾을 수 없습니다: ${this.currentLayoutId}`);
    }

    this.loggingService.debug('레이아웃 계산 시작:', {
      layoutId: layout.id,
      cardSetId: cardSet.id,
      containerWidth,
      containerHeight,
      cardCount: cardSet.cards.length
    });

    try {
      // 레이아웃 타입에 따른 카드 위치 계산
      switch (layout.config.type) {
        case 'grid':
          this._calculateGridLayout(layout, cardSet, containerWidth, containerHeight);
          break;
        case 'masonry':
          this._calculateMasonryLayout(layout, cardSet, containerWidth);
          break;
        default:
          this.loggingService.warn('지원하지 않는 레이아웃 타입:', layout.config.type);
      }

      this.loggingService.debug('레이아웃 계산 완료');
    } catch (error) {
      this.loggingService.error('레이아웃 계산 실패:', error);
      throw error;
    }
  }

  /**
   * 그리드 레이아웃 계산
   */
  private _calculateGridLayout(layout: Layout, cardSet: CardSet, containerWidth: number, containerHeight: number): void {
    const { cardWidth, cardHeight, gap, padding } = layout.config;
    const cards = cardSet.cards;
    
    // 컨테이너 내부 사용 가능한 공간 계산
    const availableWidth = containerWidth - (padding * 2);
    const availableHeight = containerHeight - (padding * 2);
    
    // 열과 행 수 계산
    const columns = Math.floor(availableWidth / (cardWidth + gap));
    const rows = Math.floor(availableHeight / (cardHeight + gap));
    
    // 카드 위치 계산
    cards.forEach((card, index) => {
      const row = Math.floor(index / columns);
      const col = index % columns;
      
      const x = padding + (col * (cardWidth + gap));
      const y = padding + (row * (cardHeight + gap));
      
      layout.updateCardPosition(card.id, {
        x,
        y,
        width: cardWidth,
        height: cardHeight
      });
    });
  }

  /**
   * 메이슨리 레이아웃 계산
   */
  private _calculateMasonryLayout(layout: Layout, cardSet: CardSet, containerWidth: number): void {
    const { cardWidth, gap, padding } = layout.config;
    const cards = cardSet.cards;
    
    // 컨테이너 내부 사용 가능한 공간 계산
    const availableWidth = containerWidth - (padding * 2);
    
    // 열 수 계산
    const columns = Math.floor(availableWidth / (cardWidth + gap));
    
    // 각 열의 현재 높이를 추적
    const columnHeights = new Array(columns).fill(0);
    
    // 카드 위치 계산
    cards.forEach((card) => {
      // 가장 짧은 열 찾기
      const minHeight = Math.min(...columnHeights);
      const columnIndex = columnHeights.indexOf(minHeight);
      
      const x = padding + (columnIndex * (cardWidth + gap));
      const y = padding + minHeight;
      
      // 카드의 기본 높이 사용
      const cardHeight = layout.config.cardHeight;
      
      layout.updateCardPosition(card.id, {
        x,
        y,
        width: cardWidth,
        height: cardHeight
      });
      
      // 열 높이 업데이트
      columnHeights[columnIndex] += cardHeight + gap;
    });
  }

  /**
   * 레이아웃 저장
   */
  saveLayout(layout: Layout): void {
    this.layouts.set(layout.id, layout);
  }

  /**
   * 레이아웃 조회 또는 에러 발생
   */
  private async _getLayoutOrThrow(layoutId: string): Promise<Layout> {
    const layout = await this.getLayout(layoutId);
    if (!layout) {
      throw new LayoutServiceError(`레이아웃을 찾을 수 없습니다: ${layoutId}`);
    }
    return layout;
  }

  /**
   * 두 레이아웃이 동일한지 확인합니다.
   */
  private areLayoutsEqual(layout1: Layout, layout2: Layout): boolean {
    // 기본 속성 비교
    if (layout1.id !== layout2.id ||
        layout1.config.type !== layout2.config.type ||
        layout1.config.direction !== layout2.config.direction ||
        layout1.config.fixedHeight !== layout2.config.fixedHeight ||
        layout1.config.minCardWidth !== layout2.config.minCardWidth ||
        layout1.config.minCardHeight !== layout2.config.minCardHeight ||
        layout1.config.cardWidth !== layout2.config.cardWidth ||
        layout1.config.cardHeight !== layout2.config.cardHeight ||
        layout1.config.gap !== layout2.config.gap ||
        layout1.config.padding !== layout2.config.padding ||
        layout1.config.viewportWidth !== layout2.config.viewportWidth ||
        layout1.config.viewportHeight !== layout2.config.viewportHeight) {
      return false;
    }

    // 카드 위치 비교
    const positions1 = layout1.cardPositions || [];
    const positions2 = layout2.cardPositions || [];

    if (positions1.length !== positions2.length) {
      return false;
    }

    return positions1.every((pos1, index) => {
      const pos2 = positions2[index];
      return pos1.cardId === pos2.cardId &&
             pos1.x === pos2.x &&
             pos1.y === pos2.y &&
             pos1.width === pos2.width &&
             pos1.height === pos2.height;
    });
  }

  /**
   * 카드 위치 업데이트 (일괄)
   */
  async updateCardPositions(layoutId: string, positions: { cardId: string; x: number; y: number }[]): Promise<void> {
    try {
      const layout = await this._getLayoutOrThrow(layoutId);
      
      for (const position of positions) {
        const card = await this._getCardOrThrow(position.cardId);
        layout.updateCardPosition(card.id, {
          x: position.x,
          y: position.y,
          width: layout.getCardPosition(card.id)?.width || layout.config.cardWidth,
          height: layout.getCardPosition(card.id)?.height || layout.config.cardHeight
        });
      }
    } catch (error) {
      throw new LayoutServiceError(`카드 위치 일괄 업데이트 실패: ${error.message}`);
    }
  }

  /**
   * 카드 위치 추가
   */
  async addCardPosition(layoutId: string, cardId: string, x: number, y: number, width: number, height: number): Promise<void> {
    try {
      const layout = await this._getLayoutOrThrow(layoutId);
      const card = await this._getCardOrThrow(cardId);
      
      layout.updateCardPosition(card.id, { x, y, width, height });
    } catch (error) {
      throw new LayoutServiceError(`카드 위치 추가 실패: ${error.message}`);
    }
  }

  /**
   * 카드 위치 제거
   */
  async removeCardPosition(layoutId: string, cardId: string): Promise<void> {
    try {
      const layout = await this._getLayoutOrThrow(layoutId);
      const card = await this._getCardOrThrow(cardId);
      
      layout.removeCardPosition(card.id);
    } catch (error) {
      throw new LayoutServiceError(`카드 위치 제거 실패: ${error.message}`);
    }
  }

  /**
   * 카드 조회 또는 에러 발생
   */
  private async _getCardOrThrow(cardId: string): Promise<Card> {
    const card = await this.cardService.getCardById(cardId);
    if (!card) {
      throw new LayoutServiceError(`카드를 찾을 수 없습니다: ${cardId}`);
    }
    return card;
  }
} 