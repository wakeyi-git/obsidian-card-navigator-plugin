import { ILayoutManager } from '../../core/interfaces/ILayoutManager';
import { CardPosition } from '../../core/models/CardPosition';
import { CardPosition as ICardPosition } from '../../core/types/card.types';
import { 
  LayoutDirection, 
  LayoutEvent, 
  LayoutEventHandler, 
  LayoutOptions, 
  LayoutStyleOptions, 
  LayoutType 
} from '../../core/types/layout.types';
import { ErrorCode } from '../../core/constants/error.constants';
import { Card } from '../../core/models/Card';
import { ErrorHandler } from '../../utils/error/ErrorHandler';
import { Log } from '../../utils/log/Log';
import { getElementSize } from '../../utils/helpers/dom.helper';
import { MasonryLayoutService } from '../../services/layout/MasonryLayoutService';
import { ScrollService } from '../../services/layout/ScrollService';
import { LayoutCalculationResult, LayoutEventData, LayoutEventType } from '../../core/types/layout.types';
import { ResizeManager } from './ResizeManager';
import { measurePerformance } from '../../utils/helpers/performance.helper';

/**
 * 레이아웃 관리자 클래스
 * 카드 네비게이터의 레이아웃을 관리하는 클래스입니다.
 */
export class LayoutManager implements ILayoutManager {
  /**
   * 레이아웃 옵션
   */
  private _options: LayoutOptions;
  
  /**
   * 레이아웃 타입
   */
  private _layoutType: LayoutType = 'masonry';
  
  /**
   * 컨테이너 요소
   */
  private _containerElement: HTMLElement | null = null;
  
  /**
   * 카드 요소 배열
   */
  private cardElements: HTMLElement[] = [];
  
  /**
   * 레이아웃 계산 결과
   */
  private calculationResult: LayoutCalculationResult | null = null;
  
  /**
   * 리사이즈 관리자
   */
  private resizeManager: ResizeManager | null = null;
  
  /**
   * 이벤트 리스너 맵
   */
  private eventListeners: Map<string, EventListener[]> = new Map();
  
  /**
   * 생성자
   */
  constructor() {
    // 기본 레이아웃 옵션 초기화
    this._options = {
      cardThresholdWidth: 300,
      alignCardHeight: false,
      isVertical: true,
      cardGap: 16,
      fixedCardHeight: 0,
      cardsPerView: 0
    };
  }
  
  /**
   * 레이아웃 옵션 getter
   */
  get options(): LayoutOptions {
    return { ...this._options };
  }
  
  /**
   * 레이아웃 타입 getter
   */
  get layoutType(): LayoutType {
    return this._layoutType;
  }
  
  /**
   * 컨테이너 요소 getter
   */
  get containerElement(): HTMLElement {
    if (!this._containerElement) {
      throw new Error('컨테이너 요소가 초기화되지 않았습니다.');
    }
    return this._containerElement;
  }
  
  /**
   * 레이아웃 관리자 초기화
   * @param containerElement 컨테이너 요소
   * @param options 레이아웃 옵션
   */
  initialize(containerElement: HTMLElement, options?: Partial<LayoutOptions>): void {
    try {
      this._containerElement = containerElement;
      
      if (options) {
        this.setOptions(options);
      }
      
      // 리사이즈 관리자 초기화
      this.initializeResizeManager();
      
      // 초기 레이아웃 계산
      this.updateLayout();
      
      Log.debug('LayoutManager', '레이아웃 관리자 초기화 완료');
    } catch (error) {
      ErrorHandler.handleError(
        'LayoutManager.initialize',
        `레이아웃 초기화 중 오류 발생: ${error.message}`,
        error
      );
      throw error;
    }
  }
  
  /**
   * 리사이즈 관리자 초기화
   */
  private initializeResizeManager(): void {
    // 기존 리사이즈 관리자 정리
    if (this.resizeManager) {
      this.resizeManager.destroy();
    }
    
    // 새 리사이즈 관리자 생성
    this.resizeManager = new ResizeManager(this._containerElement!);
    
    // 리사이즈 콜백 설정
    this.resizeManager.setResizeCallback(this.handleResize.bind(this));
    
    // 리사이즈 관리자 초기화
    this.resizeManager.initialize();
  }
  
