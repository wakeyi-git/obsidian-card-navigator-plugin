import { ItemView, WorkspaceLeaf, Menu, TFile } from "obsidian";
import CardNavigatorPlugin from '../../main';
import { t } from 'i18next';
import { CardNavigatorViewModel } from '../viewModels/CardNavigatorViewModel';
import { CardNavigatorComponent } from '../components/CardNavigatorComponent';
import { RefreshType } from '../../domain/models/types';
import { Card } from '../../domain/models/Card';

// 카드 네비게이터 뷰의 고유 식별자
export const VIEW_TYPE_CARD_NAVIGATOR = "card-navigator-view";

/**
 * 카드 네비게이터 뷰
 */
export class CardNavigatorView extends ItemView {
    private component: CardNavigatorComponent | null = null;
    private readonly viewModel: CardNavigatorViewModel;
    private readonly plugin: CardNavigatorPlugin;
    private refreshDebounceTimers: Map<RefreshType, NodeJS.Timeout> = new Map();
    private isRefreshInProgress = false;
    private pendingRefreshTypes = new Set<RefreshType>();
    private refreshTimeout: NodeJS.Timeout | null = null;
    private lastRefreshTime: number = 0;
    private readonly REFRESH_COOLDOWN = 50; // 50ms 쿨다운

    // 생성자
    constructor(
        leaf: WorkspaceLeaf,
        viewModel: CardNavigatorViewModel
    ) {
        super(leaf);
        this.viewModel = viewModel;
        this.plugin = viewModel.getPlugin();
    }

    /**
     * 뷰 타입을 가져옵니다.
     */
    getViewType(): string {
        return VIEW_TYPE_CARD_NAVIGATOR;
    }

    /**
     * 뷰 제목을 가져옵니다.
     */
    getDisplayText(): string {
        return t('CARD_NAVIGATOR');
    }

    /**
     * 뷰 아이콘을 가져옵니다.
     */
    getIcon(): string {
        return 'layers-3';
    }

    /**
     * 뷰를 초기화합니다.
     */
    async onOpen(): Promise<void> {
        const container = this.containerEl.children[1];
        container.empty();
        container.createEl('h4', { text: t('CARD_NAVIGATOR') });

        const content = container.createDiv('card-navigator-content');
        
        // 컴포넌트 초기화
        this.component = new CardNavigatorComponent(this.viewModel, this.app);
        await this.component.initialize(content);

        // 초기 카드 표시
        await this.refresh(RefreshType.FULL);
    }

    /**
     * 뷰를 정리합니다.
     */
    async onClose(): Promise<void> {
        if (this.component) {
            await this.component.dispose();
            this.component = null;
        }
    }

    /**
     * 현재 폴더 경로를 가져옵니다.
     */
    public async getCurrentFolderPath(): Promise<string | null> {
        return this.viewModel.getCurrentFolderPath();
    }

    /**
     * 카드 컨테이너를 가져옵니다.
     */
    public get cardContainer() {
        return this.component?.getCardContainer();
    }

    //#region 카드 상호작용
    // 컨텍스트 메뉴 열기 메서드
    public openContextMenu() {
        const focusedCard = this.getFocusedCard();
        if (!focusedCard) return;

        const cardId = focusedCard.dataset.cardId;
        if (!cardId) return;

        const currentCardSet = this.viewModel.getCurrentCardSet();
        if (!currentCardSet) return;

        const card = currentCardSet.getCardById(cardId);
        if (!card) return;

        const menu = new Menu();
        const file = this.app.vault.getAbstractFileByPath(card.getFilePath());
        if (file instanceof TFile) {
            this.app.workspace.trigger('file-menu', menu, file, 'more-options');

            menu.addSeparator();

            menu.addItem((item) => {
                item
                    .setTitle(t('COPY_AS_LINK'))
                    .setIcon('link')
                    .onClick(() => {
                        navigator.clipboard.writeText(`[[${card.getFilePath()}]]`);
                    });
            });

            menu.addItem((item) => {
                item
                    .setTitle(t('COPY_CARD_CONTENT'))
                    .setIcon('file-text')
                    .onClick(async () => {
                        const content = await this.app.vault.read(file);
                        navigator.clipboard.writeText(content);
                    });
            });
        }

        const rect = focusedCard.getBoundingClientRect();
        menu.showAtPosition({ x: rect.left, y: rect.bottom });
    }

    // 키보드 네비게이터 포커스 메서드
    public focusNavigator() {
        this.component?.focusCardNavigator();
    }

    // 포커스된 카드 요소 반환 메서드
    private getFocusedCard(): HTMLElement | null {
        return this.containerEl.querySelector('.card-navigator-card.card-navigator-focused');
    }
    //#endregion

    //#region 리프레시 관리
    // 배치 리프레시 실행 메서드
    public async refreshBatch(types: RefreshType[]): Promise<void> {
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
            
            // 대기 중인 리프레시 타입들을 현재 타입들과 병합
            types.forEach(type => this.pendingRefreshTypes.add(type));
            this.pendingRefreshTypes.clear();

            // 컴포넌트 리프레시
            await this.component?.refresh(types);
        } finally {
            this.isRefreshInProgress = false;
            this.pendingRefreshTypes.clear();
        }
    }

    // 단일 리프레시 실행 메서드
    public async refresh(type: RefreshType = RefreshType.CONTENT): Promise<void> {
        await this.refreshBatch([type]);
    }
    //#endregion

    /**
     * 카드 뷰를 새로고침합니다.
     */
    public async refreshCardView(cardId: string): Promise<void> {
        await this.refresh(RefreshType.CONTENT);
    }

    /**
     * 카드 뷰를 제거합니다.
     */
    public async removeCardView(cardId: string): Promise<void> {
        await this.refresh(RefreshType.SELECTION);
    }

    /**
     * 카드 스타일을 업데이트합니다.
     */
    public async updateCardStyle(card: Card): Promise<void> {
        await this.refresh(RefreshType.CONTENT);
    }

    /**
     * 카드 위치를 업데이트합니다.
     */
    public async updateCardPosition(card: Card): Promise<void> {
        await this.refresh(RefreshType.CONTENT);
    }

    /**
     * 스크롤 방향을 가져옵니다.
     */
    public getIsVertical(): boolean {
        return this.component?.getIsVertical() ?? true;
    }

    /**
     * 스크롤 방향을 설정합니다.
     */
    public setIsVertical(isVertical: boolean): void {
        this.component?.setIsVertical(isVertical);
    }

    /**
     * 스크롤 양을 가져옵니다.
     */
    public getScrollAmount(): number {
        return this.component?.getScrollAmount() ?? 100;
    }

    /**
     * 스크롤 양을 설정합니다.
     */
    public setScrollAmount(amount: number): void {
        this.component?.setScrollAmount(amount);
    }

    /**
     * 위로 스크롤합니다.
     */
    public scrollUp(amount?: number): void {
        this.component?.scrollUp(amount);
    }

    /**
     * 아래로 스크롤합니다.
     */
    public scrollDown(amount?: number): void {
        this.component?.scrollDown(amount);
    }

    /**
     * 왼쪽으로 스크롤합니다.
     */
    public scrollLeft(amount?: number): void {
        this.component?.scrollLeft(amount);
    }

    /**
     * 오른쪽으로 스크롤합니다.
     */
    public scrollRight(amount?: number): void {
        this.component?.scrollRight(amount);
    }
} 