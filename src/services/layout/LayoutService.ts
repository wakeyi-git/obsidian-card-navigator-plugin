import { App } from 'obsidian';
import { LayoutManager } from '../../managers/layout/LayoutManager';
import { LayoutOptions, LayoutType, LayoutDirection } from '../../core/types/layout.types';
import { CardPosition } from '../../core/models/CardPosition';
import { ErrorHandler } from '../../utils/error/ErrorHandler';
import { Log } from '../../utils/log/Log';
import { ILayoutManager } from '../../core/interfaces/manager/ILayoutManager';
import { CardPosition as ICardPosition } from '../../core/types/card.types';
import { LayoutEvent, LayoutEventData, LayoutSettings } from '../../core/types/layout.types';
import { LAYOUT_CLASS_NAMES } from '../../styles/components/layout.styles';
import { ICardContainerManager } from '../../core/interfaces/manager/ICardContainerManager';
import { ErrorCode } from '../../core/constants/error.constants';

/**
 * LayoutService 클래스는 카드 레이아웃 관련 기능을 제공합니다.
 */
export class LayoutService implements ILayoutManager {
  private layoutManager: ILayoutManager;
  private container: HTMLElement | null = null;
  private _options: LayoutOptions;
  private isInitialized: boolean = false;
  private cardContainer: ICardContainerManager | null = null;
  private eventListeners: Map<string, EventListener[]> = new Map();

  /**
   * LayoutService 생성자
   * @param layoutManager 레이아웃 매니저 인스턴스
   */
  constructor(layoutManager: ILayoutManager) {
    this.layoutManager = layoutManager;
    this._options = this.getDefaultOptions();
    
    Log.debug('LayoutService', '레이아웃 서비스 초기화 완료');
  }

  /**
   * 레이아웃 옵션
   */
  get options(): LayoutOptions {
    return this._options;
  }

  /**
   * 레이아웃 타입
   */
  get layoutType(): LayoutType {
    return this.layoutManager.layoutType;
  }

  /**
   * 컨테이너 요소
   */
  get containerElement(): HTMLElement | null {
    return this.container;
  }

  /**
   * 기본 레이아웃 옵션을 가져옵니다.
   * @returns 기본 레이아웃 옵션
   */
  private getDefaultOptions(): LayoutOptions {
    return {
      type: LayoutType.MASONRY,
      direction: 'vertical',
      isVertical: true,
      cardThresholdWidth: 300,
      alignCardHeight: false,
      fixedCardHeight: 0,
      cardsPerView: 0,
      cardGap: 16,
      containerPadding: 16,
      autoDirection: true,
      autoDirectionRatio: 1.2,
      useAnimation: true,
      animationDuration: 300,
      animationEasing: 'ease-out',
      cardMinWidth: 200,
      cardMaxWidth: 600,
      cardMinHeight: 100,
      cardMaxHeight: 800,
      cardHeight: 0
    };
  }

  /**
   * 레이아웃 서비스를 초기화합니다.
   * @param containerElement 컨테이너 요소
   * @param cardContainer 카드 컨테이너 관리자
   * @param options 레이아웃 옵션
   */
  public initialize(
    containerElement: HTMLElement, 
    cardContainer: ICardContainerManager, 
    options?: Partial<LayoutOptions>
  ): void {
    try {
      if (this.isInitialized) {
        Log.warn('LayoutService', '이미 초기화된 레이아웃 서비스입니다.');
        return;
      }
      
      this.container = containerElement;
      this.cardContainer = cardContainer;
      
      if (options) {
        this._options = { ...this._options, ...options };
      }
      
      this.layoutManager.initialize(containerElement, cardContainer, this._options);
      this.isInitialized = true;
      
      Log.debug('LayoutService', '레이아웃 서비스 초기화 완료');
    } catch (error) {
      ErrorHandler.handleError('레이아웃 서비스 초기화 실패', error);
    }
  }

