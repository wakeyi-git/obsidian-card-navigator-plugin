import { ICard } from '../../domain/models/Card';
import { ICardSet } from '../../domain/models/CardSet';
import { ICardRenderConfig, DEFAULT_CARD_RENDER_CONFIG } from '../../domain/models/CardRenderConfig';
import { ICardStyle } from '../../domain/models/CardStyle';
import { ICardDisplayManager } from '../../domain/managers/ICardDisplayManager';
import { CardSelectedEvent, CardFocusedEvent } from '../../domain/events/CardEvents';
import { IEventDispatcher } from '@/domain/infrastructure/IEventDispatcher';
import { IErrorHandler } from '@/domain/infrastructure/IErrorHandler';
import { ILoggingService } from '@/domain/infrastructure/ILoggingService';
import { IPerformanceMonitor } from '@/domain/infrastructure/IPerformanceMonitor';
import { IAnalyticsService } from '@/domain/infrastructure/IAnalyticsService';
import { Container } from '@/infrastructure/di/Container';
import { CardServiceError } from '../../domain/errors/CardServiceError';

/**
 * 카드 표시 관리자 구현체
 */
export class CardDisplayManager implements ICardDisplayManager {
  private static instance: CardDisplayManager;
  private activeCardId: string | null = null;
  private focusedCardId: string | null = null;
  private selectedCardIds: Set<string> = new Set();
  private cardStyles: Map<string, ICardStyle> = new Map();
  private cardVisibility: Map<string, boolean> = new Map();
  private cardZIndices: Map<string, number> = new Map();
  private currentCardSet: ICardSet | null = null;
  private currentRenderConfig: ICardRenderConfig | null = null;
  private cards: Map<string, ICard> = new Map();

  private constructor(
    private readonly eventDispatcher: IEventDispatcher,
    private readonly errorHandler: IErrorHandler,
    private readonly loggingService: ILoggingService,
    private readonly performanceMonitor: IPerformanceMonitor,
    private readonly analyticsService: IAnalyticsService
  ) {}

  static getInstance(): CardDisplayManager {
    if (!CardDisplayManager.instance) {
      const container = Container.getInstance();
      CardDisplayManager.instance = new CardDisplayManager(
        container.resolve('IEventDispatcher'),
        container.resolve('IErrorHandler'),
        container.resolve('ILoggingService'),
        container.resolve('IPerformanceMonitor'),
        container.resolve('IAnalyticsService')
      );
    }
    return CardDisplayManager.instance;
  }

  /**
   * 초기화
   */
  initialize(): void {
    const perfMark = 'CardDisplayManager.initialize';
    this.performanceMonitor.startMeasure(perfMark);
    try {
      this.loggingService.debug('카드 표시 관리자 초기화 시작');
      
      this.activeCardId = null;
      this.focusedCardId = null;
      this.selectedCardIds.clear();
      this.cardStyles.clear();
      this.cardVisibility.clear();
      this.cardZIndices.clear();
      this.currentCardSet = null;
      this.currentRenderConfig = null;

      this.loggingService.info('카드 표시 관리자 초기화 완료');
    } catch (error) {
      this.loggingService.error('카드 표시 관리자 초기화 실패', { error });
      this.errorHandler.handleError(error as Error, 'CardDisplayManager.initialize');
      throw new CardServiceError(
        '카드 표시 관리자 초기화 중 오류가 발생했습니다.',
        undefined,
        undefined,
        'initialize',
        error instanceof Error ? error : new Error(String(error))
      );
    } finally {
      this.performanceMonitor.endMeasure(perfMark);
    }
  }

  /**
   * 정리
   */
  cleanup(): void {
    const perfMark = 'CardDisplayManager.cleanup';
    this.performanceMonitor.startMeasure(perfMark);
    try {
      this.loggingService.debug('카드 표시 관리자 정리 시작');
      this.initialize();
      this.loggingService.info('카드 표시 관리자 정리 완료');
    } catch (error) {
      this.loggingService.error('카드 표시 관리자 정리 실패', { error });
      this.errorHandler.handleError(error as Error, 'CardDisplayManager.cleanup');
      throw new CardServiceError(
        '카드 표시 관리자 정리 중 오류가 발생했습니다.',
        undefined,
        undefined,
        'cleanup',
        error instanceof Error ? error : new Error(String(error))
      );
    } finally {
      this.performanceMonitor.endMeasure(perfMark);
    }
  }

