/**
 * DOM 조작 헬퍼 함수 모음
 * DOM 요소를 생성하고 조작하는 데 사용되는 유틸리티 함수들입니다.
 */

/**
 * 요소의 모든 자식 요소를 제거합니다.
 * @param element 자식 요소를 제거할 요소
 */
export function clearElement(element: HTMLElement): void {
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
}

/**
 * 요소의 클래스를 토글합니다.
 * @param element 클래스를 토글할 요소
 * @param className 토글할 클래스 이름
 * @param force 클래스 추가 여부 (true: 추가, false: 제거)
 */
export function toggleClass(element: HTMLElement, className: string, force?: boolean): void {
  element.classList.toggle(className, force);
}

/**
 * 요소에 여러 클래스를 추가합니다.
 * @param element 클래스를 추가할 요소
 * @param classNames 추가할 클래스 이름 배열
 */
export function addClasses(element: HTMLElement, classNames: string[]): void {
  element.classList.add(...classNames);
}

/**
 * 요소에서 여러 클래스를 제거합니다.
 * @param element 클래스를 제거할 요소
 * @param classNames 제거할 클래스 이름 배열
 */
export function removeClasses(element: HTMLElement, classNames: string[]): void {
  element.classList.remove(...classNames);
}

/**
 * 요소의 스타일을 설정합니다.
 * @param element 스타일을 설정할 요소
 * @param styles 설정할 스타일 객체
 */
export function setStyles(element: HTMLElement, styles: Record<string, string>): void {
  Object.entries(styles).forEach(([property, value]) => {
    element.style.setProperty(property, value);
  });
}

/**
 * 요소의 속성을 설정합니다.
 * @param element 속성을 설정할 요소
 * @param attributes 설정할 속성 객체
 */
export function setAttributes(element: HTMLElement, attributes: Record<string, string>): void {
  Object.entries(attributes).forEach(([name, value]) => {
    element.setAttribute(name, value);
  });
}

/**
 * 요소의 데이터 속성을 설정합니다.
 * @param element 데이터 속성을 설정할 요소
 * @param dataAttributes 설정할 데이터 속성 객체
 */
export function setDataAttributes(element: HTMLElement, dataAttributes: Record<string, string>): void {
  Object.entries(dataAttributes).forEach(([name, value]) => {
    element.dataset[name] = value;
  });
}

/**
 * 요소가 뷰포트에 보이는지 확인합니다.
 * @param element 확인할 요소
 * @param container 컨테이너 요소 (기본값: null, 윈도우 기준)
 * @param partial 부분적으로 보이는 것도 포함할지 여부 (기본값: false)
 * @returns 요소가 뷰포트에 보이는지 여부
 */
export function isElementInViewport(element: HTMLElement, container: HTMLElement | null = null, partial: boolean = false): boolean {
  const rect = element.getBoundingClientRect();
  
  if (container) {
    const containerRect = container.getBoundingClientRect();
    
    if (partial) {
      return (
        rect.top < containerRect.bottom &&
        rect.bottom > containerRect.top &&
        rect.left < containerRect.right &&
        rect.right > containerRect.left
      );
    }
    
    return (
      rect.top >= containerRect.top &&
      rect.bottom <= containerRect.bottom &&
      rect.left >= containerRect.left &&
      rect.right <= containerRect.right
    );
  }
  
  if (partial) {
    return (
      rect.top < window.innerHeight &&
      rect.bottom > 0 &&
      rect.left < window.innerWidth &&
      rect.right > 0
    );
  }
  
  return (
    rect.top >= 0 &&
    rect.bottom <= window.innerHeight &&
    rect.left >= 0 &&
    rect.right <= window.innerWidth
  );
}

/**
 * 요소를 스크롤하여 뷰포트에 보이게 합니다.
 * @param element 스크롤할 요소
 * @param container 컨테이너 요소 (기본값: null, 윈도우 기준)
 * @param options 스크롤 옵션
 */
export function scrollIntoView(element: HTMLElement, container: HTMLElement | null = null, options: ScrollIntoViewOptions = { behavior: 'smooth', block: 'nearest' }): void {
  if (container) {
    const containerRect = container.getBoundingClientRect();
    const elementRect = element.getBoundingClientRect();
    
    if (elementRect.top < containerRect.top) {
      container.scrollBy({
        top: elementRect.top - containerRect.top,
        behavior: options.behavior as ScrollBehavior
      });
    } else if (elementRect.bottom > containerRect.bottom) {
      container.scrollBy({
        top: elementRect.bottom - containerRect.bottom,
        behavior: options.behavior as ScrollBehavior
      });
    }
  } else {
    element.scrollIntoView(options);
  }
}

/**
 * 요소의 절대 위치를 가져옵니다.
 * @param element 위치를 가져올 요소
 * @returns 요소의 절대 위치 (top, left)
 */
export function getAbsolutePosition(element: HTMLElement): { top: number, left: number } {
  const rect = element.getBoundingClientRect();
  
  return {
    top: rect.top + window.scrollY,
    left: rect.left + window.scrollX
  };
}

/**
 * 요소의 크기를 가져옵니다.
 * @param element 크기를 가져올 요소
 * @returns 요소의 크기 (width, height)
 */
export function getElementSize(element: HTMLElement): { width: number, height: number } {
  const rect = element.getBoundingClientRect();
  
  return {
    width: rect.width,
    height: rect.height
  };
}

/**
 * 요소의 내부 크기를 가져옵니다. (패딩 제외)
 * @param element 내부 크기를 가져올 요소
 * @returns 요소의 내부 크기 (width, height)
 */
export function getElementInnerSize(element: HTMLElement): { width: number, height: number } {
  const computedStyle = window.getComputedStyle(element);
  const paddingLeft = parseFloat(computedStyle.paddingLeft);
  const paddingRight = parseFloat(computedStyle.paddingRight);
  const paddingTop = parseFloat(computedStyle.paddingTop);
  const paddingBottom = parseFloat(computedStyle.paddingBottom);
  
  return {
    width: element.clientWidth - paddingLeft - paddingRight,
    height: element.clientHeight - paddingTop - paddingBottom
  };
}

/**
 * 요소의 외부 크기를 가져옵니다. (마진 포함)
 * @param element 외부 크기를 가져올 요소
 * @returns 요소의 외부 크기 (width, height)
 */
export function getElementOuterSize(element: HTMLElement): { width: number, height: number } {
  const rect = element.getBoundingClientRect();
  const computedStyle = window.getComputedStyle(element);
  const marginLeft = parseFloat(computedStyle.marginLeft);
  const marginRight = parseFloat(computedStyle.marginRight);
  const marginTop = parseFloat(computedStyle.marginTop);
  const marginBottom = parseFloat(computedStyle.marginBottom);
  
  return {
    width: rect.width + marginLeft + marginRight,
    height: rect.height + marginTop + marginBottom
  };
} 