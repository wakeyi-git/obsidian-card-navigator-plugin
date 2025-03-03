import { LayoutOptions, LayoutDirection, LayoutType, LayoutCalculationResult } from '../../core/types/layout.types';
import { CardPosition } from '../../core/models/CardPosition';
import { ErrorHandler } from '../../utils/error/ErrorHandler';
import { Log } from '../../utils/log/Log';
import { LAYOUT_CLASS_NAMES } from '../../styles/components/layout.styles';

/**
 * MasonryLayoutService 클래스는 메이슨리 레이아웃 관련 기능을 제공합니다.
 */
export class MasonryLayoutService {
  private container: HTMLElement | null = null;
  private options: LayoutOptions;
  private cardPositions: Map<string, CardPosition> = new Map();
  private columnHeights: number[] = [];
  private columnCount: number = 0;
  private isInitialized: boolean = false;
  private resizeObserver: ResizeObserver | null = null;
  private mutationObserver: MutationObserver | null = null;

  /**
   * MasonryLayoutService 생성자
   */
  constructor() {
    this.options = this.getDefaultOptions();
    
    Log.debug('MasonryLayoutService', '메이슨리 레이아웃 서비스 초기화 완료');
  }

  /**
   * 기본 레이아웃 옵션을 가져옵니다.
   * @returns 기본 레이아웃 옵션
   */
  private getDefaultOptions(): LayoutOptions {
    return {
      type: LayoutType.MASONRY,
      direction: 'vertical',
      isVertical: true,
      cardThresholdWidth: 300,
      alignCardHeight: false,
      fixedCardHeight: 0,
      cardsPerView: 0,
      cardGap: 16,
      containerPadding: 16,
      autoDirection: true,
      autoDirectionRatio: 1.2,
      useAnimation: true,
      animationDuration: 300,
      animationEasing: 'ease-out',
      cardMinWidth: 200,
      cardMaxWidth: 500,
      cardMinHeight: 100,
      cardMaxHeight: 800,
      cardHeight: 0
    };
  }

  /**
   * 메이슨리 레이아웃 서비스를 초기화합니다.
   * @param container 컨테이너 요소
   * @param options 레이아웃 옵션
   */
  public initialize(container: HTMLElement, options?: Partial<LayoutOptions>): void {
    try {
      this.container = container;
      
      if (options) {
        this.options = { ...this.options, ...options };
      }
      
      this.setupContainer();
      this.setupObservers();
      this.isInitialized = true;
      
      Log.debug('MasonryLayoutService', '메이슨리 레이아웃 서비스 초기화 완료');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      ErrorHandler.handleError(
        'MasonryLayoutService.initialize',
        `메이슨리 레이아웃 서비스 초기화 실패: ${errorMessage}`,
        true
      );
    }
  }

  /**
   * 컨테이너를 설정합니다.
   */
  private setupContainer(): void {
    if (!this.container) return;
    
    this.container.style.position = 'relative';
    this.container.style.boxSizing = 'border-box';
    this.container.style.padding = `${this.options.containerPadding}px`;
    this.container.style.overflow = 'auto';
    
    // 방향에 따라 컨테이너 스타일 설정
    if (this.options.direction === 'horizontal') {
      this.container.style.display = 'flex';
      this.container.style.flexDirection = 'row';
      this.container.style.alignItems = 'flex-start';
      this.container.style.overflowX = 'auto';
      this.container.style.overflowY = 'hidden';
    } else {
      this.container.style.display = 'block';
      this.container.style.overflowX = 'hidden';
      this.container.style.overflowY = 'auto';
    }
  }

