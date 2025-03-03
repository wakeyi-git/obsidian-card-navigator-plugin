import { setIcon } from 'obsidian';
import { ErrorHandler } from '../../../utils/error/ErrorHandler';

/**
 * 툴바 버튼 옵션 인터페이스
 */
export interface ToolbarButtonOptions {
  id?: string;
  icon: string;
  title: string;
  active?: boolean;
  onClick?: (event: MouseEvent) => void;
  cls?: string[];
}

/**
 * 툴바 버튼 컴포넌트
 * 카드 네비게이터 툴바에 사용되는 버튼 컴포넌트입니다.
 */
export class ToolbarButton {
  /**
   * 버튼 요소
   */
  private buttonEl: HTMLElement;
  
  /**
   * 버튼 ID
   */
  private id: string;
  
  /**
   * 버튼 아이콘
   */
  private icon: string;
  
  /**
   * 버튼 제목
   */
  private title: string;
  
  /**
   * 버튼 활성화 상태
   */
  private active: boolean;
  
  /**
   * 클릭 이벤트 핸들러
   */
  private onClick: (event: MouseEvent) => void;
  
  /**
   * 생성자
   * @param options 툴바 버튼 옵션
   */
  constructor(options: ToolbarButtonOptions) {
    this.id = options.id || `toolbar-button-${Date.now()}`;
    this.icon = options.icon;
    this.title = options.title;
    this.active = options.active || false;
    this.onClick = options.onClick || (() => {});
    
    // 버튼 요소 생성
    this.buttonEl = document.createElement('button');
    this.buttonEl.id = this.id;
    this.buttonEl.className = 'card-navigator-toolbar-button';
    this.buttonEl.setAttribute('aria-label', this.title);
    this.buttonEl.setAttribute('title', this.title);
    
    // 추가 클래스 적용
    if (options.cls && options.cls.length > 0) {
      options.cls.forEach(cls => this.buttonEl.classList.add(cls));
    }
    
    // 활성화 상태 적용
    if (this.active) {
      this.buttonEl.classList.add('is-active');
    }
    
    // 아이콘 설정
    try {
      setIcon(this.buttonEl, this.icon);
    } catch (error) {
      ErrorHandler.getInstance().handleError(
        `버튼 아이콘(${this.icon})을 설정하는 중 오류가 발생했습니다.`,
        error
      );
      // 아이콘 설정 실패 시 텍스트로 대체
      this.buttonEl.textContent = this.title.charAt(0);
    }
    
    // 클릭 이벤트 설정
    this.buttonEl.addEventListener('click', this.handleClick.bind(this));
  }
  
  /**
   * 클릭 이벤트 핸들러
   * @param event 마우스 이벤트
   */
  private handleClick(event: MouseEvent): void {
    try {
      this.onClick(event);
    } catch (error) {
      ErrorHandler.getInstance().handleError(
        '버튼 클릭 이벤트 처리 중 오류가 발생했습니다.',
        error
      );
    }
  }
  
  /**
   * 버튼 요소를 반환합니다.
   * @returns 버튼 HTML 요소
   */
  public getElement(): HTMLElement {
    return this.buttonEl;
  }
  
  /**
   * 버튼 활성화 상태를 설정합니다.
   * @param active 활성화 상태
   */
  public setActive(active: boolean): void {
    try {
      this.active = active;
      
      if (active) {
        this.buttonEl.classList.add('is-active');
      } else {
        this.buttonEl.classList.remove('is-active');
      }
    } catch (error) {
      ErrorHandler.getInstance().handleError(
        '버튼 활성화 상태를 설정하는 중 오류가 발생했습니다.',
        error
      );
    }
  }
  
  /**
   * 버튼 활성화 상태를 토글합니다.
   */
  public toggleActive(): void {
    this.setActive(!this.active);
  }
  
  /**
   * 버튼 활성화 상태를 반환합니다.
   * @returns 활성화 상태
   */
  public isActive(): boolean {
    return this.active;
  }
  
  /**
   * 버튼 제목을 설정합니다.
   * @param title 버튼 제목
   */
  public setTitle(title: string): void {
    try {
      this.title = title;
      this.buttonEl.setAttribute('aria-label', title);
      this.buttonEl.setAttribute('title', title);
    } catch (error) {
      ErrorHandler.getInstance().handleError(
        '버튼 제목을 설정하는 중 오류가 발생했습니다.',
        error
      );
    }
  }
  
  /**
   * 버튼 아이콘을 설정합니다.
   * @param icon 아이콘 이름
   */
  public setIcon(icon: string): void {
    try {
      this.icon = icon;
      setIcon(this.buttonEl, icon);
    } catch (error) {
      ErrorHandler.getInstance().handleError(
        `버튼 아이콘(${icon})을 설정하는 중 오류가 발생했습니다.`,
        error
      );
    }
  }
  
  /**
   * 버튼을 비활성화합니다.
   */
  public disable(): void {
    try {
      this.buttonEl.disabled = true;
      this.buttonEl.classList.add('is-disabled');
    } catch (error) {
      ErrorHandler.getInstance().handleError(
        '버튼을 비활성화하는 중 오류가 발생했습니다.',
        error
      );
    }
  }
  
  /**
   * 버튼을 활성화합니다.
   */
  public enable(): void {
    try {
      this.buttonEl.disabled = false;
      this.buttonEl.classList.remove('is-disabled');
    } catch (error) {
      ErrorHandler.getInstance().handleError(
        '버튼을 활성화하는 중 오류가 발생했습니다.',
        error
      );
    }
  }
  
  /**
   * 버튼을 제거합니다.
   */
  public remove(): void {
    try {
      this.buttonEl.removeEventListener('click', this.handleClick.bind(this));
      this.buttonEl.remove();
    } catch (error) {
      ErrorHandler.getInstance().handleError(
        '버튼을 제거하는 중 오류가 발생했습니다.',
        error
      );
    }
  }
} 