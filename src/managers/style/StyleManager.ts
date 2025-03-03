import { IStyleManager } from "src/core/interfaces/manager/IStyleManager";
import { Log } from "src/utils/log/Log";

/**
 * 스타일 관리자 클래스
 * 컴포넌트의 스타일을 관리합니다.
 */
export class StyleManager implements IStyleManager {
    private static instance: StyleManager;
    private themeChangeCallbacks: Set<(isDark: boolean) => void>;

    private constructor() {
        this.themeChangeCallbacks = new Set();
        this.initializeThemeObserver();
        Log.debug("StyleManager initialized");
    }

    /**
     * 스타일 관리자 인스턴스를 가져옵니다.
     * @returns StyleManager 인스턴스
     */
    public static getInstance(): StyleManager {
        if (!StyleManager.instance) {
            StyleManager.instance = new StyleManager();
        }
        return StyleManager.instance;
    }

    /**
     * 스타일 클래스를 추가합니다.
     * @param element 대상 HTML 엘리먼트
     * @param className 추가할 클래스 이름
     */
    public addClass(element: HTMLElement, className: string): void {
        try {
            element.classList.add(className);
            Log.debug(`Class added: ${className}`);
        } catch (error) {
            Log.error(`Failed to add class: ${className}`, error);
            throw error;
        }
    }

    /**
     * 스타일 클래스를 제거합니다.
     * @param element 대상 HTML 엘리먼트
     * @param className 제거할 클래스 이름
     */
    public removeClass(element: HTMLElement, className: string): void {
        try {
            element.classList.remove(className);
            Log.debug(`Class removed: ${className}`);
        } catch (error) {
            Log.error(`Failed to remove class: ${className}`, error);
            throw error;
        }
    }

    /**
     * 스타일 클래스를 토글합니다.
     * @param element 대상 HTML 엘리먼트
     * @param className 토글할 클래스 이름
     * @param force 강제 적용 여부 (선택사항)
     */
    public toggleClass(element: HTMLElement, className: string, force?: boolean): void {
        try {
            element.classList.toggle(className, force);
            Log.debug(`Class toggled: ${className}`);
        } catch (error) {
            Log.error(`Failed to toggle class: ${className}`, error);
            throw error;
        }
    }

    /**
     * 스타일 클래스의 존재 여부를 확인합니다.
     * @param element 대상 HTML 엘리먼트
     * @param className 확인할 클래스 이름
     * @returns 클래스 존재 여부
     */
    public hasClass(element: HTMLElement, className: string): boolean {
        try {
            return element.classList.contains(className);
        } catch (error) {
            Log.error(`Failed to check class: ${className}`, error);
            throw error;
        }
    }

    /**
     * 인라인 스타일을 설정합니다.
     * @param element 대상 HTML 엘리먼트
     * @param property CSS 속성 이름
     * @param value CSS 속성 값
     */
    public setStyle(element: HTMLElement, property: string, value: string): void {
        try {
            element.style.setProperty(property, value);
            Log.debug(`Style set: ${property} = ${value}`);
        } catch (error) {
            Log.error(`Failed to set style: ${property}`, error);
            throw error;
        }
    }

    /**
     * 인라인 스타일을 제거합니다.
     * @param element 대상 HTML 엘리먼트
     * @param property CSS 속성 이름
     */
    public removeStyle(element: HTMLElement, property: string): void {
        try {
            element.style.removeProperty(property);
            Log.debug(`Style removed: ${property}`);
        } catch (error) {
            Log.error(`Failed to remove style: ${property}`, error);
            throw error;
        }
    }

    /**
     * 여러 스타일을 한 번에 설정합니다.
     * @param element 대상 HTML 엘리먼트
     * @param styles CSS 스타일 객체
     */
    public setStyles(element: HTMLElement, styles: Record<string, string>): void {
        try {
            Object.entries(styles).forEach(([property, value]) => {
                this.setStyle(element, property, value);
            });
            Log.debug("Multiple styles set");
        } catch (error) {
            Log.error("Failed to set multiple styles", error);
            throw error;
        }
    }

    /**
     * 테마 변경을 감지하고 처리합니다.
     * @param callback 테마 변경 시 실행할 콜백 함수
     */
    public onThemeChange(callback: (isDark: boolean) => void): void {
        try {
            this.themeChangeCallbacks.add(callback);
            // 현재 테마 상태로 즉시 콜백 실행
            const isDark = document.body.classList.contains('theme-dark');
            callback(isDark);
            Log.debug("Theme change callback registered");
        } catch (error) {
            Log.error("Failed to register theme change callback", error);
            throw error;
        }
    }

    /**
     * 테마 변경 감지를 초기화합니다.
     */
    private initializeThemeObserver(): void {
        try {
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.target === document.body && mutation.attributeName === 'class') {
                        const isDark = document.body.classList.contains('theme-dark');
                        this.notifyThemeChange(isDark);
                    }
                });
            });

            observer.observe(document.body, {
                attributes: true,
                attributeFilter: ['class']
            });

            Log.debug("Theme observer initialized");
        } catch (error) {
            Log.error("Failed to initialize theme observer", error);
            throw error;
        }
    }

    /**
     * 테마 변경을 구독자들에게 알립니다.
     * @param isDark 다크 테마 여부
     */
    private notifyThemeChange(isDark: boolean): void {
        try {
            this.themeChangeCallbacks.forEach(callback => {
                try {
                    callback(isDark);
                } catch (error) {
                    Log.error("Error in theme change callback", error);
                }
            });
            Log.debug(`Theme change notified: ${isDark ? 'dark' : 'light'}`);
        } catch (error) {
            Log.error("Failed to notify theme change", error);
            throw error;
        }
    }
} 