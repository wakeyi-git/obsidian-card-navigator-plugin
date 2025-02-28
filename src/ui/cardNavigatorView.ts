import { ItemView, WorkspaceLeaf, Menu, TFile, TFolder, debounce } from "obsidian";
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
    private refreshDebounceTimers: Map<RefreshType, NodeJS.Timeout> = new Map();
    private isRefreshInProgress = false;
    private pendingRefreshTypes = new Set<RefreshType>();
    private refreshTimeout: NodeJS.Timeout | null = null;
    private lastRefreshTime: number = 0;
    private readonly REFRESH_COOLDOWN = 50; // 50ms 쿨다운
    private resizeObserver: ResizeObserver | null = null;
    private lastContainerHeight: number | null = null;
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
     * 뷰가 열릴 때 호출되는 메서드
     */
    async onOpen() {
        try {
            // 기본 컨테이너 설정
            const { contentEl } = this;
            contentEl.empty();
            contentEl.addClass('card-navigator-view');
            
            // 네비게이터 컨테이너 생성
            const navigatorEl = contentEl.createDiv({ cls: 'card-navigator' });
            
            // 툴바 초기화
            const toolbarEl = navigatorEl.createDiv({ cls: 'card-navigator-toolbar' });
            const toolbarContainerEl = toolbarEl.createDiv({ cls: 'card-navigator-toolbar-container' });
            this.toolbar = new Toolbar(this.plugin, this, this.cardContainer);
            await this.toolbar.initialize(toolbarContainerEl);
            
            // 카드 컨테이너 초기화
            const cardContainerEl = navigatorEl.createDiv({ cls: 'card-navigator-container' });
            this.cardContainer = new CardContainer(this.plugin, this.leaf);
            await this.cardContainer.initialize(cardContainerEl);
            
            // 리사이즈 옵저버 설정
            this.setupResizeObserver();
            
            // 컨테이너 높이 계산 및 설정 - 지연 실행
            requestAnimationFrame(() => {
                // DOM이 완전히 렌더링된 후 높이 계산
                this.updateContainerHeight();
                
                // 카드 로드
                this.loadCards();
            });
            
            // 이벤트 리스너 등록
            this.registerEvents();
            
            console.log('[CardNavigator] 뷰 초기화 완료');
        } catch (error) {
            console.error('[CardNavigator] 뷰 초기화 중 오류 발생:', error);
        }
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
    private async loadCards() {
        try {
            if (!this.cardContainer || !this.cardContainer.isInitialized) {
                console.debug('[CardNavigator] 카드 로드 무시: 카드 컨테이너가 초기화되지 않음');
                return;
            }
            
            await this.cardContainer.loadCards();
        } catch (error) {
            console.error('[CardNavigator] 카드 로드 중 오류 발생:', error);
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
        
        // 현재 시간과 마지막 리프레시 시간을 비교
        const now = Date.now();
        if (now - this.lastRefreshTime < this.REFRESH_COOLDOWN) {
            // 쿨다운 중이면 타입을 병합하고 대기
            types.forEach(type => this.pendingRefreshTypes.add(type));
            
            // 이미 대기 중인 타이머가 있다면 취소
            if (this.refreshTimeout) {
                clearTimeout(this.refreshTimeout);
            }
            
            // 새로운 타이머 설정
            this.refreshTimeout = setTimeout(() => {
                this.refreshTimeout = null;
                const pendingTypes = Array.from(this.pendingRefreshTypes);
                this.pendingRefreshTypes.clear();
                if (pendingTypes.length > 0) {
                    this.refreshBatch(pendingTypes);
                }
            }, this.REFRESH_COOLDOWN);
            
            return;
        }

        // 이미 진행 중인 리프레시가 있으면 타입을 병합하고 대기
        if (this.isRefreshInProgress) {
            types.forEach(type => this.pendingRefreshTypes.add(type));
            return;
        }

        try {
            this.isRefreshInProgress = true;
            this.lastRefreshTime = now;
            
            // 컨테이너 요소 가져오기
            const containerEl = this.cardContainer.getContainerElement();
            if (!containerEl) return;

            // 가장 높은 우선순위의 리프레시 타입 결정
            let refreshType = RefreshType.CONTENT;
            if (types.includes(RefreshType.ALL)) {
                refreshType = RefreshType.ALL;
            } else if (types.includes(RefreshType.SETTINGS)) {
                refreshType = RefreshType.SETTINGS;
            } else if (types.includes(RefreshType.LAYOUT)) {
                refreshType = RefreshType.LAYOUT;
            }

            try {
                // 단일 통합 업데이트 실행
                await this.refreshByType(refreshType);
            } catch (error) {
                console.error(`[CardNavigator] 리프레시 중 오류 발생:`, error);
            }
        } finally {
            this.isRefreshInProgress = false;
            
            // 대기 중인 리프레시가 있으면 처리
            if (this.pendingRefreshTypes.size > 0) {
                const pendingTypes = Array.from(this.pendingRefreshTypes);
                this.pendingRefreshTypes.clear();
                setTimeout(() => {
                    this.refreshBatch(pendingTypes);
                }, this.REFRESH_COOLDOWN);
            }
        }
    }

    // 단일 리프레시 실행 메서드
    public async refresh(type: RefreshType = RefreshType.CONTENT) {
        await this.refreshBatch([type]);
    }

    private async refreshByType(type: RefreshType) {
        if (!this.cardContainer) return;

        try {
            // 컨테이너 요소 가져오기
            const containerEl = this.cardContainer.getContainerElement();
            if (!containerEl) return;
            
            // 컨테이너 크기 확인
            const width = containerEl.offsetWidth;
            const height = containerEl.offsetHeight;
            
            // 컨테이너 크기가 0인 경우 지연 후 재시도 (최대 1회)
            if (width === 0 || height === 0) {
                setTimeout(() => this.refreshByType(type), 100);
                return;
            }
            
            // 타입에 따라 적절한 리프레시 수행
            switch (type) {
                case RefreshType.ALL:
                    await this.cardContainer.loadCards();
                    break;
                case RefreshType.SETTINGS:
                    this.cardContainer.updateSettings(this.plugin.settings);
                    await this.cardContainer.loadCards();
                    break;
                case RefreshType.LAYOUT:
                    this.cardContainer.handleResize();
                    break;
                case RefreshType.CONTENT:
                    await this.cardContainer.loadCards();
                    break;
            }
        } catch (error) {
            console.error(`[CardNavigator] ${type} 리프레시 중 오류 발생:`, error);
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
     * 컨테이너 높이를 업데이트합니다.
     */
    private updateContainerHeight() {
        // 카드 컨테이너가 초기화되지 않았으면 무시
        if (!this.cardContainer || !this.cardContainer.isInitialized) {
            console.debug('[CardNavigator] 높이 업데이트 무시: 카드 컨테이너가 초기화되지 않음');
            return;
        }
        
        // 네비게이터 요소 가져오기
        const navigatorEl = this.containerEl.querySelector('.card-navigator');
        if (!navigatorEl || !document.body.contains(navigatorEl)) {
            console.debug('[CardNavigator] 높이 업데이트 무시: 네비게이터 요소가 없거나 DOM에 없음');
            return;
        }
        
        try {
            // 네비게이터 크기 계산
            const navigatorRect = navigatorEl.getBoundingClientRect();
            const navigatorHeight = navigatorRect.height;
            const viewportHeight = window.innerHeight;
            const navigatorTop = navigatorRect.top;
            
            // 뷰포트 내에서 실제 사용 가능한 네비게이터 높이 계산
            const visibleNavigatorHeight = Math.min(navigatorHeight, viewportHeight - navigatorTop);
            
            // 툴바 높이 계산
            const toolbarEl = this.containerEl.querySelector('.card-navigator-toolbar');
            const toolbarHeight = toolbarEl ? toolbarEl.getBoundingClientRect().height : 0;
            
            // 컨테이너 높이 계산 (툴바 높이 제외)
            const containerHeight = Math.max(0, visibleNavigatorHeight - toolbarHeight);
            
            // 로그 출력 빈도 줄이기 - 정적 변수 사용
            if (!this.lastContainerHeight || Math.abs(this.lastContainerHeight - containerHeight) > 10) {
                console.debug(`[CardNavigator] 컨테이너 높이 업데이트:`);
                console.debug(`  - 네비게이터 높이: ${navigatorHeight}px`);
                console.debug(`  - 뷰포트 높이: ${viewportHeight}px`);
                console.debug(`  - 네비게이터 상단 위치: ${navigatorTop}px`);
                console.debug(`  - 가시 네비게이터 높이: ${visibleNavigatorHeight}px`);
                console.debug(`  - 툴바 높이: ${toolbarHeight}px`);
                console.debug(`  - 계산된 컨테이너 높이: ${Math.max(containerHeight, 100)}px`);
                
                this.lastContainerHeight = containerHeight;
            }
            
            // 컨테이너 높이 설정 (최소 100px)
            this.cardContainer.setContainerHeight(Math.max(containerHeight, 100));
        } catch (error) {
            console.error('[CardNavigator] 컨테이너 높이 계산 중 오류 발생:', error);
        }
    }
    
    // 리사이즈 옵저버 설정
    private setupResizeObserver() {
        // 기존 옵저버 정리
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }
        
        // 새 옵저버 생성 - 디바운스 시간 증가 (100ms → 150ms)
        this.resizeObserver = new ResizeObserver(debounce(() => {
            // 이미 리사이즈 처리 중이면 무시
            if (this.isRefreshInProgress) {
                return;
            }
            
            // 현재 시간과 마지막 리프레시 시간을 비교
            const now = Date.now();
            if (now - this.lastRefreshTime < this.REFRESH_COOLDOWN) {
                // 쿨다운 중이면 타이머 설정
                if (this.refreshTimeout) {
                    clearTimeout(this.refreshTimeout);
                }
                
                this.refreshTimeout = setTimeout(() => {
                    this.updateContainerHeight();
                }, this.REFRESH_COOLDOWN);
                return;
            }
            
            this.lastRefreshTime = now;
            this.updateContainerHeight();
        }, 150));
        
        // 네비게이터 요소 관찰
        const navigatorEl = this.containerEl.querySelector('.card-navigator');
        if (navigatorEl) {
            this.resizeObserver.observe(navigatorEl);
        }
    }

    /**
     * 폴더 변경 이벤트를 등록합니다.
     * CardContainer에서 폴더가 변경될 때 toolbar의 폴더 경로 표시를 업데이트합니다.
     */
    private registerFolderChangeEvent(): void {
        // 폴더 변경 이벤트 구독
        this.plugin.app.workspace.on('file-open', async () => {
            if (this.plugin.settings.cardSetType === 'activeFolder') {
                const folder = await this.cardContainer.getCurrentFolder();
                if (folder) {
                    this.toolbar.updateFolderPathDisplay(folder);
                }
            }
        });
    }

    /**
     * 이벤트 리스너를 등록합니다.
     */
    private registerEvents() {
        // 폴더 변경 이벤트 구독
        this.registerFolderChangeEvent();
        
        // 파일 변경 이벤트 구독
        this.registerEvent(
            this.plugin.app.vault.on('modify', (file) => {
                if (file instanceof TFile && file.extension === 'md') {
                    this.refresh(RefreshType.CONTENT);
                }
            })
        );
        
        // 파일 생성 이벤트 구독
        this.registerEvent(
            this.plugin.app.vault.on('create', (file) => {
                if (file instanceof TFile && file.extension === 'md') {
                    this.refresh(RefreshType.CONTENT);
                }
            })
        );
        
        // 파일 삭제 이벤트 구독
        this.registerEvent(
            this.plugin.app.vault.on('delete', (file) => {
                if (file instanceof TFile && file.extension === 'md') {
                    this.refresh(RefreshType.CONTENT);
                }
            })
        );
        
        // 파일 이름 변경 이벤트 구독
        this.registerEvent(
            this.plugin.app.vault.on('rename', (file) => {
                if (file instanceof TFile && file.extension === 'md') {
                    this.refresh(RefreshType.CONTENT);
                }
            })
        );
    }
}
