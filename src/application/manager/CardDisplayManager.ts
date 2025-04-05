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
import { Menu, App } from 'obsidian';
import { IRenderManager } from '../../domain/managers/IRenderManager';
import { ICardService } from '../../domain/services/ICardService';

/**
 * 카드 표시 관리자 클래스
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
  private renderManager: IRenderManager;
  private app: App;

  private constructor(
    private readonly eventDispatcher: IEventDispatcher,
    private readonly errorHandler: IErrorHandler,
    private readonly loggingService: ILoggingService,
    private readonly performanceMonitor: IPerformanceMonitor,
    private readonly analyticsService: IAnalyticsService,
    private readonly cardInteractionService: ICardInteractionService
  ) {
    // 필요한 서비스 주입
    const container = Container.getInstance();
    this.app = container.resolve<App>('App');
    this.renderManager = container.resolve<IRenderManager>('IRenderManager');
    
    // 상태 초기화
    this.cards = new Map();
    this.cardVisibility = new Map();
    this.cardZIndices = new Map();
    this.cardStyles = new Map();
    this.selectedCardIds = new Set();
    
    // 기본 스타일 설정
    this.cardStyles.set('*', DEFAULT_CARD_STYLE);
    
    // 초기화 완료 로깅
    this.loggingService.debug('CardDisplayManager 인스턴스 생성됨');
  }

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
      // 트랜잭션 식별 및 로깅
      const currentTransactionId = transactionId || `transaction_${Date.now()}`;
      this.loggingService.debug('카드셋 표시 시작', { 
        cardSetId: cardSet.id,
        cardCount: cardSet.cards.length,
        transactionId: currentTransactionId
      });
      
      // 중복 트랜잭션 체크
      if (this.lastTransactionId === currentTransactionId) {
        this.loggingService.debug('중복 트랜잭션 감지, 무시', { transactionId: currentTransactionId });
        return;
      }
      this.lastTransactionId = currentTransactionId;
      
      // 카드셋 컨테이너 찾기
      const container = this.getCardSetContainer(cardSet.id);
      if (!container) {
        this.loggingService.error('카드셋 컨테이너를 찾을 수 없음', { cardSetId: cardSet.id });
        return;
      }
      
      // 현재 카드셋 업데이트
      this.currentCardSet = cardSet;
      
      // 1. 이전에 중복 생성된 카드 요소 정리
      this.cleanupDuplicateCardElements(container);
      
      // 2. 현재 표시된 카드 ID 추적
      const displayedCardIds = new Set<string>();
      const existingCardElements = container.querySelectorAll('.card-navigator-card');
      existingCardElements.forEach((element: HTMLElement) => {
        const cardId = element.getAttribute('data-card-id');
        if (cardId) displayedCardIds.add(cardId);
      });
      
      // 3. 새 카드셋의 카드 ID 세트
      const newCardIds = new Set(cardSet.cards.map(card => card.id));
      
      // 4. 제거할 카드 요소 찾기 (더 이상 카드셋에 없는 카드)
      const cardsToRemove = Array.from(existingCardElements).filter((element: HTMLElement) => {
        const cardId = element.getAttribute('data-card-id');
        return cardId && !newCardIds.has(cardId);
      });
      
      // 5. 추가할 카드 찾기 (카드셋에는 있지만 화면에 표시되지 않은 카드)
      const cardsToAdd = cardSet.cards.filter(card => !displayedCardIds.has(card.id));
      
      // 6. 제거할 카드 요소 제거
      cardsToRemove.forEach((element: HTMLElement) => {
        this.loggingService.debug('카드 요소 제거', { 
          cardId: element.getAttribute('data-card-id'),
          transactionId: currentTransactionId
        });
        element.remove();
      });
      
      // 7. 새 카드 요소 추가
      const fragment = document.createDocumentFragment();
      cardsToAdd.forEach(card => {
        this.loggingService.debug('새 카드 요소 추가', { 
          cardId: card.id,
          transactionId: currentTransactionId
        });
        const cardElement = this.createCardElement(card);
        fragment.appendChild(cardElement);
        
        // 내부 맵에 카드 추가
        this.cards.set(card.id, card);
      });
      
      // 모든 카드 요소를 한 번에 추가
      container.appendChild(fragment);
      
      // 8. 모든 카드 요소 상태 업데이트 (활성, 포커스 등)
      this.updateCardElements(cardSet);
      
      // 9. 렌더링 요청: 모든 카드에 대해 비동기 렌더링 요청
      const renderPromises: Promise<string>[] = [];
      
      cardSet.cards.forEach(card => {
        const promise = this.renderManager.requestRender(card.id, card)
          .catch((error: Error) => {
            this.loggingService.error('카드 렌더링 요청 실패', { 
              cardId: card.id, 
              error: error.message,
              transactionId: currentTransactionId
            });
            return `<div class="content">렌더링 실패: ${error.message}</div>`;
          });
        renderPromises.push(promise);
      });
      
      // 모든 렌더링 요청이 완료될 때까지 대기하지 않고 진행
      Promise.all(renderPromises).then(() => {
        this.loggingService.debug('모든 카드 렌더링 요청 완료', {
          cardCount: cardSet.cards.length,
          transactionId: currentTransactionId
        });
      });
      
      this.performanceMonitor.endMeasure(perfMark);
    } catch (error) {
      this.loggingService.error('카드셋 표시 중 오류 발생', { 
        cardSetId: cardSet.id, 
        error,
        transactionId: transactionId || 'none'
      });
      this.performanceMonitor.endMeasure(perfMark);
    }
  }
  
  /**
   * 카드 요소 생성
   * @param card 카드
   * @returns 카드 요소
   */
  private createCardElement(card: ICard): HTMLElement {
    // 카드 요소 생성
    const cardElement = document.createElement('div');
    cardElement.className = 'card-navigator-card';
    cardElement.setAttribute('data-card-id', card.id);
    cardElement.setAttribute('draggable', 'true');
    
    // 기본 카드 구조 생성 (헤더, 바디, 푸터)
    const headerElement = document.createElement('div');
    headerElement.className = 'card-header';
    
    const bodyElement = document.createElement('div');
    bodyElement.className = 'card-body';
    
    // 카드 본문에 로딩 상태 표시
    const loadingElement = document.createElement('div');
    loadingElement.className = 'card-loading';
    loadingElement.innerHTML = '<span class="loading-spinner"></span><span>카드 로딩 중...</span>';
    bodyElement.appendChild(loadingElement);
    
    const footerElement = document.createElement('div');
    footerElement.className = 'card-footer';
    
    // 구조 조립
    cardElement.appendChild(headerElement);
    cardElement.appendChild(bodyElement);
    cardElement.appendChild(footerElement);
    
    // 헤더 콘텐츠 설정
    if (card.file) {
      // 파일명 표시
      const fileNameElement = document.createElement('div');
      fileNameElement.className = 'file-name';
      fileNameElement.textContent = card.file.basename;
      headerElement.appendChild(fileNameElement);
      
      // 태그 표시
      if (card.metadata?.tags && card.metadata.tags.length > 0) {
        const tagsElement = document.createElement('div');
        tagsElement.className = 'tags';
        
        card.metadata.tags.forEach((tag: string) => {
          const tagElement = document.createElement('span');
          tagElement.className = 'tag';
          tagElement.textContent = tag;
          tagsElement.appendChild(tagElement);
        });
        
        headerElement.appendChild(tagsElement);
      }
    }
    
    // 이벤트 리스너 설정
    this.setupCardEventListeners(cardElement, card);
    
    return cardElement;
  }
  
  /**
   * 중복 카드 요소 정리
   * @param container 카드셋 컨테이너
   */
  private cleanupDuplicateCardElements(container: HTMLElement): void {
    // 카드 ID별로 요소 그룹화
    const cardElementsMap = new Map<string, HTMLElement[]>();
    
    container.querySelectorAll('.card-navigator-card').forEach((element: HTMLElement) => {
      const cardId = element.getAttribute('data-card-id');
      if (!cardId) return;
      
      if (!cardElementsMap.has(cardId)) {
        cardElementsMap.set(cardId, []);
      }
      cardElementsMap.get(cardId)?.push(element);
    });
    
    // 중복 요소 제거 (각 카드 ID당 첫 번째 요소만 유지)
    let removedCount = 0;
    
    cardElementsMap.forEach((elements, cardId) => {
      if (elements.length > 1) {
        // 첫 번째 요소를 제외한 나머지 제거
        for (let i = 1; i < elements.length; i++) {
          elements[i].remove();
          removedCount++;
        }
        
        this.loggingService.debug('중복 카드 요소 제거', { 
          cardId, 
          duplicateCount: elements.length - 1,
          remaining: 1
        });
      }
    });
    
    if (removedCount > 0) {
      this.loggingService.info(`${removedCount}개의 중복 카드 요소 제거됨`);
    }
  }

  /**
   * 카드 상태 업데이트 (활성, 포커스 등)
   * @param cardSet 카드셋
   */
  private updateCardElements(cardSet: ICardSet): void {
    const container = this.getCardSetContainer(cardSet.id);
    if (!container) return;
    
    const activeFileId = this.getActiveFileId();
    const focusedCardId = this.focusedCardId;
    
    // 모든 카드 요소에 대해 상태 업데이트
    container.querySelectorAll('.card-navigator-card').forEach((element: HTMLElement) => {
      const cardId = element.getAttribute('data-card-id');
      if (!cardId) return;
      
      // 활성 상태 업데이트
      if (cardId === activeFileId) {
        element.classList.add('active');
      } else {
        element.classList.remove('active');
      }
      
      // 포커스 상태 업데이트
      if (cardId === focusedCardId) {
        element.classList.add('focused');
      } else {
        element.classList.remove('focused');
      }
    });
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
      
      // DOM 요소 스타일 업데이트
      const cardElement = document.querySelector(`.card-navigator-card[data-card-id="${cardId}"]`);
      if (cardElement) {
        this.applyCardStyle(cardElement as HTMLElement, style);
      }

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
   * 카드 요소에 스타일 적용
   * @param cardElement 카드 요소
   * @param style 스타일
   */
  private applyCardStyle(cardElement: HTMLElement, style: ICardStyle): void {
    try {
      // 카드 스타일 적용
      cardElement.style.setProperty('--card-bg', style.card.backgroundColor);
      cardElement.style.setProperty('--card-font-size', style.card.fontSize);
      cardElement.style.setProperty('--card-border-color', style.card.borderColor);
      cardElement.style.setProperty('--card-border-width', style.card.borderWidth);
      
      // 헤더 스타일 적용
      cardElement.style.setProperty('--header-bg', style.header.backgroundColor);
      cardElement.style.setProperty('--header-font-size', style.header.fontSize);
      cardElement.style.setProperty('--header-border-color', style.header.borderColor);
      cardElement.style.setProperty('--header-border-width', style.header.borderWidth);
      
      // 본문 스타일 적용
      cardElement.style.setProperty('--body-bg', style.body.backgroundColor);
      cardElement.style.setProperty('--body-font-size', style.body.fontSize);
      cardElement.style.setProperty('--body-border-color', style.body.borderColor);
      cardElement.style.setProperty('--body-border-width', style.body.borderWidth);
      
      // 푸터 스타일 적용
      cardElement.style.setProperty('--footer-bg', style.footer.backgroundColor);
      cardElement.style.setProperty('--footer-font-size', style.footer.fontSize);
      cardElement.style.setProperty('--footer-border-color', style.footer.borderColor);
      cardElement.style.setProperty('--footer-border-width', style.footer.borderWidth);
      
      // 카드 상태 표시
      const isActive = this.activeCardId === cardElement.getAttribute('data-card-id');
      const isFocused = this.focusedCardId === cardElement.getAttribute('data-card-id');
      const isRegistered = cardElement.getAttribute('data-registered') === 'true';
      
      // 클래스 초기화
      cardElement.classList.remove('active-card', 'focused-card', 'registered-card', 'loading-card');
      
      // 상태에 따른 클래스 추가
      if (isActive) cardElement.classList.add('active-card');
      if (isFocused) cardElement.classList.add('focused-card');
      if (isRegistered) cardElement.classList.add('registered-card');
      
      // 로딩 상태 확인
      if (cardElement.querySelector('.card-loading')) {
        cardElement.classList.add('loading-card');
      }
      
      // 오류 상태 확인
      if (cardElement.querySelector('.card-error')) {
        cardElement.classList.add('error-card');
      }
    } catch (error) {
      this.loggingService.error('카드 스타일 적용 실패', { 
        cardId: cardElement.getAttribute('data-card-id'), 
        error 
      });
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
      
      // 1. 요소 찾기 - 전달된 요소가 없으면 DOM에서 찾음
      let cardElement = element;
      if (!cardElement) {
        cardElement = document.querySelector(`.card-navigator-card[data-card-id="${cardId}"]`) as HTMLElement;
      }
      
      // 2. 이미 메모리에 등록된 카드인지 확인
      const isMemoryRegistered = this.cards.has(cardId);
      
      // 3. DOM에 요소가 있고 이미 등록된 경우 (data-registered="true")
      if (cardElement) {
        const isDomRegistered = cardElement.getAttribute('data-registered') === 'true';
        
        // 이미 메모리와 DOM 모두에 등록된 경우 - 중복 등록 방지
        if (isMemoryRegistered && isDomRegistered) {
          this.loggingService.debug('카드가 이미 등록되어 있습니다, 중복 등록 방지', { cardId });
          return;
        }
        
        // 메모리에는 등록되어 있지만 DOM에는 등록되지 않은 경우 - DOM만 등록 처리
        if (isMemoryRegistered && !isDomRegistered) {
          cardElement.setAttribute('data-registered', 'true');
          
          // 카드 객체 가져오기 및 타입 체크
          const card = this.cards.get(cardId);
          if (card) {
            // 카드가 존재하면 이벤트 리스너 설정
            this.setupCardEventListeners(cardElement, card);
            
            // "카드 로딩 중..." 메시지를 제거하기 위해 로딩 중 요소 확인 및 제거
            const loadingDiv = cardElement.querySelector('.card-loading');
            if (loadingDiv) {
              loadingDiv.remove();
            }
            
            this.loggingService.debug('기존 카드에 DOM 요소 연결 완료', { cardId });
          } else {
            this.loggingService.warn('카드 객체를 찾을 수 없음', { cardId });
          }
          return;
        }
      }
      
      // 4. 카드셋이 없는 경우 확인
      if (!this.currentCardSet) {
        this.loggingService.warn('카드셋이 로드되지 않았습니다. 카드 등록을 건너뜁니다.', { 
          cardId,
          hasCurrentCardSet: !!this.currentCardSet,
          cardCount: this.cards.size
        });
        return;
      }
      
      // 5. 카드셋에서 카드 찾기
      let card = this.currentCardSet.cards.find(c => c.id === cardId);
      if (!card) {
        this.loggingService.warn('카드셋에서 카드를 찾을 수 없습니다.', { 
          cardId,
          cardSetId: this.currentCardSet.id,
          cardSetCardCount: this.currentCardSet.cards.length
        });
        return;
      }
      
      // 6. DOM 요소가 없거나 새로 생성해야 하는 경우
      if (!cardElement) {
        this.loggingService.debug('카드 요소를 찾을 수 없어 새로 등록할 수 없음', { cardId });
        
        // 나중에 요소가 생성되면 등록할 수 있도록 메모리에만 등록
        this.cards.set(cardId, card);
        this.cardVisibility.set(cardId, true);
        this.cardZIndices.set(cardId, 1);
        
        // 스타일이 설정되지 않았으면 기본 스타일 적용
        if (!this.cardStyles.has(cardId)) {
          this.cardStyles.set(cardId, DEFAULT_CARD_STYLE);
        }
        
        return;
      }
      
      // 7. 요소와 카드 모두 있는 경우 정상 등록
      cardElement.setAttribute('data-registered', 'true');
      this.cards.set(cardId, card);
      this.cardVisibility.set(cardId, true);
      this.cardZIndices.set(cardId, 1);
      
      // 스타일이 설정되지 않았으면 기본 스타일 적용
      if (!this.cardStyles.has(cardId)) {
        this.cardStyles.set(cardId, DEFAULT_CARD_STYLE);
      }
      
      // "카드 로딩 중..." 메시지를 제거하기 위해 로딩 중 요소 확인 및 제거
      const loadingDiv = cardElement.querySelector('.card-loading');
      if (loadingDiv) {
        loadingDiv.remove();
      }
      
      // 이벤트 처리
      this.setupCardEventListeners(cardElement, card);
      
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
   * 카드 이벤트 리스너 설정
   * @param cardElement 카드 요소
   * @param card 카드
   */
  private setupCardEventListeners(cardElement: HTMLElement, card: ICard): void {
    try {
      // 클릭 이벤트 (카드 선택)
      cardElement.addEventListener('click', (event) => {
        event.preventDefault();
        // 포커스 및 선택 처리
        this.focusCard(card.id);
        this.selectCard(card.id);
        
        // 카드에 해당하는 파일 열기
        if (card.file) {
          this.app.workspace.openLinkText(card.file.path, '', false);
        }
      });
      
      // 더블 클릭 이벤트 (카드 편집 모드로 열기)
      cardElement.addEventListener('dblclick', (event) => {
        event.preventDefault();
        // 포커스 및 선택 처리
        this.focusCard(card.id);
        this.selectCard(card.id);
        
        // 카드에 해당하는 파일을 편집 모드로 열기
        if (card.file) {
          this.app.workspace.openLinkText(card.file.path, '', true);
        }
      });
      
      // 컨텍스트 메뉴 이벤트 (우클릭 메뉴)
      cardElement.addEventListener('contextmenu', (event) => {
        event.preventDefault();
        
        // 포커스 처리
        this.focusCard(card.id);
        
        // 컨텍스트 메뉴 표시
        if (card.file) {
          const menu = new Menu();
          
          menu.addItem((item) => {
            item
              .setTitle('링크 복사')
              .setIcon('link')
              .onClick(() => {
                // 클립보드에 링크 복사
                navigator.clipboard.writeText(`[[${card.file.path}]]`);
              });
          });
          
          menu.addItem((item) => {
            item
              .setTitle('내용 복사')
              .setIcon('copy')
              .onClick(() => {
                // 카드 내용 복사
                const { vault } = this.app;
                vault.read(card.file).then((content: string) => {
                  navigator.clipboard.writeText(content);
                });
              });
          });
          
          menu.showAtPosition({ x: event.clientX, y: event.clientY });
        }
      });
      
      // 드래그 이벤트
      cardElement.addEventListener('dragstart', (event) => {
        // 드래그 데이터 설정
        if (event.dataTransfer && card.file) {
          event.dataTransfer.setData('text/plain', `[[${card.file.path}]]`);
          event.dataTransfer.effectAllowed = 'copy';
          this.eventDispatcher.dispatch(new CardDraggedEvent(card.id));
        }
      });
      
      cardElement.addEventListener('dragover', (event) => {
        event.preventDefault();
        if (event.dataTransfer) {
          event.dataTransfer.dropEffect = 'copy';
        }
      });
      
      cardElement.addEventListener('drop', (event) => {
        event.preventDefault();
        const sourceData = event.dataTransfer?.getData('text/plain');
        if (!sourceData || !card.file) return;
        
        // 드롭 이벤트 발송
        this.eventDispatcher.dispatch(new CardDroppedEvent(card.id));
        
        // 소스가 링크 형식이면 카드 간 링크 생성
        if (sourceData.startsWith('[[') && sourceData.endsWith(']]')) {
          // 옵시디언 API를 통해 노트에 링크 추가
          const { vault } = this.app;
          
          vault.read(card.file).then((content: string) => {
            const updatedContent = content + '\n' + sourceData;
            vault.modify(card.file, updatedContent);
          });
        }
      });
      
      cardElement.addEventListener('dragend', () => {
        // 드래그 상태 초기화
      });
      
      // 카드 요소에 tabindex 속성 추가 (키보드 탐색 지원)
      cardElement.setAttribute('tabindex', '0');
      
      // 포커스 이벤트
      cardElement.addEventListener('focus', () => {
        this.focusedCardId = card.id;
      });
      
      cardElement.addEventListener('blur', () => {
        if (this.focusedCardId === card.id) {
          this.focusedCardId = null;
        }
      });
      
      // 키보드 이벤트 (방향키로 카드 이동)
      cardElement.addEventListener('keydown', (event) => {
        // 기본 방향키 내비게이션 처리
        if (event.key === 'Enter') {
          // Enter 키: 카드 열기
          if (card.file) {
            this.app.workspace.openLinkText(card.file.path, '', false);
          }
        }
      });
      
    } catch (error) {
      this.loggingService.error('카드 이벤트 리스너 설정 실패', { 
        cardId: card.id, 
        error 
      });
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
   * 카드셋 컨테이너 요소 가져오기
   * @param cardSetId 카드셋 ID
   * @returns 컨테이너 요소
   */
  private getCardSetContainer(cardSetId: string): HTMLElement | null {
    const container = document.querySelector(`.card-navigator-grid[data-card-set-id="${cardSetId}"]`);
    if (!container) {
      // 기본 카드 그리드 컨테이너 반환
      return document.querySelector('.card-navigator-grid');
    }
    return container as HTMLElement;
  }

  /**
   * 활성 파일 ID 가져오기
   * @returns 활성 파일 ID
   */
  private getActiveFileId(): string | null {
    const activeFile = this.app.workspace.getActiveFile();
    return activeFile ? activeFile.path : null;
  }
} 