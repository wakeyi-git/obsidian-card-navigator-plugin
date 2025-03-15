import { Component } from '../Component';
import { DomainEventBus } from '../../../core/events/DomainEventBus';
import { EventType } from '../../../domain/events/EventTypes';
import { ILayoutService } from '../../../application/layout/LayoutService';
import { ILayoutInfo, LayoutDirection, LayoutType, ScrollDirection } from '../../../domain/layout/Layout';
import { LayoutDirectionPreference } from '../../../domain/settings/SettingsInterfaces';
import './layout.css';

/**
 * 레이아웃 컴포넌트 인터페이스
 */
export interface ILayoutComponent {
  /**
   * 레이아웃 타입 설정
   * @param type 레이아웃 타입
   */
  setLayoutType(type: LayoutType): void;
  
  /**
   * 레이아웃 방향 설정
   * @param direction 레이아웃 방향
   */
  setLayoutDirection(direction: LayoutDirection): void;
  
  /**
   * 스크롤 방향 설정
   * @param direction 스크롤 방향
   */
  setScrollDirection(direction: ScrollDirection): void;
  
  /**
   * 컨테이너 크기 업데이트
   * @param width 너비
   * @param height 높이
   */
  updateContainerSize(width: number, height: number): void;
}

/**
 * 레이아웃 컴포넌트
 * 카드셋의 레이아웃을 관리합니다.
 */
export class LayoutComponent extends Component implements ILayoutComponent {
  private layoutService: ILayoutService;
  private eventBus: DomainEventBus;
  private resizeObserver: ResizeObserver | null = null;
  private containerWidth = 0;
  private containerHeight = 0;
  private resizeTimeout: NodeJS.Timeout | null = null;
  private lastCalculation: ILayoutInfo | null = null;
  
  // 이벤트 핸들러를 바인딩된 클래스 속성으로 정의
  private boundHandleLayoutChanged: () => void;
  private boundHandleCardSetChanged: () => void;
  private boundHandleWindowResize: () => void;
  
  // 이벤트 리스너 등록 상태 추적
  private eventListenersRegistered = false;

  /**
   * 생성자
   * @param layoutService 레이아웃 서비스
   * @param eventBus 이벤트 버스
   */
  constructor(layoutService: ILayoutService, eventBus: DomainEventBus) {
    super();
    this.layoutService = layoutService;
    this.eventBus = eventBus;
    
    // 이벤트 핸들러 바인딩
    this.boundHandleLayoutChanged = this.handleLayoutChanged.bind(this);
    this.boundHandleCardSetChanged = this.handleCardSetChanged.bind(this);
    this.boundHandleWindowResize = this.handleWindowResize.bind(this);
    
    // 초기 레이아웃 설정 가져오기
    const layoutType = this.layoutService.getLayoutType();
    const layoutDirection = this.layoutService.getLayoutDirection();
    const scrollDirection = this.layoutService.getScrollDirection();
  }
  
  /**
   * 레이아웃 타입 설정
   * @param type 레이아웃 타입
   */
  setLayoutType(type: LayoutType): void {
    // 레이아웃 타입 변경 이벤트 발생
    this.eventBus.emit(EventType.LAYOUT_TYPE_CHANGED, { layoutType: type });
    
    // 레이아웃 변경 이벤트 발생
    this.eventBus.emit(EventType.LAYOUT_CHANGED, {
      previousLayout: this.layoutService.getLayoutType(),
      newLayout: type
    });
    
    // 레이아웃 적용
    this.applyLayout();
  }
  
  /**
   * 레이아웃 방향 설정
   * @param direction 레이아웃 방향
   */
  setLayoutDirection(direction: LayoutDirection): void {
    // 레이아웃 설정 변경 이벤트 발생
    this.eventBus.emit(EventType.LAYOUT_SETTINGS_CHANGED, {
      settings: { layoutDirection: direction }
    });
    
    // 레이아웃 적용
    this.applyLayout();
  }
  
  /**
   * 스크롤 방향 설정
   * @param direction 스크롤 방향
   */
  setScrollDirection(direction: ScrollDirection): void {
    // 레이아웃 설정 변경 이벤트 발생
    this.eventBus.emit(EventType.LAYOUT_SETTINGS_CHANGED, {
      settings: { scrollDirection: direction }
    });
    
    // 레이아웃 적용
    this.applyLayout();
  }
  
  /**
   * 컨테이너 크기 업데이트
   * @param width 너비
   * @param height 높이
   */
  updateContainerSize(width: number, height: number): void {
    this.containerWidth = width;
    this.containerHeight = height;
    
    // 레이아웃 적용
    this.applyLayout();
  }
  