  /**
   * 레이아웃을 업데이트합니다.
   */
  public updateLayout(): void {
    try {
      if (!this.isInitialized) {
        Log.warn('LayoutService', '초기화되지 않은 레이아웃 서비스입니다.');
        return;
      }
      
      this.layoutManager.updateLayout();
      
      Log.debug('LayoutService', '레이아웃 업데이트 완료');
    } catch (error) {
      ErrorHandler.handleError('레이아웃 업데이트 실패', error);
    }
  }

  /**
   * 레이아웃 옵션을 설정합니다.
   * @param options 레이아웃 옵션
   */
  public setOptions(options: Partial<LayoutOptions>): void {
    try {
      this._options = { ...this._options, ...options };
      
      if (this.isInitialized) {
        this.layoutManager.setOptions(options);
      }
      
      Log.debug('LayoutService', '레이아웃 옵션 설정 완료');
    } catch (error) {
      ErrorHandler.handleError('레이아웃 옵션 설정 실패', error);
    }
  }

  /**
   * 카드 위치를 계산합니다.
   * @param cardIds 카드 ID 배열
   * @returns 카드 ID를 키로 하고 위치 정보를 값으로 하는 맵
   */
  public calculateCardPositions(cardIds: string[]): Map<string, ICardPosition> {
    try {
      if (!this.isInitialized) {
        Log.warn('LayoutService', '초기화되지 않은 레이아웃 서비스입니다.');
        return new Map<string, ICardPosition>();
      }
      
      return this.layoutManager.calculateCardPositions(cardIds);
    } catch (error) {
      ErrorHandler.handleError('카드 위치 계산 실패', error);
      return new Map<string, ICardPosition>();
    }
  }

  /**
   * 카드 위치를 적용합니다.
   * @param positions 카드 위치 맵
   * @param animate 애니메이션 적용 여부
   */
  public applyCardPositions(positions: Map<string, ICardPosition>, animate?: boolean): void {
    try {
      if (!this.isInitialized) {
        Log.warn('LayoutService', '초기화되지 않은 레이아웃 서비스입니다.');
        return;
      }
      
      this.layoutManager.applyCardPositions(positions, animate);
      
      Log.debug('LayoutService', '카드 위치 적용 완료');
    } catch (error) {
      ErrorHandler.handleError('카드 위치 적용 실패', error);
    }
  }

  /**
   * 컨테이너 크기 변경 처리
   * 컨테이너 크기가 변경되었을 때 레이아웃을 업데이트합니다.
   */
  public handleContainerResize(): void {
    try {
      if (!this.isInitialized) {
        Log.warn('LayoutService', '초기화되지 않은 레이아웃 서비스입니다.');
        return;
      }
      
      this.layoutManager.handleContainerResize();
      
      Log.debug('LayoutService', '컨테이너 크기 변경 처리 완료');
    } catch (error) {
      ErrorHandler.handleError('컨테이너 크기 변경 처리 실패', error);
    }
  }

  /**
   * 레이아웃 타입 결정
   * 컨테이너 크기와 옵션에 따라 적절한 레이아웃 타입을 결정합니다.
   * @returns 레이아웃 타입
   */
  public determineLayoutType(): LayoutType {
    try {
      if (!this.isInitialized) {
        Log.warn('LayoutService', '초기화되지 않은 레이아웃 서비스입니다.');
        return LayoutType.MASONRY;
      }
      
      return this.layoutManager.determineLayoutType();
    } catch (error) {
      ErrorHandler.handleError('레이아웃 타입 결정 실패', error);
      return LayoutType.MASONRY;
    }
  }

