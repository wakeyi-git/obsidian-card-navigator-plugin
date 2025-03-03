import { App } from 'obsidian';
import { LAYOUT_CLASS_NAMES } from '../../styles/components/layout.styles';
import { LayoutType } from '../../core/types/layout.types';
import { ILayoutManager } from '../../core/interfaces/manager/ILayoutManager';
import { LayoutStyleOptions } from '../../core/types/layout.types';
import { throttle } from '../../utils/helpers/performance.helper';
import { Log } from '../../utils/log/Log';
import { ErrorHandler } from '../../utils/error/ErrorHandler';
import { LAYOUT_STYLES } from '../../styles/components/layout.styles';

/**
 * 기본 레이아웃 스타일 옵션
 */
export const DEFAULT_LAYOUT_STYLE_OPTIONS: LayoutStyleOptions = {
  cardBackgroundColor: 'var(--background-primary)',
  cardBorderColor: 'var(--background-modifier-border)',
  cardBorderWidth: 1,
  cardBorderRadius: 8,
  cardShadow: true,
  cardShadowColor: 'rgba(0, 0, 0, 0.1)',
  cardShadowSize: 4,
  cardPadding: 16,
  cardHoverEffect: true,
  cardHoverScale: 1.02,
  cardHoverShadowSize: 6
};

/**
 * 레이아웃 스타일 관리자 클래스
 * 
 * 레이아웃 컨테이너와 카드의 스타일을 관리하는 클래스입니다.
 * 레이아웃 설정에 따라 적절한 CSS 클래스와 스타일을 적용합니다.
 */
export class LayoutStyleManager {
  private containerEl: HTMLElement;
  private layoutManager: ILayoutManager;
  private app: App;
  
  /**
   * 컨테이너 요소
   */
  private containerElement: HTMLElement | null = null;
  
  /**
   * 스타일 옵션
   */
  private options: LayoutStyleOptions = { ...DEFAULT_LAYOUT_STYLE_OPTIONS };
  
  /**
   * 스타일 요소
   */
  private styleElement: HTMLStyleElement | null = null;
  
  /**
   * 스타일 ID
   */
  private readonly styleId: string = 'card-navigator-layout-style';
  
  /**
   * 스타일 업데이트 함수 (스로틀링 적용)
   */
  private updateStylesThrottled = throttle(this.updateStyles.bind(this), 100);
  
  /**
   * 리사이즈 이벤트 핸들러
   */
  private handleResize = throttle(() => {
    this.applyStyles();
  }, 100);
  
  /**
   * 생성자
   * @param containerEl 레이아웃 컨테이너 요소
   * @param layoutManager 레이아웃 관리자
   * @param app Obsidian 앱 인스턴스
   */
  constructor(containerEl: HTMLElement, layoutManager: ILayoutManager, app: App) {
    this.containerEl = containerEl;
    this.layoutManager = layoutManager;
    this.app = app;
    
    // 컨테이너에 기본 클래스 추가
    this.containerEl.addClass(LAYOUT_CLASS_NAMES.CONTAINER);
    
    // 초기 스타일 적용
    this.applyStyles();
    
    // 리사이즈 이벤트 리스너 등록
    window.addEventListener('resize', this.handleResize);
  }
  
  /**
   * 스타일 적용
   */
  private applyStyles(): void {
    try {
      // 스타일 요소 생성
      this.createStyleElement();
      
      // 스타일 업데이트
      this.updateStyles();
      
      Log.debug('LayoutStyleManager', '레이아웃 스타일 적용 완료');
    } catch (error) {
      ErrorHandler.handleError('LayoutStyleManager.applyStyles', error, true);
    }
  }
  
  /**
   * 초기화
   * @param containerElement 컨테이너 요소
   * @param options 스타일 옵션
   */
  initialize(containerElement: HTMLElement, options?: Partial<LayoutStyleOptions>): void {
    try {
      this.containerElement = containerElement;
      
      if (options) {
        this.setOptions(options);
      }
      
      // 스타일 요소 생성
      this.createStyleElement();
      
      // 초기 스타일 적용
      this.updateStyles();
      
      Log.debug('LayoutStyleManager', '레이아웃 스타일 관리자 초기화 완료');
    } catch (error) {
      ErrorHandler.handleError('LayoutStyleManager.initialize', error, true);
    }
  }
  
  /**
   * 스타일 요소 생성
   */
  private createStyleElement(): void {
    try {
      // 기존 스타일 요소가 있으면 제거
      this.removeStyleElement();
      
      // 새 스타일 요소 생성
      this.styleElement = document.createElement('style');
      this.styleElement.id = this.styleId;
      document.head.appendChild(this.styleElement);
    } catch (error) {
      ErrorHandler.handleError('LayoutStyleManager.createStyleElement', error, false);
    }
  }
  
