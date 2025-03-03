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

/**
 * LayoutService 클래스는 카드 레이아웃 관련 기능을 제공합니다.
 */
export class LayoutService {
  private layoutManager: ILayoutManager;
  private container: HTMLElement | null = null;
  private options: LayoutOptions;
  private isInitialized: boolean = false;

  /**
   * LayoutService 생성자
   * @param layoutManager 레이아웃 매니저 인스턴스
   */
  constructor(layoutManager: ILayoutManager) {
    this.layoutManager = layoutManager;
    this.options = this.getDefaultOptions();
    
    Log.debug('LayoutService', '레이아웃 서비스 초기화 완료');
  }

  /**
   * 기본 레이아웃 옵션을 가져옵니다.
   * @returns 기본 레이아웃 옵션
   */
  private getDefaultOptions(): LayoutOptions {
    return {
      type: 'masonry',
      direction: 'vertical',
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
      animationEasing: 'ease-out'
    };
  }

  /**
   * 레이아웃 서비스를 초기화합니다.
   * @param container 컨테이너 요소
   * @param options 레이아웃 옵션
   */
  public initialize(container: HTMLElement, options?: Partial<LayoutOptions>): void {
    try {
      this.container = container;
      
      if (options) {
        this.options = { ...this.options, ...options };
      }
      
      this.layoutManager.initialize(container, this.options);
      this.isInitialized = true;
      
      Log.debug('LayoutService', '레이아웃 서비스 초기화 완료');
    } catch (error) {
      ErrorHandler.handleError('레이아웃 서비스 초기화 실패', error);
    }
  }

  /**
   * 레이아웃을 업데이트합니다.
   * @param cardIds 카드 ID 배열
   * @param cardElements 카드 요소 맵
   */
  public updateLayout(cardIds: string[], cardElements: Map<string, HTMLElement>): void {
    try {
      if (!this.isInitialized) {
        throw new Error('레이아웃 서비스가 초기화되지 않았습니다.');
      }
      
      this.layoutManager.updateLayout(cardIds, cardElements);
      
      Log.debug('LayoutService', `레이아웃 업데이트 완료: ${cardIds.length}개 카드`);
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
      this.options = { ...this.options, ...options };
      
      if (this.isInitialized) {
        this.layoutManager.setOptions(this.options);
      }
      
      Log.debug('LayoutService', '레이아웃 옵션 설정 완료');
    } catch (error) {
      ErrorHandler.handleError('레이아웃 옵션 설정 실패', error);
    }
  }

  /**
   * 레이아웃 타입을 설정합니다.
   * @param type 레이아웃 타입
   */
  public setLayoutType(type: LayoutType): void {
    try {
      this.options.type = type;
      
      if (this.isInitialized) {
        this.layoutManager.setOptions(this.options);
      }
      
      Log.debug('LayoutService', `레이아웃 타입 설정 완료: ${type}`);
    } catch (error) {
      ErrorHandler.handleError(`레이아웃 타입 설정 실패: ${type}`, error);
    }
  }

  /**
   * 레이아웃 방향을 설정합니다.
   * @param direction 레이아웃 방향
   */
  public setLayoutDirection(direction: LayoutDirection): void {
    try {
      this.options.direction = direction;
      
      if (this.isInitialized) {
        this.layoutManager.setOptions(this.options);
      }
      
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
      this.options.cardThresholdWidth = width;
      
      if (this.isInitialized) {
        this.layoutManager.setOptions(this.options);
      }
      
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
      this.options.alignCardHeight = align;
      
      if (this.isInitialized) {
        this.layoutManager.setOptions(this.options);
      }
      
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
      this.options.fixedCardHeight = height;
      
      if (this.isInitialized) {
        this.layoutManager.setOptions(this.options);
      }
      
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
      this.options.cardsPerView = count;
      
      if (this.isInitialized) {
        this.layoutManager.setOptions(this.options);
      }
      
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
      this.options.cardGap = gap;
      
      if (this.isInitialized) {
        this.layoutManager.setOptions(this.options);
      }
      
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
      this.options.containerPadding = padding;
      
      if (this.isInitialized) {
        this.layoutManager.setOptions(this.options);
      }
      
      Log.debug('LayoutService', `컨테이너 패딩 설정 완료: ${padding}`);
    } catch (error) {
      ErrorHandler.handleError(`컨테이너 패딩 설정 실패: ${padding}`, error);
    }
  }

