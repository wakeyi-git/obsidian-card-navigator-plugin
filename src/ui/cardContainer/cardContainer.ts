import { WorkspaceLeaf, TFile, TFolder, debounce, App} from 'obsidian';
import CardNavigatorPlugin from 'main';
import { CardMaker } from './cardMaker';
import { CardRenderer } from './cardRenderer';
import { LayoutStrategy } from 'layouts/layoutStrategy';
import { KeyboardNavigator } from './keyboardNavigator';
import { CardNavigatorSettings } from "common/types";
import { Card, SortCriterion, SortOrder } from 'common/types';
import { t } from "i18next";
import { LayoutManager } from 'layouts/layoutManager';
import { Scroller } from './scroller';
import { getSearchService } from 'ui/toolbar/search/';
import { LayoutStyleManager } from 'layouts/layoutStyleManager';

// Main class for managing the card container and its layout
export class CardContainer {
    //#region 클래스 속성
    private app: App;
    private containerEl!: HTMLElement; // 느낌표로 초기화 보장
    public cardMaker: CardMaker;
    private cardRenderer: CardRenderer | null = null;
    private layoutManager!: LayoutManager;
    private currentLayout: CardNavigatorSettings['defaultLayout'];
    public isVertical: boolean;
    private layoutStyleManager!: LayoutStyleManager;
    private keyboardNavigator: KeyboardNavigator | null = null;
    private scroller!: Scroller;
    public cards: Card[] = [];
    private lastActiveFolder: string | null = null; // 마지막 활성 폴더 경로 추적
    private resizeObserver: ResizeObserver;
    private focusedCardId: string | null = null;
    private searchResults: TFile[] | null = null;
    private isResizing = false;
    private pendingResizeFrame: number | null = null;
    private isDisplayingCards = false;
    private pendingDisplayRequest: { files: TFile[], timestamp: number } | null = null;
    private lastWidth = 0;
    private lastHeight = 0;
    private pendingFileOpenRequest: { file: TFile, folderChanged: boolean, timestamp: number } | null = null;
    private pendingResizeRequest = false;
    //#endregion

    //#region 초기화 및 정리
    // 생성자: 기본 컴포넌트 초기화
    constructor(private plugin: CardNavigatorPlugin, private leaf: WorkspaceLeaf) {
        // 기본 컴포넌트만 초기화
        this.app = this.plugin.app;
        this.cardMaker = new CardMaker(this.plugin);
        this.isVertical = true; // 카드를 세로 방향으로 배열하는 기본 설정 (세로 스크롤)
        this.currentLayout = this.plugin.settings.defaultLayout;
        
        // 리소스 관리용 옵저버 초기화
        this.resizeObserver = new ResizeObserver(debounce(() => {
            this.handleResize();
        }, 100));

        // 파일 열림 이벤트 등록
        this.plugin.registerEvent(
            this.app.workspace.on('file-open', async (file) => {
                if (!this.cardRenderer || !file) return;
                
                // 현재 파일의 폴더 경로 확인
                const currentFolder = file.parent ? file.parent.path : null;
                
                // 폴더 변경 여부 확인
                const folderChanged = this.lastActiveFolder !== currentFolder;
                
                // 이미 렌더링 중인 경우 중복 렌더링 방지
                if (this.isDisplayingCards) {
                    console.log('[CardNavigator] 이미 렌더링 중, file-open 이벤트 처리 지연');
                    // 마지막 활성 폴더 업데이트는 계속 진행
                    this.lastActiveFolder = currentFolder;
                    
                    // 대기 중인 요청에 추가
                    if (!this.pendingFileOpenRequest) {
                        this.pendingFileOpenRequest = {
                            file,
                            folderChanged,
                            timestamp: Date.now()
                        };
                    } else {
                        // 기존 요청 업데이트
                        this.pendingFileOpenRequest.file = file;
                        this.pendingFileOpenRequest.folderChanged = folderChanged || this.pendingFileOpenRequest.folderChanged;
                        this.pendingFileOpenRequest.timestamp = Date.now();
                    }
                    return;
                }
                
                try {
                    // 렌더링 상태 플래그 설정
                    this.isDisplayingCards = true;
                    
                    if (folderChanged) {
                        // 폴더가 변경된 경우 전체 렌더링 수행
                        console.log('[CardNavigator] 폴더 변경 감지, 전체 렌더링 수행');
                        await this.cardRenderer.renderCards(this.cards, this.focusedCardId, file);
                    } else {
                        // 활성 카드 상태만 업데이트
                        const activeCardFound = this.cardRenderer.updateActiveCard(file, this.focusedCardId);
                        
                        // 활성 카드를 찾지 못한 경우에만 전체 렌더링 수행
                        if (!activeCardFound) {
                            console.log('[CardNavigator] 활성 카드를 찾지 못함, 전체 렌더링 수행');
                            await this.cardRenderer.renderCards(this.cards, this.focusedCardId, file);
                        }
                    }
                    
                    // 마지막 활성 폴더 업데이트
                    this.lastActiveFolder = currentFolder;
                } finally {
                    // 렌더링 상태 플래그 해제
                    this.isDisplayingCards = false;
                    
                    // 대기 중인 file-open 요청 처리
                    this.processPendingFileOpenRequest();
                }
                
                // DOM 업데이트 후 스크롤 실행
                const checkRenderingComplete = () => {
                    // 활성 카드 찾기
                    const activeCard = this.containerEl.querySelector('.card-navigator-active, .active') as HTMLElement;
                    if (!activeCard) {
                        // 활성 카드가 없으면 약간 지연 후 다시 확인
                        setTimeout(checkRenderingComplete, 50);
                        return;
                    }
                    
                    // 마크다운 렌더링 상태 확인
                    const markdownContainer = activeCard.querySelector('.markdown-rendered') as HTMLElement;
                    const isRendering = activeCard.hasAttribute('data-rendering') || 
                                       (markdownContainer && markdownContainer.classList.contains('loading'));
                    
                    if (isRendering && this.plugin.settings.renderContentAsHtml) {
                        // 렌더링 중이면 약간 지연 후 다시 확인 (최대 10회)
                        setTimeout(checkRenderingComplete, 100);
                    } else {
                        // 렌더링이 완료되었거나 HTML 렌더링을 사용하지 않는 경우 스크롤 실행
                        this.scrollToActiveCard(true);
                    }
                };
                
                // 약간의 지연 후 렌더링 상태 확인 시작
                setTimeout(checkRenderingComplete, 100);
            })
        );
    }