  /**
   * 스타일 요소 제거
   */
  private removeStyleElement(): void {
    try {
      const existingStyle = document.getElementById(this.styleId);
      if (existingStyle) {
        existingStyle.remove();
      }
      this.styleElement = null;
    } catch (error) {
      ErrorHandler.handleError('LayoutStyleManager.removeStyleElement', error, false);
    }
  }
  
  /**
   * 스타일 옵션 설정
   * @param options 스타일 옵션
   */
  setOptions(options: Partial<LayoutStyleOptions>): void {
    try {
      this.options = {
        ...this.options,
        ...options
      };
      
      // 스타일 업데이트 (스로틀링 적용)
      this.updateStylesThrottled();
      
      Log.debug('LayoutStyleManager', '레이아웃 스타일 옵션 설정 완료');
    } catch (error) {
      ErrorHandler.handleError('LayoutStyleManager.setOptions', error, true);
    }
  }
  
  /**
   * 스타일 업데이트
   */
  private updateStyles(): void {
    try {
      if (!this.styleElement || !this.containerElement) {
        return;
      }
      
      // 카드 스타일 생성
      const cardStyles = this.generateCardStyles();
      
      // 스타일 적용
      this.styleElement.textContent = cardStyles;
      
      Log.debug('LayoutStyleManager', '레이아웃 스타일 업데이트 완료');
    } catch (error) {
      ErrorHandler.handleError('LayoutStyleManager.updateStyles', error, false);
    }
  }
  
  /**
   * 카드 스타일 생성
   * @returns 카드 스타일 문자열
   */
  private generateCardStyles(): string {
    if (!this.containerElement) {
      return '';
    }
    
    const containerSelector = `#${this.containerElement.id}`;
    const { cardBorderRadius, cardBorderWidth, cardShadowSize, cardPadding, 
            cardBorderColor, cardShadowColor, cardBackgroundColor } = this.options;
    
    return `
      ${containerSelector} {
        position: relative;
        width: 100%;
        height: 100%;
        overflow: auto;
        box-sizing: border-box;
      }
      
      ${containerSelector} .card-container {
        position: relative;
        width: 100%;
        height: 100%;
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(${LAYOUT_STYLES.CARD_MIN_WIDTH}, 1fr));
        grid-gap: ${LAYOUT_STYLES.CARD_GAP};
        padding: ${LAYOUT_STYLES.CONTAINER_PADDING};
        box-sizing: border-box;
      }
      
      ${containerSelector}.horizontal .card-container {
        display: flex;
        flex-wrap: nowrap;
        overflow-x: auto;
        overflow-y: hidden;
        align-items: flex-start;
        height: auto;
        min-height: 100%;
      }
      
      ${containerSelector} .card {
        position: relative;
        background: ${cardBackgroundColor};
        color: var(--text-normal);
        border: ${cardBorderWidth}px solid ${cardBorderColor};
        border-radius: ${cardBorderRadius}px;
        padding: ${cardPadding}px;
        box-shadow: 0 0 ${cardShadowSize}px ${cardShadowColor};
        transition: transform 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
        box-sizing: border-box;
        overflow: hidden;
        cursor: pointer;
        user-select: none;
      }
      
      ${containerSelector} .card:hover {
        background: var(--background-primary-alt);
        transform: translateY(-2px);
        box-shadow: 0 2px calc(${cardShadowSize}px + 2px) ${cardShadowColor};
      }
      
      ${containerSelector} .card.selected {
        background: var(--background-primary-alt);
        border-color: var(--interactive-accent);
        box-shadow: 0 0 0 2px var(--interactive-accent);
      }
      
      ${containerSelector} .card.dragging {
        opacity: 0.7;
        transform: scale(1.05);
      }
      
      ${containerSelector}.horizontal .card {
        flex: 0 0 auto;
        width: ${LAYOUT_STYLES.CARD_MIN_WIDTH};
        max-width: ${LAYOUT_STYLES.CARD_MAX_WIDTH};
        margin-right: ${LAYOUT_STYLES.CARD_GAP};
      }
      
      ${containerSelector}.vertical .card {
        width: 100%;
      }
    `;
  }
  
  /**
   * 소멸
   */
  destroy(): void {
    try {
      // 리사이즈 이벤트 리스너 제거
      window.removeEventListener('resize', this.handleResize);
      
      // 스타일 요소 제거
      this.removeStyleElement();
      
      // 참조 정리
      this.containerElement = null;
      
      Log.debug('LayoutStyleManager', '레이아웃 스타일 관리자 정리 완료');
    } catch (error) {
      ErrorHandler.handleError('LayoutStyleManager.destroy', error, false);
    }
  }
} 