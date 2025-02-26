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
        if (!this.cardContainer) {
            console.log(`[CardNavigator] updateLayout: cardContainer가 초기화되지 않음`);
            return;
        }
        
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
        
        console.log(`[CardNavigator] refreshBatch 호출됨: 타입 ${types.join(', ')}`);

        // 현재 시간과 마지막 리프레시 시간을 비교
        const now = Date.now();
        if (now - this.lastRefreshTime < this.REFRESH_COOLDOWN) {
            // 쿨다운 중이면 타입을 병합하고 대기
            console.log(`[CardNavigator] 리프레시 쿨다운 중 (${this.REFRESH_COOLDOWN}ms), 타입 병합`);
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
                    console.log(`[CardNavigator] 쿨다운 후 대기 중인 리프레시 실행: ${pendingTypes.join(', ')}`);
                    this.refreshBatch(pendingTypes);
                }
            }, this.REFRESH_COOLDOWN);
            
            return;
        }

        // 이미 진행 중인 리프레시가 있으면 타입을 병합하고 대기
        if (this.isRefreshInProgress) {
            console.log(`[CardNavigator] 리프레시 이미 진행 중, 타입 병합`);
            types.forEach(type => this.pendingRefreshTypes.add(type));
            return;
        }

        try {
            this.isRefreshInProgress = true;
            this.lastRefreshTime = now;
            
            // 대기 중인 리프레시 타입들을 현재 타입들과 병합
            types.forEach(type => this.pendingRefreshTypes.add(type));
            const refreshTypes = Array.from(this.pendingRefreshTypes);
            this.pendingRefreshTypes.clear();

            console.log(`[CardNavigator] 리프레시 실행: ${refreshTypes.join(', ')}`);

            // 컨테이너 요소 가져오기
            const containerEl = this.cardContainer.getContainerElement();
            if (!containerEl) {
                console.log(`[CardNavigator] 컨테이너 요소가 없음, 리프레시 취소`);
                return;
            }

            try {
                // 모든 타입에 대해 리프레시 실행
                await this.refreshByType(refreshTypes);
                
                // 짧은 지연 후 레이아웃 재계산
                await new Promise(resolve => setTimeout(resolve, 50));
                console.log(`[CardNavigator] 리프레시 완료`);
            } catch (error) {
                console.error(`[CardNavigator] 리프레시 중 오류 발생:`, error);
            }
        } finally {
            this.isRefreshInProgress = false;
            
            // 대기 중인 리프레시가 있으면 처리
            if (this.pendingRefreshTypes.size > 0) {
                const pendingTypes = Array.from(this.pendingRefreshTypes);
                this.pendingRefreshTypes.clear();
                console.log(`[CardNavigator] 대기 중인 리프레시 실행: ${pendingTypes.join(', ')}`);
                
                // 약간의 지연 후 대기 중인 리프레시 실행
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

    private async refreshByType(types: RefreshType[]) {
        if (!this.cardContainer) return;

        try {
            console.log(`[CardNavigator] refreshByType 시작: ${types.join(', ')}`);
            
            // 모든 타입을 단일 업데이트로 처리            
            const folder = await this.getCurrentFolder();
            if (folder) {
                console.log(`[CardNavigator] 현재 폴더: ${folder.path}`);
                
                // 1. 설정 업데이트
                console.log(`[CardNavigator] 설정 업데이트 시작`);
                this.cardContainer.updateSettings(this.plugin.settings);
                console.log(`[CardNavigator] 설정 업데이트 완료`);
                
                // 2. 레이아웃 업데이트
                console.log(`[CardNavigator] 레이아웃 업데이트 시작`);
                // 레이아웃 매니저가 초기화되었는지 확인
                try {
                    this.updateLayout();
                    console.log(`[CardNavigator] 레이아웃 업데이트 완료`);
                } catch (error) {
                    console.log(`[CardNavigator] 레이아웃 매니저가 아직 초기화되지 않음, 업데이트 건너뜀: ${error}`);
                }
                
                // 3. 컨텐츠 업데이트 - 단일 호출로 통합
                console.log(`[CardNavigator] 컨텐츠 업데이트 시작`);
                const files = folder.children
                    .filter((file): file is TFile => file instanceof TFile && file.extension === 'md');
                console.log(`[CardNavigator] 폴더 내 마크다운 파일 수: ${files.length}`);
                
                const sortedFiles = this.sortFiles(files);
                console.log(`[CardNavigator] 정렬된 파일 수: ${sortedFiles.length}`);
                
                // 단일 렌더링 사이클에서 모든 카드 업데이트
                // 중복 호출 방지를 위해 displayCards를 한 번만 호출
                console.log(`[CardNavigator] displayCards 호출 시작`);
                await this.cardContainer.displayCards(sortedFiles);
                console.log(`[CardNavigator] displayCards 호출 완료`);
            } else {
                console.log(`[CardNavigator] 현재 폴더를 찾을 수 없음`);
            }
            
            console.log(`[CardNavigator] refreshByType 완료`);
        } catch (error) {
            console.error(`[CardNavigator] 리프레시 중 오류 발생: ${error}`);
        }
    }
    //#endregion
}