  /**
   * 카드셋 표시
   * @param cardSet 카드셋
   */
  displayCardSet(cardSet: ICardSet): void {
    const perfMark = 'CardDisplayManager.displayCardSet';
    this.performanceMonitor.startMeasure(perfMark);
    try {
      this.loggingService.debug('카드셋 표시 시작', { cardCount: cardSet.cards.length });
      
      this.currentCardSet = cardSet;
      this.cardVisibility.clear();
      this.cardZIndices.clear();

      // 모든 카드를 표시 상태로 설정
      cardSet.cards.forEach(card => {
        this.cardVisibility.set(card.id, true);
        this.cardZIndices.set(card.id, 0);
      });

      // 활성 카드가 있는 경우 해당 카드의 Z-인덱스를 높임
      if (this.activeCardId) {
        this.cardZIndices.set(this.activeCardId, 1);
      }

      // 포커스된 카드가 있는 경우 해당 카드의 Z-인덱스를 더 높임
      if (this.focusedCardId) {
        this.cardZIndices.set(this.focusedCardId, 2);
      }

      this.analyticsService.trackEvent('card_set_displayed', {
        cardCount: cardSet.cards.length,
        hasActiveCard: !!this.activeCardId,
        hasFocusedCard: !!this.focusedCardId
      });

      this.loggingService.info('카드셋 표시 완료', { cardCount: cardSet.cards.length });
    } catch (error) {
      this.loggingService.error('카드셋 표시 실패', { error });
      this.errorHandler.handleError(error as Error, 'CardDisplayManager.displayCardSet');
      throw new CardServiceError(
        '카드셋 표시 중 오류가 발생했습니다.',
        undefined,
        undefined,
        'display',
        error instanceof Error ? error : new Error(String(error))
      );
    } finally {
      this.performanceMonitor.endMeasure(perfMark);
    }
  }

  /**
   * 카드 선택
   * @param cardId 카드 ID
   */
  selectCard(cardId: string): void {
    const perfMark = 'CardDisplayManager.selectCard';
    this.performanceMonitor.startMeasure(perfMark);
    try {
      this.loggingService.debug('카드 선택 시작', { cardId });

      if (!this.currentCardSet) {
        throw new CardServiceError('카드셋이 로드되지 않았습니다.');
      }

      const card = this.currentCardSet.cards.find(c => c.id === cardId);
      if (!card) {
        throw new CardServiceError('카드를 찾을 수 없습니다.', cardId);
      }

      this.selectedCardIds.add(cardId);
      this.cardZIndices.set(cardId, 1);
      this.eventDispatcher.dispatch(new CardSelectedEvent(cardId));

      this.analyticsService.trackEvent('card_selected', { cardId });
      this.loggingService.info('카드 선택 완료', { cardId });
    } catch (error) {
      this.loggingService.error('카드 선택 실패', { error, cardId });
      this.errorHandler.handleError(error as Error, 'CardDisplayManager.selectCard');
      throw new CardServiceError(
        '카드 선택 중 오류가 발생했습니다.',
        cardId,
        undefined,
        'select',
        error instanceof Error ? error : new Error(String(error))
      );
    } finally {
      this.performanceMonitor.endMeasure(perfMark);
    }
  }

  /**
   * 카드 포커스
   * @param cardId 카드 ID
   */
  focusCard(cardId: string): void {
    const perfMark = 'CardDisplayManager.focusCard';
    this.performanceMonitor.startMeasure(perfMark);
    try {
      this.loggingService.debug('카드 포커스 시작', { cardId });

      // 카드셋이 없어도 카드 포커스 가능하도록 수정
      this.focusedCardId = cardId;
      this.cardZIndices.set(cardId, 2);
      this.eventDispatcher.dispatch(new CardFocusedEvent(cardId));

      this.analyticsService.trackEvent('card_focused', { cardId });
      this.loggingService.info('카드 포커스 완료', { cardId });
    } catch (error) {
      this.loggingService.error('카드 포커스 실패', { error, cardId });
      // 에러 핸들러에는 전달하지만 예외를 다시 던지지 않음
      this.errorHandler.handleError(error as Error, 'CardDisplayManager.focusCard');
    } finally {
      this.performanceMonitor.endMeasure(perfMark);
    }
  }

  /**
   * 카드 스크롤
   * @param cardId 카드 ID
   */
  scrollToCard(cardId: string): void {
    const perfMark = 'CardDisplayManager.scrollToCard';
    this.performanceMonitor.startMeasure(perfMark);
    try {
      this.loggingService.debug('카드 스크롤 시작', { cardId });

      // 카드셋 검사 제거 - 카드셋이 없어도 스크롤할 수 있도록
      // 스크롤 이벤트 발생 (실제 스크롤은 UI 레이어에서 처리)
      this.focusCard(cardId);

      this.analyticsService.trackEvent('card_scrolled', { cardId });
      this.loggingService.info('카드 스크롤 완료', { cardId });
    } catch (error) {
      this.loggingService.error('카드 스크롤 실패', { error, cardId });
      this.errorHandler.handleError(error as Error, 'CardDisplayManager.scrollToCard');
      // 에러를 던지지 않고 계속 진행
    } finally {
      this.performanceMonitor.endMeasure(perfMark);
    }
  }

