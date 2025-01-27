import { ItemView, WorkspaceLeaf, Menu, TFile, TFolder } from "obsidian";
import CardNavigatorPlugin from '../main';
import { Toolbar } from './toolbar/toolbar';
import { CardContainer } from './cardContainer/cardContainer';
import { sortFiles } from 'common/utils';
import { t } from 'i18next';

// Unique identifier for the Card Navigator view
export const VIEW_TYPE_CARD_NAVIGATOR = "card-navigator-view";

// 리프레시 유형을 정의하는 enum
export enum RefreshType {
    LAYOUT = 'layout',    // 레이아웃/리사이즈 관련 리프레시
    CONTENT = 'content',  // 파일 내용 변경 관련 리프레시
    SETTINGS = 'settings' // 설정 변경 관련 리프레시
}

// Main class for the Card Navigator view
export class CardNavigatorView extends ItemView {
    public toolbar: Toolbar;
    public cardContainer: CardContainer;
    private refreshDebounceTimers: Map<RefreshType, NodeJS.Timeout> = new Map();
    private isRefreshInProgress = false;
    private pendingRefreshTypes = new Set<RefreshType>();
    private refreshTimeout: NodeJS.Timeout | null = null;
    private lastRefreshTime: number = 0;
    private readonly REFRESH_COOLDOWN = 50; // 50ms 쿨다운

    constructor(leaf: WorkspaceLeaf, private plugin: CardNavigatorPlugin) {
        super(leaf);
        this.toolbar = new Toolbar(this.plugin);
        this.cardContainer = new CardContainer(this.plugin, this.leaf);
    }

    // Return the unique identifier for this view
    getViewType(): string {
        return VIEW_TYPE_CARD_NAVIGATOR;
    }

    // Return the display name for this view
	getDisplayText(): string {
		return t("CARD_NAVIGATOR");
	}

    // Return the icon name for this view
    getIcon(): string {
        return "layers-3";
    }

    // Open the context menu for the focused card
    public openContextMenu() {
        const focusedCard = this.getFocusedCard();
        if (!focusedCard) return;

        const file = this.cardContainer.getFileFromCard(focusedCard);
        if (!file) return;

        const menu = new Menu();

        // Add default Obsidian file menu items
        this.plugin.app.workspace.trigger('file-menu', menu, file, 'more-options');

        menu.addSeparator();

        // Add custom menu items
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

        // Show the menu at the card's position
        const rect = focusedCard.getBoundingClientRect();
        menu.showAtPosition({ x: rect.left, y: rect.bottom });
    }

    // Focus the keyboard navigator
	public focusNavigator() {
        this.cardContainer.focusNavigator();
    }

    // Get the currently focused card element
    private getFocusedCard(): HTMLElement | null {
        return this.containerEl.querySelector('.card-navigator-card.card-navigator-focused');
    }

    // 리프레시 타입별 디바운스 시간 설정
    private getDebounceTime(type: RefreshType): number {
        switch (type) {
            case RefreshType.LAYOUT:
                return 100; // 레이아웃 변경은 빠르게 처리
            case RefreshType.CONTENT:
                return 150; // 파일 전환 시 더 빠른 응답을 위해 시간 단축
            case RefreshType.SETTINGS:
                return 200; // 설정 변경은 적당한 딜레이
        }
    }

    // 타입별 리프레시 처리
    private async refreshByType(type: RefreshType) {
        try {
            switch (type) {
                case RefreshType.LAYOUT:
                    this.cardContainer.handleResize();
                    break;
                case RefreshType.CONTENT:
                    await this.toolbar.refresh();
                    await this.updateCardContainerContent();
                    break;
                case RefreshType.SETTINGS:
                    await this.toolbar.refresh();
                    this.updateLayoutAndRefresh(true);  // 컨텐츠 리프레시 건너뛰기
                    break;
            }
        } catch (error) {
            throw error;
        }
    }

