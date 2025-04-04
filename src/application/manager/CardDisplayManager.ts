import { ICard } from '../../domain/models/Card';
import { ICardSet } from '../../domain/models/CardSet';
import { ICardRenderConfig, DEFAULT_CARD_RENDER_CONFIG } from '../../domain/models/CardRenderConfig';
import { ICardStyle, DEFAULT_CARD_STYLE } from '../../domain/models/CardStyle';
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
      this.cards.clear();

      // 이벤트 구독 등록
      // 필요한 이벤트 핸들러 등록은 여기에 추가하세요

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
      this.loggingService.debug('카드셋 표시 시작', { cardSetId: cardSet.id });

      // 현재 카드셋 업데이트 (카드셋 데이터는 그대로 사용)
      this.currentCardSet = cardSet;
      
      // 렌더링 설정 초기화
      this.currentRenderConfig = DEFAULT_CARD_RENDER_CONFIG;

      // 기존 카드 상태 초기화
      this.cards.clear();
      this.cardVisibility.clear();
      this.cardZIndices.clear();
      this.cardStyles.clear();

      // 카드셋 내 모든 카드 초기화
      cardSet.cards.forEach(card => {
        // 카드 객체 등록 (카드셋에서 카드 데이터 그대로 사용)
        this.cards.set(card.id, card);
        
        // 카드 표시 상태 설정
        this.cardVisibility.set(card.id, true);
        
        // 카드 Z-인덱스 설정 (기본값: 1)
        this.cardZIndices.set(card.id, 1);
        
        // 카드 스타일만 DEFAULT_CARD_STYLE 사용
        this.cardStyles.set(card.id, DEFAULT_CARD_STYLE);
      });

      this.analyticsService.trackEvent('card_set_displayed', {
        cardSetId: cardSet.id,
        cardCount: cardSet.cards.length
      });

      this.loggingService.info('카드셋 표시 완료', { 
        cardSetId: cardSet.id,
        cardCount: cardSet.cards.length
      });
    } catch (error) {
      this.loggingService.error('카드셋 표시 실패', { error });
      this.errorHandler.handleError(error as Error, 'CardDisplayManager.displayCardSet');
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

      // 카드셋이 없는 경우 자세한 경고
      if (!this.currentCardSet) {
        this.loggingService.warn('카드셋이 로드되지 않았습니다. 카드 등록을 건너뜁니다.', { 
          cardId,
          hasCurrentCardSet: !!this.currentCardSet,
          cardCount: this.cards.size
        });
        return;
      } 
      
      // 카드셋에서 카드 찾기
      const card = this.currentCardSet.cards.find(c => c.id === cardId);
      if (!card) {
        this.loggingService.warn('카드셋에서 카드를 찾을 수 없습니다.', { 
          cardId,
          cardSetId: this.currentCardSet.id,
          cardSetCardCount: this.currentCardSet.cards.length,
          availableCardIds: this.currentCardSet.cards.map(c => c.id).join(', ')
        });
        return;
      }
      
      // 카드 등록
      this.cards.set(cardId, card);
      
      // 카드 표시 상태 및 스타일 설정
      this.cardVisibility.set(cardId, true);
      this.cardZIndices.set(cardId, 1);
      
      // 스타일이 설정되지 않았으면 기본 스타일 적용
      if (!this.cardStyles.has(cardId)) {
        this.cardStyles.set(cardId, DEFAULT_CARD_STYLE);
      }
      
      this.analyticsService.trackEvent('card_registered', { cardId });
      this.loggingService.info('카드 등록 완료', { cardId });
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
    try {
      this.loggingService.debug('카드 스타일 업데이트 시작');
      
      // 카드 컬렉션이 없는 경우 스킵
      if (!this.cards) {
        this.loggingService.debug('카드 컬렉션이 없어 스타일 업데이트를 건너뜁니다.');
        return;
      }

      // 문서에서 카드 요소 조회
      const cardElements = document.querySelectorAll('.card-navigator-card');
      if (!cardElements || cardElements.length === 0) {
        this.loggingService.debug('DOM에서 카드 요소를 찾을 수 없습니다.');
        return;
      }

      // 카드 요소에 스타일 적용
      cardElements.forEach((cardEl: HTMLElement) => {
        const cardId = cardEl.getAttribute('data-card-id');
        if (!cardId) return;

        // 기본 카드 스타일 설정
        const cardStyle = this.cardStyles.get('*') || this.cardStyles.get(cardId);
        if (!cardStyle) return;

        // 일반 카드 스타일 적용
        cardEl.style.setProperty('--card-bg', cardStyle.card.backgroundColor);
        cardEl.style.setProperty('--card-font-size', cardStyle.card.fontSize);
        cardEl.style.setProperty('--card-border-color', cardStyle.card.borderColor);
        cardEl.style.setProperty('--card-border-width', cardStyle.card.borderWidth);
        
        // 헤더 스타일 적용
        cardEl.style.setProperty('--header-bg', cardStyle.header.backgroundColor);
        cardEl.style.setProperty('--header-font-size', cardStyle.header.fontSize);
        cardEl.style.setProperty('--header-border-color', cardStyle.header.borderColor);
        cardEl.style.setProperty('--header-border-width', cardStyle.header.borderWidth);
        
        // 본문 스타일 적용
        cardEl.style.setProperty('--body-bg', cardStyle.body.backgroundColor);
        cardEl.style.setProperty('--body-font-size', cardStyle.body.fontSize);
        cardEl.style.setProperty('--body-border-color', cardStyle.body.borderColor);
        cardEl.style.setProperty('--body-border-width', cardStyle.body.borderWidth);
        
        // 푸터 스타일 적용
        cardEl.style.setProperty('--footer-bg', cardStyle.footer.backgroundColor);
        cardEl.style.setProperty('--footer-font-size', cardStyle.footer.fontSize);
        cardEl.style.setProperty('--footer-border-color', cardStyle.footer.borderColor);
        cardEl.style.setProperty('--footer-border-width', cardStyle.footer.borderWidth);
        
        // 활성 카드 스타일 적용
        cardEl.style.setProperty('--active-card-bg', cardStyle.activeCard.backgroundColor);
        cardEl.style.setProperty('--active-card-font-size', cardStyle.activeCard.fontSize);
        cardEl.style.setProperty('--active-card-border-color', cardStyle.activeCard.borderColor);
        cardEl.style.setProperty('--active-card-border-width', cardStyle.activeCard.borderWidth);
        
        // 포커스 카드 스타일 적용
        cardEl.style.setProperty('--focused-card-bg', cardStyle.focusedCard.backgroundColor);
        cardEl.style.setProperty('--focused-card-font-size', cardStyle.focusedCard.fontSize);
        cardEl.style.setProperty('--focused-card-border-color', cardStyle.focusedCard.borderColor);
        cardEl.style.setProperty('--focused-card-border-width', cardStyle.focusedCard.borderWidth);
        
        // 카드 상태 클래스 적용
        cardEl.classList.remove('active-card', 'focused-card');
        
        // 활성 카드인 경우 클래스 추가
        if (cardId === this.activeCardId) {
          cardEl.classList.add('active-card');
        }
        
        // 포커스 카드인 경우 클래스 추가
        if (cardId === this.focusedCardId) {
          cardEl.classList.add('focused-card');
        }
      });
      
      this.loggingService.info('카드 스타일 업데이트 완료');
    } catch (error) {
      this.loggingService.error('카드 스타일 업데이트 실패', { error });
      this.errorHandler.handleError(error as Error, 'CardDisplayManager.updateCardStyles');
    }
  }
} 