  /**
   * 컴포넌트 생성
   * @returns 생성된 HTML 요소
   */
  protected async createComponent(): Promise<HTMLElement> {
    const layoutElement = document.createElement('div');
    layoutElement.className = 'card-navigator-layout';
    
    // 레이아웃 컨트롤 추가
    const controlsElement = document.createElement('div');
    controlsElement.className = 'layout-controls';
    
    // 레이아웃 타입 컨트롤
    const layoutTypeControl = document.createElement('div');
    layoutTypeControl.className = 'layout-type-control';
    
    // 레이아웃 타입 버튼 추가
    const layoutTypes: LayoutType[] = ['grid', 'masonry'];
    layoutTypes.forEach(type => {
      const button = document.createElement('button');
      button.className = `layout-type-button ${type}`;
      button.dataset.type = type;
      button.title = `${type} 레이아웃`;
      
      // 현재 레이아웃 타입에 active 클래스 추가
      if (this.layoutService.getLayoutType() === type) {
        button.classList.add('active');
      }
      
      // 클릭 이벤트 핸들러
      button.addEventListener('click', () => {
        this.setLayoutType(type);
      });
      
      layoutTypeControl.appendChild(button);
    });
    
    controlsElement.appendChild(layoutTypeControl);
    
    // 레이아웃 방향 컨트롤
    const layoutDirectionControl = document.createElement('div');
    layoutDirectionControl.className = 'layout-direction-control';
    
    // 레이아웃 방향 버튼 추가
    const layoutDirections: LayoutDirection[] = ['horizontal', 'vertical'];
    layoutDirections.forEach(direction => {
      const button = document.createElement('button');
      button.className = `layout-direction-button ${direction}`;
      button.dataset.direction = direction;
      button.title = `${direction} 방향`;
      
      // 현재 레이아웃 방향에 active 클래스 추가
      if (this.layoutService.getLayoutDirection() === direction) {
        button.classList.add('active');
      }
      
      // 클릭 이벤트 핸들러
      button.addEventListener('click', () => {
        this.setLayoutDirection(direction);
      });
      
      layoutDirectionControl.appendChild(button);
    });
    
    controlsElement.appendChild(layoutDirectionControl);
    
    // 스크롤 방향 컨트롤
    const scrollDirectionControl = document.createElement('div');
    scrollDirectionControl.className = 'scroll-direction-control';
    
    // 스크롤 방향 버튼 추가
    const scrollDirections: ScrollDirection[] = ['vertical', 'horizontal'];
    scrollDirections.forEach(direction => {
      const button = document.createElement('button');
      button.className = `scroll-direction-button ${direction}`;
      button.dataset.direction = direction;
      button.title = `${direction} 스크롤`;
      
      // 현재 스크롤 방향에 active 클래스 추가
      if (this.layoutService.getScrollDirection() === direction) {
        button.classList.add('active');
      }
      
      // 클릭 이벤트 핸들러
      button.addEventListener('click', () => {
        this.setScrollDirection(direction);
      });
      
      scrollDirectionControl.appendChild(button);
    });
    
    controlsElement.appendChild(scrollDirectionControl);
    
    // 컨트롤 추가
    layoutElement.appendChild(controlsElement);
    
    return layoutElement;
  }
  
  /**
   * 컴포넌트 렌더링
   * @param container 컨테이너 요소
   * @returns 생성된 컴포넌트 요소
   */
  async render(container?: HTMLElement): Promise<HTMLElement> {
    // 기본 렌더링 로직 실행
    const element = await super.render(container);
    
    // ResizeObserver 설정
    if (this.element) {
      this.resizeObserver = new ResizeObserver(entries => {
        for (const entry of entries) {
          const { width, height } = entry.contentRect;
          this.updateContainerSize(width, height);
        }
      });
      
      this.resizeObserver.observe(this.element);
    }
    
    // 이벤트 리스너 등록
    this.registerEventListeners();
    
    return element;
  }
  
  /**
   * 컴포넌트 제거
   * 이벤트 리스너 제거 및 리소스 정리
   */
  remove(): void {
    // 이벤트 리스너 제거
    this.removeEventListeners();
    
    // ResizeObserver 정리
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
    
    // 타임아웃 정리
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
      this.resizeTimeout = null;
    }
    
    // 마지막 계산 결과 정리
    this.lastCalculation = null;
    
    // 컨테이너 참조 제거
    this.element = null;
    
