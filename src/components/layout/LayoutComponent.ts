import { Component } from '../Component';
import { DomainEventBus } from '../../domain/events/DomainEventBus';
import { EventType } from '../../domain/events/EventTypes';
import { ILayoutService } from '../../services/layout/LayoutService';
import { LayoutDirection, LayoutType, ScrollDirection } from '../../domain/layout/Layout';
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
  private containerWidth: number = 0;
  private containerHeight: number = 0;
  
  /**
   * 생성자
   * @param layoutService 레이아웃 서비스
   * @param eventBus 이벤트 버스
   */
  constructor(layoutService: ILayoutService, eventBus: DomainEventBus) {
    super();
    this.layoutService = layoutService;
    this.eventBus = eventBus;
    
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
  protected createComponent(): HTMLElement {
    const layoutElement = document.createElement('div');
    layoutElement.className = 'card-navigator-layout';
    
    // 레이아웃 컨트롤 추가
    const controlsElement = document.createElement('div');
    controlsElement.className = 'layout-controls';
    
    // 레이아웃 타입 토글 버튼
    const toggleButton = document.createElement('button');
    toggleButton.className = 'layout-type-toggle';
    toggleButton.textContent = this.layoutService.getLayoutType() === 'grid' ? '그리드' : '메이슨리';
    toggleButton.addEventListener('click', () => {
      const currentType = this.layoutService.getLayoutType();
      const newType = currentType === 'grid' ? 'masonry' : 'grid';
      this.setLayoutType(newType);
      toggleButton.textContent = newType === 'grid' ? '그리드' : '메이슨리';
    });
    
    controlsElement.appendChild(toggleButton);
    layoutElement.appendChild(controlsElement);
    
    // 레이아웃 컨테이너 추가
    const containerElement = document.createElement('div');
    containerElement.className = 'layout-container';
    containerElement.classList.add(`layout-${this.layoutService.getLayoutType()}`);
    containerElement.classList.add(`direction-${this.layoutService.getLayoutDirection()}`);
    containerElement.classList.add(`scroll-${this.layoutService.getScrollDirection()}`);
    
    layoutElement.appendChild(containerElement);
    
    return layoutElement;
  }
  
  /**
   * 컴포넌트 렌더링
   * @param container 컨테이너 요소
   */
  render(container: HTMLElement): void {
    super.render(container);
    
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
  }
  
  /**
   * 컴포넌트 제거
   */
  remove(): void {
    // ResizeObserver 해제
    if (this.resizeObserver && this.element) {
      this.resizeObserver.unobserve(this.element);
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
    
    // 이벤트 리스너 제거
    this.removeEventListeners();
    
    super.remove();
  }
  
  /**
   * 이벤트 리스너 등록
   */
  registerEventListeners(): void {
    // 레이아웃 변경 이벤트 리스너
    this.eventBus.on(EventType.LAYOUT_CHANGED, this.handleLayoutChanged.bind(this));
    
    // 카드셋 변경 이벤트 리스너
    this.eventBus.on(EventType.CARD_SET_CHANGED, this.handleCardSetChanged.bind(this));
    
    // 윈도우 리사이즈 이벤트 리스너
    window.addEventListener('resize', this.handleWindowResize.bind(this));
  }
  
  /**
   * 이벤트 리스너 제거
   */
  removeEventListeners(): void {
    // 레이아웃 변경 이벤트 리스너 제거
    this.eventBus.off(EventType.LAYOUT_CHANGED, this.handleLayoutChanged.bind(this));
    
    // 카드셋 변경 이벤트 리스너 제거
    this.eventBus.off(EventType.CARD_SET_CHANGED, this.handleCardSetChanged.bind(this));
    
    // 윈도우 리사이즈 이벤트 리스너 제거
    window.removeEventListener('resize', this.handleWindowResize.bind(this));
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
    if (this.element) {
      const { width, height } = this.element.getBoundingClientRect();
      this.updateContainerSize(width, height);
    }
  }
  
  /**
   * 레이아웃 적용
   */
  private applyLayout(): void {
    if (!this.element || this.containerWidth === 0 || this.containerHeight === 0) {
      return;
    }
    
    // 카드 수 가져오기
    const cards = this.eventBus.getState('currentCards') || [];
    const itemCount = cards.length;
    
    // 레이아웃 계산
    const layoutInfo = this.layoutService.calculateLayout(
      this.containerWidth,
      this.containerHeight,
      itemCount
    );
    
    // 레이아웃 적용 이벤트 발생
    this.eventBus.emit(EventType.LAYOUT_APPLIED, { layoutInfo });
  }
} 