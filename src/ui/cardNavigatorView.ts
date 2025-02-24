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
    SETTINGS = 'settings', // 설정 변경 관련 리프레시
    ALL = 'all'           // 전체 업데이트
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

    // 레이아웃 설정 업데이트 메서드
    private updateLayout() {
        const settings = this.plugin.settings;
        if (settings.defaultLayout) {
            this.cardContainer.setLayout(settings.defaultLayout);
        } else {
            this.cardContainer.setLayout('auto');
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
        
        console.log(`[CardNavigator] 배치 리프레시 요청 - 타입들:`, types);

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
            console.log(`[CardNavigator] 리프레시가 진행 중 - 타입 병합`);
            types.forEach(type => this.pendingRefreshTypes.add(type));
            return;
        }

        try {
            this.isRefreshInProgress = true;
            this.lastRefreshTime = now;
            
            // 대기 중인 리프레시 타입들을 현재 타입들과 병합
            types.forEach(type => this.pendingRefreshTypes.add(type));
            const mergedTypes = Array.from(this.pendingRefreshTypes);
            this.pendingRefreshTypes.clear();

            // 컨테이너 요소 가져오기
            const containerEl = this.cardContainer.getContainerElement();
            if (!containerEl) return;

            try {
                // 단일 통합 업데이트 실행
                await this.refreshByType(RefreshType.SETTINGS);
                
                // 짧은 지연 후 레이아웃 재계산
                await new Promise(resolve => setTimeout(resolve, 50));
            } catch (error) {
                console.error(`[CardNavigator] 리프레시 중 오류 발생:`, error);
            }
        } finally {
            this.isRefreshInProgress = false;
            this.pendingRefreshTypes.clear();
        }
    }

    // 단일 리프레시 실행 메서드
    public async refresh(type: RefreshType = RefreshType.CONTENT) {
        await this.refreshBatch([type]);
    }

    private async refreshByType(type: RefreshType) {
        if (!this.cardContainer) return;

        console.log(`[CardNavigator] 리프레시 시작 - 타입: ${type}`);
        const startTime = performance.now();

        try {
            // 모든 타입을 단일 업데이트로 처리
            console.log(`[CardNavigator] 통합 업데이트 시작`);
            
            const folder = await this.getCurrentFolder();
            if (folder) {
                // 1. 설정 업데이트
                this.cardContainer.updateSettings(this.plugin.settings);
                
                // 2. 레이아웃 업데이트
                this.updateLayout();
                
                // 3. 컨텐츠 업데이트
                const files = folder.children
                    .filter((file): file is TFile => file instanceof TFile && file.extension === 'md');
                const sortedFiles = this.sortFiles(files);
                
                // 단일 렌더링 사이클에서 모든 카드 업데이트
                await this.cardContainer.displayCards(sortedFiles);
            }
            
            console.log(`[CardNavigator] 통합 업데이트 완료`);

            const endTime = performance.now();
            console.log(`[CardNavigator] 리프레시 완료 - 타입: ${type}, 소요시간: ${endTime - startTime}ms`);
        } catch (error) {
            console.error(`[CardNavigator] 리프레시 중 오류 발생:`, error);
            throw error;
        }
    }
    //#endregion
}
