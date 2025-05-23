import { ItemView, WorkspaceLeaf } from 'obsidian';
import CardNavigatorPlugin from '../../main';
import { ICardNavigatorViewModel } from '../interfaces/ICardNavigatorViewModel';
import { ICardNavigatorView } from '../interfaces/ICardNavigatorView';
import { ICardNavigatorState } from '../../domain/models/CardNavigatorState';
import { ICard } from '../../domain/models/Card';
import { ICardSet } from '../../domain/models/CardSet';
import { IErrorHandler } from '@/domain/infrastructure/IErrorHandler';
import { ILoggingService } from '@/domain/infrastructure/ILoggingService';
import { IPerformanceMonitor } from '@/domain/infrastructure/IPerformanceMonitor';
import { Container } from '@/infrastructure/di/Container';
import { CardSetType } from '@/domain/models/CardSet';
import { ISortConfig, SortOrder, SortType } from '@/domain/models/Sort';
import { LayoutType } from '@/domain/models/Layout';
import { CardDisplayManager } from '@/application/manager/CardDisplayManager';
import { CardRenderManager } from '@/application/manager/CardRenderManager';
import { IAnalyticsService } from '@/domain/infrastructure/IAnalyticsService';
import { DomainEventType } from '@/domain/events/DomainEventType';
import { EventBus } from '@/domain/events/EventBus';

export const VIEW_TYPE_CARD_NAVIGATOR = 'card-navigator-view';

export class CardNavigatorView extends ItemView implements ICardNavigatorView {
    private plugin: CardNavigatorPlugin;
    private readonly viewModel: ICardNavigatorViewModel;
    private toolbarEl: HTMLElement;
    private cardContainerEl: HTMLElement;
    private cardElements: Map<string, HTMLElement> = new Map();
    private errorHandler: IErrorHandler;
    private loggingService: ILoggingService;
    private performanceMonitor: IPerformanceMonitor;
    private cardDisplayManager: CardDisplayManager;
    private cardRenderManager: CardRenderManager;
    private analyticsService: IAnalyticsService;
    private eventBus: EventBus;
    private initialized: boolean = false;

    constructor(
        leaf: WorkspaceLeaf,
        plugin: CardNavigatorPlugin,
        viewModel: ICardNavigatorViewModel
    ) {
        super(leaf);

        // 의존성 주입
        this.plugin = plugin;
        this.viewModel = viewModel;

        const container = Container.getInstance();
        this.errorHandler = container.resolve<IErrorHandler>('IErrorHandler');
        this.loggingService = container.resolve<ILoggingService>('ILoggingService');
        this.performanceMonitor = container.resolve<IPerformanceMonitor>('IPerformanceMonitor');
        this.cardDisplayManager = container.resolve<CardDisplayManager>('ICardDisplayManager');
        this.cardRenderManager = container.resolve<CardRenderManager>('ICardRenderManager');
        this.analyticsService = container.resolve<IAnalyticsService>('IAnalyticsService');
        this.eventBus = container.resolve<EventBus>('IEventDispatcher');

        // 초기화 검증
        if (!this.performanceMonitor) {
            throw new Error('PerformanceMonitor가 주입되지 않았습니다.');
        }
        if (!this.loggingService) {
            throw new Error('LoggingService가 주입되지 않았습니다.');
        }
        if (!this.errorHandler) {
            throw new Error('ErrorHandler가 주입되지 않았습니다.');
        }
        if (!this.cardDisplayManager) {
            throw new Error('CardDisplayManager가 주입되지 않았습니다.');
        }
        if (!this.cardRenderManager) {
            throw new Error('CardRenderManager가 주입되지 않았습니다.');
        }
        if (!this.analyticsService) {
            throw new Error('AnalyticsService가 주입되지 않았습니다.');
        }
        if (!this.eventBus) {
            throw new Error('EventBus가 주입되지 않았습니다.');
        }
    }

    getViewType(): string {
        return VIEW_TYPE_CARD_NAVIGATOR;
    }

    getDisplayText(): string {
        return 'Card Navigator';
    }

    getIcon(): string {
        return 'layers';
    }

    async onOpen(): Promise<void> {
        this.contentEl.empty();
        this.contentEl.addClass('card-navigator-view');

        // 툴바 생성
        this.createToolbar();

        // 카드 컨테이너 생성
        this.createCardContainer();

        // 뷰 초기화
        this.initialize();

        // 초기 상태 로드
        await this.viewModel.initialize();
    }

    async onClose(): Promise<void> {
        this.contentEl.empty();
        await this.viewModel.cleanup();
    }

