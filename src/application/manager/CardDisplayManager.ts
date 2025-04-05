import { ICard } from '../../domain/models/Card';
import { ICardSet } from '../../domain/models/CardSet';
import { ICardRenderConfig, DEFAULT_CARD_RENDER_CONFIG } from '../../domain/models/CardRenderConfig';
import { ICardStyle, DEFAULT_CARD_STYLE } from '../../domain/models/CardStyle';
import { ICardDisplayManager } from '../../domain/managers/ICardDisplayManager';
import { CardSelectedEvent, CardFocusedEvent, CardDraggedEvent, CardDroppedEvent } from '../../domain/events/CardEvents';
import { IEventDispatcher } from '@/domain/infrastructure/IEventDispatcher';
import { IErrorHandler } from '@/domain/infrastructure/IErrorHandler';
import { ILoggingService } from '@/domain/infrastructure/ILoggingService';
import { IPerformanceMonitor } from '@/domain/infrastructure/IPerformanceMonitor';
import { IAnalyticsService } from '@/domain/infrastructure/IAnalyticsService';
import { Container } from '@/infrastructure/di/Container';
import { CardServiceError } from '../../domain/errors/CardServiceError';
import { ICardInteractionService } from '../../domain/services/ICardInteractionService';
import { Menu } from 'obsidian';

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
  private lastTransactionId: string | null = null;
  private static TRANSACTION_TIMEOUT = 1000; // 1초 내 동일 트랜잭션 무시

  private constructor(
    private readonly eventDispatcher: IEventDispatcher,
    private readonly errorHandler: IErrorHandler,
    private readonly loggingService: ILoggingService,
    private readonly performanceMonitor: IPerformanceMonitor,
    private readonly analyticsService: IAnalyticsService,
    private readonly cardInteractionService: ICardInteractionService
  ) {}

  static getInstance(): CardDisplayManager {
    if (!CardDisplayManager.instance) {
      const container = Container.getInstance();
      CardDisplayManager.instance = new CardDisplayManager(
        container.resolve('IEventDispatcher'),
        container.resolve('IErrorHandler'),
        container.resolve('ILoggingService'),
        container.resolve('IPerformanceMonitor'),
        container.resolve('IAnalyticsService'),
        container.resolve('ICardInteractionService')
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
   * @param transactionId 트랜잭션 ID (선택 사항)
   */
  displayCardSet(cardSet: ICardSet, transactionId?: string): void {
    const perfMark = 'CardDisplayManager.displayCardSet';
    this.performanceMonitor.startMeasure(perfMark);
    try {
      this.loggingService.debug('카드셋 표시 시작', { 
        cardSetId: cardSet.id,
        transactionId: transactionId || 'none'
      });

      // 트랜잭션 ID가 제공되고 마지막 트랜잭션 ID와 같으면 중복 요청으로 간주하고 무시
      if (transactionId && this.lastTransactionId === transactionId) {
        this.loggingService.debug('동일한 트랜잭션 ID로 인한 중복 요청, 무시함', { 
          transactionId,
          cardSetId: cardSet.id
        });
        return;
      }
      
      // 동일한 카드셋 ID이고 카드 수가 같다면 중복 표시 방지
      if (this.currentCardSet && this.currentCardSet.id === cardSet.id && 
          this.currentCardSet.cards.length === cardSet.cards.length) {
        // 추가 검증: 카드 ID가 모두 동일한지 확인
        const existingCardIds = new Set(this.currentCardSet.cards.map(c => c.id));
        const allCardsIdentical = cardSet.cards.every(card => existingCardIds.has(card.id));
        
        if (allCardsIdentical) {
          this.loggingService.debug('동일한 카드셋이 이미 표시됨, 중복 표시 방지', {
            cardSetId: cardSet.id,
            cardCount: cardSet.cards.length
          });
          return;
        }
      }
      
      // 트랜잭션 ID 기록
      if (transactionId) {
        this.lastTransactionId = transactionId;
        
        // 일정 시간 후 트랜잭션 ID 초기화 (새로운 요청 허용)
        setTimeout(() => {
          if (this.lastTransactionId === transactionId) {
            this.lastTransactionId = null;
          }
        }, CardDisplayManager.TRANSACTION_TIMEOUT);
      }

      // 현재 카드셋 업데이트 전에 DOM에서 기존 카드 요소 제거
      this.clearExistingCardElements();

      // 현재 카드셋 업데이트 (카드셋 데이터는 그대로 사용)
      this.currentCardSet = cardSet;
      
      // 렌더링 설정 초기화
      this.currentRenderConfig = DEFAULT_CARD_RENDER_CONFIG;

      // 기존 카드 상태 모두 초기화
      this.loggingService.debug('카드 상태 초기화', { 
        existingCardCount: this.cards.size,
        newCardCount: cardSet.cards.length 
      });
      this.cards.clear();
      this.cardVisibility.clear();
      this.cardZIndices.clear();
      this.cardStyles.clear();
      this.selectedCardIds.clear();
      
      // 중복 등록 방지를 위한 Set 생성
      const processedCardIds = new Set<string>();

      // 카드셋 내 모든 카드 초기화
      cardSet.cards.forEach(card => {
        // 중복 카드 건너뛰기
        if (processedCardIds.has(card.id)) {
          this.loggingService.debug('중복 카드 건너뛰기', { cardId: card.id });
          return;
        }
        
        // 처리된 카드 목록에 추가
        processedCardIds.add(card.id);
        
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
   * DOM에서 기존 카드 요소 제거
   */
  private clearExistingCardElements(): void {
    try {
      // 카드 컨테이너 찾기
      const container = document.querySelector('.card-navigator-grid');
      if (!container) {
        this.loggingService.debug('카드 컨테이너를 찾을 수 없음');
        return;
      }
      
      // 기존 카드 요소 제거
      const existingCards = container.querySelectorAll('.card-navigator-card');
      if (existingCards.length > 0) {
        this.loggingService.debug('기존 카드 요소 제거', { count: existingCards.length });
        existingCards.forEach(element => element.remove());
      }
    } catch (error) {
      this.loggingService.error('기존 카드 요소 제거 실패', { error });
      this.errorHandler.handleError(error, '기존 카드 요소 제거 실패');
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
   * 카드 등록 (DOM에 카드 요소 추가)
   * @param cardId 카드 ID
   * @param element 카드 요소 (선택 사항)
   */
  registerCard(cardId: string, element?: HTMLElement): void {
    const perfMark = 'CardDisplayManager.registerCard';
    this.performanceMonitor.startMeasure(perfMark);
    try {
      this.loggingService.debug('카드 등록 시작', { cardId });
      
      // 중복 등록 방지 - 동일 ID로 이미 등록된 요소가 있는지 확인
      const existingCard = document.querySelector(`.card-navigator-card[data-card-id="${cardId}"][data-registered="true"]`);
      if (existingCard) {
        this.loggingService.debug('카드가 이미 등록되어 있습니다, 중복 등록 방지', { cardId });
        return;
      }
      
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
      
      // 카드 요소 찾기
      let cardElement = element;
      if (!cardElement) {
        cardElement = document.querySelector(`.card-navigator-card[data-card-id="${cardId}"]`) as HTMLElement;
        if (!cardElement) {
          this.loggingService.warn('등록할 카드 요소를 찾을 수 없음', { cardId });
          return;
        }
      }
      
      // 이미 등록된 카드인지 확인
      if (cardElement.getAttribute('data-registered') === 'true') {
        this.loggingService.debug('이미 등록된 카드, 중복 등록 방지', { cardId });
        return;
      }
      
      // 카드 등록 마킹
      cardElement.setAttribute('data-registered', 'true');
      
      // 카드 등록
      this.cards.set(cardId, card);
      
      // 카드 표시 상태 및 스타일 설정
      this.cardVisibility.set(cardId, true);
      this.cardZIndices.set(cardId, 1);
      
      // 스타일이 설정되지 않았으면 기본 스타일 적용
      if (!this.cardStyles.has(cardId)) {
        this.cardStyles.set(cardId, DEFAULT_CARD_STYLE);
      }
      
      // 이벤트 처리
      this.setupCardEvents(cardElement, cardId);
      
      this.analyticsService.trackEvent('card_registered', { cardId });
      this.loggingService.debug('카드 등록 완료', { cardId });
    } catch (error) {
      this.loggingService.error('카드 등록 실패', { error, cardId });
      this.errorHandler.handleError(error as Error, 'CardDisplayManager.registerCard');
    } finally {
      this.performanceMonitor.endMeasure(perfMark);
    }
  }
  
  /**
   * 카드 요소에 이벤트 설정
   * @param cardElement 카드 요소
   * @param cardId 카드 ID
   */
  private setupCardEvents(cardElement: HTMLElement, cardId: string): void {
    try {
      // 클릭 이벤트
      cardElement.addEventListener('click', (event) => {
        this.handleCardClick(event, cardId);
      });
      
      // 더블 클릭 이벤트
      cardElement.addEventListener('dblclick', (event) => {
        this.handleCardDoubleClick(event, cardId);
      });
      
      // 컨텍스트 메뉴 이벤트
      cardElement.addEventListener('contextmenu', (event) => {
        this.handleCardContextMenu(event, cardId);
      });
      
      // 드래그 이벤트
      cardElement.setAttribute('draggable', 'true');
      cardElement.addEventListener('dragstart', (event) => {
        this.handleCardDragStart(event, cardId);
      });
      
      // 드롭 이벤트
      cardElement.addEventListener('dragover', (event) => {
        this.handleCardDragOver(event, cardId);
      });
      
      cardElement.addEventListener('drop', (event) => {
        this.handleCardDrop(event, cardId);
      });
    } catch (error) {
      this.loggingService.error('카드 이벤트 설정 실패', { error, cardId });
      this.errorHandler.handleError(error, '카드 이벤트 설정 실패');
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

  /**
   * 카드 클릭 이벤트 처리
   * @param event 클릭 이벤트
   * @param cardId 카드 ID
   */
  private handleCardClick(event: MouseEvent, cardId: string): void {
    try {
      // 기존 포커스와 선택 이벤트 활용
      this.focusCard(cardId);
      this.selectCard(cardId);
      
      // 기본 동작 - 카드 활성화
      const card = this.cards.get(cardId);
      if (card && card.file) {
        // 옵시디언 API를 통해 파일 열기
        const { workspace } = (window as any).app;
        workspace.openLinkText(card.file.path, '', false);
      }
    } catch (error) {
      this.loggingService.error('카드 클릭 처리 실패', { error, cardId });
      this.errorHandler.handleError(error, '카드 클릭 처리 실패');
    }
  }
  
  /**
   * 카드 더블 클릭 이벤트 처리
   * @param event 더블 클릭 이벤트
   * @param cardId 카드 ID
   */
  private handleCardDoubleClick(event: MouseEvent, cardId: string): void {
    try {
      // 포커스 및 선택 상태로 변경
      this.focusCard(cardId);
      this.selectCard(cardId);
      
      // 기본 동작 - 카드 편집 모드로 전환
      const card = this.cards.get(cardId);
      if (card && card.file) {
        // 옵시디언 API를 통해 파일 편집 모드로 열기
        const { workspace } = (window as any).app;
        workspace.openLinkText(card.file.path, '', true);
      }
    } catch (error) {
      this.loggingService.error('카드 더블 클릭 처리 실패', { error, cardId });
      this.errorHandler.handleError(error, '카드 더블 클릭 처리 실패');
    }
  }
  
  /**
   * 카드 컨텍스트 메뉴 이벤트 처리
   * @param event 컨텍스트 메뉴 이벤트
   * @param cardId 카드 ID
   */
  private handleCardContextMenu(event: MouseEvent, cardId: string): void {
    try {
      event.preventDefault();
      // 포커스 처리
      this.focusCard(cardId);
      
      // 기본 동작 - 컨텍스트 메뉴 표시
      const card = this.cards.get(cardId);
      if (card) {
        this.showCardContextMenu(card, event);
      }
    } catch (error) {
      this.loggingService.error('카드 컨텍스트 메뉴 처리 실패', { error, cardId });
      this.errorHandler.handleError(error, '카드 컨텍스트 메뉴 처리 실패');
    }
  }
  
  /**
   * 카드 드래그 시작 이벤트 처리
   * @param event 드래그 시작 이벤트
   * @param cardId 카드 ID
   */
  private handleCardDragStart(event: DragEvent, cardId: string): void {
    try {
      const card = this.cards.get(cardId);
      if (!card || !event.dataTransfer) return;
      
      // 기존 드래그 이벤트 사용
      this.eventDispatcher.dispatch(new CardDraggedEvent(cardId));
      
      // 드래그 데이터 설정
      if (card.file) {
        event.dataTransfer.setData('text/plain', `[[${card.file.path}]]`);
        event.dataTransfer.effectAllowed = 'copy';
      }
    } catch (error) {
      this.loggingService.error('카드 드래그 시작 처리 실패', { error, cardId });
      this.errorHandler.handleError(error, '카드 드래그 시작 처리 실패');
    }
  }
  
  /**
   * 카드 드래그 오버 이벤트 처리
   * @param event 드래그 오버 이벤트
   * @param cardId 카드 ID
   */
  private handleCardDragOver(event: DragEvent, cardId: string): void {
    try {
      event.preventDefault();
      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = 'copy';
      }
    } catch (error) {
      this.loggingService.error('카드 드래그 오버 처리 실패', { error, cardId });
      this.errorHandler.handleError(error, '카드 드래그 오버 처리 실패');
    }
  }
  
  /**
   * 카드 드롭 이벤트 처리
   * @param event 드롭 이벤트
   * @param cardId 카드 ID
   */
  private handleCardDrop(event: DragEvent, cardId: string): void {
    try {
      event.preventDefault();
      const sourceData = event.dataTransfer?.getData('text/plain');
      if (!sourceData) return;
      
      const targetCard = this.cards.get(cardId);
      if (!targetCard || !targetCard.file) return;
      
      // 드롭 이벤트 발송
      this.eventDispatcher.dispatch(new CardDroppedEvent(cardId));
      
      // 소스가 링크 형식이면 카드 간 링크 생성
      if (sourceData.startsWith('[[') && sourceData.endsWith(']]')) {
        // 옵시디언 API를 통해 노트에 링크 추가
        const { vault } = (window as any).app;
        const file = targetCard.file;
        
        vault.read(file).then((content: string) => {
          const updatedContent = content + '\n' + sourceData;
          vault.modify(file, updatedContent);
        });
      }
    } catch (error) {
      this.loggingService.error('카드 드롭 처리 실패', { error, cardId });
      this.errorHandler.handleError(error, '카드 드롭 처리 실패');
    }
  }
  
  /**
   * 카드 컨텍스트 메뉴 표시
   * @param card 카드
   * @param event 이벤트
   */
  private showCardContextMenu(card: ICard, event: MouseEvent): void {
    try {
      // Obsidian Menu API 사용
      const menu = new Menu();
      
      menu.addItem((item) => {
        item
          .setTitle('링크 복사')
          .setIcon('link')
          .onClick(() => {
            if (card.file) {
              // 클립보드에 링크 복사
              navigator.clipboard.writeText(`[[${card.file.path}]]`);
            }
          });
      });
      
      menu.addItem((item) => {
        item
          .setTitle('내용 복사')
          .setIcon('copy')
          .onClick(() => {
            // 카드 내용 복사
            if (card.file) {
              const { vault } = (window as any).app;
              vault.read(card.file).then((content: string) => {
                navigator.clipboard.writeText(content);
              });
            }
          });
      });
      
      menu.showAtPosition({ x: event.clientX, y: event.clientY });
    } catch (error) {
      this.loggingService.error('카드 컨텍스트 메뉴 표시 실패', { error });
      this.errorHandler.handleError(error, '카드 컨텍스트 메뉴 표시 실패');
    }
  }
} 