  /**
   * 레이아웃 업데이트
   * 성능 최적화를 위해 measurePerformance로 래핑
   */
  updateLayout = measurePerformance(function(this: LayoutManager): void {
    try {
      if (!this._containerElement || this.cardElements.length === 0) {
        return;
      }
      
      // 컨테이너 크기 가져오기
      const { width, height } = getElementSize(this._containerElement);
      
      // 레이아웃 방향 결정
      this.determineLayoutDirection(width, height);
      
      // 레이아웃 계산
      this.calculationResult = this.calculateLayout(width, height);
      
      // 레이아웃 적용
      this.applyLayout(this.calculationResult);
      
      // 레이아웃 업데이트 이벤트 발생
      this.dispatchEvent('layout-updated', {
        type: 'layout-updated',
        layoutType: this._layoutType,
        direction: this._options.direction,
        containerSize: { width, height }
      });
      
      Log.debug('LayoutManager', `레이아웃 업데이트 완료: ${this._layoutType}, ${this._options.direction}`);
    } catch (error) {
      ErrorHandler.handleError(
        'LayoutManager.updateLayout',
        `레이아웃 업데이트 중 오류 발생: ${error.message}`,
        error
      );
    }
  }, 'LayoutManager.updateLayout');
  
  /**
   * 레이아웃 옵션 설정
   * @param options 설정할 레이아웃 옵션
   */
  setOptions(options: Partial<LayoutOptions>): void {
    ErrorHandler.captureErrorSync(() => {
      this._options = {
        ...this._options,
        ...options
      };
      
      // 레이아웃 타입이 변경된 경우 처리
      if (options.layoutType && options.layoutType !== this._layoutType) {
        this._layoutType = options.layoutType;
      }
      
      // 설정이 변경되면 레이아웃 다시 계산 및 적용
      if (this._containerElement) {
        this.updateLayout();
      }
      
      Log.debug('LayoutManager', '레이아웃 옵션 설정 완료');
    }, ErrorCode.LAYOUT_OPTIONS_SET_ERROR, {}, true);
  }
  
  /**
   * 카드 위치 계산
   * @param cardIds 카드 ID 목록
   * @returns 카드 ID별 위치 맵
   */
  calculateCardPositions(cardIds: string[]): Map<string, ICardPosition> {
    return ErrorHandler.captureErrorSync(() => {
      if (!this._containerElement || !this.calculationResult) {
        throw new Error('컨테이너 요소 또는 계산 결과가 초기화되지 않았습니다.');
      }
      
      const { cardWidth, cardHeight, columns, isVertical } = this.calculationResult;
      const cardPositions = new Map<string, ICardPosition>();
      
      // 각 카드의 위치 계산
      cardIds.forEach((cardId, index) => {
        if (!cardId) return;
        
        const column = isVertical ? index % columns : index;
        const row = isVertical ? Math.floor(index / columns) : 0;
        
        const x = isVertical ? column * (cardWidth + this._options.cardGap) : index * (cardWidth + this._options.cardGap);
        const y = isVertical ? row * (cardHeight + this._options.cardGap) : 0;
        
        cardPositions.set(cardId, {
          cardId,
          x,
          y,
          column,
          row,
          width: cardWidth,
          height: cardHeight
        });
      });
      
      return cardPositions;
    }, ErrorCode.CARD_POSITION_CALCULATION_ERROR, {}, false) || new Map<string, ICardPosition>();
  }
  
  /**
   * 카드 위치 적용
   * @param cardPositions 카드 ID별 위치 맵
   */
  applyCardPositions(cardPositions: Map<string, ICardPosition>): void {
    ErrorHandler.captureErrorSync(() => {
      if (!this._containerElement) {
        throw new Error('컨테이너 요소가 초기화되지 않았습니다.');
      }
      
      // 각 카드 요소에 위치 적용
      this.cardElements.forEach(cardElement => {
        const cardId = cardElement.dataset.cardId;
        if (!cardId) return;
        
        const position = cardPositions.get(cardId);
        if (!position) return;
        
        // 카드 위치 및 크기 설정
        cardElement.style.gridColumn = `${position.column + 1}`;
        cardElement.style.gridRow = `${position.row + 1}`;
        
        // 카드 너비 및 높이 설정
        cardElement.style.width = `${position.width}px`;
        if (this._options.alignCardHeight && position.height > 0) {
          cardElement.style.height = `${position.height}px`;
        } else {
          cardElement.style.height = 'auto';
        }
      });
      
      Log.debug('LayoutManager', '카드 위치 적용 완료');
    }, ErrorCode.CARD_POSITION_APPLY_ERROR, {}, true);
  }
  
  /**
   * 컨테이너 크기 변경 처리
   * @param width 새 너비
   * @param height 새 높이
   */
  handleResize(width: number, height: number): void {
    // 이전 크기와 동일하면 무시
    if (
      this.calculationResult && 
      this.calculationResult.containerWidth === width && 
      this.calculationResult.containerHeight === height
    ) {
      return;
    }
    
    // 레이아웃 업데이트
    this.updateLayout();
  }
  