  /**
   * 카드 스타일 업데이트
   * @param cardId 카드 ID
   * @param style 스타일
   */
  updateCardStyle(cardId: string, style: ICardStyle): void {
    const perfMark = 'CardDisplayManager.updateCardStyle';
    this.performanceMonitor.startMeasure(perfMark);
    try {
      this.loggingService.debug('카드 스타일 업데이트 시작', { cardId });

      if (!this.currentCardSet) {
        throw new CardServiceError('카드셋이 로드되지 않았습니다.');
      }

      const card = this.currentCardSet.cards.find(c => c.id === cardId);
      if (!card) {
        throw new CardServiceError('카드를 찾을 수 없습니다.', cardId);
      }

      this.cardStyles.set(cardId, style);

      this.analyticsService.trackEvent('card_style_updated', { cardId });
      this.loggingService.info('카드 스타일 업데이트 완료', { cardId });
    } catch (error) {
      this.loggingService.error('카드 스타일 업데이트 실패', { error, cardId });
      this.errorHandler.handleError(error as Error, 'CardDisplayManager.updateCardStyle');
      throw new CardServiceError(
        '카드 스타일 업데이트 중 오류가 발생했습니다.',
        cardId,
        undefined,
        'updateStyle',
        error instanceof Error ? error : new Error(String(error))
      );
    } finally {
      this.performanceMonitor.endMeasure(perfMark);
    }
  }

  /**
   * 카드 렌더링 설정 업데이트
   * @param config 렌더링 설정
   */
  updateRenderConfig(config: ICardRenderConfig): void {
    const perfMark = 'CardDisplayManager.updateRenderConfig';
    this.performanceMonitor.startMeasure(perfMark);
    try {
      this.loggingService.debug('카드 렌더링 설정 업데이트 시작');

      this.currentRenderConfig = config;

      if (this.currentCardSet) {
        // 모든 카드의 렌더링 설정 업데이트
        this.currentCardSet.cards.forEach(card => {
          this.eventDispatcher.dispatch(new CardSelectedEvent(card.id));
        });
      }

      this.analyticsService.trackEvent('render_config_updated', {
        renderMarkdown: config.renderMarkdown,
        cardCount: this.currentCardSet?.cards.length ?? 0
      });

      this.loggingService.info('카드 렌더링 설정 업데이트 완료');
    } catch (error) {
      this.loggingService.error('카드 렌더링 설정 업데이트 실패', { error });
      this.errorHandler.handleError(error as Error, 'CardDisplayManager.updateRenderConfig');
      throw new CardServiceError(
        '카드 렌더링 설정 업데이트 중 오류가 발생했습니다.',
        undefined,
        undefined,
        'updateRenderConfig',
        error instanceof Error ? error : new Error(String(error))
      );
    } finally {
      this.performanceMonitor.endMeasure(perfMark);
    }
  }

  /**
   * 카드 표시 상태 업데이트
   * @param cardId 카드 ID
   * @param visible 표시 여부
   */
  updateCardVisibility(cardId: string, visible: boolean): void {
    const perfMark = 'CardDisplayManager.updateCardVisibility';
    this.performanceMonitor.startMeasure(perfMark);
    try {
      this.loggingService.debug('카드 표시 상태 업데이트 시작', { cardId, visible });

      if (!this.currentCardSet) {
        throw new CardServiceError('카드셋이 로드되지 않았습니다.');
      }

      const card = this.currentCardSet.cards.find(c => c.id === cardId);
      if (!card) {
        throw new CardServiceError('카드를 찾을 수 없습니다.', cardId);
      }

      this.cardVisibility.set(cardId, visible);

      this.analyticsService.trackEvent('card_visibility_updated', { cardId, visible });
      this.loggingService.info('카드 표시 상태 업데이트 완료', { cardId, visible });
    } catch (error) {
      this.loggingService.error('카드 표시 상태 업데이트 실패', { error, cardId });
      this.errorHandler.handleError(error as Error, 'CardDisplayManager.updateCardVisibility');
      throw new CardServiceError(
        '카드 표시 상태 업데이트 중 오류가 발생했습니다.',
        cardId,
        undefined,
        'updateVisibility',
        error instanceof Error ? error : new Error(String(error))
      );
    } finally {
      this.performanceMonitor.endMeasure(perfMark);
    }
  }