    private createToolbar(): void {
        this.toolbarEl = this.contentEl.createDiv('card-navigator-toolbar');
        
        // 카드셋 선택 드롭다운
        const cardSetSelect = this.toolbarEl.createEl('select', {
            cls: 'card-navigator-cardset-select'
        });
        cardSetSelect.createEl('option', { text: '폴더', value: 'folder' });
        cardSetSelect.createEl('option', { text: '태그', value: 'tag' });
        cardSetSelect.createEl('option', { text: '링크', value: 'link' });

        // 검색 입력 필드
        const searchInput = this.toolbarEl.createEl('input', {
            type: 'text',
            placeholder: '검색...',
            cls: 'card-navigator-search-input'
        });

        // 정렬 버튼
        const sortButton = this.toolbarEl.createEl('button', {
            text: '정렬',
            cls: 'card-navigator-sort-button'
        });

        // 설정 버튼
        const settingsButton = this.toolbarEl.createEl('button', {
            text: '설정',
            cls: 'card-navigator-settings-button'
        });

        // 이벤트 리스너 등록
        cardSetSelect.addEventListener('change', async (e) => {
            const value = (e.target as HTMLSelectElement).value;
            await this.handleCardSetTypeChange(value);
        });

        searchInput.addEventListener('input', async (e) => {
            const value = (e.target as HTMLInputElement).value;
            await this.viewModel.search(value);
        });

        sortButton.addEventListener('click', () => {
            this.handleSortClick();
        });

        settingsButton.addEventListener('click', () => {
            this.viewModel.openSettings();
        });
    }

    private createCardContainer(): void {
        this.cardContainerEl = this.contentEl.createDiv('card-navigator-container');
    }

    private renderCards(cards: readonly ICard[]): void {
        // 기존 카드 제거
        this.cardContainerEl.empty();
        this.cardElements.clear();

        // 새 카드 렌더링
        cards.forEach(card => {
            try {
                // CardRenderManager를 통해 카드 렌더링
                const cardEl = this.cardRenderManager.renderCard(card, this.cardContainerEl);
                if (cardEl) {
                    this.cardContainerEl.appendChild(cardEl);
                    this.cardElements.set(card.id, cardEl);
                    
                    // CardDisplayManager에 카드 요소 등록
                    this.cardDisplayManager.registerCardElement(card.id, cardEl);
                    
                    // CardRenderManager에 렌더링 리소스 등록
                    this.cardRenderManager.registerRenderResource(card.id, cardEl);
                } else {
                    this.loggingService.error('카드 렌더링 실패', { cardId: card.id });
                }
            } catch (error) {
                this.errorHandler.handleError(error as Error, 'CardNavigatorView.renderCards');
                this.loggingService.error('카드 렌더링 중 오류 발생', { error, cardId: card.id });
            }
        });
    }

    public updateState(state: ICardNavigatorState): void {
        this.loggingService.debug('상태 업데이트 시작');
        
        if (!this.cardContainerEl) {
            this.loggingService.error('카드 컨테이너가 초기화되지 않았습니다.');
            return;
        }
        
        // 카드 컨테이너 초기화
        this.cardContainerEl.empty();
        this.cardElements.clear();
        
        // 카드 렌더링
        if (state.activeCardSet) {
            this.renderCards(state.activeCardSet.cards);
        }
        
        this.loggingService.debug('상태 업데이트 완료');
    }

    public updateSelectedCards(cardIds: Set<string>): void {
        cardIds.forEach(cardId => {
            this.cardDisplayManager.updateCardState(cardId, { isSelected: true });
        });
    }