  /**
   * 레이아웃 타입을 설정합니다.
   * @param type 레이아웃 타입
   */
  public setLayoutType(type: LayoutType): void {
    try {
      if (!this.isInitialized) {
        Log.warn('LayoutService', '초기화되지 않은 레이아웃 서비스입니다.');
        return;
      }
      
      this.layoutManager.setLayoutType(type);
      
      Log.debug('LayoutService', `레이아웃 타입 설정 완료: ${type}`);
    } catch (error) {
      ErrorHandler.handleError(`레이아웃 타입 설정 실패: ${type}`, error);
    }
  }

  /**
   * 레이아웃 클래스 적용
   * 레이아웃 타입에 따라 컨테이너에 적절한 CSS 클래스를 적용합니다.
   */
  public applyLayoutClasses(): void {
    try {
      if (!this.isInitialized) {
        Log.warn('LayoutService', '초기화되지 않은 레이아웃 서비스입니다.');
        return;
      }
      
      this.layoutManager.applyLayoutClasses();
      
      Log.debug('LayoutService', '레이아웃 클래스 적용 완료');
    } catch (error) {
      ErrorHandler.handleError('레이아웃 클래스 적용 실패', error);
    }
  }

  /**
   * 이벤트 리스너 등록
   * 레이아웃 관련 이벤트 리스너를 등록합니다.
   */
  public registerEventListeners(): void {
    try {
      if (!this.isInitialized) {
        Log.warn('LayoutService', '초기화되지 않은 레이아웃 서비스입니다.');
        return;
      }
      
      this.layoutManager.registerEventListeners();
      
      Log.debug('LayoutService', '이벤트 리스너 등록 완료');
    } catch (error) {
      ErrorHandler.handleError('이벤트 리스너 등록 실패', error);
    }
  }

  /**
   * 이벤트 리스너 제거
   * 레이아웃 관련 이벤트 리스너를 제거합니다.
   */
  public removeEventListeners(): void {
    try {
      if (!this.isInitialized) {
        Log.warn('LayoutService', '초기화되지 않은 레이아웃 서비스입니다.');
        return;
      }
      
      this.layoutManager.removeEventListeners();
      
      Log.debug('LayoutService', '이벤트 리스너 제거 완료');
    } catch (error) {
      ErrorHandler.handleError('이벤트 리스너 제거 실패', error);
    }
  }

  /**
   * 이벤트 리스너 추가
   * @param eventType 이벤트 타입
   * @param listener 이벤트 리스너
   */
  public addEventListener(eventType: string, listener: EventListener): void {
    try {
      if (!this.isInitialized) {
        Log.warn('LayoutService', '초기화되지 않은 레이아웃 서비스입니다.');
        return;
      }
      
      this.layoutManager.addEventListener(eventType, listener);
      
      // 이벤트 리스너 추적을 위해 저장
      if (!this.eventListeners.has(eventType)) {
        this.eventListeners.set(eventType, []);
      }
      this.eventListeners.get(eventType)?.push(listener);
      
      Log.debug('LayoutService', `이벤트 리스너 추가 완료: ${eventType}`);
    } catch (error) {
      ErrorHandler.handleError(`이벤트 리스너 추가 실패: ${eventType}`, error);
    }
  }

  /**
   * 이벤트 리스너 제거
   * @param eventType 이벤트 타입
   * @param listener 이벤트 리스너
   */
  public removeEventListener(eventType: string, listener: EventListener): void {
    try {
      if (!this.isInitialized) {
        Log.warn('LayoutService', '초기화되지 않은 레이아웃 서비스입니다.');
        return;
      }
      
      this.layoutManager.removeEventListener(eventType, listener);
      
      // 이벤트 리스너 추적 목록에서 제거
      const listeners = this.eventListeners.get(eventType);
      if (listeners) {
        const index = listeners.indexOf(listener);
        if (index !== -1) {
          listeners.splice(index, 1);
        }
      }
      
      Log.debug('LayoutService', `이벤트 리스너 제거 완료: ${eventType}`);
    } catch (error) {
      ErrorHandler.handleError(`이벤트 리스너 제거 실패: ${eventType}`, error);
    }
  }

