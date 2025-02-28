import { ItemView, WorkspaceLeaf, Menu, TFile } from "obsidian";
import CardNavigatorPlugin from '../main';
import { Toolbar } from './toolbar/toolbar';
import { CardContainer } from './cardContainer/cardContainer';
import { sortFiles } from 'common/utils';
import { t } from 'i18next';

// 카드 네비게이터 뷰의 고유 식별자
export const VIEW_TYPE_CARD_NAVIGATOR = "card-navigator-view";

// 리프레시 유형을 정의하는 enum
export enum RefreshType {
    LAYOUT = 'layout',    // 레이아웃/리사이즈 관련 리프레시
    CONTENT = 'content',  // 파일 내용 변경 관련 리프레시
    SETTINGS = 'settings', // 설정 변경 관련 리프레시
    ALL = 'all'           // 전체 업데이트
}

export class CardNavigatorView extends ItemView {
    //#region 클래스 속성
    public toolbar!: Toolbar;
    public cardContainer: CardContainer;
    private isRefreshInProgress = false;
    private pendingRefreshTypes = new Set<RefreshType>();
    private refreshTimeout: number | null = null;
    private lastRefreshTime: number = 0;
    private readonly REFRESH_COOLDOWN = 50; // 50ms 쿨다운
    private resizeObserver: ResizeObserver | null = null;
    private lastContainerHeight: number | null = null;
    private toolbarContainerEl!: HTMLElement;
    private cardContainerEl!: HTMLElement;
    //#endregion

    //#region 초기화 및 기본 메서드
    // 생성자
    constructor(leaf: WorkspaceLeaf, private plugin: CardNavigatorPlugin) {
        super(leaf);
        this.cardContainer = new CardContainer(this.plugin, this.leaf);
        // 툴바는 onOpen에서 초기화됩니다.
    }

    // 뷰 타입 반환 메서드
    getViewType(): string {
        return VIEW_TYPE_CARD_NAVIGATOR;
    }

    // 표시 텍스트 반환 메서드
    getDisplayText(): string {
        return t("CARD_NAVIGATOR");
    }

    // 아이콘 반환 메서드
    getIcon(): string {
        return "layers-3";
    }

    /**
     * 뷰가 열릴 때 호출됩니다.
     */
    async onOpen(): Promise<void> {
        try {
            const { contentEl } = this;
            contentEl.empty();
            
            const navigatorEl = contentEl.createDiv('card-navigator');
            this.toolbarContainerEl = navigatorEl.createDiv('card-navigator-toolbar');
            this.cardContainerEl = navigatorEl.createDiv('card-navigator-container');
            
            this.cardContainer = new CardContainer(
                this.plugin,
                this.leaf
            );
            
            this.cardContainer.containerEl = this.cardContainerEl;
            await this.cardContainer.initialize();
            
            this.toolbar = new Toolbar(
                this.plugin,
                this,
                this.cardContainer
            );
            
            // 툴바 초기화 추가
            await this.toolbar.initialize(this.toolbarContainerEl);
            
            await this.loadCards();
            this.setupResizeObserver();
            this.registerEvents();
        } catch (error) {
            console.error('뷰 열기 중 오류 발생:', error);
        }
    }

