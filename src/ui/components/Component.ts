/**
 * 컴포넌트 인터페이스
 * 모든 UI 컴포넌트의 기본 인터페이스입니다.
 */
export interface IComponent {
  /**
   * 컴포넌트 렌더링
   * @param container 컨테이너 요소
   * @returns 렌더링된 요소
   */
  render(container?: HTMLElement): Promise<HTMLElement>;
  
  /**
   * 컴포넌트 업데이트
   */
  update(): Promise<void>;
  
  /**
   * 컴포넌트 제거
   */
  remove(): void;
  
  /**
   * 컴포넌트 요소 가져오기
   * @returns 컴포넌트 요소
   */
  getElement(): HTMLElement | null;
}

/**
 * 컴포넌트 추상 클래스
 * 모든 UI 컴포넌트의 기본 클래스입니다.
 */
export abstract class Component implements IComponent {
  /**
   * 컴포넌트 요소
   */
  protected element: HTMLElement | null = null;
  private memoizedValues: Map<string, any> = new Map();
  
  /**
   * 컴포넌트 생성
   * @returns 생성된 컴포넌트 요소
   */
  protected abstract createComponent(): Promise<HTMLElement>;
  
  /**
   * 이벤트 리스너 등록
   */
  protected registerEventListeners(): void {
    // 기본 구현은 비어 있음
    // 하위 클래스에서 필요에 따라 오버라이드
  }
  
  /**
   * 이벤트 리스너 제거
   */
  protected removeEventListeners(): void {
    // 기본 구현은 비어 있음
    // 하위 클래스에서 필요에 따라 오버라이드
  }
  
  /**
   * 컴포넌트 렌더링
   * @param container 컨테이너 요소
   * @returns 렌더링된 요소
   */
  async render(container?: HTMLElement): Promise<HTMLElement> {
    // 이미 렌더링된 경우 기존 요소 반환
    if (this.element) {
      if (container) {
        container.appendChild(this.element);
      }
      return this.element;
    }
    
    // 컴포넌트 생성
    this.element = await this.createComponent();
    
    // 이벤트 리스너 등록
    this.registerEventListeners();
    
    // 컨테이너에 추가
    if (container) {
      container.appendChild(this.element);
    }
    
    return this.element;
  }
  
  /**
   * 컴포넌트 업데이트
   */
  async update(): Promise<void> {
    // 기본 구현은 비어 있음
    // 하위 클래스에서 필요에 따라 오버라이드
  }
  
  /**
   * 컴포넌트 제거
   */
  remove(): void {
    if (this.element) {
      // 이벤트 리스너 제거
      this.removeEventListeners();
      
      // 요소 제거
      this.element.remove();
      this.element = null;
    }
  }
  
  /**
   * 컴포넌트 요소 가져오기
   * @returns 컴포넌트 요소
   */
  getElement(): HTMLElement | null {
    return this.element;
  }
  
  /**
   * 컴포넌트 정리
   * 컴포넌트가 더 이상 필요하지 않을 때 호출합니다.
   */
  cleanup(): void {
    this.remove();
  }
  
  /**
   * 메모이제이션 함수
   * 동일한 입력에 대해 이전 계산 결과를 재사용합니다.
   * @param key 캐시 키
   * @param fn 계산 함수
   * @param args 함수 인자
   * @returns 계산 결과
   */
  protected memoize<T>(key: string, fn: (...args: any[]) => T, ...args: any[]): T {
    // 캐시 키 생성 (함수 이름 + 인자 해시)
    // 순환 참조 문제를 방지하기 위해 간단한 해시 함수 사용
    const argsHash = this.getSimpleHash(args);
    const cacheKey = `${key}:${argsHash}`;
    
    // 캐시에 있으면 캐시된 값 반환
    if (this.memoizedValues.has(cacheKey)) {
      return this.memoizedValues.get(cacheKey);
    }
    
    // 없으면 계산하고 캐시에 저장
    const result = fn(...args);
    this.memoizedValues.set(cacheKey, result);
    return result;
  }
  
  /**
   * 간단한 해시 함수
   * 순환 참조 문제를 방지하기 위해 객체의 간단한 해시를 생성합니다.
   * @param args 해시할 인자
   * @returns 해시 문자열
   */
  private getSimpleHash(args: any[]): string {
    try {
      return args.map(arg => {
        if (arg === null || arg === undefined) {
          return String(arg);
        }
        if (typeof arg === 'function') {
          return 'function';
        }
        if (typeof arg !== 'object') {
          return String(arg);
        }
        if (Array.isArray(arg)) {
          return `array:${arg.length}`;
        }
        // 객체의 경우 키 목록과 타입만 사용
        const keys = Object.keys(arg).sort().join(',');
        return `object:${keys}:${arg.constructor?.name || 'Object'}`;
      }).join('|');
    } catch (error) {
      console.error('해시 생성 오류:', error);
      return Date.now().toString(); // 오류 발생 시 현재 시간을 해시로 사용
    }
  }
  
  /**
   * 메모이제이션 캐시 초기화
   */
  protected clearMemoCache(): void {
    this.memoizedValues.clear();
  }
  
  /**
   * 특정 키에 대한 메모이제이션 캐시 초기화
   * @param keyPrefix 캐시 키 접두사
   */
  protected clearMemoCacheByKey(keyPrefix: string): void {
    for (const key of this.memoizedValues.keys()) {
      if (key.startsWith(`${keyPrefix}:`)) {
        this.memoizedValues.delete(key);
      }
    }
  }
} 