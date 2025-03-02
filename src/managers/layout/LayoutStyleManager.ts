import { App } from 'obsidian';
import { LAYOUT_CLASS_NAMES } from '../../styles/components/layout.styles';
import { LayoutDirection, LayoutType } from '../../core/constants/layout.constants';
import { ILayoutManager } from '../../core/interfaces/ILayoutManager';
import { LayoutSettings } from '../../core/types/layout.types';
import { throttle } from '../../utils/helpers/performance.helper';

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
    
    // 리사이즈 이벤트 처리를 위한 쓰로틀 함수 설정
    this.handleResize = throttle(this.handleResize.bind(this), 100);
    
    // 초기 스타일 적용
    this.applyStyles();
    
    // 리사이즈 이벤트 리스너 등록
    window.addEventListener('resize', this.handleResize);
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
      ErrorHandler.handleError(
        'LayoutStyleManager.initialize',
        `레이아웃 스타일 초기화 중 오류 발생: ${error.message}`,
        error
      );
    }
  }
  
  /**
   * 스타일 요소 생성
   */
  private createStyleElement(): void {
    // 기존 스타일 요소가 있으면 제거
    this.removeStyleElement();
    
    // 새 스타일 요소 생성
    this.styleElement = document.createElement('style');
    this.styleElement.id = this.styleId;
    document.head.appendChild(this.styleElement);
  }
  
  /**
   * 스타일 요소 제거
   */
  private removeStyleElement(): void {
    const existingStyle = document.getElementById(this.styleId);
    if (existingStyle) {
      existingStyle.remove();
    }
    this.styleElement = null;
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
      ErrorHandler.handleError(
        'LayoutStyleManager.setOptions',
        `스타일 옵션 설정 중 오류 발생: ${error.message}`,
        error
      );
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
      
      // CSS 변수 생성
      const cssVars = this.generateCssVariables();
      
      // 기본 스타일 생성
      const baseStyles = this.generateBaseStyles();
      
      // 카드 스타일 생성
      const cardStyles = this.generateCardStyles();
      
      // 스타일 적용
      this.styleElement.textContent = `
        ${cssVars}
        ${baseStyles}
        ${cardStyles}
      `;
      
      Log.debug('LayoutStyleManager', '레이아웃 스타일 업데이트 완료');
    } catch (error) {
      ErrorHandler.handleError(
        'LayoutStyleManager.updateStyles',
        `스타일 업데이트 중 오류 발생: ${error.message}`,
        error
      );
    }
  }
  
  /**
   * CSS 변수 생성
   * @returns CSS 변수 문자열
   */
  private generateCssVariables(): string {
    const containerSelector = `#${this.containerElement!.id}`;
    
    return `
      ${containerSelector} {
        --card-gap: ${this.options.cardGap}px;
        --card-border-radius: ${this.options.cardBorderRadius}px;
        --card-border-width: ${this.options.cardBorderWidth}px;
        --card-shadow-size: ${this.options.cardShadowSize}px;
        --card-padding: ${this.options.cardPadding}px;
        --card-background: ${this.options.cardBackground};
        --card-text-color: ${this.options.cardTextColor};
        --card-border-color: ${this.options.cardBorderColor};
        --card-shadow-color: ${this.options.cardShadowColor};
        --card-hover-background: ${this.options.cardHoverBackground};
        --card-selected-background: ${this.options.cardSelectedBackground};
        --card-selected-border-color: ${this.options.cardSelectedBorderColor};
      }
    `;
  }
  
  /**
   * 기본 스타일 생성
   * @returns 기본 스타일 문자열
   */
  private generateBaseStyles(): string {
    const containerSelector = `#${this.containerElement!.id}`;
    
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
        grid-template-columns: repeat(auto-fill, minmax(${this.options.cardMinWidth}px, 1fr));
        grid-gap: var(--card-gap);
        padding: var(--card-gap);
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
    `;
  }
  
  /**
   * 카드 스타일 생성
   * @returns 카드 스타일 문자열
   */
  private generateCardStyles(): string {
    const containerSelector = `#${this.containerElement!.id}`;
    
    return `
      ${containerSelector} .card {
        position: relative;
        background: var(--card-background);
        color: var(--card-text-color);
        border: var(--card-border-width) solid var(--card-border-color);
        border-radius: var(--card-border-radius);
        padding: var(--card-padding);
        box-shadow: 0 0 var(--card-shadow-size) var(--card-shadow-color);
        transition: transform 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
        box-sizing: border-box;
        overflow: hidden;
        cursor: pointer;
        user-select: none;
      }
      
      ${containerSelector} .card:hover {
        background: var(--card-hover-background);
        transform: translateY(-2px);
        box-shadow: 0 2px calc(var(--card-shadow-size) + 2px) var(--card-shadow-color);
      }
      
      ${containerSelector} .card.selected {
        background: var(--card-selected-background);
        border-color: var(--card-selected-border-color);
        box-shadow: 0 0 0 2px var(--card-selected-border-color);
      }
      
      ${containerSelector} .card.dragging {
        opacity: 0.7;
        transform: scale(1.05);
      }
      
      ${containerSelector}.horizontal .card {
        flex: 0 0 auto;
        width: ${this.options.cardMinWidth}px;
        max-width: ${this.options.cardMaxWidth}px;
        height: ${this.options.alignCardHeight ? this.options.cardHeight + 'px' : 'auto'};
        margin-right: var(--card-gap);
      }
      
      ${containerSelector}.vertical .card {
        width: 100%;
        height: ${this.options.alignCardHeight ? this.options.cardHeight + 'px' : 'auto'};
      }
    `;
  }
  
  /**
   * 소멸
   */
  destroy(): void {
    try {
      // 스타일 요소 제거
      this.removeStyleElement();
      
      // 참조 정리
      this.containerElement = null;
      
      Log.debug('LayoutStyleManager', '레이아웃 스타일 관리자 정리 완료');
    } catch (error) {
      ErrorHandler.handleError(
        'LayoutStyleManager.destroy',
        `레이아웃 스타일 관리자 정리 중 오류 발생: ${error.message}`,
        error
      );
    }
  }
} 