import { DomainEventBus } from '../../core/events/DomainEventBus';
import { EventType } from '../../domain/events/EventTypes';
import { ILayoutController } from '../../domain/interaction/InteractionInterfaces';
import { ISettingsService, LayoutDirectionPreference, ICardNavigatorSettings } from '../../domain/settings/SettingsInterfaces';
import { ICard } from '../../domain/card/Card';
import { ILayout, ILayoutInfo, ScrollDirection } from '../../domain/layout/Layout';

/**
 * 레이아웃 타입
 */
export type LayoutType = 'grid' | 'list' | 'masonry' | 'timeline' | 'kanban';

/**
 * 레이아웃 방향
 */
export type LayoutDirection = 'horizontal' | 'vertical';

/**
 * 레이아웃 서비스 인터페이스
 */
export interface ILayoutService {
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
  getLayoutType(): string;
  
  /**
   * 레이아웃 방향 가져오기
   * @returns 레이아웃 방향
   */
  getLayoutDirection(): string;
  
  /**
   * 스크롤 방향 가져오기
   * @returns 스크롤 방향
   */
  getScrollDirection(): ScrollDirection;
  
  /**
   * CSS 변수 적용
   * @param container 컨테이너 요소
   * @param layoutInfo 레이아웃 정보
   */
  applyCssVariables(container: HTMLElement, layoutInfo: any): void;
  
  /**
   * 현재 레이아웃 가져오기
   * @returns 현재 레이아웃 타입
   */
  getCurrentLayout(): LayoutType;
  
  /**
   * 마지막 계산 결과 가져오기
   * @returns 마지막 계산 결과
   */
  getLastCalculation(): ILayoutInfo | null;
  
  /**
   * 레이아웃 전환 애니메이션 사용 여부 확인
   * @returns 레이아웃 전환 애니메이션 사용 여부
   */
  useLayoutTransition(): boolean;
  
  /**
   * 리소스 정리
   * 서비스가 사용한 모든 리소스를 정리합니다.
   */
  cleanup(): void;
  
  /**
   * 레이아웃 정보 가져오기
   * 현재 설정에 따른 레이아웃 정보를 반환합니다.
   * @returns 레이아웃 정보
   */
  getLayoutInfo(): ILayoutInfo;
  
  /**
   * 카드 너비 가져오기
   * 현재 설정에 따른 카드 너비를 반환합니다.
   * @returns 카드 너비
   */
  getCardWidth(): number;
  
  /**
   * 카드 높이 가져오기
   * 현재 설정에 따른 카드 높이를 반환합니다.
   * @returns 카드 높이
   */
  getCardHeight(): number;
  
  /**
   * 카드 간격 가져오기
   * 현재 설정에 따른 카드 간격을 반환합니다.
   * @returns 카드 간격
   */
  getCardGap(): number;
  
  /**
   * 설정 가져오기
   * @returns 플러그인 설정
   */
  getSettings(): ICardNavigatorSettings;
  
  /**
   * 레이아웃 타입 설정
   * @param layoutType 레이아웃 타입
   */
  setLayoutType(layoutType: LayoutType): void;
  
  /**
   * 카드 너비 설정
   * @param width 카드 너비
   */
  setCardWidth(width: number): void;
  
  /**
   * 카드 높이 설정
   * @param height 카드 높이
   */
  setCardHeight(height: number): void;
  
  /**
   * 카드 간격 설정
   * @param gap 카드 간격
   */
  setCardGap(gap: number): void;
  
  /**
   * 컨테이너 크기 계산
   * @param containerWidth 컨테이너 너비
   * @param containerHeight 컨테이너 높이
   * @param cardCount 카드 수
   * @returns 컨테이너 크기 정보
   */
  calculateContainerSize(containerWidth: number, containerHeight: number, cardCount: number): {
    width: number;
    height: number;
    columns: number;
    rows: number;
  };
  
  /**
   * 카드 위치 계산
   * @param cards 카드 목록
   * @param containerWidth 컨테이너 너비
   * @param containerHeight 컨테이너 높이
   * @returns 카드 위치 정보
   */
  calculateCardPositions(cards: ICard[], containerWidth: number, containerHeight: number): Map<string, { x: number; y: number }>;
  