  /**
   * 레이아웃 방향을 설정합니다.
   * @param direction 레이아웃 방향
   */
  public setLayoutDirection(direction: LayoutDirection): void {
    try {
      if (!this.isInitialized) {
        Log.warn('LayoutService', '초기화되지 않은 레이아웃 서비스입니다.');
        return;
      }
      
      this.setOptions({ direction });
      this.updateLayout();
      
      Log.debug('LayoutService', `레이아웃 방향 설정 완료: ${direction}`);
    } catch (error) {
      ErrorHandler.handleError(`레이아웃 방향 설정 실패: ${direction}`, error);
    }
  }

  /**
   * 카드 너비 임계값을 설정합니다.
   * @param width 카드 너비 임계값
   */
  public setCardThresholdWidth(width: number): void {
    try {
      if (!this.isInitialized) {
        Log.warn('LayoutService', '초기화되지 않은 레이아웃 서비스입니다.');
        return;
      }
      
      this.setOptions({ cardThresholdWidth: width });
      this.updateLayout();
      
      Log.debug('LayoutService', `카드 너비 임계값 설정 완료: ${width}`);
    } catch (error) {
      ErrorHandler.handleError(`카드 너비 임계값 설정 실패: ${width}`, error);
    }
  }

  /**
   * 카드 높이 정렬 여부를 설정합니다.
   * @param align 카드 높이 정렬 여부
   */
  public setAlignCardHeight(align: boolean): void {
    try {
      if (!this.isInitialized) {
        Log.warn('LayoutService', '초기화되지 않은 레이아웃 서비스입니다.');
        return;
      }
      
      this.setOptions({ alignCardHeight: align });
      this.updateLayout();
      
      Log.debug('LayoutService', `카드 높이 정렬 설정 완료: ${align}`);
    } catch (error) {
      ErrorHandler.handleError(`카드 높이 정렬 설정 실패: ${align}`, error);
    }
  }

  /**
   * 고정 카드 높이를 설정합니다.
   * @param height 고정 카드 높이
   */
  public setFixedCardHeight(height: number): void {
    try {
      if (!this.isInitialized) {
        Log.warn('LayoutService', '초기화되지 않은 레이아웃 서비스입니다.');
        return;
      }
      
      this.setOptions({ fixedCardHeight: height });
      this.updateLayout();
      
      Log.debug('LayoutService', `고정 카드 높이 설정 완료: ${height}`);
    } catch (error) {
      ErrorHandler.handleError(`고정 카드 높이 설정 실패: ${height}`, error);
    }
  }

  /**
   * 뷰당 카드 수를 설정합니다.
   * @param count 뷰당 카드 수
   */
  public setCardsPerView(count: number): void {
    try {
      if (!this.isInitialized) {
        Log.warn('LayoutService', '초기화되지 않은 레이아웃 서비스입니다.');
        return;
      }
      
      this.setOptions({ cardsPerView: count });
      this.updateLayout();
      
      Log.debug('LayoutService', `뷰당 카드 수 설정 완료: ${count}`);
    } catch (error) {
      ErrorHandler.handleError(`뷰당 카드 수 설정 실패: ${count}`, error);
    }
  }

  /**
   * 카드 간격을 설정합니다.
   * @param gap 카드 간격
   */
  public setCardGap(gap: number): void {
    try {
      if (!this.isInitialized) {
        Log.warn('LayoutService', '초기화되지 않은 레이아웃 서비스입니다.');
        return;
      }
      
      this.setOptions({ cardGap: gap });
      this.updateLayout();
      
      Log.debug('LayoutService', `카드 간격 설정 완료: ${gap}`);
    } catch (error) {
      ErrorHandler.handleError(`카드 간격 설정 실패: ${gap}`, error);
    }
  }

