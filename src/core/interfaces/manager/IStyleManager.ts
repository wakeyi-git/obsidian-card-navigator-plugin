/**
 * 스타일 관리자 인터페이스
 * 컴포넌트의 스타일을 관리하기 위한 인터페이스를 정의합니다.
 */
export interface IStyleManager {
    /**
     * 스타일 클래스를 추가합니다.
     * @param element 대상 HTML 엘리먼트
     * @param className 추가할 클래스 이름
     */
    addClass(element: HTMLElement, className: string): void;

    /**
     * 스타일 클래스를 제거합니다.
     * @param element 대상 HTML 엘리먼트
     * @param className 제거할 클래스 이름
     */
    removeClass(element: HTMLElement, className: string): void;

    /**
     * 스타일 클래스를 토글합니다.
     * @param element 대상 HTML 엘리먼트
     * @param className 토글할 클래스 이름
     * @param force 강제 적용 여부 (선택사항)
     */
    toggleClass(element: HTMLElement, className: string, force?: boolean): void;

    /**
     * 스타일 클래스의 존재 여부를 확인합니다.
     * @param element 대상 HTML 엘리먼트
     * @param className 확인할 클래스 이름
     */
    hasClass(element: HTMLElement, className: string): boolean;

    /**
     * 인라인 스타일을 설정합니다.
     * @param element 대상 HTML 엘리먼트
     * @param property CSS 속성 이름
     * @param value CSS 속성 값
     */
    setStyle(element: HTMLElement, property: string, value: string): void;

    /**
     * 인라인 스타일을 제거합니다.
     * @param element 대상 HTML 엘리먼트
     * @param property CSS 속성 이름
     */
    removeStyle(element: HTMLElement, property: string): void;

    /**
     * 여러 스타일을 한 번에 설정합니다.
     * @param element 대상 HTML 엘리먼트
     * @param styles CSS 스타일 객체
     */
    setStyles(element: HTMLElement, styles: Record<string, string>): void;

    /**
     * 테마 변경을 감지하고 처리합니다.
     * @param callback 테마 변경 시 실행할 콜백 함수
     */
    onThemeChange(callback: (isDark: boolean) => void): void;
} 