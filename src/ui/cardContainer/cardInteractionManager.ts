import { TFile, Notice } from 'obsidian';
import { Card } from '../../common/types';
import { DEFAULT_SETTINGS } from '../../common/types';

/**
 * 카드 상호작용 관리 클래스
 */
export class CardInteractionManager {
    private settings: any;
    private interactionCache: Set<string> = new Set();
    private longPressTimeout: number | null = null;
    private isLongPressing: boolean = false;
    private isDragging: boolean = false;
    
    // 이벤트 핸들러 참조 저장 (제거 용도)
    private eventHandlers: Map<string, {
        element: HTMLElement,
        type: string,
        handler: EventListener
    }[]> = new Map();

    constructor(
        private openFile: (file: TFile) => void,
        private showMenu: (cardEl: HTMLElement, card: Card, event: MouseEvent) => void,
        private handleDragStart: (event: DragEvent, card: Card) => void,
        private handleDragOver: (event: DragEvent) => void,
        private handleDrop: (event: DragEvent, targetCard: Card) => void
    ) {
        this.settings = DEFAULT_SETTINGS;
    }

    /**
     * 설정 업데이트
     * @param settings 새 설정
     */
    public updateSettings(settings: any): void {
        this.settings = settings;
    }

    /**
     * 카드 상호작용 설정
     * @param cardEl 카드 요소
     * @param card 카드 데이터
     */
    public setupInteractions(cardEl: HTMLElement, card: Card): void {
        // 이미 상호작용이 설정된 카드는 건너뜀
        if (this.interactionCache.has(card.id)) {
            return;
        }
        
        // 상호작용 캐시에 추가
        this.interactionCache.add(card.id);
        
        // 이벤트 핸들러 배열 초기화
        const handlers: {
            element: HTMLElement,
            type: string,
            handler: EventListener
        }[] = [];
        
        // 클릭 이벤트 핸들러
        const clickHandler = this.createClickHandler(card);
        cardEl.addEventListener('click', clickHandler);
        handlers.push({ element: cardEl, type: 'click', handler: clickHandler });
        
        // 컨텍스트 메뉴 이벤트 핸들러
        const contextMenuHandler = this.createContextMenuHandler(cardEl, card);
        cardEl.addEventListener('contextmenu', contextMenuHandler);
        handlers.push({ element: cardEl, type: 'contextmenu', handler: contextMenuHandler });
        
        // 드래그 앤 드롭 이벤트 핸들러 (항상 활성화)
        // 드래그 시작 이벤트 핸들러
        const dragStartHandler = this.createDragStartHandler(card);
        cardEl.addEventListener('dragstart', dragStartHandler);
        handlers.push({ element: cardEl, type: 'dragstart', handler: dragStartHandler });
        
        // 드래그 종료 이벤트 핸들러
        const dragEndHandler = this.createDragEndHandler();
        cardEl.addEventListener('dragend', dragEndHandler);
        handlers.push({ element: cardEl, type: 'dragend', handler: dragEndHandler });
        
        // 드래그 오버 이벤트 핸들러
        const dragOverHandler = this.createDragOverHandler();
        cardEl.addEventListener('dragover', dragOverHandler);
        handlers.push({ element: cardEl, type: 'dragover', handler: dragOverHandler });
        
        // 드롭 이벤트 핸들러
        const dropHandler = this.createDropHandler(card);
        cardEl.addEventListener('drop', dropHandler);
        handlers.push({ element: cardEl, type: 'drop', handler: dropHandler });
        
        // 드래그 가능 속성 설정
        cardEl.setAttribute('draggable', 'true');
        
        // 모바일 터치 이벤트 핸들러 (설정에서 활성화된 경우)
        if (this.settings?.enableMobileInteractions) {
            // 터치 시작 이벤트 핸들러
            const touchStartHandler = this.createTouchStartHandler(cardEl, card);
            cardEl.addEventListener('touchstart', touchStartHandler);
            handlers.push({ element: cardEl, type: 'touchstart', handler: touchStartHandler });
            
            // 터치 종료 이벤트 핸들러
            const touchEndHandler = this.createTouchEndHandler();
            cardEl.addEventListener('touchend', touchEndHandler);
            handlers.push({ element: cardEl, type: 'touchend', handler: touchEndHandler });
            
            // 터치 이동 이벤트 핸들러
            const touchMoveHandler = this.createTouchMoveHandler();
            cardEl.addEventListener('touchmove', touchMoveHandler);
            handlers.push({ element: cardEl, type: 'touchmove', handler: touchMoveHandler });
        }
        
        // 이벤트 핸들러 참조 저장
        this.eventHandlers.set(card.id, handlers);
    }