    /**
     * DOM 요소가 준비될 때까지 기다리는 메서드
     * @param element 기다릴 DOM 요소
     * @param callback 요소가 준비되면 실행할 콜백 함수
     */
    private waitForElementReady(element: HTMLElement, callback: () => void) {
        const startTime = Date.now();
        const timeout = 20000; // 20초로 타임아웃 증가
        let checkCount = 0;
        
        // 요소가 준비되었는지 확인하는 함수
        const checkElementReady = () => {
            checkCount++;
            
            // 요소가 DOM에 있고 크기가 유효한지 확인
            if (document.body.contains(element)) {
                const rect = element.getBoundingClientRect();
                if (rect.width > 0 && rect.height > 0) {
                    console.log(`[CardNavigator] 요소가 준비되었습니다. 소요 시간: ${Date.now() - startTime}ms, 크기: ${rect.width}x${rect.height}`);
                    callback();
                    return;
                }
                
                // 요소가 DOM에 있지만 크기가 아직 계산되지 않은 경우 로그 출력 (100번마다)
                if (checkCount % 100 === 0) {
                    console.log(`[CardNavigator] 요소가 DOM에 있지만 크기가 아직 계산되지 않았습니다. 대기 중... (${Date.now() - startTime}ms 경과)`);
                }
            } else if (checkCount % 100 === 0) {
                // 요소가 DOM에 없는 경우 로그 출력 (100번마다)
                console.log(`[CardNavigator] 요소가 아직 DOM에 추가되지 않았습니다. 대기 중... (${Date.now() - startTime}ms 경과)`);
            }
            
            // 타임아웃 확인
            if (Date.now() - startTime > timeout) {
                console.warn(`[CardNavigator] 요소 준비 타임아웃: ${timeout}ms 초과.`);
                
                // 타임아웃 시에도 요소가 DOM에 있는지 확인
                if (document.body.contains(element)) {
                    console.log(`[CardNavigator] 요소가 DOM에 있으므로 계속 진행합니다.`);
                    callback();
                } else {
                    console.error(`[CardNavigator] 요소가 DOM에 없습니다. 강제로 계속 진행합니다.`);
                    callback();
                }
                return;
            }
            
            // 다음 프레임에서 다시 확인
            requestAnimationFrame(checkElementReady);
        };
        
        // 첫 번째 확인 시작
        requestAnimationFrame(checkElementReady);
    }

    /**
     * 이벤트 리스너를 등록합니다.
     */
    private registerEvents(): void {
        this.plugin.registerEvent(
            this.plugin.app.workspace.on('file-open', async () => {
                if (this.cardContainer && this.cardContainer.isInitialized) {
                    await this.refresh(RefreshType.CONTENT);
                }
            })
        );
        
        this.plugin.registerEvent(
            this.plugin.app.vault.on('modify', async (file) => {
                if (file instanceof TFile && file.extension === 'md') {
                    await this.refresh(RefreshType.CONTENT);
                }
            })
        );
        
        this.plugin.registerEvent(
            this.plugin.app.vault.on('create', async (file) => {
                if (file instanceof TFile && file.extension === 'md') {
                    await this.refresh(RefreshType.CONTENT);
                }
            })
        );
        
        this.plugin.registerEvent(
            this.plugin.app.vault.on('delete', async (file) => {
                if (file instanceof TFile && file.extension === 'md') {
                    await this.refresh(RefreshType.CONTENT);
                }
            })
        );
    }
    
    /**
     * 리사이즈 옵저버를 설정합니다.
     */
    private setupResizeObserver(): void {
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }
        
        const navigatorEl = this.containerEl.querySelector('.card-navigator');
        if (!navigatorEl) {
            return;
        }
        
        this.resizeObserver = new ResizeObserver(() => {
            this.updateContainerSizeAndOrientation();
            this.refresh(RefreshType.LAYOUT);
        });
        
