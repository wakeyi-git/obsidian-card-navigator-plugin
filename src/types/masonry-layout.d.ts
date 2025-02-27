declare module 'masonry-layout' {
    interface MasonryOptions {
        /**
         * 아이템 요소 선택자
         */
        itemSelector: string;
        
        /**
         * 열 너비
         */
        columnWidth: number | string;
        
        /**
         * 아이템 간 간격
         */
        gutter?: number | string;
        
        /**
         * 퍼센트 위치 사용 여부
         */
        percentPosition?: boolean;
        
        /**
         * 수평 순서 사용 여부
         */
        horizontalOrder?: boolean;
        
        /**
         * 전환 지속 시간
         */
        transitionDuration?: string | number;
        
        /**
         * 컨테이너 요소의 크기 변경 시 레이아웃 재계산 여부
         */
        resize?: boolean;
        
        /**
         * 초기화 시 레이아웃 실행 여부
         */
        initLayout?: boolean;
    }
    
    interface MasonryItem {
        element: HTMLElement;
        position: {
            x: number;
            y: number;
        };
        size: {
            width: number;
            height: number;
        };
    }
    
    interface MasonryEvents {
        layoutComplete: (items: MasonryItem[]) => void;
        removeComplete: (items: MasonryItem[]) => void;
    }
    
    class Masonry {
        constructor(element: HTMLElement | string, options?: MasonryOptions);
        
        /**
         * 레이아웃을 재계산합니다.
         */
        layout(): void;
        
        /**
         * 리소스를 정리합니다.
         */
        destroy(): void;
        
        /**
         * 아이템을 추가합니다.
         */
        addItems(elements: HTMLElement | HTMLElement[]): void;
        
        /**
         * 아이템을 제거합니다.
         */
        remove(elements: HTMLElement | HTMLElement[]): void;
        
        /**
         * 이벤트 리스너를 등록합니다.
         */
        on<K extends keyof MasonryEvents>(
            eventName: K,
            listener: MasonryEvents[K]
        ): this;
        
        /**
         * 이벤트 리스너를 제거합니다.
         */
        off<K extends keyof MasonryEvents>(
            eventName: K,
            listener: MasonryEvents[K]
        ): this;
        
        /**
         * 한 번만 실행되는 이벤트 리스너를 등록합니다.
         */
        once<K extends keyof MasonryEvents>(
            eventName: K,
            listener: MasonryEvents[K]
        ): this;
    }
    
    export default Masonry;
} 