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
                return 300; // 컨텐츠 변경은 중간 딜레이
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
                    this.updateLayoutAndRefresh();
                    break;
            }
        } catch (error) {
            console.error(`Failed to refresh ${type}:`, error);
        }
    }

    // 디바운스된 리프레시 실행
    async refresh(type: RefreshType = RefreshType.CONTENT) {
        // 이전 타이머가 있다면 클리어
        const existingTimer = this.refreshDebounceTimers.get(type);
        if (existingTimer) {
            clearTimeout(existingTimer);
        }

        // 새로운 타이머 설정
        const timer = setTimeout(async () => {
            try {
                await this.refreshByType(type);
            } catch (error) {
                console.error(`Failed to execute refresh ${type}:`, error);
            } finally {
                this.refreshDebounceTimers.delete(type);
            }
        }, this.getDebounceTime(type));

        this.refreshDebounceTimers.set(type, timer);
    }

    // Update layout settings and refresh the view
    public updateLayoutAndRefresh() {
        const settings = this.plugin.settings;
        if (settings.defaultLayout) {
            this.cardContainer.setLayout(settings.defaultLayout);
        } else {
            this.cardContainer.setLayout('auto');
        }
        
        this.cardContainer.updateSettings(settings);
        this.refresh(RefreshType.CONTENT);
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
    
        // UI 구조 초기화
        this.toolbar.initialize(toolbarEl);
        this.cardContainer.initialize(cardContainerEl);
    
        // 초기화 작업 수행
        try {
            await this.plugin.loadSettings();
            this.updateLayoutAndRefresh();
        } catch (error) {
            console.error('Failed to initialize view:', error);
        }
    }

    // Clean up when the view is closed
    async onClose() {
        this.toolbar.onClose();
        this.cardContainer.onClose();
    }
}