    // 배치 리프레시 실행
    public async refreshBatch(types: RefreshType[]) {
        const now = Date.now();
        
        // 쿨다운 체크
        if (now - this.lastRefreshTime < this.REFRESH_COOLDOWN) {
            types.forEach(type => this.pendingRefreshTypes.add(type));
            return;
        }

        if (this.isRefreshInProgress) {
            types.forEach(type => this.pendingRefreshTypes.add(type));
            return;
        }

        // 기존 타이머가 있다면 취소
        if (this.refreshTimeout) {
            clearTimeout(this.refreshTimeout);
            this.refreshTimeout = null;
        }

        // 모든 타입을 대기열에 추가
        types.forEach(type => this.pendingRefreshTypes.add(type));

        const minDebounceTime = Math.min(
            ...Array.from(this.pendingRefreshTypes).map(t => this.getDebounceTime(t))
        );

        this.refreshTimeout = setTimeout(async () => {
            try {
                this.isRefreshInProgress = true;
                this.lastRefreshTime = Date.now();

                // 레이아웃 먼저 처리
                if (this.pendingRefreshTypes.has(RefreshType.LAYOUT)) {
                    await this.refreshByType(RefreshType.LAYOUT);
                }

                // 설정 다음 처리
                if (this.pendingRefreshTypes.has(RefreshType.SETTINGS)) {
                    await this.refreshByType(RefreshType.SETTINGS);
                }

                // 컨텐츠 마지막 처리
                if (this.pendingRefreshTypes.has(RefreshType.CONTENT)) {
                    await this.refreshByType(RefreshType.CONTENT);
                }
            } finally {
                this.pendingRefreshTypes.clear();
                this.refreshTimeout = null;
                this.isRefreshInProgress = false;
            }
        }, minDebounceTime);
    }

    // 단일 리프레시 실행
    async refresh(type: RefreshType = RefreshType.CONTENT) {
        await this.refreshBatch([type]);
    }

    // Update layout settings and refresh the view
    public updateLayoutAndRefresh(skipContentRefresh: boolean = false) {
        const settings = this.plugin.settings;
        if (settings.defaultLayout) {
            this.cardContainer.setLayout(settings.defaultLayout);
        } else {
            this.cardContainer.setLayout('auto');
        }
        
        this.cardContainer.updateSettings(settings);
        
        // 설정 리프레시 중에는 컨텐츠 리프레시를 건너뜀
        if (!skipContentRefresh) {
            this.refresh(RefreshType.CONTENT);
        }
    }

    // CardContainer의 컨텐츠 업데이트
    private async updateCardContainerContent() {
        const folder = await this.getCurrentFolder();
        if (!folder) return;

        const files = folder.children.filter((file: any): file is TFile => file instanceof TFile);
        const mdFiles = files.filter(file => file.extension === 'md');
        const sortedFiles = this.sortFiles(mdFiles);
        await this.cardContainer.displayCards(sortedFiles);
    }

    // 현재 폴더의 경로 가져오기
    public async getCurrentFolderPath(): Promise<string | null> {
        const folder = await this.getCurrentFolder();
        return folder?.path || null;
    }

    // 현재 폴더 가져오기
    private async getCurrentFolder(): Promise<TFolder | null> {
        if (this.plugin.settings.useSelectedFolder && this.plugin.settings.selectedFolder) {
            const abstractFile = this.plugin.app.vault.getAbstractFileByPath(this.plugin.settings.selectedFolder);
            return abstractFile instanceof TFolder ? abstractFile : null;
        } else {
            const activeFile = this.plugin.app.workspace.getActiveFile();
            return activeFile?.parent || null;
        }
    }

    // 파일 정렬
    private sortFiles(files: TFile[]): TFile[] {
        const mdFiles = files.filter(file => file.extension === 'md');
        return sortFiles(mdFiles, this.plugin.settings.sortCriterion, this.plugin.settings.sortOrder);
    }

    // Set up the view when it's opened
    async onOpen() {
            const container = this.containerEl.children[1] as HTMLElement;
            container.empty();

            const navigatorEl = container.createDiv('card-navigator');
            const toolbarEl = navigatorEl.createDiv('card-navigator-toolbar');
            const cardContainerEl = navigatorEl.createDiv('card-navigator-container');

            // 툴바 초기화
            this.toolbar.initialize(toolbarEl);

            // 카드 컨테이너 초기화
            this.cardContainer.initialize(cardContainerEl);

            // 레이아웃 업데이트 이벤트 등록
            this.registerEvent(
                this.app.workspace.on('resize', () => {
                    this.cardContainer?.handleResize();
                })
            );
    }

    // Clean up when the view is closed
    async onClose() {
        this.toolbar.onClose();
        this.cardContainer.onClose();
    }
}