  /**
   * 레이아웃 업데이트
   * @param container 컨테이너 요소
   * @param cards 카드 요소 맵
   */
  updateLayout(container: HTMLElement, cards: Map<string, HTMLElement>): void;
  
  /**
   * 레이아웃 방향 설정
   * @param direction 레이아웃 방향
   */
  setLayoutDirection(direction: string): void;
  
  /**
   * 레이아웃 컨트롤러 설정
   * @param controller 레이아웃 컨트롤러
   */
  setLayoutController(controller: ILayoutController): void;
  
  /**
   * 레이아웃 변경
   * @param layoutType 레이아웃 타입
   */
  changeLayout(layoutType: LayoutType): Promise<void>;
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
  private lastCalculation: ILayoutInfo | null = null;
  private lastContainerWidth: number = 0;
  private lastContainerHeight: number = 0;
  private calculationDebounceTimeout: NodeJS.Timeout | null = null;
  private lastCalculationTime: number = 0;
  
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
    
    this.layoutType = layoutSettings.fixedCardHeight ? 'grid' : 'masonry';
    this.layoutDirection = 'vertical'; // 기본값
    this.scrollDirection = 'vertical'; // 기본값
  }
  
  /**
   * 레이아웃 계산
   * @param containerWidth 컨테이너 너비
   * @param containerHeight 컨테이너 높이
   * @param itemCount 아이템 수
   * @returns 계산된 레이아웃 정보
   */
  calculateLayout(containerWidth: number, containerHeight: number, itemCount: number): ILayoutInfo {
    // 디바운스 처리: 이전 계산 후 짧은 시간 내에 다시 계산 요청이 오면 이전 결과 반환
    const now = Date.now();
    const lastCalculationTime = this.lastCalculationTime || 0;
    const timeSinceLastCalculation = now - lastCalculationTime;
    
    // 300ms 이내에 다시 계산 요청이 오면 이전 결과 반환 (단, 이전 결과가 있는 경우에만)
    if (this.lastCalculation && timeSinceLastCalculation < 300) {
      console.log('레이아웃 계산 디바운스: 이전 결과 재사용 (마지막 계산 후 ' + timeSinceLastCalculation + 'ms)');
      return this.lastCalculation;
    }
    
    // 컨테이너 크기가 유효하지 않으면 기본값 반환
    if (containerWidth <= 0 || containerHeight <= 0) {
      return {
        columns: 1,
        rows: 1,
        itemWidth: 200,
        itemHeight: 150,
        fixedHeight: true,
        direction: 'vertical',
        scrollDirection: 'vertical',
        itemCount: itemCount,
        containerWidth,
        containerHeight
      };
    }
    
    // 아이템이 없으면 기본값 반환
    if (itemCount <= 0) {
      return {
        columns: 1,
        rows: 1,
        itemWidth: 200,
        itemHeight: 150,
        fixedHeight: true,
        direction: 'vertical',
        scrollDirection: 'vertical',
        itemCount: 0,
        containerWidth,
        containerHeight
      };
    }
    
    // 설정 가져오기
    const settings = this.settingsService.getSettings();
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
    
    // 컨테이너 크기가 크게 변하지 않았으면 마지막 계산 결과 재사용
    if (this.lastCalculation && 
        Math.abs(this.lastContainerWidth - containerWidth) < 20 && 
        Math.abs(this.lastContainerHeight - containerHeight) < 20 &&
        this.lastCalculation.itemCount === itemCount) {
      return this.lastCalculation;
    }
    
    // 컨테이너 높이가 너무 작으면 최소 높이 적용
    // 이는 컨테이너가 초기화 중이거나 접혀있는 상태일 수 있음
    if (containerHeight < 50) {
      containerHeight = 100; // 최소 높이 적용
    }
    
    // 컨테이너 크기 저장
    this.lastContainerWidth = containerWidth;
    this.lastContainerHeight = containerHeight;
    
    // 레이아웃 타입 결정 (그리드 vs 메이슨리)
    this.layoutType = layoutSettings.fixedCardHeight ? 'grid' : 'masonry';
    
    // 레이아웃 방향 결정 (가로 vs 세로)
    if (layoutSettings.layoutDirectionPreference === LayoutDirectionPreference.AUTO) {
      // 자동 방향 결정 (뷰포트 비율에 따라)
      const ratio = containerWidth / containerHeight;
      
      // 히스테리시스 적용: 현재 방향에 따라 다른 임계값 사용
      // 수평->수직 전환 임계값: 1.3, 수직->수평 전환 임계값: 1.7
      if (this.layoutDirection === 'horizontal') {
        // 현재 수평 방향인 경우, 비율이 1.3 미만일 때만 수직으로 전환
        this.layoutDirection = ratio < 1.3 ? 'vertical' : 'horizontal';
      } else {
        // 현재 수직 방향인 경우, 비율이 1.7 초과일 때만 수평으로 전환
        this.layoutDirection = ratio > 1.7 ? 'horizontal' : 'vertical';
      }
      
      console.log('자동 레이아웃 방향 결정:', {
        containerWidth,
        containerHeight,
        비율: ratio,
        이전방향: this.lastCalculation?.direction || '없음',
        결정방향: this.layoutDirection
      });
    } else {
      // 사용자 선호도에 따라 방향 결정
      this.layoutDirection = layoutSettings.layoutDirectionPreference === LayoutDirectionPreference.HORIZONTAL 
        ? 'horizontal' 
        : 'vertical';
      console.log('사용자 지정 레이아웃 방향 적용:', {
        선호도: layoutSettings.layoutDirectionPreference,
        결정방향: this.layoutDirection
      });
    }
    
    // 스크롤 방향 결정 (레이아웃 방향과 일치하도록)
    this.scrollDirection = this.layoutDirection === 'horizontal' ? 'horizontal' : 'vertical';
    
    // 열/행 수 계산
    let columns, rows;
    let itemWidth, itemHeight;
    
    if (this.layoutDirection === 'horizontal') {
      // 가로 레이아웃 - 행 수 먼저 계산
      const thresholdHeight = layoutSettings.cardThresholdHeight;
      const gap = layoutSettings.cardGap;
      const padding = layoutSettings.cardsetPadding * 2;
      
      // 사용 가능한 높이 계산
      const availableHeight = containerHeight - padding;
      
      // 행 수 계산 (임계 높이와 간격 고려)
      rows = Math.max(1, Math.floor((availableHeight + gap) / (thresholdHeight + gap)));
      
      // 아이템 수에 따라 열 수 계산
      columns = Math.ceil(itemCount / rows);
      
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
      const availableWidth = containerWidth - padding;
      
      // 열 수 계산 (임계 너비와 간격 고려)
      columns = Math.max(1, Math.floor((availableWidth + gap) / (thresholdWidth + gap)));
      
      // 아이템 수에 따라 행 수 계산
      rows = Math.ceil(itemCount / columns);
      
      // 아이템 너비 계산 (뷰포트 너비를 열 수에 맞게 분배)
      itemWidth = (availableWidth - (columns - 1) * gap) / columns;
      
      // 아이템 높이는 임계 높이로 고정 (그리드 레이아웃인 경우)
      // 메이슨리 레이아웃에서는 콘텐츠에 따라 달라짐
      itemHeight = layoutSettings.cardThresholdHeight;
    }
    
    // 아이템 수가 열 수보다 적으면 아이템 수로 제한
    if (itemCount > 0) {
      columns = Math.min(columns, itemCount);
    }
    
    // 열 수가 0이 되지 않도록 보장
    columns = Math.max(1, columns);
    
    // 계산 결과 저장
    const layoutInfo: ILayoutInfo = {
      columns,
      rows,
      itemWidth,
      itemHeight,
      fixedHeight: this.layoutType === 'grid',
      direction: this.layoutDirection,
      scrollDirection: this.scrollDirection,
      itemCount,
      containerWidth,
      containerHeight,
      settings: layoutSettings
    };
    
    // 디버깅 정보 출력
    console.log('레이아웃 계산:', {
      containerWidth,
      containerHeight,
      columns,
      rows,
      direction: this.layoutDirection,
      type: this.layoutType
    });
    
    // 마지막 계산 결과 및 시간 저장
    this.lastCalculation = layoutInfo;
    this.lastCalculationTime = now;
    
    return layoutInfo;
  }
  
  /**
   * CSS 변수 적용
   * @param container 컨테이너 요소
   * @param layoutInfo 레이아웃 정보
   */
  applyCssVariables(container: HTMLElement, layoutInfo: any): void {
    // 설정 가져오기
    const settings = this.settingsService.getSettings();
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
    
    // CSS 변수 설정
    container.style.setProperty('--columns', layoutInfo.columns.toString());
    container.style.setProperty('--rows', layoutInfo.rows.toString());
    container.style.setProperty('--card-min-width', `${layoutInfo.itemWidth}px`);
    container.style.setProperty('--card-min-height', `${layoutInfo.itemHeight}px`);
    container.style.setProperty('--card-gap', `${layoutSettings.cardGap}px`);
    container.style.setProperty('--card-padding', `${layoutSettings.cardsetPadding}px`);
    container.style.setProperty('--card-size-factor', layoutSettings.cardSizeFactor.toString());
    
    // 레이아웃 타입에 따른 클래스 설정
    container.classList.remove('layout-grid', 'layout-masonry');
    container.classList.add(layoutInfo.fixedHeight ? 'layout-grid' : 'layout-masonry');
    
    // 레이아웃 방향에 따른 클래스 설정
    container.classList.remove('direction-horizontal', 'direction-vertical');
    container.classList.add(`direction-${layoutInfo.direction}`);
    
    // 스크롤 방향에 따른 클래스 설정
    container.classList.remove('scroll-horizontal', 'scroll-vertical');
    container.classList.add(`scroll-${layoutInfo.scrollDirection}`);
    
    // 레이아웃 전환 애니메이션 설정
    if (layoutSettings.useLayoutTransition) {
      container.style.transition = 'all 0.3s ease-in-out';
    } else {
      container.style.transition = 'none';
    }
    
    // 디버깅 정보 출력
    console.log('CSS 변수 적용:', {
      columns: layoutInfo.columns,
      rows: layoutInfo.rows,
      itemWidth: layoutInfo.itemWidth,
      itemHeight: layoutInfo.itemHeight,
      layoutType: layoutInfo.fixedHeight ? 'grid' : 'masonry',
      direction: layoutInfo.direction,
      scrollDirection: layoutInfo.scrollDirection
    });
  }
  
  /**
   * 레이아웃 타입 가져오기
   * @returns 레이아웃 타입
   */
  getLayoutType(): string {
    return this.layoutType;
  }
  
  /**
   * 레이아웃 방향 가져오기
   * @returns 레이아웃 방향
   */
  getLayoutDirection(): string {
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
   * 현재 레이아웃 가져오기
   * @returns 현재 레이아웃 타입
   */
  getCurrentLayout(): LayoutType {
    return this.layoutType;
  }
  
  /**
   * 마지막 계산 결과 가져오기
   * @returns 마지막 계산 결과
   */
  getLastCalculation(): ILayoutInfo | null {
    return this.lastCalculation;
  }
  
  /**
   * 레이아웃 전환 애니메이션 사용 여부 확인
   * @returns 레이아웃 전환 애니메이션 사용 여부
   */
  useLayoutTransition(): boolean {
    const settings = this.settingsService.getSettings();
    return settings.layout?.useLayoutTransition ?? true;
  }
  
  /**
   * 리소스 정리
   * 서비스가 사용한 모든 리소스를 정리합니다.
   */
  cleanup(): void {
    // 타임아웃 정리
    if (this.calculationDebounceTimeout) {
      clearTimeout(this.calculationDebounceTimeout);
      this.calculationDebounceTimeout = null;
    }
    
    // 마지막 계산 결과 정리
    this.lastCalculation = null;
    
    // 이벤트 리스너 제거
    this.eventBus.off(EventType.LAYOUT_CHANGED, this.handleLayoutChanged);
    
    console.log('레이아웃 서비스 정리 완료');
  }
  
  /**
   * 레이아웃 변경 이벤트 핸들러
   * @param data 이벤트 데이터
   */
  private handleLayoutChanged = (data: any) => {
    // 레이아웃 타입 변경
    if (data && data.type) {
      this.layoutType = data.type;
    }
  };
  
  /**
   * 레이아웃 변경
   * @param layoutType 레이아웃 타입
   */
  async changeLayout(layoutType: LayoutType): Promise<void> {
    if (this.layoutType !== layoutType) {
      this.layoutType = layoutType;
      
      // 설정 업데이트
      const settings = this.settingsService.getSettings();
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
      
      // 레이아웃 타입에 따라 fixedCardHeight 설정
      layoutSettings.fixedCardHeight = layoutType === 'grid';
      
      // 설정 업데이트
      settings.layout = layoutSettings;
      
      await this.settingsService.saveSettings(settings);
      
      // 이벤트 발생
      this.eventBus.emit(EventType.LAYOUT_CHANGED, { type: layoutType });
    }
  }
  
  /**
   * 레이아웃 정보 가져오기
   * 현재 설정에 따른 레이아웃 정보를 반환합니다.
   * @returns 레이아웃 정보
   */
  getLayoutInfo(): ILayoutInfo {
    return this.lastCalculation || {
      columns: 1,
      rows: 1,
      itemWidth: 200,
      itemHeight: 150,
      fixedHeight: true,
      direction: 'vertical',
      scrollDirection: 'vertical',
      itemCount: 0,
      containerWidth: 0,
      containerHeight: 0
    };
  }
  
  /**
   * 카드 너비 가져오기
   * 현재 설정에 따른 카드 너비를 반환합니다.
   * @returns 카드 너비
   */
  getCardWidth(): number {
    const layoutInfo = this.getLayoutInfo();
    return layoutInfo.itemWidth;
  }
  
  /**
   * 카드 높이 가져오기
   * 현재 설정에 따른 카드 높이를 반환합니다.
   * @returns 카드 높이
   */
  getCardHeight(): number {
    const layoutInfo = this.getLayoutInfo();
    return layoutInfo.itemHeight;
  }
  
  /**
   * 카드 간격 가져오기
   * 현재 설정에 따른 카드 간격을 반환합니다.
   * @returns 카드 간격
   */
  getCardGap(): number {
    const settings = this.settingsService.getSettings();
    return settings.cardGap || 10;
  }
  
  /**
   * 설정 가져오기
   * @returns 플러그인 설정
   */
  getSettings(): ICardNavigatorSettings {
    return this.settingsService.getSettings();
  }
  
  /**
   * 레이아웃 타입 설정
   * @param layoutType 레이아웃 타입
   */
  setLayoutType(layoutType: LayoutType): void {
    this.layoutType = layoutType;
  }
  
  /**
   * 카드 너비 설정
   * @param width 카드 너비
   */
  setCardWidth(width: number): void {
    // Implementation needed
  }
  
  /**
   * 카드 높이 설정
   * @param height 카드 높이
   */
  setCardHeight(height: number): void {
    // Implementation needed
  }
  
  /**
   * 카드 간격 설정
   * @param gap 카드 간격
   */
  setCardGap(gap: number): void {
    // Implementation needed
  }
  
  /**
   * 컨테이너 크기 계산
   * @param containerWidth 컨테이너 너비
   * @param containerHeight 컨테이너 높이
   * @param cardCount 카드 수
   * @returns 컨테이너 크기 정보
   */
  calculateContainerSize(containerWidth: number, containerHeight: number, cardCount: number): {
    width: number;
    height: number;
    columns: number;
    rows: number;
  } {
    // Implementation needed
    return { width: 0, height: 0, columns: 0, rows: 0 };
  }
  
  /**
   * 카드 위치 계산
   * @param cards 카드 목록
   * @param containerWidth 컨테이너 너비
   * @param containerHeight 컨테이너 높이
   * @returns 카드 위치 정보
   */
  calculateCardPositions(cards: ICard[], containerWidth: number, containerHeight: number): Map<string, { x: number; y: number }> {
    // Implementation needed
    return new Map();
  }
  
  /**
   * 레이아웃 업데이트
   * @param container 컨테이너 요소
   * @param cards 카드 요소 맵
   */
  updateLayout(container: HTMLElement, cards: Map<string, HTMLElement>): void {
    // Implementation needed
  }
  
  /**
   * 레이아웃 방향 설정
   * @param direction 레이아웃 방향
   */
  setLayoutDirection(direction: string): void {
    // Implementation needed
  }
  
  /**
   * 레이아웃 컨트롤러 설정
   * @param controller 레이아웃 컨트롤러
   */
  setLayoutController(controller: ILayoutController): void {
    // Implementation needed
  }
} 