  /**
   * 레이아웃 계산
   * 컨테이너 크기와 설정에 따라 레이아웃을 계산합니다.
   */
  private calculateLayout(): void {
    ErrorHandler.captureErrorSync(() => {
      if (!this._containerElement) {
        throw new Error('컨테이너 요소가 초기화되지 않았습니다.');
      }
      
      // 컨테이너 크기 가져오기
      const containerRect = this._containerElement.getBoundingClientRect();
      const containerWidth = containerRect.width;
      const containerHeight = containerRect.height;
      
      // 컨테이너 비율에 따라 수직/수평 방향 자동 결정 (설정에서 명시적으로 지정하지 않은 경우)
      const isVertical = this._options.isVertical;
      
      // 카드 너비 및 열 수 계산
      let columns: number;
      let cardWidth: number;
      
      if (isVertical) {
        // 수직 방향인 경우 열 수 계산
        columns = Math.max(1, Math.floor(containerWidth / this._options.cardThresholdWidth));
        cardWidth = (containerWidth - (this._options.cardGap * (columns - 1))) / columns;
      } else {
        // 수평 방향인 경우 카드 너비는 임계값으로 고정하고 열 수는 카드 수
        cardWidth = this._options.cardThresholdWidth;
        columns = this.cardElements.length;
      }
      
      // 카드 높이 계산
      let cardHeight: number;
      
      if (this._options.alignCardHeight) {
        // 높이 정렬이 활성화된 경우
        if (this._options.fixedCardHeight) {
          // 고정 높이가 지정된 경우
          cardHeight = this._options.fixedCardHeight;
        } else if (this._options.cardsPerView) {
          // 뷰당 카드 수가 지정된 경우
          const rows = Math.ceil(this._options.cardsPerView / columns);
          cardHeight = (containerHeight - (this._options.cardGap * (rows - 1))) / rows;
        } else {
          // 기본값: 너비의 1.5배
          cardHeight = cardWidth * 1.5;
        }
      } else {
        // 높이 정렬이 비활성화된 경우 기본값 설정 (실제로는 각 카드의 내용에 따라 결정됨)
        cardHeight = 0;
      }
      
      // 행 수 계산
      const rows = Math.ceil(this.cardElements.length / columns);
      
      // 계산 결과 저장
      this.calculationResult = {
        columns,
        rows,
        cardWidth,
        cardHeight,
        containerWidth,
        containerHeight,
        isVertical
      };
      
      // 컨테이너 스타일 설정
      this._containerElement.style.display = 'grid';
      this._containerElement.style.gridGap = `${this._options.cardGap}px`;
      
      if (isVertical) {
        // 수직 방향 레이아웃
        this._containerElement.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;
        this._containerElement.style.gridAutoRows = this._options.alignCardHeight ? `${cardHeight}px` : 'auto';
        this._containerElement.style.overflowY = 'auto';
        this._containerElement.style.overflowX = 'hidden';
      } else {
        // 수평 방향 레이아웃
        this._containerElement.style.gridTemplateColumns = `repeat(${this.cardElements.length}, ${cardWidth}px)`;
        this._containerElement.style.gridAutoRows = this._options.alignCardHeight ? `${cardHeight}px` : 'auto';
        this._containerElement.style.overflowX = 'auto';
        this._containerElement.style.overflowY = 'hidden';
      }
      
      Log.debug('LayoutManager', '레이아웃 계산 완료');
    }, ErrorCode.LAYOUT_CALCULATION_ERROR, {}, true);
  }
  
  /**
   * 카드 요소 추가
   * @param cardElement 추가할 카드 요소
   */
  addCardElement(cardElement: HTMLElement): void {
    ErrorHandler.captureErrorSync(() => {
      if (!this._containerElement) {
        throw new Error('컨테이너 요소가 초기화되지 않았습니다.');
      }
      
      // 카드 요소 배열에 추가
      this.cardElements.push(cardElement);
      
      // 컨테이너에 추가
      this._containerElement.appendChild(cardElement);
      
      // 레이아웃 업데이트
      this.updateLayout();
      
      Log.debug('LayoutManager', `카드 요소 추가 완료: ${cardElement.dataset.cardId}`);
    }, ErrorCode.CARD_ELEMENT_ADD_ERROR, { cardId: cardElement.dataset.cardId }, true);
  }
  
