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
    //#endregion

    //#region 초기화 및 정리
    // 생성자: 기본 컴포넌트 초기화
    constructor(private plugin: CardNavigatorPlugin, private leaf: WorkspaceLeaf) {
        // 기본 컴포넌트만 초기화
        this.app = this.plugin.app;
        this.cardMaker = new CardMaker(this.plugin);
        this.isVertical = true; // 기본값
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
                
                // 폴더가 변경된 경우에만 전체 렌더링
                const needsFullRendering = folderChanged;
                
                if (needsFullRendering) {
                    // 전체 렌더링 수행
                    await this.cardRenderer.renderCards(this.cards, this.focusedCardId, file);
                } else {
                    // 활성 카드 상태만 업데이트
                    const activeCardFound = this.cardRenderer.updateActiveCard(file, this.focusedCardId);
                    
                    // 활성 카드를 찾지 못한 경우 전체 렌더링 수행
                    if (!activeCardFound) {
                        await this.cardRenderer.renderCards(this.cards, this.focusedCardId, file);
                    }
                }
                
                // 마지막 활성 폴더 업데이트
                this.lastActiveFolder = currentFolder;
                
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
            
            // 컨테이너 스타일 업데이트
            console.log('[CardNavigator] 컨테이너 스타일 업데이트');
            this.updateContainerStyle();
            
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
            this.resizeObserver = new ResizeObserver(
                debounce(() => {
                    if (!this.isResizing) {
                        this.handleResize();
                    }
                }, 100)
            );
            this.resizeObserver.observe(this.containerEl);
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
    // 컨테이너 크기 대기 메서드
    private waitForContainerSize(): Promise<void> {
        if (this.containerEl && 
            this.containerEl.offsetWidth > 0 && 
            this.containerEl.offsetHeight > 0) {
            return Promise.resolve();
        }

        return new Promise((resolve) => {
            const observer = new ResizeObserver(() => {
                if (this.containerEl && 
                    this.containerEl.offsetWidth > 0 && 
                    this.containerEl.offsetHeight > 0) {
                    observer.disconnect();
                    resolve();
                }
            });

            if (this.containerEl) {
                observer.observe(this.containerEl);
            }
        });
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
     * 컨테이너 크기 변경 처리
     */
    private handleResize = (): void => {
        if (!this.containerEl || !this.layoutManager) return;
        
        // 이미 리사이징 중이면 중복 처리 방지
        if (this.isResizing) return;
        
        // 리사이징 상태 설정
        this.isResizing = true;
        
        // 대기 중인 애니메이션 프레임 취소
        if (this.pendingResizeFrame !== null) {
            cancelAnimationFrame(this.pendingResizeFrame);
        }
        
        // 애니메이션 프레임 요청
        this.pendingResizeFrame = requestAnimationFrame(() => {
            try {
                // 현재 스크롤 위치 저장
                const scrollTop = this.containerEl.scrollTop;
                const scrollLeft = this.containerEl.scrollLeft;
                
                // 현재 레이아웃 전략 가져오기
                const oldLayoutStrategy = this.layoutManager.getLayoutStrategy();
                const oldLayoutType = oldLayoutStrategy.getLayoutType();
                
                // 컨테이너 크기 가져오기
                const containerWidth = this.containerEl.offsetWidth;
                const containerHeight = this.containerEl.offsetHeight;
                
                // 레이아웃 매니저에 컨테이너 크기 변경 알림
                this.layoutManager.handleContainerResize(containerWidth, containerHeight);
                
                // 레이아웃 타입 변경 여부 확인
                const newLayoutStrategy = this.layoutManager.getLayoutStrategy();
                const newLayoutType = newLayoutStrategy.getLayoutType();
                
                // 현재 활성화된 파일과 포커스된 카드 ID 저장
                const activeFile = this.app.workspace.getActiveFile();
                const focusedCardId = this.focusedCardId;
                
                // 레이아웃 타입이 변경된 경우 카드 렌더러의 레이아웃 전략 업데이트
                if (oldLayoutType !== newLayoutType) {
                    this.cardRenderer?.setLayoutStrategy(newLayoutStrategy);
                }
                
                // 카드 렌더링
                if (this.cardRenderer) {
                    this.cardRenderer.renderCards(this.cards, focusedCardId, activeFile);
                }
                
                // 스크롤 위치 복원
                this.containerEl.scrollTop = scrollTop;
                this.containerEl.scrollLeft = scrollLeft;
            } catch (error) {
                console.error('리사이즈 처리 중 오류 발생:', error);
            } finally {
                // 리사이징 상태 해제
                this.isResizing = false;
                this.pendingResizeFrame = null;
            }
        });
    }

    // 현재 레이아웃 전략 반환 메서드
    public getLayoutStrategy(): LayoutStrategy {
        return this.layoutManager.getLayoutStrategy();
    }

    // 레이아웃 설정 메서드
    setLayout(layout: CardNavigatorSettings['defaultLayout']) {
        this.layoutManager.setLayout(layout);
        this.cardRenderer?.setLayoutStrategy(this.layoutManager.getLayoutStrategy());
        this.keyboardNavigator?.updateLayout(this.layoutManager.getLayoutStrategy());
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

    // 중복 호출 방지를 위한 플래그
    private isDisplayingCards = false;
    // 마지막으로 처리한 파일 목록의 해시
    private lastDisplayedFilesHash = '';

    // 파일 목록의 해시 생성 (비교용)
    private getFilesHash(files: TFile[]): string {
        if (!files || files.length === 0) return '';
        return files.map(file => `${file.path}:${file.stat.mtime}`).join('|');
    }

    // 카드 표시 메서드
    public async displayCards(files: TFile[]) {
        console.log(`[CardNavigator] displayCards 호출됨: 파일 수 ${files?.length || 0}`);
        if (!this.containerEl) {
            console.log(`[CardNavigator] displayCards: 컨테이너 요소가 없음`);
            return;
        }

        // 이미 카드 표시 중인 경우 중복 호출 방지
        if (this.isDisplayingCards) {
            console.log(`[CardNavigator] displayCards: 이미 카드 표시 중, 중복 호출 방지`);
            return;
        }

        try {
            this.isDisplayingCards = true;

            let displayFiles: TFile[] = [];
            const folder = await this.getCurrentFolder();
            
            if (!folder) {
                console.log(`[CardNavigator] displayCards: 폴더를 찾을 수 없음`);
                // 폴더를 찾을 수 없는 경우 UI 표시
                this.containerEl.innerHTML = `
                    <div class="card-navigator-empty-state">
                        <div class="card-navigator-empty-message">
                            ${t('No cards to display')}
                        </div>
                    </div>`;
                return;
            }

            console.log(`[CardNavigator] displayCards: 현재 폴더 ${folder.path}`);
            
            // 검색 결과가 있으면 그것을 우선 사용
            if (this.searchResults) {
                console.log(`[CardNavigator] displayCards: 검색 결과 사용 (${this.searchResults.length}개 파일)`);
                displayFiles = this.searchResults;
            }
            // 검색 결과가 없는 경우에만 기존 로직 사용
            else if (!files || files.length === 0 || this.plugin.settings.cardSetType === 'vault') {
                if (this.plugin.settings.cardSetType === 'vault') {
                    console.log(`[CardNavigator] displayCards: 전체 볼트 파일 사용`);
                    displayFiles = this.getAllMarkdownFiles(folder);
                } else {
                    console.log(`[CardNavigator] displayCards: 현재 폴더 파일 사용`);
                    displayFiles = folder.children
                        .filter((file): file is TFile => file instanceof TFile && file.extension === 'md');
                }
            } else {
                console.log(`[CardNavigator] displayCards: 제공된 파일 목록 사용`);
                displayFiles = files;
            }
            
            console.log(`[CardNavigator] displayCards: 표시할 파일 수 ${displayFiles.length}`);
            
            if (displayFiles.length === 0) {
                console.log(`[CardNavigator] displayCards: 표시할 파일이 없음`);
                // 빈 상태 UI 표시
                this.containerEl.innerHTML = `
                    <div class="card-navigator-empty-state">
                        <div class="card-navigator-empty-message">
                            ${t('No markdown files found')}
                        </div>
                    </div>`;
                return;
            }
            
            // 파일 목록 해시 계산 및 비교
            const currentFilesHash = this.getFilesHash(displayFiles);
            if (currentFilesHash === this.lastDisplayedFilesHash) {
                console.log(`[CardNavigator] displayCards: 동일한 파일 목록이 이미 표시됨, 중복 렌더링 방지`);
                return;
            }
            this.lastDisplayedFilesHash = currentFilesHash;
            
            this.updateContainerStyle();
            console.log(`[CardNavigator] displayCards: 카드 데이터 생성 시작`);
            const cardsData = await this.createCardsData(displayFiles);
            console.log(`[CardNavigator] displayCards: 카드 데이터 생성 완료 (${cardsData.length}개)`);
            
            if (cardsData.length === 0) {
                console.log(`[CardNavigator] displayCards: 카드 데이터를 생성할 수 없음`);
                // 카드 데이터를 생성할 수 없는 경우 UI 표시
                this.containerEl.innerHTML = `
                    <div class="card-navigator-empty-state">
                        <div class="card-navigator-empty-message">
                            ${t('Failed to create cards')}
                        </div>
                    </div>`;
                return;
            }
            
            console.log(`[CardNavigator] displayCards: 카드 렌더링 시작`);
            await this.renderCards(cardsData);
            console.log(`[CardNavigator] displayCards: 카드 렌더링 완료`);
        } finally {
            this.isDisplayingCards = false;
        }
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
        console.log(`[CardNavigator] renderCards 호출됨: 카드 수 ${cardsData?.length || 0}`);
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

        console.log(`[CardNavigator] renderCards: 변경된 카드 수 ${changedCards.length}, 순서 변경 ${orderChanged}`);

        if (changedCards.length === 0 && this.cards.length === cardsData.length && !orderChanged) {
            console.log(`[CardNavigator] renderCards: 변경사항이 없어 렌더링 스킵`);
            return; // 변경사항이 없으면 렌더링 스킵
        }

        this.cards = cardsData;
        const activeFile = this.plugin.app.workspace.getActiveFile();
        console.log(`[CardNavigator] renderCards: 활성 파일 ${activeFile?.path || '없음'}`);

        // 카드 렌더링
        console.log(`[CardNavigator] renderCards: cardRenderer.renderCards 호출 시작`);
        await this.cardRenderer?.renderCards(cardsData, this.focusedCardId, activeFile);
        console.log(`[CardNavigator] renderCards: cardRenderer.renderCards 호출 완료`);

        // DOM이 업데이트될 때까지 기다린 후 스크롤 위치 조정
        requestAnimationFrame(() => {
            const newActiveCardIndex = Array.from(this.containerEl.children).findIndex(
                child => child.classList.contains('card-navigator-active')
            );

            console.log(`[CardNavigator] renderCards: 활성 카드 인덱스 ${newActiveCardIndex}`);
            if (newActiveCardIndex !== -1) {
                // 약간의 지연 후 스크롤 실행
                setTimeout(() => {
                    console.log(`[CardNavigator] renderCards: 활성 카드로 스크롤 시작`);
                    this.scrollToActiveCard(false);
                    console.log(`[CardNavigator] renderCards: 활성 카드로 스크롤 완료`);
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
     * 카드 너비만 업데이트합니다.
     * 리스트 레이아웃에서 컨테이너 크기 변경 시 전체 재렌더링 없이 카드 너비만 조정할 때 사용합니다.
     */
    private updateCardWidths(newWidth: number): void {
        if (!this.containerEl) return;
        
        // 모든 카드 요소의 너비 업데이트
        const cardElements = this.containerEl.querySelectorAll('.card-navigator-card');
        cardElements.forEach(cardEl => {
            if (cardEl instanceof HTMLElement) {
                cardEl.style.width = `${newWidth}px`;
            }
        });
    }
}

