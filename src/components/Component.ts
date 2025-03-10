/**
 * 컴포넌트 인터페이스
 * 모든 UI 컴포넌트의 기본 인터페이스입니다.
 */
export interface IComponent {
  /**
   * 컴포넌트 렌더링
   * @param container 컨테이너 요소
   */
  render(container: HTMLElement): void;
  
  /**
   * 컴포넌트 업데이트
   */
  update(): void;
  
  /**
   * 컴포넌트 제거
   */
  remove(): void;
  
  /**
   * 이벤트 리스너 등록
   */
  registerEventListeners(): void;
  
  /**
   * 이벤트 리스너 제거
   */
  removeEventListeners(): void;
}

/**
 * 기본 컴포넌트 추상 클래스
 * 모든 UI 컴포넌트의 기본 구현을 제공합니다.
 */
export abstract class Component implements IComponent {
  protected container: HTMLElement | null = null;
  protected element: HTMLElement | null = null;
  
  /**
   * 컴포넌트 렌더링
   * @param container 컨테이너 요소
   */
  render(container: HTMLElement): void {
    this.container = container;
    this.element = this.createComponent();
    if (this.element) {
      container.appendChild(this.element);
      this.registerEventListeners();
    }
  }
  
  /**
   * 컴포넌트 생성
   * @returns 생성된 HTML 요소
   */
  protected abstract createComponent(): HTMLElement;
  
  /**
   * 컴포넌트 업데이트
   */
  update(): void {
    if (this.container && this.element) {
      const newElement = this.createComponent();
      this.container.replaceChild(newElement, this.element);
      this.element = newElement;
      this.registerEventListeners();
    }
  }
  
  /**
   * 컴포넌트 제거
   */
  remove(): void {
    if (this.element) {
      this.removeEventListeners();
      this.element.remove();
      this.element = null;
    }
  }
  
  /**
   * 이벤트 리스너 등록
   */
  registerEventListeners(): void {
    // 기본 구현 없음, 하위 클래스에서 구현
  }
  
  /**
   * 이벤트 리스너 제거
   */
  removeEventListeners(): void {
    // 기본 구현 없음, 하위 클래스에서 구현
  }
} 