  /**
   * 카드 Z-인덱스 업데이트
   * @param cardId 카드 ID
   * @param zIndex Z-인덱스
   */
  updateCardZIndex(cardId: string, zIndex: number): void {
    const perfMark = 'CardDisplayManager.updateCardZIndex';
    this.performanceMonitor.startMeasure(perfMark);
    try {
      this.loggingService.debug('카드 Z-인덱스 업데이트 시작', { cardId, zIndex });

      if (!this.currentCardSet) {
        throw new CardServiceError('카드셋이 로드되지 않았습니다.');
      }

      const card = this.currentCardSet.cards.find(c => c.id === cardId);
      if (!card) {
        throw new CardServiceError('카드를 찾을 수 없습니다.', cardId);
      }

      this.cardZIndices.set(cardId, zIndex);

      this.analyticsService.trackEvent('card_zindex_updated', { cardId, zIndex });
      this.loggingService.info('카드 Z-인덱스 업데이트 완료', { cardId, zIndex });
    } catch (error) {
      this.loggingService.error('카드 Z-인덱스 업데이트 실패', { error, cardId });
      this.errorHandler.handleError(error as Error, 'CardDisplayManager.updateCardZIndex');
      throw new CardServiceError(
        '카드 Z-인덱스 업데이트 중 오류가 발생했습니다.',
        cardId,
        undefined,
        'updateZIndex',
        error instanceof Error ? error : new Error(String(error))
      );
    } finally {
      this.performanceMonitor.endMeasure(perfMark);
    }
  }

  /**
   * 활성 카드 ID 반환
   */
  getActiveCardId(): string | null {
    return this.activeCardId;
  }

  /**
   * 포커스된 카드 ID 반환
   */
  getFocusedCardId(): string | null {
    return this.focusedCardId;
  }

  /**
   * 선택된 카드 ID 목록 반환
   */
  getSelectedCardIds(): string[] {
    return Array.from(this.selectedCardIds);
  }

  /**
   * 카드 표시 여부 확인
   * @param cardId 카드 ID
   */
  isCardVisible(cardId: string): boolean {
    return this.cardVisibility.get(cardId) ?? false;
  }

  /**
   * 카드 등록
   * @param cardId 카드 ID
   * @param element 카드 요소
   */
  registerCard(cardId: string, element: HTMLElement): void {
    const perfMark = 'CardDisplayManager.registerCard';
    this.performanceMonitor.startMeasure(perfMark);
    try {
      this.loggingService.debug('카드 등록 시작', { cardId });

      // 카드셋이 없는 경우 임시 카드셋 생성
      if (!this.currentCardSet) {
        this.loggingService.warn('카드셋이 로드되지 않아 임시 카드를 생성합니다');
        this.registerTempCard(cardId);
      } else {
        // 기존 로직 유지
        const card = this.currentCardSet.cards.find(c => c.id === cardId);
        if (!card) {
          this.loggingService.warn('카드셋에서 카드를 찾을 수 없어 임시 카드를 생성합니다', { cardId });
          this.registerTempCard(cardId);
        } else {
          this.cards.set(cardId, card);
        }

        this.analyticsService.trackEvent('card_registered', { cardId });
        this.loggingService.info('카드 등록 완료', { cardId });
      }
    } catch (error) {
      this.loggingService.error('카드 등록 실패', { error, cardId });
      this.errorHandler.handleError(error as Error, 'CardDisplayManager.registerCard');
      // 에러를 던지지 않고 계속 진행
    } finally {
      this.performanceMonitor.endMeasure(perfMark);
    }
  }

  /**
   * 임시 카드 등록
   * @param cardId 카드 ID
   */
  private registerTempCard(cardId: string): void {
    try {
      // 기본 렌더링 설정 사용
      const renderConfig = this.currentRenderConfig || DEFAULT_CARD_RENDER_CONFIG;

      // 타입 오류 회피를 위해 as any 사용 (임시 해결책)
      const card = {
        id: cardId,
        file: { path: cardId } as any,
        fileName: cardId.split('/').pop() || '',
        firstHeader: null,
        content: '',
        tags: [],
        properties: {},
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: {},
        renderConfig,
        validate: () => true,
        toString: function() {
          return `Card(${this.fileName})`;
        }
      } as any;
      
      // 임시 배열에 카드 저장
      if (!this.cards.has(cardId)) {
        this.cards.set(cardId, card);
      }

      // 기본 설정
      this.cardVisibility.set(cardId, true);
      this.cardZIndices.set(cardId, 0);
      
      this.analyticsService.trackEvent('card_registered', { cardId });
      this.loggingService.info('임시 카드 등록 완료', { cardId });
    } catch (error) {
      this.loggingService.error('임시 카드 등록 실패', { error, cardId });
      this.errorHandler.handleError(error as Error, 'CardDisplayManager.registerTempCard');
    }
  }

  private handleCardFocused(event: CardFocusedEvent): void {
    this.focusedCardId = event.data;
    this.updateCardStyles();
  }

  private handleCardSelected(event: CardSelectedEvent): void {
    const cardId = event.data;
    this.selectedCardIds.add(cardId);
    this.updateCardStyles();
  }

  private updateCardStyles(): void {
    // Implementation of updateCardStyles method
  }
} 