import { ItemView, WorkspaceLeaf, Menu, TFile, TFolder } from "obsidian";
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
    SETTINGS = 'settings' // 설정 변경 관련 리프레시
}

export class CardNavigatorView extends ItemView {
    //#region 클래스 속성
    public toolbar: Toolbar;
    public cardContainer: CardContainer;
    private refreshDebounceTimers: Map<RefreshType, NodeJS.Timeout> = new Map();
    private isRefreshInProgress = false;
    private pendingRefreshTypes = new Set<RefreshType>();
    private refreshTimeout: NodeJS.Timeout | null = null;
    private lastRefreshTime: number = 0;
    private readonly REFRESH_COOLDOWN = 50; // 50ms 쿨다운
    //#endregion

    //#region 초기화 및 기본 메서드
    // 생성자
    constructor(leaf: WorkspaceLeaf, private plugin: CardNavigatorPlugin) {
        super(leaf);
        this.toolbar = new Toolbar(this.plugin);
        this.cardContainer = new CardContainer(this.plugin, this.leaf);
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

    // 뷰 열기 메서드
    async onOpen() {
        const container = this.containerEl.children[1] as HTMLElement;
        container.empty();

        const navigatorEl = container.createDiv('card-navigator');
        const toolbarEl = navigatorEl.createDiv('card-navigator-toolbar');
        const cardContainerEl = navigatorEl.createDiv('card-navigator-container');

        this.toolbar.initialize(toolbarEl);
        this.cardContainer.initialize(cardContainerEl);
    }

    // 뷰 닫기 메서드
    async onClose() {
        this.toolbar.onClose();
        this.cardContainer.onClose();
    }
    //#endregion

    //#region 폴더 및 파일 관리
    // 현재 폴더 경로 반환 메서드
    public async getCurrentFolderPath(): Promise<string | null> {
        const folder = await this.getCurrentFolder();
        return folder?.path || null;
    }

    // 현재 폴더 반환 메서드
    private async getCurrentFolder(): Promise<TFolder | null> {
        if (this.plugin.settings.cardSetType === 'selectedFolder' && this.plugin.settings.selectedFolder) {
            const abstractFile = this.plugin.app.vault.getAbstractFileByPath(this.plugin.settings.selectedFolder);
            return abstractFile instanceof TFolder ? abstractFile : null;
        } else if (this.plugin.settings.cardSetType === 'vault') {
            return this.plugin.app.vault.getRoot();
        } else {
            const activeFile = this.plugin.app.workspace.getActiveFile();
            return activeFile?.parent || null;
        }
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
        const folder = await this.getCurrentFolder();
        if (!folder) return;

        const files = folder.children.filter((file: any): file is TFile => file instanceof TFile);
        const mdFiles = files.filter(file => file.extension === 'md');
        const sortedFiles = this.sortFiles(mdFiles);
        await this.cardContainer.displayCards(sortedFiles);
    }

    // 레이아웃 설정 업데이트 및 리프레시 메서드
    public updateLayoutAndRefresh(skipContentRefresh: boolean = false) {
        const settings = this.plugin.settings;
        if (settings.defaultLayout) {
            this.cardContainer.setLayout(settings.defaultLayout);
        } else {
            this.cardContainer.setLayout('auto');
        }
        
        this.cardContainer.updateSettings(settings);
        
        if (!skipContentRefresh) {
            this.refresh(RefreshType.CONTENT);
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
    // 리프레시 타입별 디바운스 시간 반환 메서드
    private getDebounceTime(type: RefreshType): number {
        switch (type) {
            case RefreshType.LAYOUT:
                return 100;
            case RefreshType.CONTENT:
                return 150;
            case RefreshType.SETTINGS:
                return 200;
        }
    }

    // 타입별 리프레시 실행 메서드
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
                    this.updateLayoutAndRefresh(true);
                    break;
            }
        } catch (error) {
            throw error;
        }
    }

    // 배치 리프레시 실행 메서드
    public async refreshBatch(types: RefreshType[]) {
        const now = Date.now();
        
        if (now - this.lastRefreshTime < this.REFRESH_COOLDOWN) {
            types.forEach(type => this.pendingRefreshTypes.add(type));
            return;
        }

        if (this.isRefreshInProgress) {
            types.forEach(type => this.pendingRefreshTypes.add(type));
            return;
        }

        if (this.refreshTimeout) {
            clearTimeout(this.refreshTimeout);
            this.refreshTimeout = null;
        }

        types.forEach(type => this.pendingRefreshTypes.add(type));

        const minDebounceTime = Math.min(
            ...Array.from(this.pendingRefreshTypes).map(t => this.getDebounceTime(t))
        );

        this.refreshTimeout = setTimeout(async () => {
            try {
                this.isRefreshInProgress = true;
                this.lastRefreshTime = Date.now();

                if (this.pendingRefreshTypes.has(RefreshType.LAYOUT)) {
                    await this.refreshByType(RefreshType.LAYOUT);
                }

                if (this.pendingRefreshTypes.has(RefreshType.SETTINGS)) {
                    await this.refreshByType(RefreshType.SETTINGS);
                }

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

    // 단일 리프레시 실행 메서드
    async refresh(type: RefreshType = RefreshType.CONTENT) {
        await this.refreshBatch([type]);
    }
    //#endregion
}
