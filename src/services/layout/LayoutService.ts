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
  
  /**
   * 현재 레이아웃 가져오기
   * @returns 현재 레이아웃 타입
   */
  getCurrentLayout(): LayoutType;
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
    this.fixedHeight = settings.fixedCardHeight !== undefined ? settings.fixedCardHeight : false;
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
    
    // 최소 카드 너비 (반응형 디자인을 위해)
    const minCardWidth = 250;
    
    // 화면 너비 확인
    const windowWidth = window.innerWidth;
    const isMobileView = windowWidth <= 600;
    
    // 열 수 계산 (반응형)
    let columns;
    
    if (isMobileView) {
      // 모바일 뷰에서는 1열로 강제
      columns = 1;
    } else {
      // 컨테이너 너비에 따른 최대 열 수 계산
      // 컨테이너 너비, 최소 카드 너비, 간격을 고려하여 열 수 계산
      const availableWidth = Math.max(0, containerWidth - this.gap * 2); // 좌우 여백 고려
      const columnWithGap = minCardWidth + this.gap; // 카드 너비 + 간격
      
      // 열 수 계산 (최소 1, 최대 4)
      columns = Math.floor(availableWidth / columnWithGap);
      columns = Math.max(1, Math.min(4, columns)); // 최소 1열, 최대 4열로 제한
      
      // 컨테이너가 너무 좁으면 1열로 강제
      if (containerWidth < minCardWidth + this.gap * 2) {
        columns = 1;
      }
      
      // 컨테이너 너비에 따른 열 수 조정
      if (containerWidth < 500) {
        columns = 1; // 500px 미만은 1열
      } else if (containerWidth < 800) {
        columns = Math.min(2, columns); // 800px 미만은 최대 2열
      } else if (containerWidth < 1200) {
        columns = Math.min(3, columns); // 1200px 미만은 최대 3열
      }
      
      // 아이템 수가 열 수보다 적으면 아이템 수로 제한
      if (itemCount > 0) {
        columns = Math.min(columns, itemCount);
      }
    }
    
    // 행 수 계산
    let rows = Math.ceil(itemCount / Math.max(1, columns));
    
    // 가로 모드인 경우 행과 열 교환
    if (this.layoutDirection === 'horizontal') {
      const temp = columns;
      columns = rows;
      rows = temp;
    }
    
    // 아이템 너비 계산 (동적)
    let itemWidth;
    
    if (columns <= 1) {
      // 1열인 경우 컨테이너 너비에서 여백만 뺀 값
      itemWidth = Math.max(minCardWidth, containerWidth - this.gap * 2);
    } else {
      // 여러 열인 경우 균등 분배
      const totalGapWidth = (columns - 1) * this.gap + this.gap * 2;
      itemWidth = Math.floor((containerWidth - totalGapWidth) / columns);
      
      // 최소 너비 보장
      if (itemWidth < minCardWidth * 0.8) {
        // 너비가 최소 너비의 80%보다 작으면 열 수 감소
        columns = Math.max(1, columns - 1);
        // 너비 재계산
        const newTotalGapWidth = (columns - 1) * this.gap + this.gap * 2;
        itemWidth = Math.floor((containerWidth - newTotalGapWidth) / columns);
      }
    }
    
    // 아이템 높이 계산 (동적)
    let itemHeight = this.cardHeight;
    if (!this.fixedHeight) {
      // 동적 높이 모드
      if (this.layoutType === 'masonry') {
        // 메이슨리 모드에서는 높이가 가변적
        itemHeight = 0; // 실제로는 각 아이템마다 다른 높이를 가짐
      } else {
        // 그리드 모드에서도 컨텐츠에 따라 높이 조정 가능
        itemHeight = Math.floor(itemWidth * 0.6); // 너비의 60% 정도로 높이 설정 (황금비율)
      }
    }
    
    // 디버깅 정보 출력
    console.log('레이아웃 계산:', {
      containerWidth,
      columns,
      itemWidth,
      itemHeight,
      isMobileView,
      availableWidth: containerWidth - this.gap * 2,
      minCardWidth
    });
    
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
  
  /**
   * 현재 레이아웃 가져오기
   * @returns 현재 레이아웃 타입
   */
  getCurrentLayout(): LayoutType {
    return this.layoutType;
  }
} 