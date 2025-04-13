import { ICardStyle } from '@/domain/models/Card';
import { ILayoutConfig } from '@/domain/models/Layout';
import { ICardDisplayManager, ICardDisplayState, IInteractionStyle } from '@/domain/managers/ICardDisplayManager';
import { IErrorHandler } from '@/domain/infrastructure/IErrorHandler';
import { ILoggingService } from '@/domain/infrastructure/ILoggingService';
import { IPerformanceMonitor } from '@/domain/infrastructure/IPerformanceMonitor';
import { IAnalyticsService } from '@/domain/infrastructure/IAnalyticsService';
import { Container } from '@/infrastructure/di/Container';
import { ICard } from '@/domain/models/Card';
import { IEventDispatcher } from '@/domain/infrastructure/IEventDispatcher';
import { CardStyleUpdatedEvent } from '@/domain/events/CardEvents';
import { IPreset } from '@/domain/models/Preset';
import { PresetManager } from '@/application/manager/PresetManager';

/**
 * 기본 카드 스타일
 */
const DEFAULT_CARD_STYLE: ICardStyle = {
  classes: ['card'],
  backgroundColor: 'var(--background-primary)',
  fontSize: 'var(--font-size-normal)',
  color: 'var(--text-normal)',
  border: {
    width: '1px',
    color: 'var(--background-modifier-border)',
    style: 'solid',
    radius: '8px'
  },
  padding: 'var(--size-4-2)',
  boxShadow: 'var(--shadow-s)',
  lineHeight: 'var(--line-height-normal)',
  fontFamily: 'var(--font-family)'
};

/**
 * 카드 표시 관리자 클래스
 * - 카드 DOM 요소 관리
 * - 카드 이벤트 리스너 관리
 * - 카드 스타일 관리
 * - 카드 상태 관리
 */
export class CardDisplayManager implements ICardDisplayManager {
  private static instance: CardDisplayManager;
  private readonly cardElements: Map<string, HTMLElement> = new Map();
  private readonly presetManager: PresetManager;
  private eventListeners: Map<string, Map<string, EventListener[]>> = new Map();
  private cardStates: Map<string, ICardDisplayState> = new Map();
  private initialized: boolean = false;

  private constructor(
    private readonly errorHandler: IErrorHandler,
    private readonly loggingService: ILoggingService,
    private readonly performanceMonitor: IPerformanceMonitor,
    private readonly analyticsService: IAnalyticsService,
    private readonly eventDispatcher: IEventDispatcher
  ) {}

  static getInstance(): CardDisplayManager {
    if (!CardDisplayManager.instance) {
      const container = Container.getInstance();
      CardDisplayManager.instance = new CardDisplayManager(
        container.resolve('IErrorHandler'),
        container.resolve('ILoggingService'),
        container.resolve('IPerformanceMonitor'),
        container.resolve('IAnalyticsService'),
        container.resolve('IEventDispatcher')
      );
    }
    return CardDisplayManager.instance;
  }

  initialize(): void {
    if (this.initialized) return;
    this.initialized = true;
    this.loggingService.debug('카드 표시 관리자 초기화 완료');
  }