    // 컨테이너 초기화 메서드
    async initialize(containerEl: HTMLElement) {
        console.log('[CardNavigator] CardContainer.initialize 시작');
        this.cleanup();
        
        this.containerEl = containerEl;
        this.app = this.plugin.app;
        
        try {
            // CSS 클래스 추가
            this.containerEl.classList.add('card-navigator-container');
            
            // 컨테이너 크기가 설정될 때까지 대기
            console.log('[CardNavigator] 컨테이너 크기 대기 시작');
            await this.waitForContainerSize();
            console.log('[CardNavigator] 컨테이너 크기 대기 완료');
            
            // 레이아웃 스타일 매니저 초기화
            console.log('[CardNavigator] 레이아웃 스타일 매니저 초기화');
            this.layoutStyleManager = new LayoutStyleManager(this.app, containerEl, this.plugin.settings);
            console.log('[CardNavigator] 레이아웃 스타일 매니저 초기화 완료');
            
            // 초기 컨테이너 크기 설정 및 방향 결정
            this.initializeContainerSizeAndOrientation();
            
            // 레이아웃 매니저 초기화
            console.log('[CardNavigator] 레이아웃 매니저 초기화');
            this.layoutManager = new LayoutManager(this.plugin, containerEl, this.cardMaker);
            
            // 스크롤러 초기화
            console.log('[CardNavigator] 스크롤러 초기화');
            this.scroller = new Scroller(
                containerEl,
                this.plugin,
                () => this.layoutManager.getLayoutStrategy(),
                () => this.getCardSize()
            );
            console.log('[CardNavigator] 스크롤러 초기화 완료');
            
            // 컨테이너 스타일 업데이트
            console.log('[CardNavigator] 컨테이너 스타일 업데이트');
            this.updateContainerStyle();
            console.log('[CardNavigator] 컨테이너 스타일 업데이트 완료');
            
            // 카드 렌더러 초기화
            console.log('[CardNavigator] 카드 렌더러 초기화');
            this.cardRenderer = new CardRenderer(
                this.containerEl,
                this.cardMaker,
                this.layoutManager,
                this.plugin
            );

            // 키보드 내비게이터 초기화
            console.log('[CardNavigator] 키보드 내비게이터 초기화');
            this.initializeKeyboardNavigator();
            
            // 리사이즈 옵저버 설정
            console.log('[CardNavigator] 리사이즈 옵저버 설정');
            this.setupResizeObserver();
            console.log('[CardNavigator] 컨테이너 크기 관찰 시작');
            
            // 스크롤 이벤트 리스너 설정
            console.log('[CardNavigator] 스크롤 이벤트 리스너 설정');
            this.containerEl.addEventListener('scroll', this.handleScroll);
            
            // 초기 레이아웃 업데이트 강제 실행
            console.log('[CardNavigator] 초기 레이아웃 업데이트 대기');
            await new Promise(resolve => setTimeout(resolve, 100));
            console.log('[CardNavigator] 초기 리사이즈 처리 시작');
            this.handleResize();
            console.log('[CardNavigator] 초기 리사이즈 처리 완료');
            
            // 리사이즈 이벤트 리스너 설정
            console.log('[CardNavigator] 리사이즈 이벤트 리스너 설정');
            this.containerEl.addEventListener('masonry-resize', (e: Event) => {
                const customEvent = e as CustomEvent;
                if (customEvent.detail?.needsRecalculation) {
                    const activeFile = this.app.workspace.getActiveFile();
                    this.cardRenderer?.renderCards(this.cards, this.focusedCardId, activeFile);
                }
            });
            
            this.containerEl.addEventListener('grid-resize', (e: Event) => {
                const customEvent = e as CustomEvent;
                if (customEvent.detail?.needsRecalculation) {
                    const activeFile = this.app.workspace.getActiveFile();
                    this.cardRenderer?.renderCards(this.cards, this.focusedCardId, activeFile);
                }
            });
            
            this.containerEl.addEventListener('list-resize', (e: Event) => {
                // 리스트 레이아웃은 CSS 플렉스박스를 활용하므로 
                // 카드 너비만 업데이트하고 전체 재렌더링은 필요 없음
                const customEvent = e as CustomEvent;
                if (customEvent.detail?.needsRecalculation) {
                    // 카드 너비 업데이트만 필요한 경우 처리
                    if (customEvent.detail.newCardWidth) {
                        this.updateCardWidths(customEvent.detail.newCardWidth);
                    } else {
                        // 필요한 경우에만 전체 재렌더링
                        const activeFile = this.app.workspace.getActiveFile();
                        this.cardRenderer?.renderCards(this.cards, this.focusedCardId, activeFile);
                    }
                }
            });
            
            this.containerEl.addEventListener('layout-type-changed', (e: Event) => {
                const customEvent = e as CustomEvent;
                if (customEvent.detail) {
                    // 레이아웃 타입이 변경되었으므로 카드 렌더러의 레이아웃 전략 업데이트
                    const layoutStrategy = this.layoutManager.getLayoutStrategy();
                    this.cardRenderer?.setLayoutStrategy(layoutStrategy);
                    
                    // 카드 다시 렌더링
                    const activeFile = this.app.workspace.getActiveFile();
                    this.cardRenderer?.renderCards(this.cards, this.focusedCardId, activeFile);
                }
            });
            
            console.log('[CardNavigator] CardContainer.initialize 완료');
        } catch (error) {
            console.error('[CardNavigator] 카드 컨테이너 초기화 중 오류 발생:', error);
            throw error;
        }
    }

    // 리소스 정리 메서드
    private cleanup() {
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }

        // 추가: 대기 중인 애니메이션 프레임 취소
        if (this.pendingResizeFrame !== null) {
            cancelAnimationFrame(this.pendingResizeFrame);
            this.pendingResizeFrame = null;
        }

        // 추가: 이벤트 리스너 정리
        this.containerEl?.removeEventListener('scroll', this.handleScroll);

        // 기존 cleanup 로직
        if (this.cardRenderer) {
            this.cardRenderer.cleanup?.();
            this.cardRenderer = null;
        }
        if (this.keyboardNavigator) {
            this.keyboardNavigator.cleanup?.();
            this.keyboardNavigator = null;
        }
        if (this.containerEl) {
            this.containerEl.empty();
        }

