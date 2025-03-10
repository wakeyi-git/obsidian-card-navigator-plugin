import { DomainEventBus } from '../../domain/events/DomainEventBus';
import { EventType } from '../../domain/events/EventTypes';
import { ILayout, ILayoutInfo, LayoutDirection, LayoutType, ScrollDirection } from '../../domain/layout/Layout';
import { ILayoutController } from '../../domain/interaction/InteractionInterfaces';
import { ISettingsService } from '../../domain/settings/SettingsInterfaces';

/**
 * 레이아웃 서비스 인터페이스
 */
export interface ILayoutService extends ILayoutController {
  /**
   * 레이아웃 계산
   * @param containerWidth 컨테이너 너비
   * @param containerHeight 컨테이너 높이
   * @param itemCount 아이템 수
   * @returns 계산된 레이아웃 정보
   */
  calculateLayout(containerWidth: number, containerHeight: number, itemCount: number): ILayoutInfo;
  
  /**
   * 레이아웃 타입 가져오기
   * @returns 레이아웃 타입
   */
  getLayoutType(): LayoutType;
  
  /**
   * 레이아웃 방향 가져오기
   * @returns 레이아웃 방향
   */
  getLayoutDirection(): LayoutDirection;
  
  /**
   * 스크롤 방향 가져오기
   * @returns 스크롤 방향
   */
  getScrollDirection(): ScrollDirection;
  
  /**
   * 카드 너비 가져오기
   * @returns 카드 너비
   */
  getCardWidth(): number;
  
  /**
   * 카드 높이 가져오기
   * @returns 카드 높이
   */
  getCardHeight(): number;
  
  /**
   * 카드 너비 설정
   * @param width 카드 너비
   */
  setCardWidth(width: number): Promise<void>;
  
  /**
   * 카드 높이 설정
   * @param height 카드 높이
   */
  setCardHeight(height: number): Promise<void>;
  
  /**
   * 카드 높이 고정 여부 가져오기
   * @returns 카드 높이 고정 여부
   */
  isFixedHeight(): boolean;
  
  /**
   * 카드 높이 고정 여부 설정
   * @param fixed 카드 높이 고정 여부
   */
  setFixedHeight(fixed: boolean): Promise<void>;
}

/**
 * 레이아웃 서비스
 * 레이아웃 관련 기능을 관리합니다.
 */
export class LayoutService implements ILayoutService {
  private settingsService: ISettingsService;
  private eventBus: DomainEventBus;
  private layoutType: LayoutType;
  private layoutDirection: LayoutDirection;
  private scrollDirection: ScrollDirection;
  private cardWidth: number;
  private cardHeight: number;
  private fixedHeight: boolean;
  private gap: number;
  
  /**
   * 생성자
   * @param settingsService 설정 서비스
   * @param eventBus 이벤트 버스
   */
  constructor(settingsService: ISettingsService, eventBus: DomainEventBus) {
    this.settingsService = settingsService;
    this.eventBus = eventBus;
    
    // 설정에서 초기값 가져오기
    const settings = this.settingsService.getSettings();
    this.layoutType = settings.fixedCardHeight ? 'grid' : 'masonry';
    this.layoutDirection = 'vertical'; // 기본값
    this.scrollDirection = 'vertical'; // 기본값
    this.cardWidth = settings.cardWidth || 250;
    this.cardHeight = settings.cardHeight || 150;
    this.fixedHeight = settings.fixedCardHeight || true;
    this.gap = settings.cardGap || 10;
  }
  