    /**
     * 카드 상호작용 제거
     * @param cardId 카드 ID
     */
    public removeInteractions(cardId: string): void {
        // 이벤트 핸들러 참조 가져오기
        const handlers = this.eventHandlers.get(cardId);
        
        if (handlers) {
            // 모든 이벤트 핸들러 제거
            handlers.forEach(({ element, type, handler }) => {
                element.removeEventListener(type, handler);
            });
            
            // 이벤트 핸들러 참조 제거
            this.eventHandlers.delete(cardId);
        }
        
        // 상호작용 캐시에서 제거
        this.interactionCache.delete(cardId);
    }

    /**
     * 클릭 이벤트 핸들러 생성
     */
    private createClickHandler(card: Card): EventListener {
        return (event: Event) => {
            // 드래그 중이거나 롱 프레스 중이면 무시
            if (this.isDragging || this.isLongPressing) {
                return;
            }
            
            // 파일 열기
            if (card.file) {
                this.openFile(card.file);
            }
        };
    }

    /**
     * 컨텍스트 메뉴 이벤트 핸들러 생성
     */
    private createContextMenuHandler(cardEl: HTMLElement, card: Card): EventListener {
        return (event: Event) => {
            // 기본 컨텍스트 메뉴 방지
            event.preventDefault();
            
            // 카드 메뉴 표시
            this.showMenu(cardEl, card, event as MouseEvent);
        };
    }

    /**
     * 드래그 시작 이벤트 핸들러 생성
     */
    private createDragStartHandler(card: Card): EventListener {
        return (event: Event) => {
            // 드래그 시작 상태 설정
            this.isDragging = true;
            
            // 드래그 이벤트 처리
            this.handleDragStart(event as DragEvent, card);
        };
    }

    /**
     * 드래그 종료 이벤트 핸들러 생성
     */
    private createDragEndHandler(): EventListener {
        return (event: Event) => {
            // 드래그 상태 초기화
            this.isDragging = false;
            
            // 약간의 지연 후 상태 초기화 (클릭 이벤트와 충돌 방지)
            setTimeout(() => {
                this.isDragging = false;
            }, 50);
        };
    }

    /**
     * 드래그 오버 이벤트 핸들러 생성
     */
    private createDragOverHandler(): EventListener {
        return (event: Event) => {
            // 기본 동작 방지
            event.preventDefault();
            
            // 드래그 오버 이벤트 처리
            this.handleDragOver(event as DragEvent);
        };
    }

    /**
     * 드롭 이벤트 핸들러 생성
     */
    private createDropHandler(card: Card): EventListener {
        return (event: Event) => {
            // 기본 동작 방지
            event.preventDefault();
            
            // 드래그 상태 초기화
            this.isDragging = false;
            
            // 드롭 이벤트 처리
            this.handleDrop(event as DragEvent, card);
        };
    }

    /**
     * 터치 시작 이벤트 핸들러 생성
     */
    private createTouchStartHandler(cardEl: HTMLElement, card: Card): EventListener {
        return (event: Event) => {
            // 롱 프레스 타이머 설정 (500ms)
            this.longPressTimeout = window.setTimeout(() => {
                this.isLongPressing = true;
                
                // 햅틱 피드백 (지원되는 경우)
                if (navigator.vibrate) {
                    navigator.vibrate(50);
                }
                
                // 컨텍스트 메뉴 표시
                const touch = (event as TouchEvent).touches[0];
                const mouseEvent = new MouseEvent('contextmenu', {
                    clientX: touch.clientX,
                    clientY: touch.clientY,
                    bubbles: true,
                    cancelable: true,
                    view: window
                });
                
                this.showMenu(cardEl, card, mouseEvent);
                
                // 타이머 초기화
                this.longPressTimeout = null;
            }, 500);
        };
    }

    /**
     * 터치 종료 이벤트 핸들러 생성
     */
    private createTouchEndHandler(): EventListener {
        return () => {
            // 롱 프레스 타이머 취소
            if (this.longPressTimeout !== null) {
                clearTimeout(this.longPressTimeout);
                this.longPressTimeout = null;
            }
            
            // 롱 프레스 상태 초기화
            setTimeout(() => {
                this.isLongPressing = false;
            }, 10);
        };
    }

    /**
     * 터치 이동 이벤트 핸들러 생성
     */
    private createTouchMoveHandler(): EventListener {
        return () => {
            // 롱 프레스 타이머 취소
            if (this.longPressTimeout !== null) {
                clearTimeout(this.longPressTimeout);
                this.longPressTimeout = null;
            }
        };
    }

    /**
     * 캐시 정리
     */
    public clearCache(): void {
        this.interactionCache.clear();
    }
}