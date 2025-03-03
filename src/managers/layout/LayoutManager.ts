import { ILayoutManager } from '../../core/interfaces/manager/ILayoutManager';
import { CardPosition } from '../../core/models/CardPosition';
import { CardPosition as ICardPosition } from '../../core/types/card.types';
import { 
  LayoutDirection, 
  LayoutEvent, 
  LayoutEventHandler, 
  LayoutOptions, 
  LayoutStyleOptions, 
  LayoutType,
  LayoutCalculationResult,
  LayoutEventData,
  LayoutEventType
} from '../../core/types/layout.types';
import { ErrorCode } from '../../core/constants/error.constants';
import { Card } from '../../core/models/Card';
import { ErrorHandler } from '../../utils/error/ErrorHandler';
import { Log } from '../../utils/log/Log';
import { getElementSize } from '../../utils/helpers/dom.helper';
import { MasonryLayoutService } from '../../services/layout/MasonryLayoutService';
import { ScrollService } from '../../services/layout/ScrollService';
import { ResizeManager } from './ResizeManager';
import { ICardContainerManager } from '../../core/interfaces/manager/ICardContainerManager';
import { ICardManager } from '../../core/interfaces/manager/ICardManager';
import { CardContainerEventData } from '../../core/types/card.types';
import { ResizeEventData, ResizeEventType } from '../../core/interfaces/manager/IResizeManager';

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
  private _layoutType: LayoutType = LayoutType.MASONRY;
  
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
   * 바인딩된 이벤트 핸들러 참조 저장
   * 메모리 누수 방지를 위해 사용
   */
  private boundEventHandlers: Map<string, Function> = new Map();
  
  /**
   * 생성자
   */
  constructor() {
    // 기본 레이아웃 옵션 초기화
    this._options = {
      type: LayoutType.MASONRY,
      cardThresholdWidth: 300,
      alignCardHeight: false,
      isVertical: true,
      cardGap: 10,
      fixedCardHeight: 0,
      cardsPerView: 0,
      direction: LayoutDirection.VERTICAL,
      containerPadding: 16,
      autoDirection: true,
      autoDirectionRatio: 1.2,
      useAnimation: true,
      animationDuration: 300,
      animationEasing: 'ease-in-out',
      // 추가된 필수 속성들
      cardMinWidth: 200,
      cardMaxWidth: 500,
      cardMinHeight: 100,
      cardMaxHeight: 500,
      cardHeight: 200
    };
    
    // 이벤트 핸들러 바인딩
    this.boundEventHandlers = new Map();
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
    return this.determineLayoutType();
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
   * @param cardContainer 카드 컨테이너 관리자
   * @param options 레이아웃 옵션
   */
  initialize(containerElement: HTMLElement, cardContainer: ICardContainerManager, options?: Partial<LayoutOptions>): void {
    try {
      if (!containerElement) {
        throw new Error('컨테이너 요소가 유효하지 않습니다.');
      }
      
      this._containerElement = containerElement;
      
      if (options) {
        this.setOptions(options);
      }
      
      // 카드 컨테이너에서 카드 요소 가져오기
      this.updateCardElements(cardContainer);
      
      // 카드 추가/제거 이벤트 리스너 등록
      const handleCardAdded = this.handleCardAdded.bind(this);
      const handleCardRemoved = this.handleCardRemoved.bind(this);
      const handleCardsCleared = this.handleCardsCleared.bind(this);
      
      // 바인딩된 핸들러 저장
      this.boundEventHandlers.set('card-added', handleCardAdded);
      this.boundEventHandlers.set('card-removed', handleCardRemoved);
      this.boundEventHandlers.set('cards-cleared', handleCardsCleared);
      
      cardContainer.addEventListener('card-added', handleCardAdded);
      cardContainer.addEventListener('card-removed', handleCardRemoved);
      cardContainer.addEventListener('cards-cleared', handleCardsCleared);
      
      // 이벤트 리스너 등록
      this.registerEventListeners();
      
      // 초기 레이아웃 계산
      this.updateLayout();
      
      Log.debug('LayoutManager', '레이아웃 관리자 초기화 완료');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      ErrorHandler.handleErrorWithCode(
        ErrorCode.LAYOUT_INITIALIZATION_ERROR,
        { message: errorMessage }
      );
      throw error;
    }
  }
  
  /**
   * 카드 요소 업데이트
   * @param cardContainer 카드 컨테이너 관리자
   */
  private updateCardElements(cardContainer: ICardContainerManager): void {
    try {
      // 카드 컨테이너에서 모든 카드 관리자 가져오기
      const cardManagers = cardContainer.getAllCards();
      
      // 카드 요소 배열 업데이트
      this.cardElements = cardManagers
        .map(manager => manager.element)
        .filter((element): element is HTMLElement => element !== null);
      
      Log.debug('LayoutManager', `카드 요소 업데이트: ${this.cardElements.length}개`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      ErrorHandler.handleErrorWithCode(
        ErrorCode.LAYOUT_UPDATE_ERROR,
        { message: errorMessage }
      );
    }
  }
  
  /**
   * 카드 추가 이벤트 핸들러
   * @param event 카드 추가 이벤트
   */
  private handleCardAdded(data: CardContainerEventData): void {
    try {
      const cardManager = data.cardManager as ICardManager;
      if (cardManager && cardManager.element) {
        this.cardElements.push(cardManager.element);
        this.updateLayout();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      ErrorHandler.handleErrorWithCode(
        ErrorCode.EVENT_HANDLER_ERROR,
        { message: errorMessage }
      );
    }
  }
  
  /**
   * 카드 제거 이벤트 핸들러
   * @param event 카드 제거 이벤트
   */
  private handleCardRemoved(data: CardContainerEventData): void {
    try {
      const cardId = data.cardId;
      if (!cardId) {
        return;
      }
      
      const index = this.cardElements.findIndex(element => element.getAttribute('data-card-id') === cardId);
      
      if (index !== -1) {
        this.cardElements.splice(index, 1);
        this.updateLayout();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      ErrorHandler.handleErrorWithCode(
        ErrorCode.EVENT_HANDLER_ERROR,
        { message: errorMessage }
      );
    }
  }
  
  /**
   * 카드 전체 제거 이벤트 핸들러
   */
  private handleCardsCleared(data: CardContainerEventData): void {
    try {
      this.cardElements = [];
      this.updateLayout();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      ErrorHandler.handleErrorWithCode(
        ErrorCode.EVENT_HANDLER_ERROR,
        { message: errorMessage }
      );
    }
  }
  
  /**
   * 리사이즈 관리자 초기화
   */
  private initializeResizeManager(): void {
    try {
      // 기존 리사이즈 관리자 정리
      if (this.resizeManager) {
        this.resizeManager.destroy();
      }
      
      if (!this._containerElement) {
        throw new Error('컨테이너 요소가 초기화되지 않았습니다.');
      }
      
      // 새 리사이즈 관리자 생성
      this.resizeManager = new ResizeManager(this._containerElement);
      
      // 리사이즈 콜백 설정
      const handleResize = (data: ResizeEventData) => {
        this.handleResize(data.width, data.height);
      };
      
      this.boundEventHandlers.set('resize', handleResize);
      
      // 리사이즈 관리자 초기화
      this.resizeManager.initialize();
      
      // 리사이즈 이벤트 리스너 등록
      this.resizeManager.addEventListener(ResizeEventType.RESIZE, handleResize);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      ErrorHandler.handleErrorWithCode(
        ErrorCode.LAYOUT_INITIALIZATION_ERROR,
        { message: errorMessage }
      );
    }
  }
  
  /**
   * 레이아웃 업데이트
   * 성능 측정을 포함한 레이아웃 업데이트 메서드
   */
  updateLayout(): void {
    try {
      // 성능 측정 시작
      const startTime = performance.now();
      
      if (!this._containerElement || this.cardElements.length === 0) {
        return;
      }
      
      // 레이아웃 계산
      this.calculateLayout();
      
      if (!this.calculationResult) {
        return;
      }
      
      // 카드 위치 계산 및 적용
      const cardIds = this.cardElements.map(element => element.getAttribute('data-card-id') || '');
      const cardPositions = this.calculateCardPositions(cardIds);
      this.applyCardPositions(cardPositions);
      
      // 레이아웃 클래스 적용
      this.applyLayoutClasses();
      
      // 레이아웃 업데이트 완료 이벤트 발생
      this.dispatchLayoutUpdatedEvent();
      
      // 성능 측정 종료 및 로깅
      const endTime = performance.now();
      const duration = endTime - startTime;
      Log.debug(`성능 측정: LayoutManager.updateLayout (${duration.toFixed(2)}ms)`);
      
      Log.debug('LayoutManager', '레이아웃 업데이트 완료');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      ErrorHandler.handleErrorWithCode(
        ErrorCode.LAYOUT_UPDATE_ERROR,
        { message: errorMessage }
      );
    }
  }
  
  /**
   * 레이아웃 업데이트 이벤트 발생
   */
  private dispatchLayoutUpdatedEvent(): void {
    try {
      const event = new CustomEvent<LayoutEventData>('layout-updated', {
        detail: {
          type: LayoutEventType.UPDATE_COMPLETE,
          timestamp: Date.now()
        }
      });
      
      this.dispatchEvent('layout-updated', event);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      ErrorHandler.handleErrorWithCode(
        ErrorCode.LAYOUT_UPDATE_ERROR,
        { message: errorMessage }
      );
    }
  }
  
  /**
   * 레이아웃 옵션 설정
   * @param options 설정할 레이아웃 옵션
   */
  setOptions(options: Partial<LayoutOptions>): void {
    try {
      this._options = {
        ...this._options,
        ...options
      };
      
      // 옵션 변경 후 레이아웃 업데이트
      this.updateLayout();
      
      Log.debug('LayoutManager', '레이아웃 옵션 업데이트 완료');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      ErrorHandler.handleErrorWithCode(
        ErrorCode.LAYOUT_OPTIONS_UPDATE_ERROR,
        { message: errorMessage }
      );
    }
  }
  
  /**
   * 카드 위치 계산
   * @param cardIds 카드 ID 목록
   * @returns 카드 ID별 위치 맵
   */
  calculateCardPositions(cardIds: string[]): Map<string, ICardPosition> {
    try {
      if (!this.calculationResult || cardIds.length === 0) {
        return new Map<string, ICardPosition>();
      }
      
      const { cardWidth, cardHeight, columns, isVertical } = this.calculationResult;
      const cardPositions = new Map<string, ICardPosition>();
      
      // 각 카드의 위치 계산
      cardIds.forEach((cardId, index) => {
        if (!cardId) return;
        
        let column: number, row: number, x: number, y: number;
        
        if (isVertical) {
          // 수직 방향 레이아웃
          column = index % columns;
          row = Math.floor(index / columns);
          x = column * (cardWidth + this._options.cardGap);
          y = row * (cardHeight + this._options.cardGap);
        } else {
          // 수평 방향 레이아웃
          column = index;
          row = 0;
          x = column * (cardWidth + this._options.cardGap);
          y = 0;
        }
        
        cardPositions.set(cardId, new CardPosition(
          cardId,
          x,
          y,
          cardWidth,
          cardHeight,
          row,
          column
        ));
      });
      
      return cardPositions;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      ErrorHandler.handleErrorWithCode(
        ErrorCode.LAYOUT_CALCULATION_ERROR,
        { message: errorMessage }
      );
      return new Map<string, ICardPosition>();
    }
  }
  
  /**
   * 카드 위치 적용
   * @param cardPositions 카드 ID별 위치 맵
   */
  applyCardPositions(cardPositions: Map<string, ICardPosition>): void {
    try {
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
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      ErrorHandler.handleErrorWithCode(
        ErrorCode.LAYOUT_UPDATE_ERROR,
        { message: errorMessage }
      );
    }
  }
  
  /**
   * 컨테이너 크기 변경 처리
   * @param width 새 너비
   * @param height 새 높이
   */
  handleResize(width: number, height: number): void {
    try {
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
      
      Log.debug('LayoutManager', `컨테이너 크기 변경 처리 완료: ${width}x${height}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      ErrorHandler.handleErrorWithCode(
        ErrorCode.LAYOUT_RESIZE_ERROR,
        { message: errorMessage }
      );
    }
  }
  
  /**
   * 레이아웃 이벤트 리스너 추가
   * @param eventType 이벤트 타입
   * @param listener 이벤트 리스너
   */
  addEventListener(eventType: string, listener: EventListener): void {
    try {
      if (!this.eventListeners.has(eventType)) {
        this.eventListeners.set(eventType, []);
      }
      
      const listeners = this.eventListeners.get(eventType);
      if (listeners && !listeners.includes(listener)) {
        listeners.push(listener);
      }
      
      Log.debug('LayoutManager', `이벤트 리스너 추가 완료: ${eventType}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      ErrorHandler.handleErrorWithCode(
        ErrorCode.EVENT_LISTENER_ADD_ERROR,
        { message: errorMessage }
      );
    }
  }
  
  /**
   * 레이아웃 이벤트 리스너 제거
   * @param eventType 이벤트 타입
   * @param listener 이벤트 리스너
   */
  removeEventListener(eventType: string, listener: EventListener): void {
    try {
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
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      ErrorHandler.handleErrorWithCode(
        ErrorCode.EVENT_LISTENER_REMOVE_ERROR,
        { message: errorMessage }
      );
    }
  }
  
  /**
   * 이벤트 발생
   * @param eventType 이벤트 타입
   * @param event 이벤트 객체
   */
  private dispatchEvent<T extends Event>(eventType: string, event: T): void {
    try {
      if (!this.eventListeners.has(eventType)) {
        return;
      }
      
      const listeners = this.eventListeners.get(eventType);
      if (listeners) {
        listeners.forEach(listener => {
          try {
            listener(event);
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
            ErrorHandler.handleErrorWithCode(
              ErrorCode.EVENT_LISTENER_EXECUTION_ERROR,
              { message: errorMessage }
            );
          }
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      ErrorHandler.handleErrorWithCode(
        ErrorCode.EVENT_DISPATCH_ERROR,
        { message: errorMessage }
      );
    }
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
      
      // 바인딩된 이벤트 핸들러 참조 정리
      this.boundEventHandlers.clear();
      
      // 참조 정리
      this._containerElement = null;
      this.cardElements = [];
      this.calculationResult = null;
      
      Log.debug('LayoutManager', '레이아웃 관리자 정리 완료');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      ErrorHandler.handleErrorWithCode(
        ErrorCode.LAYOUT_DESTROY_ERROR,
        { message: errorMessage }
      );
    }
  }
  
  /**
   * 최적 레이아웃 타입 결정
   * 컨테이너 크기와 설정에 따라 최적의 레이아웃 타입을 결정합니다.
   * @returns 결정된 레이아웃 타입
   */
  determineLayoutType(): LayoutType {
    try {
      if (!this._containerElement || !this.calculationResult) {
        return LayoutType.GRID; // 기본값
      }
      
      const { containerWidth, containerHeight, isVertical, columns } = this.calculationResult;
      
      // 컨테이너 비율 계산
      const aspectRatio = containerWidth / containerHeight;
      
      // 레이아웃 타입 결정
      if (isVertical) {
        // 수직 방향인 경우
        if (columns === 1) {
          return LayoutType.LIST; // 단일 열인 경우 리스트 형태
        } else if (this._options.alignCardHeight) {
          return LayoutType.GRID; // 높이 정렬이 활성화된 경우 그리드 형태
        } else {
          return LayoutType.MASONRY; // 높이 정렬이 비활성화된 경우 메이슨리 형태
        }
      } else {
        // 수평 방향인 경우
        return LayoutType.HORIZONTAL; // 수평 스크롤 형태
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      ErrorHandler.handleErrorWithCode(
        ErrorCode.LAYOUT_TYPE_DETERMINATION_ERROR,
        { message: errorMessage }
      );
      return LayoutType.GRID; // 오류 발생 시 기본값 반환
    }
  }
  
  /**
   * 레이아웃 계산
   * 컨테이너 크기와 레이아웃 옵션을 기반으로 레이아웃 계산 결과를 생성합니다.
   */
  private calculateLayout(): void {
    try {
      // 성능 측정 시작
      const startTime = performance.now();
      
      if (!this._containerElement) {
        return;
      }
      
      // 컨테이너 크기 가져오기
      const { width: containerWidth, height: containerHeight } = getElementSize(this._containerElement);
      
      // 방향 결정
      let isVertical = this._options.isVertical;
      
      // 자동 방향 전환이 활성화된 경우
      if (this._options.autoDirection) {
        const aspectRatio = containerWidth / containerHeight;
        isVertical = aspectRatio < this._options.autoDirectionRatio;
      }
      
      // 카드 너비 계산
      let cardWidth = this._options.cardThresholdWidth;
      let columns = 1;
      
      if (isVertical) {
        // 수직 방향인 경우
        const availableWidth = containerWidth - (this._options.containerPadding * 2);
        columns = Math.max(1, Math.floor(availableWidth / (cardWidth + this._options.cardGap)));
        cardWidth = (availableWidth - (this._options.cardGap * (columns - 1))) / columns;
      } else {
        // 수평 방향인 경우
        columns = this.cardElements.length;
        cardWidth = this._options.cardThresholdWidth;
      }
      
      // 카드 높이 계산
      let cardHeight = 0;
      
      if (this._options.alignCardHeight) {
        if (this._options.fixedCardHeight > 0) {
          // 고정 높이 사용
          cardHeight = this._options.fixedCardHeight;
        } else if (this._options.cardsPerView > 0) {
          // 뷰당 카드 수 기반 높이 계산
          const availableHeight = containerHeight - (this._options.containerPadding * 2);
          const rowsPerView = Math.ceil(this._options.cardsPerView / columns);
          cardHeight = (availableHeight - (this._options.cardGap * (rowsPerView - 1))) / rowsPerView;
        }
      }
      
      // 행 수 계산
      const rows = Math.ceil(this.cardElements.length / columns);
      
      // 컨텐츠 전체 크기 계산
      const contentWidth = isVertical
        ? containerWidth
        : columns * cardWidth + (columns - 1) * this._options.cardGap + (this._options.containerPadding * 2);
      
      const contentHeight = isVertical
        ? rows * (cardHeight || 0) + (rows - 1) * this._options.cardGap + (this._options.containerPadding * 2)
        : containerHeight;
      
      // 레이아웃 계산 결과 저장
      this.calculationResult = {
        columns,
        rows,
        cardWidth,
        cardHeight,
        containerWidth,
        containerHeight,
        direction: isVertical ? 'vertical' : 'horizontal',
        isVertical,
        cardPositions: [],
        contentHeight,
        contentWidth
      };
      
      // 성능 측정 종료 및 로깅
      const endTime = performance.now();
      const duration = endTime - startTime;
      Log.debug(`성능 측정: LayoutManager.calculateLayout (${duration.toFixed(2)}ms)`);
      
      Log.debug('LayoutManager', `레이아웃 계산 완료: ${columns}열 x ${rows}행, 카드 크기: ${cardWidth}x${cardHeight}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      ErrorHandler.handleErrorWithCode(
        ErrorCode.LAYOUT_CALCULATION_ERROR,
        { message: errorMessage }
      );
    }
  }
  
  /**
   * 컨테이너 크기 변경 처리
   * 컨테이너 크기가 변경되었을 때 레이아웃을 업데이트합니다.
   */
  handleContainerResize(): void {
    try {
      if (!this._containerElement) {
        return;
      }
      
      const { width, height } = getElementSize(this._containerElement);
      this.handleResize(width, height);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      ErrorHandler.handleErrorWithCode(
        ErrorCode.LAYOUT_RESIZE_ERROR,
        { message: errorMessage }
      );
    }
  }
  
  /**
   * 레이아웃 타입 설정
   * @param type 레이아웃 타입
   */
  setLayoutType(type: LayoutType): void {
    try {
      this._options.type = type;
      this._layoutType = type;
      
      // 레이아웃 클래스 적용
      this.applyLayoutClasses();
      
      // 레이아웃 업데이트
      this.updateLayout();
      
      Log.debug('LayoutManager', `레이아웃 타입 설정: ${type}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      ErrorHandler.handleErrorWithCode(
        ErrorCode.LAYOUT_UPDATE_ERROR,
        { message: errorMessage }
      );
    }
  }
  
  /**
   * 레이아웃 클래스 적용
   * 레이아웃 타입에 따라 컨테이너에 적절한 CSS 클래스를 적용합니다.
   */
  applyLayoutClasses(): void {
    try {
      if (!this._containerElement) {
        return;
      }
      
      // 기존 레이아웃 클래스 제거
      this._containerElement.classList.remove(
        'card-layout-masonry',
        'card-layout-grid',
        'card-layout-list',
        'card-layout-horizontal'
      );
      
      // 방향 클래스 제거
      this._containerElement.classList.remove(
        'card-layout-vertical',
        'card-layout-horizontal'
      );
      
      // 레이아웃 타입 클래스 추가
      const layoutType = this.determineLayoutType();
      this._containerElement.classList.add(`card-layout-${layoutType}`);
      
      // 방향 클래스 추가
      const direction = this.calculationResult?.isVertical 
        ? LayoutDirection.VERTICAL 
        : LayoutDirection.HORIZONTAL;
      this._containerElement.classList.add(`card-layout-${direction}`);
      
      Log.debug('LayoutManager', `레이아웃 클래스 적용: ${layoutType}, ${direction}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      ErrorHandler.handleErrorWithCode(
        ErrorCode.LAYOUT_UPDATE_ERROR,
        { message: errorMessage }
      );
    }
  }
  
  /**
   * 이벤트 리스너 등록
   * 레이아웃 관련 이벤트 리스너를 등록합니다.
   */
  registerEventListeners(): void {
    try {
      if (!this._containerElement) {
        return;
      }
      
      // 리사이즈 관리자 초기화
      this.initializeResizeManager();
      
      Log.debug('LayoutManager', '이벤트 리스너 등록 완료');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      ErrorHandler.handleErrorWithCode(
        ErrorCode.EVENT_LISTENER_ADD_ERROR,
        { message: errorMessage }
      );
    }
  }
  
  /**
   * 이벤트 리스너 제거
   * 레이아웃 관련 이벤트 리스너를 제거합니다.
   */
  removeEventListeners(): void {
    try {
      // 리사이즈 관리자 정리
      if (this.resizeManager) {
        this.resizeManager.destroy();
        this.resizeManager = null;
      }
      
      Log.debug('LayoutManager', '이벤트 리스너 제거 완료');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      ErrorHandler.handleErrorWithCode(
        ErrorCode.EVENT_LISTENER_REMOVE_ERROR,
        { message: errorMessage }
      );
    }
  }
} 