  /**
   * 레이아웃 계산
   * @param containerWidth 컨테이너 너비
   * @param containerHeight 컨테이너 높이
   * @param itemCount 아이템 수
   * @returns 계산된 레이아웃 정보
   */
  calculateLayout(containerWidth: number, containerHeight: number, itemCount: number): ILayoutInfo {
    // 레이아웃 방향 결정
    this.layoutDirection = containerWidth > containerHeight ? 'horizontal' : 'vertical';
    
    // 스크롤 방향 결정
    this.scrollDirection = this.layoutDirection === 'horizontal' ? 'horizontal' : 'vertical';
    
    // 열 수 계산
    let columns = Math.floor(containerWidth / this.cardWidth);
    columns = Math.max(1, columns);
    
    // 행 수 계산
    let rows = Math.ceil(itemCount / columns);
    
    // 가로 모드인 경우 행과 열 교환
    if (this.layoutDirection === 'horizontal') {
      const temp = columns;
      columns = rows;
      rows = temp;
    }
    
    // 아이템 너비 계산
    const itemWidth = Math.floor((containerWidth - (columns - 1) * this.gap) / columns);
    
    // 아이템 높이 계산
    let itemHeight = this.cardHeight;
    if (!this.fixedHeight && this.layoutType === 'masonry') {
      // 메이슨리 모드에서는 높이가 가변적
      itemHeight = 0; // 실제로는 각 아이템마다 다른 높이를 가짐
    }
    
    return {
      columns,
      rows,
      itemWidth,
      itemHeight,
      fixedHeight: this.fixedHeight,
      direction: this.layoutDirection,
      scrollDirection: this.scrollDirection
    };
  }
  
  /**
   * 레이아웃 타입 가져오기
   * @returns 레이아웃 타입
   */
  getLayoutType(): LayoutType {
    return this.layoutType;
  }
  
  /**
   * 레이아웃 방향 가져오기
   * @returns 레이아웃 방향
   */
  getLayoutDirection(): LayoutDirection {
    return this.layoutDirection;
  }
  
  /**
   * 스크롤 방향 가져오기
   * @returns 스크롤 방향
   */
  getScrollDirection(): ScrollDirection {
    return this.scrollDirection;
  }
  
  /**
   * 카드 너비 가져오기
   * @returns 카드 너비
   */
  getCardWidth(): number {
    return this.cardWidth;
  }
  
  /**
   * 카드 높이 가져오기
   * @returns 카드 높이
   */
  getCardHeight(): number {
    return this.cardHeight;
  }
  
  /**
   * 카드 너비 설정
   * @param width 카드 너비
   */
  async setCardWidth(width: number): Promise<void> {
    this.cardWidth = width;
    
    // 설정 업데이트
    await this.settingsService.updateSettings({
      cardWidth: width
    });
    
    // 레이아웃 변경 이벤트 발생
    this.eventBus.emit(EventType.LAYOUT_CHANGED, {
      previousLayout: this.layoutType,
      newLayout: this.layoutType
    });
  }
  
  /**
   * 카드 높이 설정
   * @param height 카드 높이
   */
  async setCardHeight(height: number): Promise<void> {
    this.cardHeight = height;
    
    // 설정 업데이트
    await this.settingsService.updateSettings({
      cardHeight: height
    });
    
    // 레이아웃 변경 이벤트 발생
    this.eventBus.emit(EventType.LAYOUT_CHANGED, {
      previousLayout: this.layoutType,
      newLayout: this.layoutType
    });
  }
  
  /**
   * 카드 높이 고정 여부 가져오기
   * @returns 카드 높이 고정 여부
   */
  isFixedHeight(): boolean {
    return this.fixedHeight;
  }
  
  /**
   * 카드 높이 고정 여부 설정
   * @param fixed 카드 높이 고정 여부
   */
  async setFixedHeight(fixed: boolean): Promise<void> {
    this.fixedHeight = fixed;
    
    // 레이아웃 타입 변경
    const previousLayout = this.layoutType;
    this.layoutType = fixed ? 'grid' : 'masonry';
    
    // 설정 업데이트
    await this.settingsService.updateSettings({
      fixedCardHeight: fixed
    });
    
    // 레이아웃 변경 이벤트 발생
    this.eventBus.emit(EventType.LAYOUT_CHANGED, {
      previousLayout,
      newLayout: this.layoutType
    });
  }
  
  /**
   * 레이아웃 변경
   * @param type 변경할 레이아웃 타입
   */
  async changeLayout(type: LayoutType): Promise<void> {
    const previousLayout = this.layoutType;
    this.layoutType = type;
    
    // 카드 높이 고정 여부 설정
    this.fixedHeight = type === 'grid';
    
    // 설정 업데이트
    await this.settingsService.updateSettings({
      fixedCardHeight: this.fixedHeight
    });
    
    // 레이아웃 변경 이벤트 발생
    this.eventBus.emit(EventType.LAYOUT_CHANGED, {
      previousLayout,
      newLayout: type
    });
  }
} 