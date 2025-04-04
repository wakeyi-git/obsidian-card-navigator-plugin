import { IToolbarService } from '../../domain/services/IToolbarService';
import { CardSetType } from '../../domain/models/CardSet';
import { ISortConfig } from '../../domain/models/SortConfig';
import { ICardRenderConfig } from '../../domain/models/CardRenderConfig';
import { ILayoutConfig } from '../../domain/models/LayoutConfig';
import { DEFAULT_SORT_CONFIG } from '../../domain/models/SortConfig';
import { DEFAULT_CARD_RENDER_CONFIG } from '../../domain/models/CardRenderConfig';
import { DEFAULT_LAYOUT_CONFIG } from '../../domain/models/LayoutConfig';
import { IErrorHandler } from '@/domain/infrastructure/IErrorHandler';
import { ILoggingService } from '@/domain/infrastructure/ILoggingService';
import { IPerformanceMonitor } from '@/domain/infrastructure/IPerformanceMonitor';
import { IAnalyticsService } from '@/domain/infrastructure/IAnalyticsService';
import { IEventDispatcher } from '@/domain/infrastructure/IEventDispatcher';
import { Container } from '@/infrastructure/di/Container';

/**
 * 툴바 서비스 구현체
 */
export class ToolbarService implements IToolbarService {
  private static instance: ToolbarService;
  private currentCardSetType: CardSetType = CardSetType.FOLDER;
  private currentSearchQuery: string = '';
  private currentSortConfig: ISortConfig = DEFAULT_SORT_CONFIG;
  private currentCardRenderConfig: ICardRenderConfig = DEFAULT_CARD_RENDER_CONFIG;
  private currentLayoutConfig: ILayoutConfig = DEFAULT_LAYOUT_CONFIG;

  private constructor(
    private readonly errorHandler: IErrorHandler,
    private readonly loggingService: ILoggingService,
    private readonly performanceMonitor: IPerformanceMonitor,
    private readonly analyticsService: IAnalyticsService,
    private readonly eventDispatcher: IEventDispatcher
  ) {}

  static getInstance(): ToolbarService {
    if (!ToolbarService.instance) {
      const container = Container.getInstance();
      ToolbarService.instance = new ToolbarService(
        container.resolve('IErrorHandler'),
        container.resolve('ILoggingService'),
        container.resolve('IPerformanceMonitor'),
        container.resolve('IAnalyticsService'),
        container.resolve('IEventDispatcher')
      );
    }
    return ToolbarService.instance;
  }

  /**
   * 서비스 초기화
   */
  initialize(): void {
    // 초기 설정 로드
  }

  /**
   * 서비스 정리
   */
  cleanup(): void {
    // 리소스 정리
  }

  /**
   * 카드셋 타입 변경
   * @param type 카드셋 타입
   */
  changeCardSetType(type: CardSetType): void {
    this.currentCardSetType = type;
    this.updateUI();
  }

  /**
   * 검색 실행
   * @param query 검색어
   */
  search(query: string): void {
    this.currentSearchQuery = query;
    this.updateUI();
  }

  /**
   * 정렬 설정 적용
   * @param sortConfig 정렬 설정
   */
  applySort(sortConfig: ISortConfig): void {
    this.currentSortConfig = sortConfig;
    this.updateUI();
  }

  /**
   * 설정 토글
   * @param setting 설정 이름
   * @param value 설정 값
   */
  toggleSetting(setting: string, value: any): void {
    switch (setting) {
      case 'cardRender':
        this.currentCardRenderConfig = value;
        break;
      case 'layout':
        this.currentLayoutConfig = value;
        break;
    }
    this.updateUI();
  }

  /**
   * 현재 카드셋 타입 조회
   */
  getCurrentCardSetType(): CardSetType {
    return this.currentCardSetType;
  }

  /**
   * 현재 검색어 조회
   */
  getCurrentSearchQuery(): string {
    return this.currentSearchQuery;
  }

  /**
   * 현재 정렬 설정 조회
   */
  getCurrentSortConfig(): ISortConfig {
    return this.currentSortConfig;
  }

  /**
   * 현재 카드 렌더링 설정 조회
   */
  getCurrentCardRenderConfig(): ICardRenderConfig {
    return this.currentCardRenderConfig;
  }

  /**
   * 현재 레이아웃 설정 조회
   */
  getCurrentLayoutConfig(): ILayoutConfig {
    return this.currentLayoutConfig;
  }

  /**
   * UI 업데이트
   */
  updateUI(): void {
    // UI 업데이트 로직
  }
} 