    console.log('레이아웃 컴포넌트 제거 완료');
  }
  
  /**
   * 이벤트 리스너 등록
   */
  registerEventListeners(): void {
    // 이미 등록된 경우 중복 등록 방지
    if (this.eventListenersRegistered) return;
    
    // 레이아웃 변경 이벤트 리스너 등록
    this.eventBus.on(EventType.LAYOUT_CHANGED, this.boundHandleLayoutChanged);
    
    // 카드셋 변경 이벤트 리스너 등록
    this.eventBus.on(EventType.CARDSET_CHANGED, this.boundHandleCardSetChanged);
    
    // 윈도우 리사이즈 이벤트 리스너 등록
    window.addEventListener('resize', this.boundHandleWindowResize);
    
    // 이벤트 리스너 등록 상태 업데이트
    this.eventListenersRegistered = true;
  }
  
  /**
   * 이벤트 리스너 제거
   */
  removeEventListeners(): void {
    // 등록되지 않은 경우 무시
    if (!this.eventListenersRegistered) return;
    
    // 레이아웃 변경 이벤트 리스너 제거
    this.eventBus.off(EventType.LAYOUT_CHANGED, this.boundHandleLayoutChanged);
    
    // 카드셋 변경 이벤트 리스너 제거
    this.eventBus.off(EventType.CARDSET_CHANGED, this.boundHandleCardSetChanged);
    
    // 윈도우 리사이즈 이벤트 리스너 제거
    window.removeEventListener('resize', this.boundHandleWindowResize);
    
    // 이벤트 리스너 등록 상태 업데이트
    this.eventListenersRegistered = false;
  }
  
  /**
   * 레이아웃 변경 이벤트 핸들러
   */
  private handleLayoutChanged(): void {
    this.update();
  }
  
  /**
   * 카드셋 변경 이벤트 핸들러
   */
  private handleCardSetChanged(): void {
    this.applyLayout();
  }
  
  /**
   * 윈도우 리사이즈 이벤트 핸들러
   */
  private handleWindowResize(): void {
    // 디바운스 처리
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
    }
    
    this.resizeTimeout = setTimeout(() => {
      // element가 null이 아닌지 확인
      if (this.element) {
        const layoutContainer = this.element.querySelector('.card-navigator-layout');
        if (layoutContainer) {
          const rect = layoutContainer.getBoundingClientRect();
          this.updateContainerSize(rect.width, rect.height);
        }
      }
    }, 300); // 300ms 디바운스
  }
  
  /**
   * 레이아웃 적용
   */
  private applyLayout(): void {
    // 컨테이너가 없으면 무시
    if (!this.element) return;
    
    // 컨테이너 크기가 유효하지 않으면 무시
    if (this.containerWidth <= 0 || this.containerHeight <= 0) return;
    
    // 현재 카드 수 가져오기
    const cards = this.eventBus.getState('currentCards') || [];
    const itemCount = cards.length;
    
    // 레이아웃 계산이 필요한지 확인
    const needsRecalculation = this.isLayoutRecalculationNeeded(itemCount);
    if (!needsRecalculation) return;
    
    // 레이아웃 계산
    const layoutInfo = this.calculateLayout(
      this.containerWidth,
      this.containerHeight,
      itemCount
    );
    
    // CSS 변수 적용
    this.applyCssVariables(layoutInfo);
    
    // 레이아웃 적용 이벤트 발생
    this.eventBus.emit(EventType.LAYOUT_APPLIED, layoutInfo);
  }
  
  /**
   * 레이아웃 재계산이 필요한지 확인
   * @param itemCount 현재 아이템 수
   * @returns 재계산 필요 여부
   */
  private isLayoutRecalculationNeeded(itemCount: number): boolean {
    // 마지막 계산 결과가 없으면 계산 필요
    const lastCalc = this.layoutService.getLastCalculation();
    if (!lastCalc) return true;
    
    // 아이템 수가 변경되었으면 계산 필요
    if (lastCalc.itemCount !== itemCount) return true;
    
    // 컨테이너 크기가 크게 변경되었으면 계산 필요 (20px 이상)
    if (Math.abs(this.containerWidth - lastCalc.containerWidth) > 20 ||
        Math.abs(this.containerHeight - lastCalc.containerHeight) > 20) {
      return true;
    }
    
    // 레이아웃 타입이 변경되었으면 계산 필요
    if (lastCalc.fixedHeight !== (this.layoutService.getLayoutType() === 'grid')) {
      return true;
    }
    
    // 그 외의 경우 재계산 불필요
    return false;
  }
  
  /**
   * 레이아웃 계산
   * @param containerWidth 컨테이너 너비
   * @param containerHeight 컨테이너 높이
   * @param itemCount 아이템 수
   * @returns 계산된 레이아웃 정보
   */
  private calculateLayout(containerWidth: number, containerHeight: number, itemCount: number): ILayoutInfo {
    return this.memoize('calculateLayout', (width, height, count) => {
      // 레이아웃 타입 가져오기
      const settings = this.layoutService.getSettings();
      const layoutSettings = settings.layout || {
        fixedCardHeight: true,
        layoutDirectionPreference: LayoutDirectionPreference.AUTO,
        cardThresholdWidth: 200,
        cardThresholdHeight: 150,
        cardGap: 10,
        cardsetPadding: 10,
        cardSizeFactor: 1.0,
        useLayoutTransition: true
      };
      
      // 레이아웃 타입 결정
      const layoutType = layoutSettings.fixedCardHeight ? 'grid' : 'masonry';
      
      // 레이아웃 방향 결정
      let layoutDirection: LayoutDirection = 'vertical';
      
      if (layoutSettings.layoutDirectionPreference === LayoutDirectionPreference.AUTO) {
        // 자동 방향 결정 (뷰포트 비율에 따라)
        const ratio = width / height;
        layoutDirection = ratio > 1.5 ? 'horizontal' : 'vertical';
      } else {
        // 사용자 선호도에 따라 방향 결정
        layoutDirection = layoutSettings.layoutDirectionPreference === LayoutDirectionPreference.HORIZONTAL 
          ? 'horizontal' 
          : 'vertical';
      }
      
      // 스크롤 방향 결정
      const scrollDirection: ScrollDirection = layoutDirection === 'horizontal' ? 'horizontal' : 'vertical';
      
      // 열/행 수 계산
      let columns, rows;
      let itemWidth, itemHeight;
      
      if (layoutDirection === 'horizontal') {
        // 가로 레이아웃 - 행 수 먼저 계산
        const thresholdHeight = layoutSettings.cardThresholdHeight;
        const gap = layoutSettings.cardGap;
        const padding = layoutSettings.cardsetPadding * 2;
        
        // 사용 가능한 높이 계산
        const availableHeight = height - padding;
        
        // 행 수 계산 (임계 높이와 간격 고려)
        rows = Math.max(1, Math.floor((availableHeight + gap) / (thresholdHeight + gap)));
        
        // 아이템 수에 따라 열 수 계산
        columns = Math.ceil(count / rows);
        
        // 아이템 높이 계산 (뷰포트 높이를 행 수에 맞게 분배)
        itemHeight = (availableHeight - (rows - 1) * gap) / rows;
        
        // 아이템 너비는 임계 너비로 고정
        itemWidth = layoutSettings.cardThresholdWidth;
      } else {
        // 세로 레이아웃 - 열 수 먼저 계산
        const thresholdWidth = layoutSettings.cardThresholdWidth;
        const gap = layoutSettings.cardGap;
        const padding = layoutSettings.cardsetPadding * 2;
        
        // 사용 가능한 너비 계산
        const availableWidth = width - padding;
        
        // 열 수 계산 (임계 너비와 간격 고려)
        columns = Math.max(1, Math.floor((availableWidth + gap) / (thresholdWidth + gap)));
        
        // 아이템 수에 따라 행 수 계산
        rows = Math.ceil(count / columns);
        
        // 아이템 너비 계산 (뷰포트 너비를 열 수에 맞게 분배)
        itemWidth = (availableWidth - (columns - 1) * gap) / columns;
        
        // 아이템 높이는 임계 높이로 고정 (그리드 레이아웃인 경우)
        // 메이슨리 레이아웃에서는 콘텐츠에 따라 달라짐
        itemHeight = layoutSettings.cardThresholdHeight;
      }
      
      // 아이템 수가 열 수보다 적으면 아이템 수로 제한
      if (count > 0) {
        columns = Math.min(columns, count);
      }
      
      // 열 수가 0이 되지 않도록 보장
      columns = Math.max(1, columns);
      
      return {
        columns,
        rows,
        itemWidth,
        itemHeight,
        fixedHeight: layoutType === 'grid',
        direction: layoutDirection,
        scrollDirection,
        itemCount: count,
        containerWidth: width,
        containerHeight: height,
        settings: layoutSettings
      };
    }, containerWidth, containerHeight, itemCount);
  }

  /**
   * 컴포넌트 정리
   */
  cleanup(): void {
    // 이벤트 리스너 제거
    this.removeEventListeners();
    
    // 컴포넌트 제거
    this.remove();
    
    // 참조 정리
    this.element = null;
  }
  
  /**
   * 레이아웃 업데이트
   */
  async updateLayout(): Promise<void> {
    // 레이아웃 컨테이너 가져오기
    if (this.element) {
      const layoutContainer = this.element.querySelector('.card-navigator-layout');
      
      // ... existing code ...
    }
  }
  
  /**
   * 레이아웃 렌더링
   */
  private renderLayout(): void {
    if (!this.element) return;
    
    // ... existing code ...
  }
  
  /**
   * CSS 변수 적용
   * @param layoutInfo 레이아웃 정보
   */
  private applyCssVariables(layoutInfo: any): void {
    if (this.element) {
      this.layoutService.applyCssVariables(this.element, layoutInfo);
    }
  }
} 