  /**
   * 옵저버를 설정합니다.
   */
  private setupObservers(): void {
    // ResizeObserver 설정
    this.resizeObserver = new ResizeObserver(this.handleResize.bind(this));
    if (this.container) {
      this.resizeObserver.observe(this.container);
    }
    
    // MutationObserver 설정
    this.mutationObserver = new MutationObserver(this.handleMutation.bind(this));
    if (this.container) {
      this.mutationObserver.observe(this.container, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['style', 'class']
      });
    }
  }

  /**
   * 리사이즈 이벤트를 처리합니다.
   */
  private handleResize(): void {
    this.refresh();
  }

  /**
   * 뮤테이션 이벤트를 처리합니다.
   * @param mutations 뮤테이션 레코드 배열
   */
  private handleMutation(mutations: MutationRecord[]): void {
    // 카드 요소의 스타일이나 클래스가 변경된 경우에만 레이아웃 업데이트
    const shouldUpdate = mutations.some(mutation => {
      if (mutation.type === 'attributes') {
        const target = mutation.target as HTMLElement;
        return target.classList.contains(LAYOUT_CLASS_NAMES.CARD.CONTAINER);
      }
      return false;
    });
    
    if (shouldUpdate) {
      this.refresh();
    }
  }

  /**
   * 레이아웃을 업데이트합니다.
   * @param cardIds 카드 ID 배열
   * @param cardElements 카드 요소 맵
   */
  public updateLayout(cardIds: string[], cardElements: Map<string, HTMLElement>): void {
    try {
      if (!this.isInitialized || !this.container) {
        throw new Error('메이슨리 레이아웃 서비스가 초기화되지 않았습니다.');
      }
      
      // 자동 방향 설정
      if (this.options.autoDirection) {
        this.updateDirection();
      }
      
      // 컬럼 수 계산
      this.calculateColumnCount();
      
      // 컬럼 높이 초기화
      this.resetColumnHeights();
      
      // 카드 위치 계산 및 적용
      this.positionCards(cardIds, cardElements);
      
      // 컨테이너 높이 설정
      this.updateContainerSize();
      
      Log.debug('MasonryLayoutService', `레이아웃 업데이트 완료: ${cardIds.length}개 카드, ${this.columnCount}개 컬럼`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      ErrorHandler.handleError(
        'MasonryLayoutService.updateLayout',
        `메이슨리 레이아웃 업데이트 실패: ${errorMessage}`,
        true
      );
    }
  }

  /**
   * 방향을 업데이트합니다.
   */
  private updateDirection(): void {
    if (!this.container) return;
    
    const containerWidth = this.container.clientWidth;
    const containerHeight = this.container.clientHeight;
    const ratio = containerWidth / containerHeight;
    
    // 컨테이너 비율에 따라 방향 결정
    if (ratio > this.options.autoDirectionRatio) {
      this.options.direction = 'horizontal';
    } else {
      this.options.direction = 'vertical';
    }
    
    // 컨테이너 스타일 업데이트
    this.setupContainer();
  }

  /**
   * 컬럼 수를 계산합니다.
   */
  private calculateColumnCount(): void {
    if (!this.container) return;
    
    const containerSize = this.options.direction === 'horizontal'
      ? this.container.clientHeight
      : this.container.clientWidth;
    
    const availableSize = containerSize - (this.options.containerPadding * 2);
    const cardSize = this.options.cardThresholdWidth;
    const gap = this.options.cardGap;
    
    // 컬럼 수 계산
    this.columnCount = Math.max(1, Math.floor((availableSize + gap) / (cardSize + gap)));
    
    Log.debug('MasonryLayoutService', `컬럼 수 계산: ${this.columnCount}개 (컨테이너 크기: ${containerSize}px, 카드 크기: ${cardSize}px, 간격: ${gap}px)`);
  }

  /**
   * 컬럼 높이를 초기화합니다.
   */
  private resetColumnHeights(): void {
    this.columnHeights = Array(this.columnCount).fill(0);
  }

  /**
   * 카드 위치를 계산하고 적용합니다.
   * @param cardIds 카드 ID 배열
   * @param cardElements 카드 요소 맵
   */
  private positionCards(cardIds: string[], cardElements: Map<string, HTMLElement>): void {
    if (!this.container) return;
    
    const gap = this.options.cardGap;
    const containerPadding = this.options.containerPadding;
    const isHorizontal = this.options.direction === 'horizontal';
    
    // 컨테이너 크기
    const containerWidth = this.container.clientWidth - (containerPadding * 2);
    const containerHeight = this.container.clientHeight - (containerPadding * 2);
    
    // 카드 너비 계산
    const cardWidth = isHorizontal
      ? this.options.cardThresholdWidth
      : (containerWidth - (gap * (this.columnCount - 1))) / this.columnCount;
    
    // 카드 위치 맵 초기화
    this.cardPositions.clear();
    
    // 각 카드 위치 계산 및 적용
    cardIds.forEach(cardId => {
      const cardElement = cardElements.get(cardId);
      if (!cardElement) return;
      
      // 카드 스타일 설정
      cardElement.style.position = 'absolute';
      cardElement.style.boxSizing = 'border-box';
      cardElement.style.width = `${cardWidth}px`;
      
      // 고정 높이 설정 여부 확인
      if (this.options.alignCardHeight && this.options.fixedCardHeight > 0) {
        cardElement.style.height = `${this.options.fixedCardHeight}px`;
      } else if (this.options.cardsPerView > 0) {
        // 뷰당 카드 수에 따른 높이 계산
        const cardHeight = isHorizontal
          ? (containerHeight - (gap * (this.options.cardsPerView - 1))) / this.options.cardsPerView
          : 'auto';
        
        if (typeof cardHeight === 'number') {
          cardElement.style.height = `${cardHeight}px`;
        } else {
          cardElement.style.height = cardHeight;
        }
      } else {
        cardElement.style.height = 'auto';
      }
      
      // 가장 짧은 컬럼 찾기
      const shortestColumnIndex = this.columnHeights.indexOf(Math.min(...this.columnHeights));
      
      // 카드 위치 계산
      let x = 0;
      let y = 0;
      
      if (isHorizontal) {
        x = this.columnHeights[shortestColumnIndex];
        y = shortestColumnIndex * (cardWidth + gap);
      } else {
        x = shortestColumnIndex * (cardWidth + gap);
        y = this.columnHeights[shortestColumnIndex];
      }
      
      // 카드 위치 적용
      cardElement.style.transform = `translate(${x}px, ${y}px)`;
      
      if (this.options.useAnimation) {
        cardElement.style.transition = `transform ${this.options.animationDuration}ms ${this.options.animationEasing}`;
      } else {
        cardElement.style.transition = 'none';
      }
      
      // 카드 높이 측정 및 컬럼 높이 업데이트
      const cardHeight = cardElement.offsetHeight;
      this.columnHeights[shortestColumnIndex] += cardHeight + gap;
      
      // 카드 위치 저장
      this.cardPositions.set(cardId, new CardPosition(cardId, x, y, cardWidth, cardHeight));
    });
  }

  /**
   * 컨테이너 크기를 업데이트합니다.
   */
  private updateContainerSize(): void {
    if (!this.container || this.columnHeights.length === 0) return;
    
    const maxColumnHeight = Math.max(...this.columnHeights);
    
    if (this.options.direction === 'horizontal') {
      this.container.style.width = `${maxColumnHeight}px`;
    } else {
      this.container.style.height = `${maxColumnHeight}px`;
    }
  }

  /**
   * 레이아웃 옵션을 설정합니다.
   * @param options 레이아웃 옵션
   */
  public setOptions(options: Partial<LayoutOptions>): void {
    try {
      this.options = { ...this.options, ...options };
      
      if (this.isInitialized) {
        this.setupContainer();
        this.refresh();
      }
      
      Log.debug('MasonryLayoutService', '레이아웃 옵션 설정 완료');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      ErrorHandler.handleError(
        'MasonryLayoutService.setOptions',
        `레이아웃 옵션 설정 실패: ${errorMessage}`,
        true
      );
    }
  }

  /**
   * 카드 위치를 가져옵니다.
   * @param cardId 카드 ID
   * @returns 카드 위치 또는 null
   */
  public getCardPosition(cardId: string): CardPosition | null {
    return this.cardPositions.get(cardId) || null;
  }

  /**
   * 모든 카드 위치를 가져옵니다.
   * @returns 카드 ID와 위치 맵
   */
  public getAllCardPositions(): Map<string, CardPosition> {
    return new Map(this.cardPositions);
  }

  /**
   * 특정 카드로 스크롤합니다.
   * @param cardId 카드 ID
   * @param behavior 스크롤 동작
   */
  public scrollToCard(cardId: string, behavior: ScrollBehavior = 'smooth'): void {
    try {
      if (!this.isInitialized || !this.container) {
        throw new Error('메이슨리 레이아웃 서비스가 초기화되지 않았습니다.');
      }
      
      const position = this.cardPositions.get(cardId);
      if (!position) return;
      
      const { x, y } = position;
      
      if (this.options.direction === 'horizontal') {
        this.container.scrollTo({
          left: x - this.options.containerPadding,
          behavior
        });
      } else {
        this.container.scrollTo({
          top: y - this.options.containerPadding,
          behavior
        });
      }
      
      Log.debug('MasonryLayoutService', `카드로 스크롤 완료: ${cardId}`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      ErrorHandler.handleError(
        'MasonryLayoutService.scrollToCard',
        `카드로 스크롤 실패: ${cardId}, 오류: ${errorMessage}`,
        true
      );
    }
  }

  /**
   * 레이아웃을 새로고침합니다.
   */
  public refresh(): void {
    try {
      if (!this.isInitialized || !this.container) {
        throw new Error('메이슨리 레이아웃 서비스가 초기화되지 않았습니다.');
      }
      
      // 현재 카드 요소 수집
      const cardElements = new Map<string, HTMLElement>();
      const cardIds: string[] = [];
      
      const cards = this.container.querySelectorAll(`.${LAYOUT_CLASS_NAMES.CARD.CONTAINER}`);
      cards.forEach(card => {
        const cardElement = card as HTMLElement;
        const cardId = cardElement.dataset.cardId;
        
        if (cardId) {
          cardIds.push(cardId);
          cardElements.set(cardId, cardElement);
        }
      });
      
      // 레이아웃 업데이트
      this.updateLayout(cardIds, cardElements);
      
      Log.debug('MasonryLayoutService', '레이아웃 새로고침 완료');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      ErrorHandler.handleError(
        'MasonryLayoutService.refresh',
        `레이아웃 새로고침 실패: ${errorMessage}`,
        true
      );
    }
  }

  /**
   * 메이슨리 레이아웃 서비스를 제거합니다.
   */
  public destroy(): void {
    try {
      // ResizeObserver 제거
      if (this.resizeObserver) {
        if (this.container) {
          this.resizeObserver.unobserve(this.container);
        }
        this.resizeObserver.disconnect();
        this.resizeObserver = null;
      }
      
      // MutationObserver 제거
      if (this.mutationObserver) {
        this.mutationObserver.disconnect();
        this.mutationObserver = null;
      }
      
      this.container = null;
      this.cardPositions.clear();
      this.columnHeights = [];
      this.isInitialized = false;
      
      Log.debug('MasonryLayoutService', '메이슨리 레이아웃 서비스 제거 완료');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      ErrorHandler.handleError(
        'MasonryLayoutService.destroy',
        `메이슨리 레이아웃 서비스 제거 실패: ${errorMessage}`,
        true
      );
    }
  }

  /**
   * 레이아웃 옵션을 가져옵니다.
   * @returns 레이아웃 옵션
   */
  public getOptions(): LayoutOptions {
    return { ...this.options };
  }

  /**
   * 컨테이너 요소를 가져옵니다.
   * @returns 컨테이너 요소 또는 null
   */
  public getContainer(): HTMLElement | null {
    return this.container;
  }

  /**
   * 메이슨리 레이아웃 서비스가 초기화되었는지 확인합니다.
   * @returns 초기화 여부
   */
  public isInitializedService(): boolean {
    return this.isInitialized;
  }

  /**
   * 레이아웃 계산 함수
   * 주어진 카드 ID와 요소 배열을 기반으로 레이아웃을 계산합니다.
   * @param cardIds 카드 ID 배열
   * @param cardElements 카드 요소 배열
   * @param containerWidth 컨테이너 너비
   * @param containerHeight 컨테이너 높이
   * @param options 레이아웃 옵션
   * @returns 레이아웃 계산 결과
   */
  calculateLayout(
    cardIds: string[],
    cardElements: HTMLElement[],
    containerWidth: number,
    containerHeight: number,
    options: LayoutOptions
  ): LayoutCalculationResult {
    try {
      // 성능 측정 시작
      const startTime = performance.now();
      
      // 카드 ID와 요소 배열 길이 검증
      if (cardIds.length !== cardElements.length) {
        throw new Error('카드 ID와 요소 배열의 길이가 일치하지 않습니다.');
      }
      
      // 카드가 없는 경우 빈 결과 반환
      if (cardIds.length === 0) {
        return this.createEmptyResult(containerWidth, containerHeight);
      }
      
      // 레이아웃 방향에 따라 다른 계산 방식 사용
      const result = options.direction === LayoutDirection.HORIZONTAL
        ? this.calculateHorizontalLayout(cardIds, cardElements, containerWidth, containerHeight, options)
        : this.calculateVerticalLayout(cardIds, cardElements, containerWidth, containerHeight, options);
      
      // 성능 측정 종료 및 로깅
      const endTime = performance.now();
      const duration = endTime - startTime;
      Log.debug(`성능 측정: MasonryLayoutService.calculateLayout (${duration.toFixed(2)}ms)`);
      
      return result;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      ErrorHandler.handleError(
        'MasonryLayoutService.calculateLayout',
        `레이아웃 계산 중 오류 발생: ${errorMessage}`,
        true
      );
      
      // 오류 발생 시 빈 결과 반환
      return this.createEmptyResult(containerWidth, containerHeight);
    }
  }
  
  /**
   * 빈 레이아웃 계산 결과 생성
   * @param containerWidth 컨테이너 너비
   * @param containerHeight 컨테이너 높이
   * @returns 빈 레이아웃 계산 결과
   */
  private createEmptyResult(containerWidth: number, containerHeight: number): LayoutCalculationResult {
    return {
      cardPositions: [],
      containerWidth,
      containerHeight,
      contentWidth: 0,
      contentHeight: 0,
      columns: 0,
      rows: 0,
      cardWidth: 0,
      cardHeight: 0,
      direction: this.options.direction,
      isVertical: this.options.direction === LayoutDirection.VERTICAL
    };
  }
  
  /**
   * 수평 레이아웃 계산
   * @param cardIds 카드 ID 배열
   * @param cardElements 카드 요소 배열
   * @param containerWidth 컨테이너 너비
   * @param containerHeight 컨테이너 높이
   * @param options 레이아웃 옵션
   * @returns 레이아웃 계산 결과
   */
  private calculateHorizontalLayout(
    cardIds: string[],
    cardElements: HTMLElement[],
    containerWidth: number,
    containerHeight: number,
    options: LayoutOptions
  ): LayoutCalculationResult {
    // 카드 너비 계산
    const cardWidth = Math.max(
      options.cardMinWidth || 200,
      Math.min(options.cardMaxWidth || 500, options.cardThresholdWidth)
    );
    
    // 카드 간격 고려
    const gap = options.cardGap;
    
    // 카드 높이 계산
    let cardHeight = options.cardHeight || 200;
    if (!options.alignCardHeight) {
      // 카드 높이를 컨테이너 높이의 일정 비율로 설정
      cardHeight = Math.max(
        options.cardMinHeight || 100,
        Math.min(options.cardMaxHeight || 500, containerHeight * 0.8)
      );
    }
    
    // 카드 위치 계산
    const cardPositions: CardPosition[] = [];
    let currentX = gap;
    
    for (let i = 0; i < cardIds.length; i++) {
      const cardId = cardIds[i];
      const element = cardElements[i];
      
      // 카드 위치 생성
      const position = new CardPosition(
        cardId,
        currentX,
        gap,
        cardWidth,
        cardHeight
      );
      
      cardPositions.push(position);
      
      // 다음 카드 X 위치 계산
      currentX += cardWidth + gap;
    }
    
    // 전체 콘텐츠 너비 계산
    const contentWidth = currentX;
    
    return {
      cardPositions,
      containerWidth,
      containerHeight,
      contentWidth,
      contentHeight: containerHeight,
      columns: cardIds.length,
      rows: 1,
      cardWidth,
      cardHeight,
      direction: LayoutDirection.HORIZONTAL,
      isVertical: false
    };
  }
  
  /**
   * 수직 레이아웃 계산
   * @param cardIds 카드 ID 배열
   * @param cardElements 카드 요소 배열
   * @param containerWidth 컨테이너 너비
   * @param containerHeight 컨테이너 높이
   * @param options 레이아웃 옵션
   * @returns 레이아웃 계산 결과
   */
  private calculateVerticalLayout(
    cardIds: string[],
    cardElements: HTMLElement[],
    containerWidth: number,
    containerHeight: number,
    options: LayoutOptions
  ): LayoutCalculationResult {
    // 카드 간격 고려
    const gap = options.cardGap;
    
    // 열 수 계산
    const columns = Math.max(
      1,
      Math.floor((containerWidth + gap) / (options.cardThresholdWidth + gap))
    );
    
    // 열 너비 계산
    const cardWidth = (containerWidth - (columns + 1) * gap) / columns;
    
    // 열 높이 배열 초기화
    const columnHeights = new Array(columns).fill(gap);
    
    // 카드 위치 계산
    const cardPositions: CardPosition[] = [];
    
    for (let i = 0; i < cardIds.length; i++) {
      const cardId = cardIds[i];
      const element = cardElements[i];
      
      // 가장 낮은 열 찾기
      const minColumnIndex = this.findMinColumnIndex(columnHeights);
      
      // 카드 높이 계산
      let cardHeight = options.cardHeight || 200;
      if (!options.alignCardHeight) {
        // 요소의 실제 높이 또는 콘텐츠 기반 높이 계산
        cardHeight = this.calculateCardHeight(element, options);
      }
      
      // 카드 위치 계산
      const x = gap + minColumnIndex * (cardWidth + gap);
      const y = columnHeights[minColumnIndex];
      
      // 카드 위치 생성
      const position = new CardPosition(
        cardId,
        x,
        y,
        cardWidth,
        cardHeight,
        Math.floor(i / columns), // row
        minColumnIndex // column
      );
      
      cardPositions.push(position);
      
      // 열 높이 업데이트
      columnHeights[minColumnIndex] += cardHeight + gap;
    }
    
    // 전체 콘텐츠 높이 계산
    const contentHeight = Math.max(...columnHeights);
    
    // 행 수 계산 (대략적인 값)
    const rows = Math.ceil(cardIds.length / columns);
    
    return {
      cardPositions,
      containerWidth,
      containerHeight,
      contentWidth: containerWidth,
      contentHeight,
      columns,
      rows,
      cardWidth,
      cardHeight: options.alignCardHeight ? (options.cardHeight || 200) : 0,
      direction: LayoutDirection.VERTICAL,
      isVertical: true
    };
  }
  
  /**
   * 가장 낮은 열 인덱스 찾기
   * @param columnHeights 열 높이 배열
   * @returns 가장 낮은 열 인덱스
   */
  private findMinColumnIndex(columnHeights: number[]): number {
    let minIndex = 0;
    let minHeight = columnHeights[0];
    
    for (let i = 1; i < columnHeights.length; i++) {
      if (columnHeights[i] < minHeight) {
        minIndex = i;
        minHeight = columnHeights[i];
      }
    }
    
    return minIndex;
  }
  
  /**
   * 카드 높이 계산
   * @param element 카드 요소
   * @param options 레이아웃 옵션
   * @returns 카드 높이
   */
  private calculateCardHeight(element: HTMLElement, options: LayoutOptions): number {
    // 요소에 높이가 설정되어 있으면 해당 높이 사용
    if (element.style.height) {
      const height = parseInt(element.style.height);
      if (!isNaN(height)) {
        return height;
      }
    }
    
    // 콘텐츠 양에 따른 높이 계산 (텍스트 길이 기반)
    const content = element.textContent || '';
    const contentLength = content.length;
    
    // 기본 높이 + 콘텐츠 길이에 비례한 추가 높이
    const baseHeight = options.cardMinHeight || 100;
    const maxHeight = options.cardMaxHeight || 500;
    const additionalHeight = Math.min(
      maxHeight - baseHeight,
      contentLength / 10 * 5 // 10자당 5px 추가 (최대 높이 제한)
    );
    
    return Math.max(
      baseHeight,
      Math.min(maxHeight, baseHeight + additionalHeight)
    );
  }
} 