import { DomainEventBus } from '../../domain/events/DomainEventBus';
import { EventType } from '../../domain/events/EventTypes';
import { ILayout, ILayoutInfo, LayoutDirection, LayoutType, ScrollDirection } from '../../domain/layout/Layout';
import { ILayoutController } from '../../domain/interaction/InteractionInterfaces';
import { ISettingsService, LayoutDirectionPreference } from '../../domain/settings/SettingsInterfaces';

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
   * CSS 변수 적용
   * @param container 컨테이너 요소
   * @param layoutInfo 레이아웃 정보
   */
  applyCssVariables(container: HTMLElement, layoutInfo: ILayoutInfo): void;
  
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
      cardMinWidth: 200,
      cardMaxWidth: 400,
      cardMinHeight: 100,
      cardMaxHeight: 300,
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
        itemHeight: 100,
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
        itemHeight: 100,
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
      cardMinWidth: 200,
      cardMaxWidth: 400,
      cardMinHeight: 100,
      cardMaxHeight: 300,
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
    
    if (this.layoutDirection === 'horizontal') {
      // 가로 레이아웃 - 행 수 먼저 계산
      const minRowHeight = layoutSettings.cardMinHeight + layoutSettings.cardGap;
      rows = Math.max(1, Math.floor((containerHeight - layoutSettings.cardsetPadding * 2) / minRowHeight));
      columns = Math.ceil(itemCount / rows);
    } else {
      // 세로 레이아웃 - 열 수 먼저 계산
      const minColumnWidth = layoutSettings.cardMinWidth + layoutSettings.cardGap;
      columns = Math.max(1, Math.floor((containerWidth - layoutSettings.cardsetPadding * 2) / minColumnWidth));
      rows = Math.ceil(itemCount / columns);
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
      itemWidth: 0, // CSS에서 계산
      itemHeight: 0, // CSS에서 계산
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
  applyCssVariables(container: HTMLElement, layoutInfo: ILayoutInfo): void {
    // 설정 가져오기
    const settings = this.settingsService.getSettings();
    const layoutSettings = settings.layout || {
      fixedCardHeight: true,
      layoutDirectionPreference: LayoutDirectionPreference.AUTO,
      cardMinWidth: 200,
      cardMaxWidth: 400,
      cardMinHeight: 100,
      cardMaxHeight: 300,
      cardGap: 10,
      cardsetPadding: 10,
      cardSizeFactor: 1.0,
      useLayoutTransition: true
    };
    
    // CSS 변수 설정
    container.style.setProperty('--columns', layoutInfo.columns.toString());
    container.style.setProperty('--rows', layoutInfo.rows.toString());
    container.style.setProperty('--card-min-width', `${layoutSettings.cardMinWidth}px`);
    container.style.setProperty('--card-max-width', `${layoutSettings.cardMaxWidth}px`);
    container.style.setProperty('--card-min-height', `${layoutSettings.cardMinHeight}px`);
    container.style.setProperty('--card-max-height', `${layoutSettings.cardMaxHeight}px`);
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
    
    // 디버깅 정보 출력
    console.log('CSS 변수 적용:', {
      columns: layoutInfo.columns,
      rows: layoutInfo.rows,
      layoutType: layoutInfo.fixedHeight ? 'grid' : 'masonry',
      direction: layoutInfo.direction,
      scrollDirection: layoutInfo.scrollDirection,
      cardMinHeight: layoutSettings.cardMinHeight
    });
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
   * @param type 레이아웃 타입
   */
  async changeLayout(type: LayoutType): Promise<void> {
    if (this.layoutType !== type) {
      this.layoutType = type;
      
      // 설정 업데이트
      const settings = this.settingsService.getSettings();
      const layoutSettings = settings.layout || {
        fixedCardHeight: true,
        layoutDirectionPreference: LayoutDirectionPreference.AUTO,
        cardMinWidth: 200,
        cardMaxWidth: 400,
        cardMinHeight: 100,
        cardMaxHeight: 300,
        cardGap: 10,
        cardsetPadding: 10,
        cardSizeFactor: 1.0,
        useLayoutTransition: true
      };
      
      // 레이아웃 타입에 따라 fixedCardHeight 설정
      layoutSettings.fixedCardHeight = type === 'grid';
      
      // 설정 업데이트
      settings.layout = layoutSettings;
      
      await this.settingsService.saveSettings(settings);
      
      // 이벤트 발생
      this.eventBus.emit(EventType.LAYOUT_CHANGED, { type });
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
      itemHeight: 100,
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
} 