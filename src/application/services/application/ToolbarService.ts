import { IToolbarService } from '@/domain/services/application/IToolbarService';
import { CardSetType } from '@/domain/models/CardSet';
import { ISearchConfig } from '@/domain/models/Search';
import { ISortConfig } from '@/domain/models/Sort';
import { ICardStyle, ICardSection, DEFAULT_CARD_SECTION } from '@/domain/models/Card';
import { ILayoutConfig } from '@/domain/models/Layout';
import { DEFAULT_SORT_CONFIG } from '@/domain/models/Sort';
import { DEFAULT_CARD_STYLE } from '@/domain/models/Card';
import { DEFAULT_LAYOUT_CONFIG } from '@/domain/models/Layout';
import { DEFAULT_SEARCH_CONFIG } from '@/domain/models/Search';
import { IErrorHandler } from '@/domain/infrastructure/IErrorHandler';
import { ILoggingService } from '@/domain/infrastructure/ILoggingService';
import { IPerformanceMonitor } from '@/domain/infrastructure/IPerformanceMonitor';
import { IAnalyticsService } from '@/domain/infrastructure/IAnalyticsService';
import { IEventDispatcher } from '@/domain/infrastructure/IEventDispatcher';
import { Container } from '@/infrastructure/di/Container';
import {
  ToolbarActionEvent,
  CardSetTypeChangedEvent,
  SearchConfigChangedEvent,
  SortConfigChangedEvent,
  CardStyleChangedEvent,
  LayoutConfigChangedEvent,
  CardSectionChangedEvent
} from '../../../domain/events/ToolbarEvents';
import { CardService } from '@/application/services/domain/CardService';
import { CardSetService } from '@/application/services/domain/CardSetService';
import { PresetService } from '@/application/services/application/PresetService';
import { CardManager } from '@/application/manager/CardManager';
import { PresetManager } from '@/application/manager/PresetManager';
import { CardFactory } from '@/application/factories/CardFactory';

/**
 * 툴바 서비스 구현체
 */
export class ToolbarService implements IToolbarService {
  private static instance: ToolbarService;
  private currentCardSetType: CardSetType = CardSetType.FOLDER;
  private currentSearchConfig: ISearchConfig = DEFAULT_SEARCH_CONFIG;
  private currentSortConfig: ISortConfig = DEFAULT_SORT_CONFIG;
  private currentCardStyle: ICardStyle = DEFAULT_CARD_STYLE;
  private currentCardSection: ICardSection = DEFAULT_CARD_SECTION;
  private currentLayoutConfig: ILayoutConfig = DEFAULT_LAYOUT_CONFIG;
  private initialized: boolean = false;

  constructor(
    private readonly cardService: CardService,
    private readonly cardSetService: CardSetService,
    private readonly presetService: PresetService,
    private readonly cardManager: CardManager,
    private readonly presetManager: PresetManager,
    private readonly cardFactory: CardFactory,
    private readonly errorHandler: IErrorHandler,
    private readonly logger: ILoggingService,
    private readonly performanceMonitor: IPerformanceMonitor,
    private readonly analyticsService: IAnalyticsService,
    private readonly eventDispatcher: IEventDispatcher
  ) {}

  static getInstance(): ToolbarService {
    if (!ToolbarService.instance) {
      const container = Container.getInstance();
      ToolbarService.instance = new ToolbarService(
        container.resolve('ICardService'),
        container.resolve('ICardSetService'),
        container.resolve('IPresetService'),
        container.resolve('ICardManager'),
        container.resolve('IPresetManager'),
        container.resolve('ICardFactory'),
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
    this.initialized = true;
  }

  /**
   * 초기화 여부 확인
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * 서비스 정리
   */
  cleanup(): void {
    this.initialized = false;
  }

  /**
   * 카드셋 타입 변경
   * @param type 카드셋 타입
   */
  changeCardSetType(type: CardSetType): void {
    const oldType = this.currentCardSetType;
    this.currentCardSetType = type;
    this.eventDispatcher.dispatch(new CardSetTypeChangedEvent(oldType, type));
    this.updateUI();
  }

  /**
   * 현재 카드셋 타입 가져오기
   */
  getCurrentCardSetType(): CardSetType {
    return this.currentCardSetType;
  }

  /**
   * 검색 설정 업데이트
   * @param config 검색 설정
   */
  updateSearchConfig(config: ISearchConfig): void {
    const oldConfig = this.currentSearchConfig;
    this.currentSearchConfig = config;
    this.eventDispatcher.dispatch(new SearchConfigChangedEvent(oldConfig, config));
    this.updateUI();
  }

  /**
   * 현재 검색 설정 가져오기
   */
  getCurrentSearchConfig(): ISearchConfig {
    return this.currentSearchConfig;
  }

  /**
   * 정렬 설정 업데이트
   * @param config 정렬 설정
   */
  updateSortConfig(config: ISortConfig): void {
    const oldConfig = this.currentSortConfig;
    this.currentSortConfig = config;
    this.eventDispatcher.dispatch(new SortConfigChangedEvent(oldConfig, config));
    this.updateUI();
  }

  /**
   * 현재 정렬 설정 가져오기
   */
  getCurrentSortConfig(): ISortConfig {
    return this.currentSortConfig;
  }

  /**
   * 카드 섹션 업데이트
   * @param section 카드 섹션
   */
  updateCardSection(section: ICardSection): void {
    const oldSection = this.currentCardSection;
    this.currentCardSection = section;
    this.eventDispatcher.dispatch(new CardSectionChangedEvent(oldSection, section));
    this.updateUI();
  }

  /**
   * 현재 카드 섹션 가져오기
   */
  getCurrentCardSection(): ICardSection {
    return this.currentCardSection;
  }

  /**
   * 카드 스타일 업데이트
   * @param style 카드 스타일
   */
  updateCardStyle(style: ICardStyle): void {
    const oldStyle = this.currentCardStyle;
    this.currentCardStyle = style;
    this.eventDispatcher.dispatch(new CardStyleChangedEvent(oldStyle, style));
    this.updateUI();
  }

  /**
   * 현재 카드 스타일 가져오기
   */
  getCurrentCardStyle(): ICardStyle {
    return this.currentCardStyle;
  }

  /**
   * 레이아웃 설정 업데이트
   * @param config 레이아웃 설정
   */
  updateLayoutConfig(config: ILayoutConfig): void {
    const oldConfig = this.currentLayoutConfig;
    this.currentLayoutConfig = config;
    this.eventDispatcher.dispatch(new LayoutConfigChangedEvent(oldConfig, config));
    this.updateUI();
  }

  /**
   * 현재 레이아웃 설정 가져오기
   */
  getCurrentLayoutConfig(): ILayoutConfig {
    return this.currentLayoutConfig;
  }

  /**
   * UI 업데이트
   */
  public updateUI(): void {
    const event = new ToolbarActionEvent(
      this.currentCardSetType,
      this.currentSearchConfig,
      this.currentSortConfig,
      this.currentCardSection,
      this.currentCardStyle,
      this.currentLayoutConfig
    );
    this.eventDispatcher.dispatch(event);
  }
} 