  /**
   * 컨테이너 패딩을 설정합니다.
   * @param padding 컨테이너 패딩
   */
  public setContainerPadding(padding: number): void {
    try {
      if (!this.isInitialized) {
        Log.warn('LayoutService', '초기화되지 않은 레이아웃 서비스입니다.');
        return;
      }
      
      this.setOptions({ containerPadding: padding });
      this.updateLayout();
      
      Log.debug('LayoutService', `컨테이너 패딩 설정 완료: ${padding}`);
    } catch (error) {
      ErrorHandler.handleError(`컨테이너 패딩 설정 실패: ${padding}`, error);
    }
  }

  /**
   * 자동 방향 전환 여부를 설정합니다.
   * @param auto 자동 방향 전환 여부
   */
  public setAutoDirection(auto: boolean): void {
    try {
      if (!this.isInitialized) {
        Log.warn('LayoutService', '초기화되지 않은 레이아웃 서비스입니다.');
        return;
      }
      
      this.setOptions({ autoDirection: auto });
      this.updateLayout();
      
      Log.debug('LayoutService', `자동 방향 설정 완료: ${auto}`);
    } catch (error) {
      ErrorHandler.handleError(`자동 방향 설정 실패: ${auto}`, error);
    }
  }

  /**
   * 자동 방향 전환 비율을 설정합니다.
   * @param ratio 자동 방향 전환 비율
   */
  public setAutoDirectionRatio(ratio: number): void {
    try {
      if (!this.isInitialized) {
        Log.warn('LayoutService', '초기화되지 않은 레이아웃 서비스입니다.');
        return;
      }
      
      this.setOptions({ autoDirectionRatio: ratio });
      this.updateLayout();
      
      Log.debug('LayoutService', `자동 방향 비율 설정 완료: ${ratio}`);
    } catch (error) {
      ErrorHandler.handleError(`자동 방향 비율 설정 실패: ${ratio}`, error);
    }
  }

  /**
   * 애니메이션 사용 여부를 설정합니다.
   * @param use 애니메이션 사용 여부
   */
  public setUseAnimation(use: boolean): void {
    try {
      if (!this.isInitialized) {
        Log.warn('LayoutService', '초기화되지 않은 레이아웃 서비스입니다.');
        return;
      }
      
      this.setOptions({ useAnimation: use });
      
      Log.debug('LayoutService', `애니메이션 사용 설정 완료: ${use}`);
    } catch (error) {
      ErrorHandler.handleError(`애니메이션 사용 설정 실패: ${use}`, error);
    }
  }

  /**
   * 애니메이션 지속 시간을 설정합니다.
   * @param duration 애니메이션 지속 시간
   */
  public setAnimationDuration(duration: number): void {
    try {
      if (!this.isInitialized) {
        Log.warn('LayoutService', '초기화되지 않은 레이아웃 서비스입니다.');
        return;
      }
      
      this.setOptions({ animationDuration: duration });
      
      Log.debug('LayoutService', `애니메이션 지속 시간 설정 완료: ${duration}`);
    } catch (error) {
      ErrorHandler.handleError(`애니메이션 지속 시간 설정 실패: ${duration}`, error);
    }
  }

  /**
   * 애니메이션 이징 함수를 설정합니다.
   * @param easing 애니메이션 이징 함수
   */
  public setAnimationEasing(easing: string): void {
    try {
      if (!this.isInitialized) {
        Log.warn('LayoutService', '초기화되지 않은 레이아웃 서비스입니다.');
        return;
      }
      
      this.setOptions({ animationEasing: easing });
      
      Log.debug('LayoutService', `애니메이션 이징 설정 완료: ${easing}`);
    } catch (error) {
      ErrorHandler.handleError(`애니메이션 이징 설정 실패: ${easing}`, error);
    }
  }

  /**
   * 특정 카드의 위치를 가져옵니다.
   * @param cardId 카드 ID
   * @returns 카드 위치 또는 null
   */
  public getCardPosition(cardId: string): ICardPosition | null {
    if (!this.isInitialized || !this.cardContainer) {
      Log.warn('LayoutService', '초기화되지 않은 레이아웃 서비스입니다.');
      return null;
    }
    
    const positions = this.calculateCardPositions([cardId]);
    return positions.get(cardId) || null;
  }