  /**
   * 카드 요소 제거
   * @param cardElement 제거할 카드 요소
   */
  removeCardElement(cardElement: HTMLElement): void {
    ErrorHandler.captureErrorSync(() => {
      if (!this._containerElement) {
        throw new Error('컨테이너 요소가 초기화되지 않았습니다.');
      }
      
      // 카드 요소 배열에서 제거
      const index = this.cardElements.indexOf(cardElement);
      if (index !== -1) {
        this.cardElements.splice(index, 1);
      }
      
      // 컨테이너에서 제거
      if (cardElement.parentElement === this._containerElement) {
        this._containerElement.removeChild(cardElement);
      }
      
      // 레이아웃 업데이트
      this.updateLayout();
      
      Log.debug('LayoutManager', `카드 요소 제거 완료: ${cardElement.dataset.cardId}`);
    }, ErrorCode.CARD_ELEMENT_REMOVE_ERROR, { cardId: cardElement.dataset.cardId }, true);
  }
  
  /**
   * 모든 카드 요소 제거
   */
  clearCardElements(): void {
    ErrorHandler.captureErrorSync(() => {
      if (!this._containerElement) {
        throw new Error('컨테이너 요소가 초기화되지 않았습니다.');
      }
      
      // 모든 카드 요소 제거
      this.cardElements.forEach(cardElement => {
        if (cardElement.parentElement === this._containerElement) {
          this._containerElement.removeChild(cardElement);
        }
      });
      
      // 카드 요소 배열 초기화
      this.cardElements = [];
      
      // 레이아웃 업데이트
      this.updateLayout();
      
      Log.debug('LayoutManager', '모든 카드 요소 제거 완료');
    }, ErrorCode.CARD_ELEMENTS_CLEAR_ERROR, {}, true);
  }
  
  /**
   * 레이아웃 이벤트 리스너 추가
   * @param eventType 이벤트 타입
   * @param listener 이벤트 리스너
   */
  addEventListener(eventType: string, listener: EventListener): void {
    ErrorHandler.captureErrorSync(() => {
      if (!this.eventListeners.has(eventType)) {
        this.eventListeners.set(eventType, []);
      }
      
      const listeners = this.eventListeners.get(eventType);
      if (listeners && !listeners.includes(listener)) {
        listeners.push(listener);
      }
      
      Log.debug('LayoutManager', `이벤트 리스너 추가 완료: ${eventType}`);
    }, ErrorCode.EVENT_LISTENER_ADD_ERROR, { eventType }, false);
  }
  
  /**
   * 레이아웃 이벤트 리스너 제거
   * @param eventType 이벤트 타입
   * @param listener 이벤트 리스너
   */
  removeEventListener(eventType: string, listener: EventListener): void {
    ErrorHandler.captureErrorSync(() => {
      if (!this.eventListeners.has(eventType)) {
        return;
      }
      
      const listeners = this.eventListeners.get(eventType);
      if (listeners) {
        const index = listeners.indexOf(listener);
        if (index !== -1) {
          listeners.splice(index, 1);
        }
      }
      
      Log.debug('LayoutManager', `이벤트 리스너 제거 완료: ${eventType}`);
    }, ErrorCode.EVENT_LISTENER_REMOVE_ERROR, { eventType }, false);
  }
  
  /**
   * 이벤트 발생
   * @param eventType 이벤트 타입
   * @param event 이벤트 객체
   */
  private dispatchEvent(eventType: string, event: Event): void {
    ErrorHandler.captureErrorSync(() => {
      if (!this.eventListeners.has(eventType)) {
        return;
      }
      
      const listeners = this.eventListeners.get(eventType);
      if (listeners) {
        listeners.forEach(listener => {
          try {
            listener(event);
          } catch (error) {
            ErrorHandler.captureErrorSync(() => {
              throw error;
            }, ErrorCode.EVENT_LISTENER_EXECUTION_ERROR, { eventType }, false);
          }
        });
      }
    }, ErrorCode.EVENT_DISPATCH_ERROR, { eventType }, false);
  }
  
  /**
   * 레이아웃 관리자 소멸
   */
  destroy(): void {
    try {
      // 리사이즈 관리자 정리
      if (this.resizeManager) {
        this.resizeManager.destroy();
        this.resizeManager = null;
      }
      
      // 이벤트 리스너 정리
      this.eventListeners.clear();
      
      // 참조 정리
      this._containerElement = null;
      this.cardElements = [];
      this.calculationResult = null;
      
      Log.debug('LayoutManager', '레이아웃 관리자 정리 완료');
    } catch (error) {
      ErrorHandler.handleError(
        'LayoutManager.destroy',
        `레이아웃 관리자 정리 중 오류 발생: ${error.message}`,
        error
      );
    }
  }
} 