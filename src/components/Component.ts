/**
 * 컴포넌트 인터페이스
 * 모든 UI 컴포넌트의 기본 인터페이스입니다.
 */
export interface IComponent {
  /**
   * 컴포넌트 렌더링
   * @param container 컨테이너 요소
   */
  render(container: HTMLElement): Promise<void>;
  
  /**
   * 컴포넌트 업데이트
   */
  update(): Promise<void>;
  
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
  async render(container: HTMLElement): Promise<void> {
    this.container = container;
    this.element = await this.createComponent();
    if (this.element) {
      container.appendChild(this.element);
      this.registerEventListeners();
    }
  }
  
  /**
   * 컴포넌트 생성
   * @returns 생성된 HTML 요소
   */
  protected abstract createComponent(): Promise<HTMLElement>;
  
  /**
   * 컴포넌트 업데이트
   */
  async update(): Promise<void> {
    if (this.container && this.element) {
      try {
        const newElement = await this.createComponent();
        
        // 요소가 여전히 컨테이너의 자식인지 확인
        if (this.element.parentNode === this.container) {
          this.container.replaceChild(newElement, this.element);
        } else {
          // 부모-자식 관계가 깨진 경우 새 요소를 추가
          this.container.appendChild(newElement);
        }
        
        this.element = newElement;
        this.registerEventListeners();
      } catch (error) {
        console.error('컴포넌트 업데이트 중 오류 발생:', error);
      }
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