  cleanup(): void {
    const timer = this.performanceMonitor.startTimer('CardDisplayManager.cleanup');
    try {
      // 이벤트 리스너 제거
      this.eventListeners.forEach((listeners, cardId) => {
        const element = this.cardElements.get(cardId);
        if (element) {
          listeners.forEach((listenerArray, type) => {
            listenerArray.forEach(listener => {
              element.removeEventListener(type, listener);
            });
          });
        }
      });

      this.cardElements.clear();
      this.eventListeners.clear();
      this.cardStates.clear();
      this.initialized = false;

      this.loggingService.debug('카드 표시 관리자 정리 완료');
    } catch (error) {
      this.loggingService.error('카드 표시 관리자 정리 실패', { error });
      this.errorHandler.handleError(error as Error, 'CardDisplayManager.cleanup');
    } finally {
      timer.stop();
    }
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  registerCardElement(cardId: string, element: HTMLElement): void {
    const timer = this.performanceMonitor.startTimer('CardDisplayManager.registerCardElement');
    try {
      this.cardElements.set(cardId, element);
      this.eventListeners.set(cardId, new Map());
      
      // 기본 상태 설정
      this.cardStates.set(cardId, {
        element,
        isVisible: true,
        zIndex: 0,
        isActive: false,
        isFocused: false,
        isSelected: false
      });

      this.loggingService.debug('카드 요소 등록 완료', { cardId });
    } catch (error) {
      this.loggingService.error('카드 요소 등록 실패', { error, cardId });
      this.errorHandler.handleError(error as Error, 'CardDisplayManager.registerCardElement');
    } finally {
      timer.stop();
    }
  }

  unregisterCardElement(cardId: string): void {
    const timer = this.performanceMonitor.startTimer('CardDisplayManager.unregisterCardElement');
    try {
      const element = this.cardElements.get(cardId);
      const listeners = this.eventListeners.get(cardId);

      if (element && listeners) {
        // 이벤트 리스너 제거
        listeners.forEach((listenerArray, type) => {
          listenerArray.forEach(listener => {
            element.removeEventListener(type, listener);
          });
        });
      }

      this.cardElements.delete(cardId);
      this.eventListeners.delete(cardId);
      this.cardStates.delete(cardId);

      this.loggingService.debug('카드 요소 등록 해제 완료', { cardId });
    } catch (error) {
      this.loggingService.error('카드 요소 등록 해제 실패', { error, cardId });
      this.errorHandler.handleError(error as Error, 'CardDisplayManager.unregisterCardElement');
    } finally {
      timer.stop();
    }
  }

  getCardElement(cardId: string): HTMLElement | null {
    return this.cardElements.get(cardId) || null;
  }

  addCardEventListener(cardId: string, type: string, listener: EventListener): void {
    const element = this.cardElements.get(cardId);
    if (!element) return;

    const cardListeners = this.eventListeners.get(cardId) || new Map();
    const typeListeners = cardListeners.get(type) || [];
    
    typeListeners.push(listener);
    cardListeners.set(type, typeListeners);
    this.eventListeners.set(cardId, cardListeners);
    
    element.addEventListener(type, listener);
  }

  removeCardEventListener(cardId: string, type: string, listener: EventListener): void {
    const element = this.cardElements.get(cardId);
    const cardListeners = this.eventListeners.get(cardId);
    if (!element || !cardListeners) return;

    const typeListeners = cardListeners.get(type);
    if (!typeListeners) return;

    const index = typeListeners.indexOf(listener);
    if (index !== -1) {
      typeListeners.splice(index, 1);
      element.removeEventListener(type, listener);
    }
  }

  applyCardStyle(cardId: string, style: ICardStyle): void {
    const element = this.cardElements.get(cardId);
    if (!element) return;

    Object.entries(style).forEach(([property, value]) => {
      element.style.setProperty(property, value);
    });
  }

  applyInteractionStyle(cardId: string, style: IInteractionStyle): void {
    const element = this.cardElements.get(cardId);
    if (!element) return;

    const state = this.cardStates.get(cardId);
    if (!state) return;

    if (state.isSelected) {
      element.style.transform = style.selectedEffect;
    } else if (state.isFocused) {
      element.style.transform = style.focusEffect;
    } else {
      element.style.transform = 'none';
    }

    element.style.transition = `all ${style.transitionDuration}`;
  }

  applyLayoutStyle(cardId: string, layout: ILayoutConfig): void {
    const element = this.cardElements.get(cardId);
    if (!element) return;

    element.style.width = `${layout.cardThresholdWidth}px`;
    if (layout.fixedCardHeight) {
      element.style.height = `${layout.cardThresholdHeight}px`;
    }
  }

  getCardState(cardId: string): ICardDisplayState | null {
    return this.cardStates.get(cardId) || null;
  }

  updateCardState(cardId: string, state: Partial<ICardDisplayState>): void {
    const currentState = this.cardStates.get(cardId);
    if (!currentState) return;

    this.cardStates.set(cardId, {
      ...currentState,
      ...state
    });
  }

  /**
   * 컨테이너의 크기를 가져옵니다.
   * @returns 컨테이너의 너비와 높이
   */
  getContainerDimensions(): { width: number; height: number } {
    const timer = this.performanceMonitor.startTimer('getContainerDimensions');
    try {
      this.loggingService.debug('컨테이너 크기 계산 시작');
      
      const container = document.querySelector('.card-navigator-container');
      if (!container) {
        this.loggingService.warn('컨테이너를 찾을 수 없습니다.');
        return { width: 0, height: 0 };
      }
      
      const rect = container.getBoundingClientRect();
      const dimensions = {
        width: rect.width,
        height: rect.height
      };
      
      this.loggingService.debug('컨테이너 크기 계산 완료', { dimensions });
      return dimensions;
    } catch (error) {
      this.loggingService.error('컨테이너 크기 계산 실패', { error });
      this.errorHandler.handleError(error as Error, 'CardDisplayManager.getContainerDimensions');
      return { width: 0, height: 0 };
    } finally {
      timer.stop();
    }
  }

  /**
   * 카드 스타일을 가져옵니다.
   * @returns 카드 스타일
   */
  getCardStyle(): ICardStyle {
    const timer = this.performanceMonitor.startTimer('getCardStyle');
    try {
      this.loggingService.debug('카드 스타일 가져오기 시작');
      
      const style: ICardStyle = {
        classes: ['card'],
        backgroundColor: 'var(--background-primary)',
        fontSize: 'var(--font-size-normal)',
        color: 'var(--text-normal)',
        border: {
          width: '1px',
          color: 'var(--background-modifier-border)',
          style: 'solid',
          radius: '8px'
        },
        padding: 'var(--size-4-2)',
        boxShadow: 'var(--shadow-s)',
        lineHeight: 'var(--line-height-normal)',
        fontFamily: 'var(--font-family)'
      };
      
      this.loggingService.debug('카드 스타일 가져오기 완료', { style });
      return style;
    } catch (error) {
      this.loggingService.error('카드 스타일 가져오기 실패', { error });
      this.errorHandler.handleError(error as Error, 'CardDisplayManager.getCardStyle');
      return {
        classes: [],
        backgroundColor: '',
        fontSize: '',
        color: '',
        border: {
          width: '',
          color: '',
          style: '',
          radius: ''
        },
        padding: '',
        boxShadow: '',
        lineHeight: '',
        fontFamily: ''
      };
    } finally {
      timer.stop();
    }
  }

  /**
   * 카드 스타일 업데이트
   * @param card 카드
   * @param style 스타일 타입
   */
  updateCardStyle(card: ICard, style: 'normal' | 'active' | 'focused'): void {
    const timer = this.performanceMonitor.startTimer('CardDisplayManager.updateCardStyle');
    try {
      this.loggingService.debug('카드 스타일 업데이트 시작', { 
        cardId: card.id,
        style 
      });

      // 카드 요소 찾기
      const cardElement = document.querySelector(`.card-navigator-card[data-card-id="${card.id}"]`);
      if (!cardElement) {
        this.loggingService.warn('카드 요소를 찾을 수 없음', { cardId: card.id });
        return;
      }

      // 기존 스타일 클래스 제거
      cardElement.classList.remove('active-card', 'focused-card');

      // 새로운 스타일 클래스 추가
      switch (style) {
        case 'active':
          cardElement.classList.add('active-card');
          break;
        case 'focused':
          cardElement.classList.add('focused-card');
          break;
        case 'normal':
          // 기본 스타일은 클래스가 없음
          break;
      }

      // 카드 섹션(헤더, 바디, 푸터) 스타일 업데이트
      const sections = cardElement.querySelectorAll('.card-header, .card-body, .card-footer');
      sections.forEach(section => {
        // 기존 스타일 클래스 제거
        section.classList.remove('active', 'focused');

        // 새로운 스타일 클래스 추가
        if (style !== 'normal') {
          section.classList.add(style);
        }
      });

      // 이벤트 발송
      this.eventDispatcher.dispatch(new CardStyleUpdatedEvent(card.id, style));

      this.analyticsService.trackEvent('card_style_updated', {
        cardId: card.id,
        style
      });

      this.loggingService.info('카드 스타일 업데이트 완료', { 
        cardId: card.id,
        style 
      });
    } catch (error) {
      this.loggingService.error('카드 스타일 업데이트 실패', { error });
      this.errorHandler.handleError(error as Error, 'CardDisplayManager.updateCardStyle');
    } finally {
      timer.stop();
    }
  }

  /**
   * 카드에 프리셋 스타일을 적용합니다.
   * @param cardId 카드 ID
   * @param presets 적용할 프리셋 배열
   */
  applyPresetStyles(cardId: string, presets: IPreset[]): void {
    const element = this.cardElements.get(cardId);
    if (!element) return;

    // 프리셋 스타일 병합
    const mergedStyle = this.mergePresetStyles(presets);
    
    // 동적으로 스타일 적용
    Object.assign(element.style, this.convertCardStyleToCSS(mergedStyle));
  }

  /**
   * 프리셋 스타일을 병합합니다.
   * @param presets 프리셋 배열
   * @returns 병합된 카드 스타일
   */
  private mergePresetStyles(presets: IPreset[]): ICardStyle {
    return presets.reduce((merged, preset) => {
      const presetStyle = preset.config.cardStateStyle.normal;
      return {
        ...merged,
        backgroundColor: presetStyle.backgroundColor || merged.backgroundColor,
        fontSize: presetStyle.fontSize || merged.fontSize,
        color: presetStyle.color || merged.color,
        border: {
          ...merged.border,
          ...presetStyle.border
        },
        padding: presetStyle.padding || merged.padding,
        boxShadow: presetStyle.boxShadow || merged.boxShadow,
        lineHeight: presetStyle.lineHeight || merged.lineHeight,
        fontFamily: presetStyle.fontFamily || merged.fontFamily
      };
    }, DEFAULT_CARD_STYLE);
  }

  /**
   * 카드 스타일을 CSS 스타일로 변환합니다.
   * @param style 카드 스타일
   * @returns CSS 스타일
   */
  private convertCardStyleToCSS(style: ICardStyle): Partial<CSSStyleDeclaration> {
    return {
      backgroundColor: style.backgroundColor,
      fontSize: style.fontSize,
      color: style.color,
      border: `${style.border.width} ${style.border.style} ${style.border.color}`,
      borderRadius: style.border.radius,
      padding: style.padding,
      boxShadow: style.boxShadow,
      lineHeight: style.lineHeight,
      fontFamily: style.fontFamily
    };
  }
} 