        this.resizeObserver.observe(navigatorEl);
    }

    // 뷰 닫기 메서드
    async onClose() {
        this.toolbar.onClose();
        this.cardContainer.onClose();
        
        // 리사이즈 옵저버 정리
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }
    }
    //#endregion

    //#region 폴더 및 파일 관리
    // 현재 폴더 경로 반환 메서드
    public async getCurrentFolderPath(): Promise<string | null> {
        const folder = await this.cardContainer.getCurrentFolder();
        return folder?.path || null;
    }

    // 파일 정렬 메서드
    private sortFiles(files: TFile[]): TFile[] {
        const mdFiles = files.filter(file => file.extension === 'md');
        return sortFiles(mdFiles, this.plugin.settings.sortCriterion, this.plugin.settings.sortOrder);
    }
    //#endregion

    //#region 카드 컨테이너 관리
    // 카드 컨테이너 컨텐츠 업데이트 메서드
    private async updateCardContainerContent() {
        await this.cardContainer.loadCards();
    }

    /**
     * 카드를 로드합니다.
     */
    async loadCards(): Promise<void> {
        try {
            await this.cardContainer.loadCards();
        } catch (error) {
            console.error('카드 로드 중 오류 발생:', error);
        }
    }
    //#endregion

    //#region 카드 상호작용
    // 컨텍스트 메뉴 열기 메서드
    public openContextMenu() {
        const focusedCard = this.getFocusedCard();
        if (!focusedCard) return;

        const file = this.cardContainer.getFileFromCard(focusedCard);
        if (!file) return;

        const menu = new Menu();

        this.plugin.app.workspace.trigger('file-menu', menu, file, 'more-options');

        menu.addSeparator();

        menu.addItem((item) => {
            item
                .setTitle(t('COPY_AS_LINK'))
                .setIcon('link')
                .onClick(() => {
                    this.cardContainer.cardMaker.copyLink(file);
                });
        });

        menu.addItem((item) => {
            item
                .setTitle(t('COPY_CARD_CONTENT'))
                .setIcon('file-text')
                .onClick(async () => {
                    await this.cardContainer.cardMaker.copyCardContent(file);
                });
        });

        const rect = focusedCard.getBoundingClientRect();
        menu.showAtPosition({ x: rect.left, y: rect.bottom });
    }

    // 키보드 네비게이터 포커스 메서드
    public focusNavigator() {
        this.cardContainer.focusNavigator();
    }

    // 포커스된 카드 요소 반환 메서드
    private getFocusedCard(): HTMLElement | null {
        return this.containerEl.querySelector('.card-navigator-card.card-navigator-focused');
    }
    //#endregion

    //#region 리프레시 관리
    // 배치 리프레시 실행 메서드
    public async refreshBatch(types: RefreshType[]) {
        if (!this.cardContainer) return;
        
        const now = Date.now();
        if (now - this.lastRefreshTime < this.REFRESH_COOLDOWN) {
            // 쿨다운 중이면 타입을 큐에 추가하고 나중에 처리
            types.forEach(type => this.pendingRefreshTypes.add(type));
            
            if (this.refreshTimeout) {
                cancelAnimationFrame(this.refreshTimeout);
            }
            
            // 다음 프레임에서 처리 예약
            this.refreshTimeout = requestAnimationFrame(() => {
                this.refreshTimeout = null;
                const pendingTypes = Array.from(this.pendingRefreshTypes);
                this.pendingRefreshTypes.clear();
                if (pendingTypes.length > 0) {
                    this.refreshBatch(pendingTypes);
                }
            });
            
            return;
        }

        if (this.isRefreshInProgress) {
            // 이미 리프레시 중이면 타입을 큐에 추가
            types.forEach(type => this.pendingRefreshTypes.add(type));
            return;
        }

        try {
            this.isRefreshInProgress = true;
            this.lastRefreshTime = now;
            
            // 컨테이너 요소 확인
            const containerEl = this.cardContainer.getContainerElement();
            if (!containerEl) return;

            // 가장 우선순위가 높은 리프레시 타입 결정
            let refreshType = RefreshType.CONTENT;
            if (types.includes(RefreshType.ALL)) {
                refreshType = RefreshType.ALL;
            } else if (types.includes(RefreshType.SETTINGS)) {
                refreshType = RefreshType.SETTINGS;
            } else if (types.includes(RefreshType.LAYOUT)) {
                refreshType = RefreshType.LAYOUT;
            }

            // 다음 프레임에서 실제 리프레시 수행
            requestAnimationFrame(async () => {
                try {
                    await this.refreshByType(refreshType);
                } catch (error) {
                    console.error('리프레시 중 오류 발생:', error);
                } finally {
                    this.isRefreshInProgress = false;
                    
                    // 대기 중인 리프레시가 있으면 처리
                    if (this.pendingRefreshTypes.size > 0) {
                        const pendingTypes = Array.from(this.pendingRefreshTypes);
                        this.pendingRefreshTypes.clear();
                        
                        // 다음 프레임에서 처리
                        requestAnimationFrame(() => {
                            this.refreshBatch(pendingTypes);
                        });
                    }
                }
            });
        } catch (error) {
            console.error('리프레시 준비 중 오류 발생:', error);
            this.isRefreshInProgress = false;
        }
    }

    // 단일 리프레시 실행 메서드
    public async refresh(type: RefreshType = RefreshType.CONTENT) {
        await this.refreshBatch([type]);
    }

    private async refreshByType(type: RefreshType) {
        if (!this.cardContainer) return;

        try {
            const containerEl = this.cardContainer.getContainerElement();
            if (!containerEl) return;
            
            // 컨테이너 크기가 유효한지 확인
            const width = containerEl.offsetWidth;
            const height = containerEl.offsetHeight;
            
            if (width === 0 || height === 0) {
                // 크기가 유효하지 않으면 다음 프레임에서 다시 시도
                requestAnimationFrame(() => this.refreshByType(type));
                return;
            }
            
            // 리프레시 타입에 따라 적절한 작업 수행
            switch (type) {
                case RefreshType.ALL:
                    // 모든 카드 다시 로드
                    await this.cardContainer.loadCards();
                    break;
                case RefreshType.SETTINGS:
                    // 설정 업데이트 후 카드 다시 로드
                    this.cardContainer.updateSettings(this.plugin.settings);
                    // 설정 변경 후 카드 로드는 다음 프레임에서 수행
                    requestAnimationFrame(async () => {
                        await this.cardContainer.loadCards();
                    });
                    break;
                case RefreshType.LAYOUT:
                    // 레이아웃만 업데이트
                    requestAnimationFrame(() => {
                        this.cardContainer.handleResize();
                    });
                    break;
                case RefreshType.CONTENT:
                    // 카드 내용 업데이트
                    requestAnimationFrame(async () => {
                        await this.cardContainer.loadCards();
                    });
                    break;
            }
        } catch (error) {
            console.error(`${type} 리프레시 중 오류 발생:`, error);
        }
    }
    //#endregion

    // 검색 입력에 포커스 설정
    public focusSearch(): void {
        this.toolbar.focusSearch();
    }

    // 검색어 설정
    public setSearchTerm(searchTerm: string): void {
        this.toolbar.setSearchTerm(searchTerm);
    }

    /**
     * 컨테이너 크기와 방향을 업데이트합니다.
     */
    private updateContainerSizeAndOrientation() {
        if (!this.cardContainer || !this.cardContainer.isInitialized) {
            return;
        }
        
        const navigatorEl = this.containerEl.querySelector('.card-navigator');
        if (!navigatorEl || !document.body.contains(navigatorEl)) {
            return;
        }
        
        try {
            const navigatorRect = navigatorEl.getBoundingClientRect();
            const navigatorWidth = navigatorRect.width;
            const navigatorHeight = navigatorRect.height;
            
            const toolbarEl = this.containerEl.querySelector('.card-navigator-toolbar');
            const toolbarHeight = toolbarEl ? toolbarEl.getBoundingClientRect().height : 0;
            
            const containerHeight = Math.max(300, navigatorHeight - toolbarHeight);
            
            const containerEl = this.cardContainer.getContainerElement();
            if (!containerEl) {
                return;
            }
            
            if (!this.lastContainerHeight || Math.abs(this.lastContainerHeight - containerHeight) > 10) {
                this.lastContainerHeight = containerHeight;
                
                // 스타일 변경을 한 번에 모아서 처리
                const styleUpdates = {
                    height: `${containerHeight}px`,
                    minHeight: `${Math.min(containerHeight, 300)}px`,
                    '--container-width': `${navigatorWidth}px`,
                    '--container-height': `${containerHeight}px`
                };
                
                // 스타일 일괄 적용
                Object.entries(styleUpdates).forEach(([prop, value]) => {
                    if (prop.startsWith('--')) {
                        containerEl.style.setProperty(prop, value);
                    } else {
                        containerEl.style[prop as any] = value;
                    }
                });
                
                // 레이아웃 매니저 업데이트
                if (this.cardContainer.layoutManager) {
                    this.cardContainer.layoutManager.setContainer(containerEl).catch(e => {
                        console.error('레이아웃 매니저 컨테이너 설정 중 오류:', e);
                    });
                    
                    const layoutConfig = this.cardContainer.layoutManager.getLayoutConfig();
                    if (layoutConfig) {
                        const { isVertical } = layoutConfig.calculateContainerOrientation();
                        
                        // classList 변경을 한 번에 처리
                        containerEl.classList.toggle('vertical', isVertical);
                        containerEl.classList.toggle('horizontal', !isVertical);
                        
                        containerEl.style.setProperty('--is-vertical', isVertical ? '1' : '0');
                        
                        // 레이아웃 업데이트는 다음 프레임에서 수행
                        requestAnimationFrame(() => {
                            this.cardContainer.layoutManager.updateLayout(navigatorWidth, containerHeight);
                        });
                    }
                }
                
                this.cardContainer.setContainerHeight(containerHeight);
            }
        } catch (error) {
            console.error('컨테이너 높이 업데이트 중 오류 발생:', error);
        }
    }
}