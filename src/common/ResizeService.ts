import { Events } from 'obsidian';

/**
 * 중앙 집중식 크기 변경 감지 서비스
 * 
 * 이 클래스는 여러 컴포넌트에서 중복으로 ResizeObserver를 사용하는 문제를 해결하기 위한
 * 중앙 집중식 크기 변경 감지 서비스를 제공합니다.
 */
export class ResizeService {
    private static instance: ResizeService;
    private resizeObserver: ResizeObserver;
    private observedElements: Map<string, HTMLElement> = new Map();
    private elementSizes: Map<string, { width: number, height: number }> = new Map();
    public events: Events = new Events();
    private debounceTimeouts: Map<string, NodeJS.Timeout> = new Map();
    private debounceDelay: number = 50; // 디바운스 지연 시간 (ms)
    private debugMode: boolean = false;

    private constructor() {
        this.resizeObserver = new ResizeObserver(this.handleResize.bind(this));
        this.logDebug('ResizeService 초기화됨');
    }

    /**
     * ResizeService의 싱글톤 인스턴스를 반환합니다.
     */
    public static getInstance(): ResizeService {
        if (!ResizeService.instance) {
            ResizeService.instance = new ResizeService();
        }
        return ResizeService.instance;
    }

    /**
     * 디버그 로그를 출력합니다.
     */
    private logDebug(message: string, data?: any): void {
        if (this.debugMode) {
            console.log(`[ResizeService] ${message}`, data ? data : '');
        }
    }

    /**
     * 디버그 모드를 설정합니다.
     */
    public setDebugMode(enabled: boolean): void {
        this.debugMode = enabled;
    }

    /**
     * 디버그 모드를 설정합니다. (별칭)
     */
    public setDebug(enabled: boolean): void {
        this.setDebugMode(enabled);
    }

    /**
     * 요소의 크기 변경을 관찰합니다.
     * @param id 요소 식별자
     * @param element 관찰할 DOM 요소
     */
    public observe(id: string, element: HTMLElement): void {
        if (!element || !document.body.contains(element)) {
            this.logDebug(`유효하지 않은 요소: ${id}`);
            return;
        }

        if (this.observedElements.has(id)) {
            this.logDebug(`이미 관찰 중인 요소: ${id}`);
            return;
        }

        this.observedElements.set(id, element);
        this.elementSizes.set(id, {
            width: element.offsetWidth,
            height: element.offsetHeight
        });

        this.resizeObserver.observe(element);
        this.logDebug(`요소 관찰 시작: ${id}`, {
            width: element.offsetWidth,
            height: element.offsetHeight
        });
    }

    /**
     * 요소의 크기 변경 관찰을 중지합니다.
     * @param id 요소 식별자
     */
    public unobserve(id: string): void {
        const element = this.observedElements.get(id);
        if (element) {
            this.resizeObserver.unobserve(element);
            this.observedElements.delete(id);
            this.elementSizes.delete(id);
            
            // 디바운스 타임아웃이 있으면 제거
            const timeout = this.debounceTimeouts.get(id);
            if (timeout) {
                clearTimeout(timeout);
                this.debounceTimeouts.delete(id);
            }
            
            this.logDebug(`요소 관찰 중지: ${id}`);
        }
    }

    /**
     * 모든 요소의 크기 변경 관찰을 중지합니다.
     */
    public disconnect(): void {
        this.resizeObserver.disconnect();
        this.observedElements.clear();
        this.elementSizes.clear();
        
        // 모든 디바운스 타임아웃 제거
        this.debounceTimeouts.forEach((timeout) => {
            clearTimeout(timeout);
        });
        this.debounceTimeouts.clear();
        
        this.logDebug('모든 요소 관찰 중지');
    }

    /**
     * 요소의 현재 크기를 반환합니다.
     * @param id 요소 식별자
     */
    public getElementSize(id: string): { width: number, height: number } | null {
        return this.elementSizes.get(id) || null;
    }

    /**
     * ResizeObserver 콜백 함수
     */
    private handleResize(entries: ResizeObserverEntry[]): void {
        for (const entry of entries) {
            const element = entry.target as HTMLElement;
            
            // 요소 ID 찾기
            let elementId: string | null = null;
            for (const [id, el] of this.observedElements.entries()) {
                if (el === element) {
                    elementId = id;
                    break;
                }
            }
            
            if (!elementId) continue;
            
            // 이전 크기 가져오기
            const prevSize = this.elementSizes.get(elementId);
            
            // 새 크기 계산 (소수점 제거)
            const newWidth = Math.floor(entry.contentRect.width);
            const newHeight = Math.floor(entry.contentRect.height);
            
            // 크기가 변경되었는지 확인
            const isChanged = !prevSize || 
                Math.abs(prevSize.width - newWidth) > 1 || 
                Math.abs(prevSize.height - newHeight) > 1;
            
            if (isChanged) {
                // 새 크기 저장
                this.elementSizes.set(elementId, {
                    width: newWidth,
                    height: newHeight
                });
                
                // 기존 디바운스 타임아웃이 있으면 제거
                const existingTimeout = this.debounceTimeouts.get(elementId);
                if (existingTimeout) {
                    clearTimeout(existingTimeout);
                }
                
                // 디바운스된 이벤트 발생
                const timeout = setTimeout(() => {
                    this.logDebug(`요소 크기 변경: ${elementId}`, {
                        prev: prevSize,
                        new: { width: newWidth, height: newHeight }
                    });
                    
                    // 이벤트 발생
                    this.events.trigger('resize', elementId, {
                        width: newWidth,
                        height: newHeight
                    });
                    
                    this.debounceTimeouts.delete(elementId);
                }, this.debounceDelay);
                
                this.debounceTimeouts.set(elementId, timeout);
            }
        }
    }
} 