  /**
   * 모든 카드의 위치를 가져옵니다.
   * @returns 카드 ID를 키로 하고 위치 정보를 값으로 하는 맵
   */
  public getAllCardPositions(): Map<string, ICardPosition> {
    if (!this.isInitialized || !this.cardContainer) {
      Log.warn('LayoutService', '초기화되지 않은 레이아웃 서비스입니다.');
      return new Map<string, ICardPosition>();
    }
    
    // 모든 카드 ID 가져오기
    const cardIds = this.cardContainer.getAllCards().map(card => card.card.id);
    return this.calculateCardPositions(cardIds);
  }

  /**
   * 특정 카드로 스크롤합니다.
   * @param cardId 카드 ID
   * @param behavior 스크롤 동작
   */
  public scrollToCard(cardId: string, behavior: ScrollBehavior = 'smooth'): void {
    try {
      if (!this.isInitialized || !this.container || !this.cardContainer) {
        Log.warn('LayoutService', '초기화되지 않은 레이아웃 서비스입니다.');
        return;
      }
      
      const cardManager = this.cardContainer.getCard(cardId);
      if (!cardManager) {
        Log.warn('LayoutService', `카드를 찾을 수 없습니다: ${cardId}`);
        return;
      }
      
      const cardElement = cardManager.element;
      if (!cardElement) {
        Log.warn('LayoutService', `카드 요소를 찾을 수 없습니다: ${cardId}`);
        return;
      }
      
      cardElement.scrollIntoView({ behavior, block: 'center' });
      
      Log.debug('LayoutService', `카드로 스크롤 완료: ${cardId}`);
    } catch (error) {
      ErrorHandler.handleError(`카드로 스크롤 실패: ${cardId}`, error);
    }
  }

  /**
   * 레이아웃을 새로고침합니다.
   */
  public refresh(): void {
    try {
      if (!this.isInitialized) {
        Log.warn('LayoutService', '초기화되지 않은 레이아웃 서비스입니다.');
        return;
      }
      
      this.updateLayout();
      
      Log.debug('LayoutService', '레이아웃 새로고침 완료');
    } catch (error) {
      ErrorHandler.handleError('레이아웃 새로고침 실패', error);
    }
  }

  /**
   * 레이아웃 서비스를 정리합니다.
   */
  public destroy(): void {
    try {
      if (!this.isInitialized) {
        return;
      }
      
      // 이벤트 리스너 제거
      this.removeEventListeners();
      
      // 이벤트 리스너 맵 초기화
      this.eventListeners.clear();
      
      // 레이아웃 매니저 정리
      this.layoutManager.destroy();
      
      // 상태 초기화
      this.isInitialized = false;
      this.container = null;
      this.cardContainer = null;
      
      Log.debug('LayoutService', '레이아웃 서비스 제거 완료');
    } catch (error) {
      ErrorHandler.handleError('레이아웃 서비스 제거 실패', error);
    }
  }

  /**
   * 레이아웃 옵션을 가져옵니다.
   * @returns 레이아웃 옵션
   */
  public getOptions(): LayoutOptions {
    return this._options;
  }

  /**
   * 레이아웃 매니저를 가져옵니다.
   * @returns 레이아웃 매니저
   */
  public getLayoutManager(): ILayoutManager {
    return this.layoutManager;
  }

  /**
   * 컨테이너 요소를 가져옵니다.
   * @returns 컨테이너 요소
   */
  public getContainer(): HTMLElement | null {
    return this.container;
  }

  /**
   * 서비스 초기화 여부를 확인합니다.
   * @returns 초기화 여부
   */
  public isInitializedService(): boolean {
    return this.isInitialized;
  }
} 