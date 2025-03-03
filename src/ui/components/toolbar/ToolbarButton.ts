import { setIcon } from 'obsidian';
import { IToolbarService } from '../../../core/interfaces/service/IToolbarService';
import { ErrorHandler } from '../../../utils/error/ErrorHandler';
import { Log } from '../../../utils/log/Log';
import { TOOLBAR_CLASS_NAMES } from '../../../styles/components/toolbar.styles';

/**
 * 툴바 버튼 옵션 인터페이스
 */
export interface ToolbarButtonOptions {
  /**
   * 버튼 ID
   */
  id: string;

  /**
   * 버튼 아이콘 (Obsidian 아이콘 ID)
   */
  icon: string;

  /**
   * 버튼 툴팁
   */
  tooltip?: string;

  /**
   * 클릭 이벤트 핸들러
   */
  onClick?: (event: MouseEvent) => void;

  /**
   * 우클릭 이벤트 핸들러
   */
  onContextMenu?: (event: MouseEvent) => void;

  /**
   * 활성화 여부
   */
  isActive?: boolean;

  /**
   * 비활성화 여부
   */
  isDisabled?: boolean;

  /**
   * CSS 클래스
   */
  class?: string;
}

/**
 * 툴바 버튼 컴포넌트
 * 카드 네비게이터 툴바에 사용되는 버튼 컴포넌트입니다.
 */
export class ToolbarButton {
  private toolbarService: IToolbarService;
  private element: HTMLElement;
  private options: ToolbarButtonOptions;

  constructor(toolbarService: IToolbarService, options: ToolbarButtonOptions) {
    this.toolbarService = toolbarService;
    this.options = options;
    this.element = this.createButtonElement();
  }

  /**
   * 버튼 엘리먼트 생성
   */
  private createButtonElement(): HTMLElement {
    try {
      const button = document.createElement('button');
      button.id = this.options.id;
      button.classList.add('clickable-icon');
      
      if (this.options.class) {
        button.classList.add(this.options.class);
      }

      if (this.options.tooltip) {
        button.setAttribute('aria-label', this.options.tooltip);
      }

      if (this.options.isActive) {
        button.classList.add('is-active');
      }

      if (this.options.isDisabled) {
        button.disabled = true;
        button.classList.add('is-disabled');
      }

      setIcon(button, this.options.icon);

      if (this.options.onClick) {
        button.addEventListener('click', this.options.onClick);
      }

      if (this.options.onContextMenu) {
        button.addEventListener('contextmenu', this.options.onContextMenu);
      }

      Log.debug('툴바 버튼이 생성되었습니다.', { id: this.options.id });
      return button;
    } catch (error) {
      ErrorHandler.getInstance().handleError('툴바 버튼 생성 중 오류가 발생했습니다.', error);
      throw error;
    }
  }

  /**
   * 버튼 활성화 상태 설정
   */
  public setActive(isActive: boolean): void {
    try {
      if (isActive) {
        this.element.classList.add('is-active');
      } else {
        this.element.classList.remove('is-active');
      }
    } catch (error) {
      ErrorHandler.getInstance().handleError('툴바 버튼 활성화 상태 설정 중 오류가 발생했습니다.', error);
    }
  }

  /**
   * 버튼 비활성화 상태 설정
   */
  public setDisabled(isDisabled: boolean): void {
    try {
      this.element.disabled = isDisabled;
      if (isDisabled) {
        this.element.classList.add('is-disabled');
      } else {
        this.element.classList.remove('is-disabled');
      }
    } catch (error) {
      ErrorHandler.getInstance().handleError('툴바 버튼 비활성화 상태 설정 중 오류가 발생했습니다.', error);
    }
  }

  /**
   * 버튼 아이콘 변경
   */
  public setIcon(icon: string): void {
    try {
      setIcon(this.element, icon);
    } catch (error) {
      ErrorHandler.getInstance().handleError('툴바 버튼 아이콘 변경 중 오류가 발생했습니다.', error);
    }
  }

  /**
   * 버튼 툴팁 변경
   */
  public setTooltip(tooltip: string): void {
    try {
      this.element.setAttribute('aria-label', tooltip);
    } catch (error) {
      ErrorHandler.getInstance().handleError('툴바 버튼 툴팁 변경 중 오류가 발생했습니다.', error);
    }
  }

  /**
   * 버튼 엘리먼트 반환
   */
  public getElement(): HTMLElement {
    return this.element;
  }

  /**
   * 버튼 제거
   */
  public remove(): void {
    try {
      if (this.options.onClick) {
        this.element.removeEventListener('click', this.options.onClick);
      }
      if (this.options.onContextMenu) {
        this.element.removeEventListener('contextmenu', this.options.onContextMenu);
      }
      this.element.remove();
      Log.debug('툴바 버튼이 제거되었습니다.', { id: this.options.id });
    } catch (error) {
      ErrorHandler.getInstance().handleError('툴바 버튼 제거 중 오류가 발생했습니다.', error);
    }
  }
} 