    public updateFocusedCard(cardId: string | null): void {
        if (cardId) {
            this.cardDisplayManager.updateCardState(cardId, { isFocused: true });
            const cardEl = this.cardDisplayManager.getCardElement(cardId);
            if (cardEl) {
                cardEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }

    public updateActiveCard(cardId: string | null): void {
        if (cardId) {
            this.cardDisplayManager.updateCardState(cardId, { isActive: true });
        }
    }

    public updateSearchMode(isSearchMode: boolean, query: string): void {
        const searchInput = this.toolbarEl.querySelector('.card-navigator-search-input') as HTMLInputElement;
        if (searchInput) {
            searchInput.value = query;
            if (isSearchMode) {
                searchInput.addClass('active');
            } else {
                searchInput.removeClass('active');
            }
        }
    }

    public updateCardSet(cardSet: ICardSet): void {
        const cardSetSelect = this.toolbarEl.querySelector('.card-navigator-cardset-select') as HTMLSelectElement;
        if (cardSetSelect) {
            cardSetSelect.value = cardSet.id;
        }
    }

    public showLoading(isLoading: boolean): void {
        if (isLoading) {
            this.contentEl.addClass('loading');
        } else {
            this.contentEl.removeClass('loading');
        }
    }

    public showError(message: string): void {
        const timer = this.performanceMonitor.startTimer('CardNavigatorView.showError');
        try {
            this.loggingService.debug('에러 메시지 표시', { message });

            // 기존 에러 메시지 제거
            const existingError = this.contentEl.querySelector('.card-navigator-error');
            if (existingError) {
                existingError.remove();
            }

            // 에러 메시지 요소 생성
            const errorEl = this.contentEl.createDiv('card-navigator-error');
            errorEl.createEl('p', { text: message });

            // 5초 후 자동으로 사라지도록 설정
            setTimeout(() => {
                errorEl.remove();
            }, 5000);

            this.analyticsService.trackEvent('error_shown', { message });
        } catch (error) {
            this.loggingService.error('에러 메시지 표시 실패', { error, message });
            this.errorHandler.handleError(error as Error, 'CardNavigatorView.showError');
        } finally {
            timer.stop();
        }
    }

    public showMessage(message: string): void {
        const timer = this.performanceMonitor.startTimer('CardNavigatorView.showMessage');
        try {
            this.loggingService.debug('메시지 표시', { message });

            // 기존 메시지 제거
            const existingMessage = this.contentEl.querySelector('.card-navigator-message');
            if (existingMessage) {
                existingMessage.remove();
            }

            // 메시지 요소 생성
            const messageEl = this.contentEl.createDiv('card-navigator-message');
            messageEl.createEl('p', { text: message });

            // 3초 후 자동으로 사라지도록 설정
            setTimeout(() => {
                messageEl.remove();
            }, 3000);

            this.analyticsService.trackEvent('message_shown', { message });
        } catch (error) {
            this.loggingService.error('메시지 표시 실패', { error, message });
            this.errorHandler.handleError(error as Error, 'CardNavigatorView.showMessage');
        } finally {
            timer.stop();
        }
    }

    public getContainerDimensions(): { width: number; height: number } {
        return {
            width: this.contentEl.clientWidth,
            height: this.contentEl.clientHeight
        };
    }

    public scrollToCard(cardId: string): void {
        const cardEl = this.cardContainerEl.querySelector(`[data-card-id="${cardId}"]`);
        if (cardEl) {
            cardEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    public updateDragTarget(cardId: string, isTarget: boolean): void {
        const cardEl = this.cardContainerEl.querySelector(`[data-card-id="${cardId}"]`);
        if (cardEl) {
            if (isTarget) {
                cardEl.addClass('drag-target');
            } else {
                cardEl.removeClass('drag-target');
            }
        }
    }

    public cleanup(): void {
        this.contentEl.empty();
    }

    private initialize(): void {
        const timer = this.performanceMonitor.startTimer('CardNavigatorView.initialize');
        try {
            this.loggingService.debug('카드 내비게이터 뷰 초기화 시작');
            
            // 이벤트 구독
            this.eventBus.subscribe(DomainEventType.CARD_SECTION_DISPLAY_CHANGED, () => {
                this.loggingService.debug('카드 섹션 표시 설정 변경 이벤트 수신');
                const state = this.viewModel.state.value;
                this.renderCards(state.activeCardSet?.cards ?? []);
            });
            
            this.eventBus.subscribe(DomainEventType.CARD_STYLE_CHANGED, () => {
                this.loggingService.debug('카드 스타일 설정 변경 이벤트 수신');
                const state = this.viewModel.state.value;
                this.renderCards(state.activeCardSet?.cards ?? []);
            });

            // 상태 변경 구독
            this.viewModel.state.subscribe((state: ICardNavigatorState) => {
                this.loggingService.debug('상태 변경 이벤트 수신', {
                    hasActiveCardSet: !!state.activeCardSet,
                    cardCount: state.activeCardSet?.cards.length ?? 0
                });
                this.updateState(state);
            });
            
            // 초기화 완료
            this.initialized = true;
            
            this.loggingService.info('카드 내비게이터 뷰 초기화 완료');
        } catch (error) {
            this.loggingService.error('카드 내비게이터 뷰 초기화 실패', { error });
            this.errorHandler.handleError(error as Error, 'CardNavigatorView.initialize');
        } finally {
            timer.stop();
        }
    }

    private handleCardSetTypeChange(type: string): void {
        const timer = this.performanceMonitor.startTimer('CardNavigatorView.handleCardSetTypeChange');
        try {
            this.loggingService.debug('카드셋 타입 변경', { type });
            this.viewModel.changeCardSet(type as CardSetType);
        } catch (error) {
            this.loggingService.error('카드셋 타입 변경 실패', { error, type });
            this.errorHandler.handleError(error as Error, 'CardNavigatorView.handleCardSetTypeChange');
        } finally {
            timer.stop();
        }
    }

    private handleSortClick(): void {
        const timer = this.performanceMonitor.startTimer('CardNavigatorView.handleSortClick');
        try {
            this.loggingService.debug('정렬 클릭');
            const config: ISortConfig = {
                type: SortType.NAME,
                order: SortOrder.ASC,
                field: 'fileName',
                direction: 'asc',
                priorityTags: [],
                priorityFolders: []
            };
            this.viewModel.sort(config);
        } catch (error) {
            this.loggingService.error('정렬 클릭 처리 실패', { error });
            this.errorHandler.handleError(error as Error, 'CardNavigatorView.handleSortClick');
        } finally {
            timer.stop();
        }
    }
} 