  /**
   * 자동 방향 설정 여부를 설정합니다.
   * @param auto 자동 방향 설정 여부
   */
  public setAutoDirection(auto: boolean): void {
    try {
      this.options.autoDirection = auto;
      
      if (this.isInitialized) {
        this.layoutManager.setOptions(this.options);
      }
      
      Log.debug('LayoutService', `자동 방향 설정 완료: ${auto}`);
    } catch (error) {
      ErrorHandler.handleError(`자동 방향 설정 실패: ${auto}`, error);
    }
  }

  /**
   * 자동 방향 비율을 설정합니다.
   * @param ratio 자동 방향 비율
   */
  public setAutoDirectionRatio(ratio: number): void {
    try {
      this.options.autoDirectionRatio = ratio;
      
      if (this.isInitialized) {
        this.layoutManager.setOptions(this.options);
      }
      
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
      this.options.useAnimation = use;
      
      if (this.isInitialized) {
        this.layoutManager.setOptions(this.options);
      }
      
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
      this.options.animationDuration = duration;
      
      if (this.isInitialized) {
        this.layoutManager.setOptions(this.options);
      }
      
      Log.debug('LayoutService', `애니메이션 지속 시간 설정 완료: ${duration}`);
    } catch (error) {
      ErrorHandler.handleError(`애니메이션 지속 시간 설정 실패: ${duration}`, error);
    }
  }

  /**
   * 애니메이션 이징을 설정합니다.
   * @param easing 애니메이션 이징
   */
  public setAnimationEasing(easing: string): void {
    try {
      this.options.animationEasing = easing;
      
      if (this.isInitialized) {
        this.layoutManager.setOptions(this.options);
      }
      
      Log.debug('LayoutService', `애니메이션 이징 설정 완료: ${easing}`);
    } catch (error) {
      ErrorHandler.handleError(`애니메이션 이징 설정 실패: ${easing}`, error);
    }
  }

  /**
   * 카드 위치를 가져옵니다.
   * @param cardId 카드 ID
   * @returns 카드 위치 또는 null
   */
  public getCardPosition(cardId: string): ICardPosition | null {
    if (!this.layoutManager) {
      console.warn('LayoutService: 레이아웃 관리자가 초기화되지 않았습니다.');
      return null;
    }
    
    return this.layoutManager.getCardPosition(cardId);
  }

  /**
   * 모든 카드 위치를 가져옵니다.
   * @returns 카드 ID를 키로 하는 카드 위치 맵
   */
  public getAllCardPositions(): Map<string, ICardPosition> {
    if (!this.layoutManager) {
      console.warn('LayoutService: 레이아웃 관리자가 초기화되지 않았습니다.');
      return new Map<string, ICardPosition>();
    }
    
    return this.layoutManager.getAllCardPositions();
  }

  /**
   * 특정 카드로 스크롤합니다.
   * @param cardId 카드 ID
   * @param behavior 스크롤 동작
   */
  public scrollToCard(cardId: string, behavior: ScrollBehavior = 'smooth'): void {
    try {
      if (!this.isInitialized) {
        throw new Error('레이아웃 서비스가 초기화되지 않았습니다.');
      }
      
      this.layoutManager.scrollToCard(cardId, behavior);
      
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
        throw new Error('레이아웃 서비스가 초기화되지 않았습니다.');
      }
      
      this.layoutManager.refresh();
      
      Log.debug('LayoutService', '레이아웃 새로고침 완료');
    } catch (error) {
      ErrorHandler.handleError('레이아웃 새로고침 실패', error);
    }
  }

  /**
   * 레이아웃 서비스를 제거합니다.
   */
  public destroy(): void {
    try {
      if (this.isInitialized) {
        this.layoutManager.destroy();
        this.isInitialized = false;
      }
      
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
    return { ...this.options };
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
   * @returns 컨테이너 요소 또는 null
   */
  public getContainer(): HTMLElement | null {
    return this.container;
  }

  /**
   * 레이아웃 서비스가 초기화되었는지 확인합니다.
   * @returns 초기화 여부
   */
  public isInitializedService(): boolean {
    return this.isInitialized;
  }
} 