        // 추가: 참조 정리
        this.cards = [];
        this.searchResults = null;
        this.focusedCardId = null;
    }

    // 컨테이너 닫기 메서드
    onClose() {
        this.cleanup();
    }

    // 리사이즈 옵저버 설정 메서드
    private setupResizeObserver() {
        if (this.containerEl) {
            // 기존 옵저버가 있으면 정리
            if (this.resizeObserver) {
                this.resizeObserver.disconnect();
            }
            
            // 새 리사이즈 옵저버 생성
            this.resizeObserver = new ResizeObserver((entries) => {
                // 이미 리사이징 중이면 추가 처리 방지
                if (this.isResizing) return;
                
                // 애니메이션 프레임 사용하여 성능 최적화
                if (this.pendingResizeFrame !== null) {
                    cancelAnimationFrame(this.pendingResizeFrame);
                }
                
                this.pendingResizeFrame = requestAnimationFrame(() => {
                    const entry = entries[0];
                    if (entry && entry.contentRect) {
                        const width = entry.contentRect.width;
                        const height = entry.contentRect.height;
                        
                        // 의미 있는 크기 변경이 있을 때만 처리
                        if (width > 0 && height > 0 && 
                            (Math.abs(this.lastWidth - width) > 5 || 
                             Math.abs(this.lastHeight - height) > 5)) {
                            
                            console.log(`[CardNavigator] 컨테이너 크기 변경: ${width}x${height}`);
                            this.lastWidth = width;
                            this.lastHeight = height;
                            this.handleResize();
                        }
                    }
                    this.pendingResizeFrame = null;
                });
            });
            
            // 컨테이너 관찰 시작
            this.resizeObserver.observe(this.containerEl);
            console.log('[CardNavigator] 리사이즈 옵저버 설정 완료');
        } else {
            console.warn('[CardNavigator] 컨테이너 요소가 없어 리사이즈 옵저버를 설정할 수 없음');
        }
    }
    
    // 키보드 네비게이터 초기화 메서드
    private initializeKeyboardNavigator() {
        if (this.containerEl) {
            this.keyboardNavigator = new KeyboardNavigator(this.plugin, this, this.containerEl);
        } else {
            console.warn('Container element not available for KeyboardNavigator');
        }
    }
    //#endregion

    //#region 컨테이너 스타일 및 레이아웃 관리
    /**
     * 컨테이너 크기 대기 메서드
     * 컨테이너 크기가 설정될 때까지 대기하거나, 리프 크기를 활용하여 초기 크기를 설정합니다.
     */
    private waitForContainerSize(): Promise<void> {
        return new Promise<void>((resolve) => {
            // 컨테이너 크기가 이미 설정되어 있는지 확인
            if (this.containerEl.offsetWidth > 0 && this.containerEl.offsetHeight > 0) {
                console.log('[CardNavigator] 컨테이너 크기가 이미 설정됨:', 
                    this.containerEl.offsetWidth, 'x', this.containerEl.offsetHeight);
                this.lastWidth = this.containerEl.offsetWidth;
                this.lastHeight = this.containerEl.offsetHeight;
                resolve();
                return;
            }

            // 뷰가 처음 생성되는 경우인지 확인
            const isNewView = !this.containerEl.closest('.workspace-leaf')?.hasClass('mod-active');
            
            // 새 뷰인 경우 리프 크기를 활용하여 초기 크기 설정
            if (isNewView) {
                this.setInitialSizeFromLeaf();
                resolve();
                return;
            }

            // 기존 뷰인 경우 크기가 설정될 때까지 대기 (최대 1초)
            this.waitForExistingViewSize(resolve);
        });
    }

    /**
     * 리프 크기를 활용하여 초기 컨테이너 크기를 설정합니다.
     * 새 뷰가 생성될 때 호출됩니다.
     */
    private setInitialSizeFromLeaf(): void {
        console.log('[CardNavigator] 새 뷰 감지, 리프 크기 활용');
        
        // 리프 내용 영역 찾기
        const leafContent = this.leaf.view.containerEl.querySelector('.view-content');
        
        if (leafContent) {
            // 리프 내용 영역의 크기를 가져와 컨테이너 크기 설정
            const leafWidth = (leafContent as HTMLElement).offsetWidth;
            const leafHeight = (leafContent as HTMLElement).offsetHeight;
            
            if (leafWidth > 0 && leafHeight > 0) {
                // 툴바 높이 등을 고려하여 조정 (툴바 높이는 대략적인 값)
                const toolbarHeight = (this.containerEl.closest('.card-navigator')?.querySelector('.card-navigator-toolbar') as HTMLElement)?.offsetHeight || 40;
                
                // 컨테이너 크기 설정 (직접 스타일 설정은 하지 않고 크기 정보만 저장)
                this.lastWidth = leafWidth;
                this.lastHeight = leafHeight - toolbarHeight;
                
                console.log('[CardNavigator] 리프 크기 기반 초기 크기 설정:', 
                    this.lastWidth, 'x', this.lastHeight);
                
                // 레이아웃 스타일 매니저에 초기 크기 설정
                if (this.layoutStyleManager) {
                    this.layoutStyleManager.setInitialContainerSize(this.lastWidth, this.lastHeight);
                }
                
                // 레이아웃 매니저 초기화 상태 확인
                const isLayoutManagerInitialized = !!this.layoutManager;
                console.log('[CardNavigator] 레이아웃 매니저 초기화 상태:', isLayoutManagerInitialized);
                
                // 초기화 이벤트 발생 - 레이아웃 매니저 초기화 상태 포함
                const event = new CustomEvent('container-initialized', { 
                    detail: { 
                        width: this.lastWidth, 
                        height: this.lastHeight,
                        layoutManagerInitialized: isLayoutManagerInitialized
                    } 
                });
                this.containerEl.dispatchEvent(event);
                return;
            }
        }
        
        // 리프 크기를 가져올 수 없는 경우 기본 크기로 진행
        console.log('[CardNavigator] 리프 크기를 가져올 수 없음, 기본 크기로 진행');
        
        // 레이아웃 매니저 초기화 상태 확인
        const isLayoutManagerInitialized = !!this.layoutManager;
        console.log('[CardNavigator] 레이아웃 매니저 초기화 상태:', isLayoutManagerInitialized);
        
        // 초기화 이벤트 발생 - 레이아웃 매니저 초기화 상태 포함
        const event = new CustomEvent('container-initialized', { 
            detail: { 
                fallback: true,
                layoutManagerInitialized: isLayoutManagerInitialized
            } 
        });
        this.containerEl.dispatchEvent(event);
    }

    /**
     * 기존 뷰의 컨테이너 크기가 설정될 때까지 대기합니다.
     * @param resolve Promise resolve 함수
     */
    private waitForExistingViewSize(resolve: () => void): void {
        console.log('[CardNavigator] 기존 뷰, 컨테이너 크기 대기 시작');
        let attempts = 0;
        const maxAttempts = 10;
        const checkInterval = 100; // 100ms마다 확인

        const checkSize = () => {
            attempts++;
            
            if (this.containerEl.offsetWidth > 0 && this.containerEl.offsetHeight > 0) {
                console.log('[CardNavigator] 컨테이너 크기 감지됨:', 
                    this.containerEl.offsetWidth, 'x', this.containerEl.offsetHeight);
                this.lastWidth = this.containerEl.offsetWidth;
                this.lastHeight = this.containerEl.offsetHeight;
                
                // 레이아웃 스타일 매니저에 초기 크기 설정
                if (this.layoutStyleManager) {
                    this.layoutStyleManager.setInitialContainerSize(this.lastWidth, this.lastHeight);
                }
                
                // 레이아웃 매니저 초기화 상태 확인
                const isLayoutManagerInitialized = !!this.layoutManager;
                console.log('[CardNavigator] 레이아웃 매니저 초기화 상태:', isLayoutManagerInitialized);
                
                // 초기화 이벤트 발생 - 레이아웃 매니저 초기화 상태 포함
                const event = new CustomEvent('container-initialized', { 
                    detail: { 
                        width: this.lastWidth, 
                        height: this.lastHeight,
                        layoutManagerInitialized: isLayoutManagerInitialized
                    } 
                });
                this.containerEl.dispatchEvent(event);
                
                resolve();
                return;
            }
            
            if (attempts >= maxAttempts) {
                console.log('[CardNavigator] 컨테이너 크기 대기 타임아웃, 기본 크기로 진행');
                
                // 레이아웃 매니저 초기화 상태 확인
                const isLayoutManagerInitialized = !!this.layoutManager;
                console.log('[CardNavigator] 레이아웃 매니저 초기화 상태:', isLayoutManagerInitialized);
                
                // 타임아웃 시 초기화 이벤트 발생 - 레이아웃 매니저 초기화 상태 포함
                const event = new CustomEvent('container-initialized', { 
                    detail: { 
                        timeout: true,
                        layoutManagerInitialized: isLayoutManagerInitialized
                    } 
                });
                this.containerEl.dispatchEvent(event);
                
                resolve();
                return;
            }
            
            setTimeout(checkSize, checkInterval);
        };
        
        checkSize();
    }

    // 컨테이너 스타일 업데이트 메서드
    private updateContainerStyle() {
        if (this.containerEl) {
            // layoutManager가 초기화되었는지 확인
            if (this.layoutManager) {
                // 레이아웃 매니저를 통해 컨테이너 스타일 업데이트
                const layoutStyleManager = this.layoutManager.getLayoutStyleManager();
                if (layoutStyleManager) {
                    layoutStyleManager.applyContainerStyle(this.layoutManager.getLayoutStrategy());
                }
            } else if (this.layoutStyleManager) {
                // layoutManager가 없지만 layoutStyleManager가 있는 경우
                // 기본 스타일만 적용
                this.containerEl.style.position = 'relative';
                this.containerEl.style.overflow = 'auto';
            }
        }
    }
    
    // 설정 업데이트 메서드
    updateSettings(settings: Partial<CardNavigatorSettings>) {
        const needsLayoutUpdate = 
            settings.alignCardHeight !== undefined || 
            settings.cardsPerView !== undefined;

        const needsContentUpdate = 
            settings.bodyLengthLimit !== undefined ||
            settings.bodyLength !== undefined ||
            settings.showFileName !== undefined ||
            settings.showFirstHeader !== undefined ||
            settings.showBody !== undefined ||
            settings.renderContentAsHtml !== undefined;
        
        const needsSortUpdate =
            settings.sortCriterion !== undefined ||
            settings.sortOrder !== undefined;
            
        const needsStyleUpdate =
            settings.fileNameFontSize !== undefined ||
            settings.firstHeaderFontSize !== undefined ||
            settings.bodyFontSize !== undefined;

        // 설정값 업데이트
        if (settings.alignCardHeight !== undefined) {
            this.plugin.settings.alignCardHeight = settings.alignCardHeight;
        }
        if (settings.bodyLengthLimit !== undefined) {
            this.plugin.settings.bodyLengthLimit = settings.bodyLengthLimit;
        }
        if (settings.bodyLength !== undefined) {
            this.plugin.settings.bodyLength = settings.bodyLength;
        }
        if (settings.cardsPerView !== undefined) {
            this.plugin.settings.cardsPerView = settings.cardsPerView;
        }
        if (settings.sortCriterion !== undefined) {
            this.plugin.settings.sortCriterion = settings.sortCriterion;
        }
        if (settings.sortOrder !== undefined) {
            this.plugin.settings.sortOrder = settings.sortOrder;
        }
        if (settings.fileNameFontSize !== undefined) {
            this.plugin.settings.fileNameFontSize = settings.fileNameFontSize;
        }
        if (settings.firstHeaderFontSize !== undefined) {
            this.plugin.settings.firstHeaderFontSize = settings.firstHeaderFontSize;
        }
        if (settings.bodyFontSize !== undefined) {
            this.plugin.settings.bodyFontSize = settings.bodyFontSize;
        }

        // 컨텐츠 관련 설정이 변경된 경우 캐시 초기화
        if (needsContentUpdate || needsStyleUpdate) {
            this.cardMaker.clearCache();
        }

        // 현재 스크롤 위치 저장
        const scrollPosition = {
            top: this.containerEl?.scrollTop || 0,
            left: this.containerEl?.scrollLeft || 0
        };

        // 스타일이나 컨텐츠 관련 설정이 변경된 경우 카드 완전히 다시 생성
        if (needsContentUpdate || needsStyleUpdate) {
            try {
                // 컨테이너 스타일 업데이트
                this.updateContainerStyle();
                
                // 현재 파일 목록 저장
                const files = this.cards.map(card => card.file);
                
                // 카드 배열 초기화
                this.cards = [];
                
                // 카드 다시 생성 및 렌더링
                this.displayCards(files).then(() => {
                    // 스크롤 위치 복원
                    requestAnimationFrame(() => {
                        if (this.containerEl) {
                            this.containerEl.scrollTop = scrollPosition.top;
                            this.containerEl.scrollLeft = scrollPosition.left;
                        }
                    });
                });
                
                // 여기서 리턴하여 아래 코드 실행 방지
                return;
            } catch (error) {
                console.error('[CardNavigator] 카드 재생성 중 오류 발생:', error);
            }
        }

        // 레이아웃 매니저 설정 업데이트 (스타일/컨텐츠 변경이 아닌 경우에만 실행)
        if (needsLayoutUpdate || needsSortUpdate) {
            try {
                // 컨테이너 스타일 업데이트
                this.updateContainerStyle();
                
                // layoutManager가 초기화되었는지 확인
                if (this.layoutManager) {
                    // 레이아웃 매니저 업데이트
                    this.layoutManager.updateSettings(this.plugin.settings);
                    
                    // 레이아웃 전략 업데이트
                    const newLayoutStrategy = this.layoutManager.getLayoutStrategy();
                    if (this.cardRenderer) {
                        this.cardRenderer.setLayoutStrategy(newLayoutStrategy);
                    }

                    // 정렬 변경 시 카드 배열 초기화
                    if (needsSortUpdate) {
                        this.cards = [];
                        // 현재 폴더의 파일 가져와서 다시 표시
                        this.getCurrentFolder().then(folder => {
                            if (folder) {
                                const files = folder.children
                                    .filter((file): file is TFile => file instanceof TFile && file.extension === 'md');
                                this.displayCards(files);
                            }
                        });
                        return;
                    }
                    
                    // 카드 다시 렌더링 (레이아웃만 변경된 경우)
                    if (this.cards.length > 0 && this.cardRenderer) {
                        const activeFile = this.app.workspace.getActiveFile();
                        this.cardRenderer.renderCards(this.cards, this.focusedCardId, activeFile);

                        // 스크롤 위치 복원
                        requestAnimationFrame(() => {
                            if (this.containerEl) {
                                this.containerEl.scrollTop = scrollPosition.top;
                                this.containerEl.scrollLeft = scrollPosition.left;
                            }
                        });
                    }
                }
            } catch (error) {
                console.error('[CardNavigator] 설정 업데이트 중 오류 발생:', error);
            }
        }
    }

    /**
     * 컨테이너 크기 변경 처리 메서드
     */
    private handleResize = (): void => {
        if (!this.containerEl || !this.layoutManager) return;
        
        // 이미 리사이징 중이거나 렌더링 중이면 중복 처리 방지
        if (this.isResizing || this.isDisplayingCards) {
            // 대기 중인 리사이즈 요청 설정
            this.pendingResizeRequest = true;
            return;
        }
        
        // 리사이징 상태 설정
        this.isResizing = true;
        
        // 대기 중인 애니메이션 프레임 취소
        if (this.pendingResizeFrame !== null) {
            cancelAnimationFrame(this.pendingResizeFrame);
        }
        
        // 애니메이션 프레임 요청
        this.pendingResizeFrame = requestAnimationFrame(() => {
            try {
                console.log('[CardNavigator] 리사이즈 처리 시작');
                
                // 컨테이너 크기 가져오기
                const containerWidth = this.containerEl.offsetWidth;
                const containerHeight = this.containerEl.offsetHeight;
                
                // 의미 있는 크기 변경이 있는지 확인
                if (containerWidth <= 0 || containerHeight <= 0) {
                    console.log('[CardNavigator] 유효하지 않은 컨테이너 크기, 리사이즈 처리 중단');
                    return;
                }
                
                // 크기 변경이 미미한 경우 처리 건너뛰기
                if (Math.abs(this.lastWidth - containerWidth) < 10 && 
                    Math.abs(this.lastHeight - containerHeight) < 10) {
                    console.log('[CardNavigator] 미미한 크기 변경, 리사이즈 처리 건너뜀');
                    return;
                }
                
                // 현재 스크롤 위치 저장
                const scrollTop = this.containerEl.scrollTop;
                const scrollLeft = this.containerEl.scrollLeft;
                
                // 현재 레이아웃 전략 가져오기
                const oldLayoutStrategy = this.layoutManager.getLayoutStrategy();
                const oldLayoutType = oldLayoutStrategy.getLayoutType();
                
                // 레이아웃 매니저에 컨테이너 크기 변경 알림
                console.log(`[CardNavigator] 컨테이너 크기 변경 처리: ${containerWidth}x${containerHeight}`);
                this.layoutManager.handleContainerResize(containerWidth, containerHeight);
                
                // 레이아웃 타입 변경 여부 확인
                const newLayoutStrategy = this.layoutManager.getLayoutStrategy();
                const newLayoutType = newLayoutStrategy.getLayoutType();
                
                // 현재 활성화된 파일과 포커스된 카드 ID 저장
                const activeFile = this.app.workspace.getActiveFile();
                const focusedCardId = this.focusedCardId;
                
                // 레이아웃 타입이 변경된 경우 카드 렌더러의 레이아웃 전략 업데이트
                if (oldLayoutType !== newLayoutType) {
                    console.log(`[CardNavigator] 레이아웃 타입 변경: ${oldLayoutType} -> ${newLayoutType}`);
                    this.cardRenderer?.setLayoutStrategy(newLayoutStrategy);
                }
                
                // 렌더링 상태 플래그 설정
                const wasDisplayingCards = this.isDisplayingCards;
                this.isDisplayingCards = true;
                
                try {
                    // 카드 렌더링
                    if (this.cardRenderer && this.cards.length > 0) {
                        console.log('[CardNavigator] 리사이즈 후 카드 다시 렌더링');
                        this.cardRenderer.renderCards(this.cards, focusedCardId, activeFile);
                    }
                    
                    // 스크롤 위치 복원
                    this.containerEl.scrollTop = scrollTop;
                    this.containerEl.scrollLeft = scrollLeft;
                    
                    // 크기 정보 업데이트
                    this.lastWidth = containerWidth;
                    this.lastHeight = containerHeight;
                    
                    console.log('[CardNavigator] 리사이즈 처리 완료');
                } finally {
                    // 렌더링 상태 플래그 해제
                    this.isDisplayingCards = wasDisplayingCards;
                }
            } catch (error) {
                console.error('[CardNavigator] 리사이즈 처리 중 오류 발생:', error);
                // 오류 발생 시 렌더링 상태 플래그 해제
                this.isDisplayingCards = false;
            } finally {
                // 리사이징 상태 해제
                this.isResizing = false;
                this.pendingResizeFrame = null;
                
                // 대기 중인 리사이즈 요청이 있으면 처리
                if (this.pendingResizeRequest) {
                    this.pendingResizeRequest = false;
                    // 약간의 지연 후 다시 리사이즈 처리
                    setTimeout(() => {
                        this.handleResize();
                    }, 100);
                }
            }
        });
    }

    // 현재 레이아웃 전략 반환 메서드
    public getLayoutStrategy(): LayoutStrategy {
        return this.layoutManager.getLayoutStrategy();
    }

    // 레이아웃 설정 메서드
    setLayout(layout: CardNavigatorSettings['defaultLayout']) {
        console.log('[CardNavigator] CardContainer.setLayout 호출됨, 레이아웃:', layout);
        
        // 레이아웃 매니저가 초기화되었는지 확인
        if (!this.layoutManager) {
            console.error('[CardNavigator] 레이아웃 매니저가 초기화되지 않음, 레이아웃 설정 중단');
            
            // 레이아웃 매니저가 초기화되지 않은 경우 지연 후 다시 시도
            setTimeout(() => {
                if (this.layoutManager) {
                    console.log('[CardNavigator] 레이아웃 매니저가 이제 초기화됨, 레이아웃 설정 재시도');
                    this.setLayout(layout);
                } else {
                    console.error('[CardNavigator] 레이아웃 매니저가 여전히 초기화되지 않음, 레이아웃 설정 포기');
                }
            }, 200);
            
            return;
        }
        
        try {
            // 이미 같은 레이아웃이면 변경하지 않음
            if (this.currentLayout === layout) {
                console.log('[CardNavigator] 이미 같은 레이아웃이 설정되어 있음, 변경 건너뜀');
                return;
            }
            
            this.currentLayout = layout;
            this.layoutManager.setLayout(layout);
            
            // 카드 렌더러와 키보드 네비게이터 업데이트
            if (this.cardRenderer) {
                this.cardRenderer.setLayoutStrategy(this.layoutManager.getLayoutStrategy());
            }
            if (this.keyboardNavigator) {
                this.keyboardNavigator.updateLayout(this.layoutManager.getLayoutStrategy());
            }
            
            console.log('[CardNavigator] 레이아웃 설정 완료:', layout);
            
            // 렌더링 중이면 중복 렌더링 방지
            if (this.isDisplayingCards) {
                console.log('[CardNavigator] 이미 렌더링 중, 레이아웃 변경 후 렌더링 건너뜀');
                return;
            }
            
            // 레이아웃 변경 후 카드 다시 렌더링
            if (this.cards.length > 0 && this.cardRenderer) {
                console.log('[CardNavigator] 레이아웃 변경 후 카드 다시 렌더링 시작');
                
                // 렌더링 상태 플래그 설정
                this.isDisplayingCards = true;
                
                try {
                    const activeFile = this.app.workspace.getActiveFile();
                    this.cardRenderer.renderCards(this.cards, this.focusedCardId, activeFile);
                    console.log('[CardNavigator] 레이아웃 변경 후 카드 다시 렌더링 완료');
                } finally {
                    // 렌더링 상태 플래그 해제
                    this.isDisplayingCards = false;
                }
            } else {
                console.log('[CardNavigator] 카드가 없거나 렌더러가 없음, 다시 렌더링 건너뜀');
            }
        } catch (error) {
            console.error('[CardNavigator] 레이아웃 설정 중 오류 발생:', error);
            // 오류 발생 시 렌더링 상태 플래그 해제
            this.isDisplayingCards = false;
        }
    }
    //#endregion

    //#region 카드 표시 및 렌더링
    // 폴더의 모든 마크다운 파일을 재귀적으로 가져오는 메서드
    private getAllMarkdownFiles(folder: TFolder): TFile[] {
        let files: TFile[] = [];
        
        // 현재 폴더의 파일들을 처리
        folder.children.forEach(child => {
            if (child instanceof TFile && child.extension === 'md') {
                files.push(child);
            } else if (child instanceof TFolder) {
                // 하위 폴더의 파일들을 재귀적으로 가져와서 배열에 추가
                files = files.concat(this.getAllMarkdownFiles(child));
            }
        });
        
        return files;
    }

    // 마지막으로 처리한 파일 목록의 해시
    private lastDisplayedFilesHash = '';

    // 파일 목록의 해시 생성 (비교용)
    private getFilesHash(files: TFile[]): string {
        if (!files || files.length === 0) return '';
        return files.map(file => `${file.path}:${file.stat.mtime}`).join('|');
    }

    // 카드 표시 메서드
    public async displayCards(files: TFile[]) {
        if (!this.containerEl) return;

        let displayFiles: TFile[] = [];
        const folder = await this.getCurrentFolder();
        
        if (!folder) {
            // 폴더를 찾을 수 없는 경우 UI 표시
            this.containerEl.innerHTML = `
                <div class="card-navigator-empty-state">
                    <div class="card-navigator-empty-message">
                        ${t('No cards to display')}
                    </div>
                </div>`;
            return;
        }

        // 검색 결과가 있으면 그것을 우선 사용
        if (this.searchResults) {
            displayFiles = this.searchResults;
        }
        // 검색 결과가 없는 경우에만 기존 로직 사용
        else if (!files || files.length === 0 || this.plugin.settings.cardSetType === 'vault') {
            if (this.plugin.settings.cardSetType === 'vault') {
                displayFiles = this.getAllMarkdownFiles(folder);
            } else {
                displayFiles = folder.children
                    .filter((file): file is TFile => file instanceof TFile && file.extension === 'md');
            }
        } else {
            displayFiles = files;
        }
        
        if (displayFiles.length === 0) {
            // 빈 상태 UI 표시
            this.containerEl.innerHTML = `
                <div class="card-navigator-empty-state">
                    <div class="card-navigator-empty-message">
                        ${t('No markdown files found')}
                    </div>
                </div>`;
            return;
        }
        
        this.updateContainerStyle();
        const cardsData = await this.createCardsData(displayFiles);
        
        if (cardsData.length === 0) {
            // 카드 데이터를 생성할 수 없는 경우 UI 표시
            this.containerEl.innerHTML = `
                <div class="card-navigator-empty-state">
                    <div class="card-navigator-empty-message">
                        ${t('Failed to create cards')}
                    </div>
                </div>`;
            return;
        }
        
        await this.renderCards(cardsData);
    }

    // 카드 데이터 생성 메서드
    private async createCardsData(files: TFile[]): Promise<Card[]> {
        if (!files || files.length === 0) {
            console.debug('No files provided to create cards');
            return [];
        }

        const mdFiles = files.filter(file => file.extension === 'md');
        if (mdFiles.length === 0) {
            console.debug('No markdown files found');
            return [];
        }

        try {
            const cards = await Promise.all(mdFiles.map(file => this.cardMaker.createCard(file)));
            return cards.filter(card => card !== null);
        } catch (error) {
            console.error('카드 데이터 생성 중 오류 발생:', error);
            return [];
        }
    }

    // 카드 렌더링 메서드
    private async renderCards(cardsData: Card[]) {
        if (!cardsData || cardsData.length === 0) {
            console.log(`[CardNavigator] renderCards: 카드 데이터가 비어 있음`);
            return;
        }

        // 변경된 카드만 업데이트하도록 최적화
        const changedCards = cardsData.filter(card => {
            const existingCard = this.cards.find(c => c.file.path === card.file.path);
            return !existingCard || existingCard.file.stat.mtime !== card.file.stat.mtime;
        });

        // 정렬 순서 변경 감지
        const orderChanged = cardsData.length === this.cards.length && 
            cardsData.some((card, index) => 
                this.cards.length <= index || this.cards[index].file.path !== card.file.path
            );

        if (changedCards.length === 0 && this.cards.length === cardsData.length && !orderChanged) {
            return; // 변경사항이 없으면 렌더링 스킵
        }

        // 카드 데이터 업데이트
        this.cards = cardsData;
        const activeFile = this.plugin.app.workspace.getActiveFile();

        // 카드 렌더링
        await this.cardRenderer?.renderCards(cardsData, this.focusedCardId, activeFile);

        // DOM이 업데이트될 때까지 기다린 후 스크롤 위치 조정
        requestAnimationFrame(() => {
            const newActiveCardIndex = Array.from(this.containerEl.children).findIndex(
                child => child.classList.contains('card-navigator-active')
            );

            if (newActiveCardIndex !== -1) {
                // 약간의 지연 후 스크롤 실행
                setTimeout(() => {
                    this.scrollToActiveCard(false);
                }, 50);
            }
        });
    }
    //#endregion

    //#region 카드 포커스 관리
    // 카드 포커스 설정 메서드
    public focusCard(cardId: string) {
        this.focusedCardId = cardId;
        this.updateFocusedCard();
    }

    // 포커스된 카드 업데이트 메서드
    private updateFocusedCard() {
        if (!this.containerEl || !this.focusedCardId) return;
        
        const cards = this.containerEl.querySelectorAll('.card-navigator-card');
        cards.forEach(card => {
            if (card instanceof HTMLElement) {
                if (card.dataset.cardId === this.focusedCardId) {
                    card.classList.add('card-navigator-focused');
                } else {
                    card.classList.remove('card-navigator-focused');
                }
            }
        });
    }

    // 포커스된 카드 초기화 메서드
    public clearFocusedCards() {
        this.cardRenderer?.clearFocusedCards();
    }
    //#endregion

    //#region 스크롤 관리
    // 스크롤 관련 메서드들을 Scroller로 위임
    public scrollUp(count = 1) {
        this.scroller.scrollUp(count, this.cards.length);
    }

    public scrollDown(count = 1) {
        this.scroller.scrollDown(count, this.cards.length);
    }

    public scrollLeft(count = 1) {
        this.scroller.scrollLeft(count, this.cards.length);
    }

    public scrollRight(count = 1) {
        this.scroller.scrollRight(count, this.cards.length);
    }

    public scrollToActiveCard(animate = true) {
        if (!this.containerEl) return;
        
        // 활성 카드 찾기 - 두 클래스 모두 확인
        let activeCard = this.containerEl.querySelector('.card-navigator-active') as HTMLElement;
        
        // 첫 번째 클래스로 찾지 못하면 두 번째 클래스로 시도
        if (!activeCard) {
            activeCard = this.containerEl.querySelector('.active') as HTMLElement;
        }
        
        if (!activeCard) {
            console.debug('활성 카드를 찾을 수 없습니다.');
            return;
        }
        
        // 활성 카드를 중앙으로 스크롤
        this.scroller.centerCard(activeCard, animate);
    }

    public centerCard(card: HTMLElement, animate = true) {
        this.scroller.centerCard(card, animate);
    }
    //#endregion

    //#region 카드 검색 및 정렬
    // 현재 필터링된 파일 목록 가져오기
    public async getFilteredFiles(): Promise<TFile[]> {
        const folder = await this.getCurrentFolder();
        if (!folder) return [];

        // 현재 표시된 카드가 있다면 해당 파일들 반환
        if (this.cards.length > 0) {
            return this.cards.map(card => card.file);
        }

        // 카드가 없는 경우 현재 설정에 따라 파일 목록 반환
        if (this.plugin.settings.cardSetType === 'vault') {
            return this.getAllMarkdownFiles(folder);
        } else {
            return folder.children
                .filter((file): file is TFile => file instanceof TFile && file.extension === 'md');
        }
    }

    // 카드 검색 메서드
    public async searchCards(searchTerm: string) {
        const folder = await this.getCurrentFolder();
        if (!folder) return;

        const searchService = getSearchService(this.plugin);
        
        // 캐시 최적화
        const cacheKey = `${folder.path}:${searchTerm}`;
        const cachedResults = searchService.getFromCache(cacheKey);
        if (cachedResults) {
            this.setSearchResults(cachedResults);
            await this.displayCards(cachedResults);
            return;
        }

        // 기존 검색 로직
        if (!searchTerm) {
            searchService.clearCache();
            this.setSearchResults(null);
            await this.displayCards([]);
            return;
        }

        let filesToSearch: TFile[];
        if (this.cards.length > 0) {
            filesToSearch = this.cards.map(card => card.file);
        } else {
            filesToSearch = this.plugin.settings.cardSetType === 'vault' 
                ? searchService.getAllMarkdownFiles(folder)
                : folder.children.filter((file): file is TFile => file instanceof TFile && file.extension === 'md');
        }

        const filteredFiles = await searchService.searchFiles(filesToSearch, searchTerm);
        searchService.addToCache(cacheKey, filteredFiles);
        await this.displayCards(filteredFiles);
    }

    // 폴더별 카드 표시 메서드
    public async displayCardsForFolder(folder: TFolder) {
        // 폴더 변경 시 검색 캐시 초기화
        const searchService = getSearchService(this.plugin);
        searchService.clearCache();
        this.setSearchResults(null);
        
        const files = folder.children.filter((file): file is TFile => file instanceof TFile);
        await this.displayCards(files);
    }
    //#endregion

    //#region 유틸리티 메서드
    // 현재 폴더 가져오기 메서드
    private async getCurrentFolder(): Promise<TFolder | null> {
        switch (this.plugin.settings.cardSetType) {
            case 'activeFolder':
                const activeFile = this.plugin.app.workspace.getActiveFile();
                return activeFile?.parent || null;
                
            case 'selectedFolder':
                if (this.plugin.settings.selectedFolder) {
                    const abstractFile = this.plugin.app.vault.getAbstractFileByPath(this.plugin.settings.selectedFolder);
                    return abstractFile instanceof TFolder ? abstractFile : null;
                }
                return null;
                
            case 'vault':
                return this.plugin.app.vault.getRoot();
                
            default:
                return null;
        }
    }

    // 카드에서 파일 가져오기 메서드
    public getFileFromCard(cardElement: HTMLElement): TFile | null {
        return this.cardRenderer?.getFileFromCard(cardElement, this.cards) || null;
    }

    // 키보드 네비게이터 포커스 메서드
    public focusNavigator() {
        this.keyboardNavigator?.focusNavigator();
    }
    
    // 키보드 네비게이터 블러 메서드
    public blurNavigator() {
        this.keyboardNavigator?.blurNavigator();
    }

    // 카드 크기 가져오기 메서드
    private getCardSize(): { width: number, height: number } {
        return this.cardRenderer?.getCardSize() || { width: 0, height: 0 };
    }
    //#endregion

    //#region 검색 결과 관리
    // 검색 결과 설정 메서드
    public setSearchResults(files: TFile[] | null) {
        this.searchResults = files;
    }

    // 검색 결과 가져오기 메서드
    public getSearchResults(): TFile[] | null {
        return this.searchResults;
    }
    //#endregion

    private handleScroll = debounce(() => {
        if (!this.containerEl || !this.plugin.settings.renderContentAsHtml) return;
        
        const cards = Array.from(this.containerEl.children) as HTMLElement[];
        const containerRect = this.containerEl.getBoundingClientRect();
        const buffer = containerRect.height; // 버퍼 영역 추가
        
        cards.forEach(card => {
            const cardRect = card.getBoundingClientRect();
            const isInViewport = cardRect.top < (containerRect.bottom + buffer) && 
                               cardRect.bottom > (containerRect.top - buffer);
            
            // 이미 렌더링된 카드는 건너뜁니다
            const markdownContainer = card.querySelector('.markdown-rendered') as HTMLElement;
            if (!markdownContainer || markdownContainer.children.length > 0) return;
            
            if (isInViewport) {
                // 렌더링 상태를 체크하여 진행 중인 렌더링이 없을 때만 실행
                if (!card.hasAttribute('data-rendering')) {
                    card.setAttribute('data-rendering', 'true');
                    this.cardMaker.ensureCardRendered(card);
                }
            }
        });
    }, 100);

    // 컨테이너 요소를 가져오는 public 메서드 추가
    public getContainerElement(): HTMLElement | null {
        return this.containerEl || null;
    }

    /**
     * 컨테이너의 방향을 결정합니다.
     * 컨테이너의 높이가 너비보다 크거나 같으면 세로 방향(true), 그렇지 않으면 가로 방향(false)입니다.
     * 이 메서드는 레이아웃 매니저에서 레이아웃 전략을 생성할 때 사용됩니다.
     */
    public determineVerticalOrientation(): boolean {
        // 이미 결정된 방향이 있으면 그 값을 사용
        if (this.isVertical !== undefined) {
            return this.isVertical;
        }
        
        // 컨테이너 요소가 있으면 크기 비교로 방향 결정
        if (this.containerEl) {
            const width = this.containerEl.offsetWidth || this.lastWidth;
            const height = this.containerEl.offsetHeight || this.lastHeight;
            
            if (width > 0 && height > 0) {
                return height >= width;
            }
        }
        
        // 리프 크기를 사용하여 방향 결정
        if (this.leaf && this.leaf.view && this.leaf.view.containerEl) {
            const leafContent = this.leaf.view.containerEl.querySelector('.view-content') as HTMLElement;
            if (leafContent) {
                const leafWidth = leafContent.offsetWidth;
                const leafHeight = leafContent.offsetHeight;
                
                if (leafWidth > 0 && leafHeight > 0) {
                    return leafHeight >= leafWidth;
                }
            }
        }
        
        // 기본값은 세로 방향
        return true;
    }

    /**
     * 대기 중인 displayCards 요청을 처리합니다.
     */
    private processPendingDisplayRequest(): void {
        if (!this.pendingDisplayRequest || this.isDisplayingCards) return;
        
        const { files, timestamp } = this.pendingDisplayRequest;
        this.pendingDisplayRequest = null;
        
        // 마지막 요청 이후 일정 시간이 지났는지 확인
        const timeSinceRequest = Date.now() - timestamp;
        const delay = Math.max(100, Math.min(500, 500 - timeSinceRequest));
        
        console.log(`[CardNavigator] 대기 중인 displayCards 요청 처리, ${delay}ms 후 실행`);
        setTimeout(() => {
            this.displayCards(files);
        }, delay);
    }
    
    /**
     * 두 파일 목록이 동일한지 비교합니다.
     */
    private areFileListsEqual(files1: TFile[], files2: TFile[]): boolean {
        if (files1.length !== files2.length) return false;
        
        const paths1 = new Set(files1.map(file => file.path));
        const paths2 = new Set(files2.map(file => file.path));
        
        if (paths1.size !== paths2.size) return false;
        
        for (const path of paths1) {
            if (!paths2.has(path)) return false;
        }
        
        return true;
    }

    /**
     * 대기 중인 file-open 요청을 처리합니다.
     */
    private processPendingFileOpenRequest(): void {
        if (!this.pendingFileOpenRequest) return;
        
        const { file, folderChanged, timestamp } = this.pendingFileOpenRequest;
        this.pendingFileOpenRequest = null;
        
        // 마지막 요청 이후 일정 시간이 지났는지 확인
        const timeSinceRequest = Date.now() - timestamp;
        const delay = Math.max(50, Math.min(200, 300 - timeSinceRequest));
        
        // 지연 후 처리
        setTimeout(() => {
            if (folderChanged) {
                console.log('[CardNavigator] 대기 중이던 폴더 변경 요청 처리');
                this.cardRenderer?.renderCards(this.cards, this.focusedCardId, file);
            } else {
                console.log('[CardNavigator] 대기 중이던 활성 카드 업데이트 요청 처리');
                const activeCardFound = this.cardRenderer?.updateActiveCard(file, this.focusedCardId);
                
                if (!activeCardFound) {
                    console.log('[CardNavigator] 대기 중이던 요청에서 활성 카드를 찾지 못함, 전체 렌더링 수행');
                    this.cardRenderer?.renderCards(this.cards, this.focusedCardId, file);
                }
            }
        }, delay);
    }

    /**
     * 초기 컨테이너 크기 설정 및 방향 결정 메서드
     */
    private initializeContainerSizeAndOrientation(): void {
        if (!this.containerEl) return;
        
        // 컨테이너 크기 가져오기
        const width = this.containerEl.offsetWidth || this.lastWidth;
        const height = this.containerEl.offsetHeight || this.lastHeight;
        
        // 방향 결정 (높이가 너비보다 크면 세로 방향)
        this.isVertical = height >= width;
        
        console.log(`[CardNavigator] 초기 컨테이너 크기: ${width}x${height}, 방향: ${this.isVertical ? '세로' : '가로'}`);
    }

    /**
     * 카드 너비를 업데이트하는 메서드
     * 리스트 레이아웃에서 카드 너비만 변경할 때 사용
     */
    private updateCardWidths(newCardWidth: number): void {
        if (!this.containerEl) return;
        
        // 모든 카드 요소 선택
        const cardElements = this.containerEl.querySelectorAll('.card-navigator-card');
        
        // 각 카드 요소의 너비 업데이트
        cardElements.forEach(card => {
            if (card instanceof HTMLElement) {
                card.style.width = `${newCardWidth}px`;
            }
        });
        
        console.log(`[CardNavigator] 카드 너비 업데이트: ${newCardWidth}px`);
    }
    //#endregion
}

