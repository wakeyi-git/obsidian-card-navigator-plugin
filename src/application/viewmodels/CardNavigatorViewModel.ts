import { BehaviorSubject } from 'rxjs';
import { ICardNavigatorView } from '@/ui/interfaces/ICardNavigatorView';
import { ICardNavigatorState, DEFAULT_CARD_NAVIGATOR_STATE } from '@/domain/models/CardNavigatorState';
import { ICardNavigatorService } from '@/domain/services/application/ICardNavigatorService';
import { IEventDispatcher } from '@/domain/infrastructure/IEventDispatcher';
import { IErrorHandler } from '@/domain/infrastructure/IErrorHandler';
import { ILoggingService } from '@/domain/infrastructure/ILoggingService';
import { IPerformanceMonitor } from '@/domain/infrastructure/IPerformanceMonitor';
import { IAnalyticsService } from '@/domain/infrastructure/IAnalyticsService';
import { DomainEventType } from '@/domain/events/DomainEventType';
import { ICardStyle, IRenderConfig } from '@/domain/models/Card';
import { ICardSet, CardSetType, ICardSetConfig, ICardSetCriteria, ICardSetFilter } from '@/domain/models/CardSet';
import { Container } from '@/infrastructure/di/Container';
import { FocusDirection, ICardNavigatorViewModel } from '@/ui/interfaces/ICardNavigatorViewModel';
import { DomainEvent } from '@/domain/events/DomainEvent';
import { ICardSetService } from '@/domain/services/domain/ICardSetService';
import { ISearchConfig, DEFAULT_SEARCH_CONFIG } from '@/domain/models/Search';
import { ISortConfig } from '@/domain/models/Sort';
import { IActiveFileWatcher } from '@/domain/services/application/IActiveFileWatcher';
import { Menu } from 'obsidian';

/**
 * 카드 내비게이터 뷰모델 구현체
 */
export class CardNavigatorViewModel implements ICardNavigatorViewModel {
    private view: ICardNavigatorView | null = null;
    private service: ICardNavigatorService;
    private errorHandler: IErrorHandler;
    private loggingService: ILoggingService;
    private performanceMonitor: IPerformanceMonitor;
    private analyticsService: IAnalyticsService;
    private _state: ICardNavigatorState = DEFAULT_CARD_NAVIGATOR_STATE;
    private state$: BehaviorSubject<ICardNavigatorState>;
    private selectedCardIds: Set<string> = new Set<string>();
    private cardSetService: ICardSetService;
    private activeFileWatcher: IActiveFileWatcher;

    constructor(private eventDispatcher: IEventDispatcher) {
        const container = Container.getInstance();
        this.service = container.resolve<ICardNavigatorService>('ICardNavigatorService');
        this.errorHandler = container.resolve<IErrorHandler>('IErrorHandler');
        this.loggingService = container.resolve<ILoggingService>('ILoggingService');
        this.performanceMonitor = container.resolve<IPerformanceMonitor>('IPerformanceMonitor');
        this.analyticsService = container.resolve<IAnalyticsService>('IAnalyticsService');
        this.cardSetService = container.resolve<ICardSetService>('ICardSetService');
        this.activeFileWatcher = container.resolve<IActiveFileWatcher>('IActiveFileWatcher');
        this.state$ = new BehaviorSubject<ICardNavigatorState>(this._state);
        this.initializeEventListeners();
    }

    private initializeEventListeners(): void {
        const events = [
            DomainEventType.CARDSET_CREATED,
            DomainEventType.CARDSET_SORTED,
            DomainEventType.CARD_SELECTED,
            DomainEventType.CARD_FOCUSED,
            DomainEventType.PRESET_APPLIED,
            DomainEventType.CARD_CLICKED,
            DomainEventType.PRESET_UPDATED,
            DomainEventType.CARD_STYLE_CHANGED,
            DomainEventType.TOOLBAR_ACTION,
            DomainEventType.LAYOUT_CONFIG_CHANGED
        ];

        events.forEach(eventType => {
            this.eventDispatcher.subscribe(
                eventType,
                (event) => this.handleEvent(event)
            );
        });
    }

    private handleEvent(event: any): void {
        const timer = this.performanceMonitor.startTimer('CardNavigatorViewModel.handleEvent');
        try {
            this.loggingService.debug('이벤트 처리 시작', { eventType: event.type });
            
            // 이벤트 처리 로직 구현
            
            this.loggingService.info('이벤트 처리 완료', { eventType: event.type });
            this.analyticsService.trackEvent('event:handled', {
                eventType: event.type
            });
        } catch (error) {
            this.loggingService.error('이벤트 처리 실패', { error, eventType: event.type });
            this.errorHandler.handleError(error as Error, 'CardNavigatorViewModel.handleEvent');
        } finally {
            timer.stop();
        }
    }

    setView(view: ICardNavigatorView): void {
        this.view = view;
    }

    async initialize(): Promise<void> {
        const timer = this.performanceMonitor.startTimer('CardNavigatorViewModel.initialize');
        try {
            this.loggingService.debug('카드 내비게이터 뷰모델 초기화 시작');
            
            // 초기 상태 설정
            const settings = await this.service.loadPreset('default');
            
            // 현재 활성 파일을 기반으로 카드셋 생성
            const activeFile = this.activeFileWatcher.getActiveFile();
            let activeCardSet: ICardSet | null = null;
            
            if (activeFile) {
                activeCardSet = await this.cardSetService.createCardSet(CardSetType.FOLDER, {
                    criteria: {
                        type: CardSetType.FOLDER,
                        folderPath: activeFile.parent?.path ?? '/'
                    },
                    filter: {
                        includeSubfolders: true,
                        includeSubtags: true,
                        tagCaseSensitive: false,
                        linkDepth: 1
                    }
                });
            } else {
                // 활성 파일이 없는 경우 기본 카드셋 생성
                activeCardSet = await this.cardSetService.createCardSet(CardSetType.FOLDER, {
                    criteria: {
                        type: CardSetType.FOLDER,
                        folderPath: '/'
                    },
                    filter: {
                        includeSubfolders: true,
                        includeSubtags: true,
                        tagCaseSensitive: false,
                        linkDepth: 1
                    }
                });
            }
            
            this._state = {
                ...this._state,
                settings,
                activeCardSet
            };
            
            this.state$.next(this._state);

            this.loggingService.info('카드 내비게이터 뷰모델 초기화 완료');
            this.analyticsService.trackEvent('viewmodel_initialized', {
                viewType: 'card_navigator'
            });
        } catch (error) {
            this.loggingService.error('카드 내비게이터 뷰모델 초기화 실패', { error });
            this.errorHandler.handleError(error as Error, 'CardNavigatorViewModel.initialize');
            throw error;
        } finally {
            timer.stop();
        }
    }

    async cleanup(): Promise<void> {
        const timer = this.performanceMonitor.startTimer('CardNavigatorViewModel.cleanup');
        try {
            this.loggingService.debug('카드 내비게이터 뷰모델 정리 시작');

            // 이벤트 구독 해제
            this.eventDispatcher.cleanup();
            this._state = DEFAULT_CARD_NAVIGATOR_STATE;
            this.state$.next(this._state);
            this.selectedCardIds.clear();

            this.loggingService.info('카드 내비게이터 뷰모델 정리 완료');
        } catch (error) {
            this.loggingService.error('카드 내비게이터 뷰모델 정리 실패', { error });
            this.errorHandler.handleError(error as Error, 'CardNavigatorViewModel.cleanup');
            throw error;
        } finally {
            timer.stop();
        }
    }

    moveFocus(direction: FocusDirection): void {
        const timer = this.performanceMonitor.startTimer('CardNavigatorViewModel.moveFocus');
        try {
            this.loggingService.debug('포커스 이동', { direction });

            const { activeCardSet } = this._state;
            if (!activeCardSet) {
                return;
            }

            const currentIndex = activeCardSet.cards.findIndex(card => card.id === this._state.focusedCard?.id);
            if (currentIndex === -1) {
                return;
            }

            let nextIndex = currentIndex;
            switch (direction) {
                case 'up':
                    nextIndex = Math.max(0, currentIndex - 1);
                    break;
                case 'down':
                    nextIndex = Math.min(activeCardSet.cards.length - 1, currentIndex + 1);
                    break;
                case 'left':
                    nextIndex = Math.max(0, currentIndex - 1);
                    break;
                case 'right':
                    nextIndex = Math.min(activeCardSet.cards.length - 1, currentIndex + 1);
                    break;
            }

            const nextCard = activeCardSet.cards[nextIndex];
            this.focusCard(nextCard.id);

            this.analyticsService.trackEvent('focus_moved', { direction });
        } catch (error) {
            this.loggingService.error('포커스 이동 실패', { error, direction });
            this.errorHandler.handleError(error as Error, 'CardNavigatorViewModel.moveFocus');
            throw error;
        } finally {
            timer.stop();
        }
    }

    openFocusedCard(): void {
        const timer = this.performanceMonitor.startTimer('CardNavigatorViewModel.openFocusedCard');
        try {
            this.loggingService.debug('포커스된 카드 열기');

            const { focusedCard } = this._state;
            if (!focusedCard) {
                this.loggingService.warn('포커스된 카드가 없음');
                return;
            }

            this.activateCard(focusedCard.id);

            this.analyticsService.trackEvent('card_opened', {
                cardId: focusedCard.id
            });
        } catch (error) {
            this.loggingService.error('포커스된 카드 열기 실패', { error });
            this.errorHandler.handleError(error as Error, 'CardNavigatorViewModel.openFocusedCard');
            throw error;
        } finally {
            timer.stop();
        }
    }

    clearFocus(): void {
        const timer = this.performanceMonitor.startTimer('CardNavigatorViewModel.clearFocus');
        try {
            this.loggingService.debug('포커스 해제');

            this._state = {
                ...this._state,
                focusedCard: null
            };
            this.state$.next(this._state);

            this.analyticsService.trackEvent('focus_cleared');
        } catch (error) {
            this.loggingService.error('포커스 해제 실패', { error });
            this.errorHandler.handleError(error as Error, 'CardNavigatorViewModel.clearFocus');
            throw error;
        } finally {
            timer.stop();
        }
    }

    selectCard(cardId: string): void {
        const timer = this.performanceMonitor.startTimer('CardNavigatorViewModel.selectCard');
        try {
            this.loggingService.debug('카드 선택', { cardId });
            this.selectedCardIds.add(cardId);
            if (this.view) {
                this.view.updateSelectedCards(this.selectedCardIds);
            }
            this.service.getCardById(cardId).then(card => {
                if (card) {
                    this.eventDispatcher.dispatch(new DomainEvent(DomainEventType.CARD_SELECTED, { card }));
                }
            });
            this.analyticsService.trackEvent('card_selected', { cardId });
        } catch (error) {
            this.loggingService.error('카드 선택 실패', { error, cardId });
            this.errorHandler.handleError(error as Error, 'CardNavigatorViewModel.selectCard');
            throw error;
        } finally {
            timer.stop();
        }
    }

    deselectCard(cardId: string): void {
        const timer = this.performanceMonitor.startTimer('CardNavigatorViewModel.deselectCard');
        try {
            this.loggingService.debug('카드 선택 해제', { cardId });
            this.selectedCardIds.delete(cardId);
            if (this.view) {
                this.view.updateSelectedCards(this.selectedCardIds);
            }
            this.service.getCardById(cardId).then(card => {
                if (card) {
                    this.eventDispatcher.dispatch(new DomainEvent(DomainEventType.CARD_DESELECTED, { card }));
                }
            });
            this.analyticsService.trackEvent('card_deselected', { cardId });
        } catch (error) {
            this.loggingService.error('카드 선택 해제 실패', { error, cardId });
            this.errorHandler.handleError(error as Error, 'CardNavigatorViewModel.deselectCard');
            throw error;
        } finally {
            timer.stop();
        }
    }

    public isCardSelected(cardId: string): boolean {
        return this.selectedCardIds.has(cardId);
    }

    public getSelectedCardIds(): Set<string> {
        return new Set(this.selectedCardIds);
    }

    public clearSelectedCards(): void {
        const timer = this.performanceMonitor.startTimer('clearSelectedCards');
        try {
            this.selectedCardIds.clear();
            if (this.view) {
                this.view.updateSelectedCards(this.selectedCardIds);
            }
        } catch (error) {
            this.errorHandler.handleError(error, 'CardNavigatorViewModel.clearSelectedCards');
        } finally {
            timer.stop();
        }
    }

    async selectCardsInRange(cardId: string): Promise<void> {
        const timer = this.performanceMonitor.startTimer('CardNavigatorViewModel.selectCardsInRange');
        try {
            this.loggingService.debug('카드 범위 선택', { cardId });

            const { activeCardSet } = this._state;
            if (!activeCardSet) {
                return;
            }

            const currentIndex = activeCardSet.cards.findIndex(card => card.id === cardId);
            if (currentIndex === -1) {
                return;
            }

            const lastSelectedCardId = Array.from(this.selectedCardIds).pop();
            if (!lastSelectedCardId) {
                this.selectCard(cardId);
                return;
            }

            const lastSelectedIndex = activeCardSet.cards.findIndex(card => card.id === lastSelectedCardId);
            if (lastSelectedIndex === -1) {
                this.selectCard(cardId);
                return;
            }

            const startIndex = Math.min(currentIndex, lastSelectedIndex);
            const endIndex = Math.max(currentIndex, lastSelectedIndex);

            for (let i = startIndex; i <= endIndex; i++) {
                this.selectCard(activeCardSet.cards[i].id);
            }

            this.analyticsService.trackEvent('cards_selected_in_range', { cardId });
        } catch (error) {
            this.loggingService.error('카드 범위 선택 실패', { error, cardId });
            this.errorHandler.handleError(error as Error, 'CardNavigatorViewModel.selectCardsInRange');
            throw error;
        } finally {
            timer.stop();
        }
    }

    async toggleCardSelection(cardId: string): Promise<void> {
        const timer = this.performanceMonitor.startTimer('CardNavigatorViewModel.toggleCardSelection');
        try {
            this.loggingService.debug('카드 선택 토글', { cardId });

            if (this.selectedCardIds.has(cardId)) {
                await this.deselectCard(cardId);
            } else {
                await this.selectCard(cardId);
            }

            this.analyticsService.trackEvent('card_selection_toggled', { cardId });
        } catch (error) {
            this.loggingService.error('카드 선택 토글 실패', { error, cardId });
            this.errorHandler.handleError(error as Error, 'CardNavigatorViewModel.toggleCardSelection');
            throw error;
        } finally {
            timer.stop();
        }
    }

    async focusCard(cardId: string): Promise<void> {
        const timer = this.performanceMonitor.startTimer('CardNavigatorViewModel.focusCard');
        try {
            this.loggingService.debug('카드 포커스', { cardId });

            const card = await this.service.getCardById(cardId);
            if (!card) {
                return;
            }

            this.service.focusCard(card);
            this._state = {
                ...this._state,
                focusedCard: card
            };
            this.state$.next(this._state);

            if (this.view) {
                this.view.scrollToCard(cardId);
            }

            this.analyticsService.trackEvent('card_focused', { cardId });
        } catch (error) {
            this.loggingService.error('카드 포커스 실패', { error, cardId });
            this.errorHandler.handleError(error as Error, 'CardNavigatorViewModel.focusCard');
            throw error;
        } finally {
            timer.stop();
        }
    }

    async activateCard(cardId: string): Promise<void> {
        const timer = this.performanceMonitor.startTimer('CardNavigatorViewModel.activateCard');
        try {
            this.loggingService.debug('카드 활성화', { cardId });

            const card = await this.service.getCardById(cardId);
            if (!card) {
                return;
            }

            this._state = {
                ...this._state,
                activeCard: card
            };
            this.state$.next(this._state);

            this.analyticsService.trackEvent('card_activated', { cardId });
        } catch (error) {
            this.loggingService.error('카드 활성화 실패', { error, cardId });
            this.errorHandler.handleError(error as Error, 'CardNavigatorViewModel.activateCard');
            throw error;
        } finally {
            timer.stop();
        }
    }

    async deactivateCard(cardId: string): Promise<void> {
        const timer = this.performanceMonitor.startTimer('CardNavigatorViewModel.deactivateCard');
        try {
            this.loggingService.debug('카드 비활성화', { cardId });

            this._state = {
                ...this._state,
                activeCard: null
            };
            this.state$.next(this._state);

            this.analyticsService.trackEvent('card_deactivated', { cardId });
        } catch (error) {
            this.loggingService.error('카드 비활성화 실패', { error, cardId });
            this.errorHandler.handleError(error as Error, 'CardNavigatorViewModel.deactivateCard');
            throw error;
        } finally {
            timer.stop();
        }
    }

    showCardContextMenu(cardId: string, event: MouseEvent): void {
        const timer = this.performanceMonitor.startTimer('CardNavigatorViewModel.showCardContextMenu');
        try {
            this.loggingService.debug('카드 컨텍스트 메뉴 표시', { cardId });

            // 컨텍스트 메뉴 생성
            const menu = new Menu();
            
            // 링크 복사 메뉴 항목
            menu.addItem((item) => {
                item.setTitle('링크 복사');
                item.setIcon('link');
                item.onClick(async () => {
                    const card = await this.service.getCardById(cardId);
                    if (card) {
                        const link = `[[${card.fileName}]]`;
                        await navigator.clipboard.writeText(link);
                        this.showMessage('링크가 복사되었습니다.');
                    }
                });
            });

            // 내용 복사 메뉴 항목
            menu.addItem((item) => {
                item.setTitle('내용 복사');
                item.setIcon('copy');
                item.onClick(async () => {
                    const card = await this.service.getCardById(cardId);
                    if (card) {
                        await navigator.clipboard.writeText(card.content);
                        this.showMessage('내용이 복사되었습니다.');
                    }
                });
            });

            // 메뉴 표시
            menu.showAtMouseEvent(event);

            this.analyticsService.trackEvent('card_context_menu_shown', { cardId });
        } catch (error) {
            this.loggingService.error('카드 컨텍스트 메뉴 표시 실패', { error, cardId });
            this.errorHandler.handleError(error as Error, 'CardNavigatorViewModel.showCardContextMenu');
            throw error;
        } finally {
            timer.stop();
        }
    }

    startCardDrag(cardId: string, event: DragEvent): void {
        const timer = this.performanceMonitor.startTimer('CardNavigatorViewModel.startCardDrag');
        try {
            this.loggingService.debug('카드 드래그 시작', { cardId });

            if (event.dataTransfer) {
                // 드래그 데이터 설정
                event.dataTransfer.setData('text/plain', cardId);
                event.dataTransfer.effectAllowed = 'move';
                
                // 드래그 이미지 설정
                const cardElement = document.querySelector(`[data-card-id="${cardId}"]`);
                if (cardElement) {
                    event.dataTransfer.setDragImage(cardElement, 0, 0);
                }
            }

            this.analyticsService.trackEvent('card_drag_started', { cardId });
        } catch (error) {
            this.loggingService.error('카드 드래그 시작 실패', { error, cardId });
            this.errorHandler.handleError(error as Error, 'CardNavigatorViewModel.startCardDrag');
            throw error;
        } finally {
            timer.stop();
        }
    }

    handleCardDragOver(cardId: string, event: DragEvent): void {
        const timer = this.performanceMonitor.startTimer('CardNavigatorViewModel.handleCardDragOver');
        try {
            this.loggingService.debug('카드 드래그 오버', { cardId });

            event.preventDefault();
            if (event.dataTransfer) {
                event.dataTransfer.dropEffect = 'move';
            }

            // 드래그 오버 시 시각적 피드백 제공
            const cardElement = document.querySelector(`[data-card-id="${cardId}"]`);
            if (cardElement) {
                cardElement.classList.add('drag-over');
            }

            this.analyticsService.trackEvent('card_drag_over', { cardId });
        } catch (error) {
            this.loggingService.error('카드 드래그 오버 실패', { error, cardId });
            this.errorHandler.handleError(error as Error, 'CardNavigatorViewModel.handleCardDragOver');
            throw error;
        } finally {
            timer.stop();
        }
    }

    handleCardDrop(cardId: string, event: DragEvent): void {
        const timer = this.performanceMonitor.startTimer('CardNavigatorViewModel.handleCardDrop');
        try {
            this.loggingService.debug('카드 드롭', { cardId });

            event.preventDefault();
            
            // 드래그 오버 시 추가된 클래스 제거
            const cardElement = document.querySelector(`[data-card-id="${cardId}"]`);
            if (cardElement) {
                cardElement.classList.remove('drag-over');
            }

            if (event.dataTransfer) {
                const sourceCardId = event.dataTransfer.getData('text/plain');
                if (sourceCardId && sourceCardId !== cardId) {
                    // 카드 간 링크 생성
                    this.createLinkBetweenCards(sourceCardId, cardId);
                }
            }

            this.analyticsService.trackEvent('card_dropped', { cardId });
        } catch (error) {
            this.loggingService.error('카드 드롭 실패', { error, cardId });
            this.errorHandler.handleError(error as Error, 'CardNavigatorViewModel.handleCardDrop');
            throw error;
        } finally {
            timer.stop();
        }
    }

    public updateState(state: ICardNavigatorState): void {
        const timer = this.performanceMonitor.startTimer('updateState');
        try {
            this._state = state;
            this.state$.next(this._state);
        } catch (error) {
            this.errorHandler.handleError(error, 'CardNavigatorViewModel.updateState');
        } finally {
            timer.stop();
        }
    }

    public updateCardSet(cardSet: ICardSet): void {
        const timer = this.performanceMonitor.startTimer('updateCardSet');
        try {
            this._state = {
                ...this._state,
                activeCardSet: cardSet
            };
            this.state$.next(this._state);
        } catch (error) {
            this.errorHandler.handleError(error, 'CardNavigatorViewModel.updateCardSet');
        } finally {
            timer.stop();
        }
    }

    public updateFocusedCard(cardId: string | null): void {
        const timer = this.performanceMonitor.startTimer('updateFocusedCard');
        try {
            if (cardId && this._state.activeCardSet) {
                const focusedCard = this._state.activeCardSet.cards.find(card => card.id === cardId) || null;
                this._state = {
                    ...this._state,
                    focusedCard
                };
                this.state$.next(this._state);
            }
        } catch (error) {
            this.errorHandler.handleError(error, 'CardNavigatorViewModel.updateFocusedCard');
        } finally {
            timer.stop();
        }
    }

    public updateSelectedCards(cardIds: Set<string>): void {
        const timer = this.performanceMonitor.startTimer('updateSelectedCards');
        try {
            this.selectedCardIds = cardIds;
            if (this.view) {
                this.view.updateSelectedCards(cardIds);
            }
        } catch (error) {
            this.errorHandler.handleError(error, 'CardNavigatorViewModel.updateSelectedCards');
        } finally {
            timer.stop();
        }
    }

    public updateActiveCard(cardId: string | null): void {
        const timer = this.performanceMonitor.startTimer('updateActiveCard');
        try {
            if (cardId && this._state.activeCardSet) {
                const activeCard = this._state.activeCardSet.cards.find(card => card.id === cardId) || null;
                this._state = {
                    ...this._state,
                    activeCard
                };
                this.state$.next(this._state);
            }
        } catch (error) {
            this.errorHandler.handleError(error, 'CardNavigatorViewModel.updateActiveCard');
        } finally {
            timer.stop();
        }
    }

    public updateSearchMode(isSearchMode: boolean, query: string): void {
        const timer = this.performanceMonitor.startTimer('updateSearchMode');
        try {
            if (this.view) {
                this.view.updateSearchMode(isSearchMode, query);
            }
        } catch (error) {
            this.errorHandler.handleError(error, 'CardNavigatorViewModel.updateSearchMode');
        } finally {
            timer.stop();
        }
    }

    public showLoading(isLoading: boolean): void {
        const timer = this.performanceMonitor.startTimer('showLoading');
        try {
            if (this.view) {
                this.view.showLoading(isLoading);
            }
        } catch (error) {
            this.errorHandler.handleError(error, 'CardNavigatorViewModel.showLoading');
        } finally {
            timer.stop();
        }
    }

    public showError(message: string): void {
        const timer = this.performanceMonitor.startTimer('showError');
        try {
            if (this.view) {
                this.view.showError(message);
            }
        } catch (error) {
            this.errorHandler.handleError(error, 'CardNavigatorViewModel.showError');
        } finally {
            timer.stop();
        }
    }

    public showMessage(message: string): void {
        const timer = this.performanceMonitor.startTimer('showMessage');
        try {
            if (this.view) {
                this.view.showMessage(message);
            }
        } catch (error) {
            this.errorHandler.handleError(error, 'CardNavigatorViewModel.showMessage');
        } finally {
            timer.stop();
        }
    }

    public getContainerDimensions(): { width: number; height: number } {
        const timer = this.performanceMonitor.startTimer('getContainerDimensions');
        try {
            if (this.view) {
                return this.view.getContainerDimensions();
            }
            return { width: 0, height: 0 };
        } catch (error) {
            this.errorHandler.handleError(error, 'CardNavigatorViewModel.getContainerDimensions');
            return { width: 0, height: 0 };
        } finally {
            timer.stop();
        }
    }

    public scrollToCard(cardId: string): void {
        const timer = this.performanceMonitor.startTimer('scrollToCard');
        try {
            if (this.view) {
                this.view.scrollToCard(cardId);
            }
        } catch (error) {
            this.errorHandler.handleError(error, 'CardNavigatorViewModel.scrollToCard');
        } finally {
            timer.stop();
        }
    }

    getRenderConfig(): IRenderConfig {
        return this._state.settings.card.renderConfig;
    }

    getCardStyle(): ICardStyle {
        return this._state.settings.card.style;
    }

    getCurrentCardSet(): ICardSet | null {
        return this._state.activeCardSet;
    }

    async handleCardClick(cardId: string): Promise<void> {
        const timer = this.performanceMonitor.startTimer('CardNavigatorViewModel.handleCardClick');
        try {
            this.loggingService.debug('카드 클릭 처리', { cardId });

            // 카드 활성화
            await this.activateCard(cardId);

            // 카드 객체 가져오기
            const card = await this.service.getCardById(cardId);
            if (card) {
                // 카드 클릭 이벤트 발송
                this.eventDispatcher.dispatch(new DomainEvent(DomainEventType.CARD_CLICKED, { card }));
            }

            this.analyticsService.trackEvent('card_clicked', { cardId });
        } catch (error) {
            this.loggingService.error('카드 클릭 처리 실패', { error, cardId });
            this.errorHandler.handleError(error as Error, 'CardNavigatorViewModel.handleCardClick');
            throw error;
        } finally {
            timer.stop();
        }
    }

    async handleCardDoubleClick(cardId: string): Promise<void> {
        const timer = this.performanceMonitor.startTimer('CardNavigatorViewModel.handleCardDoubleClick');
        try {
            this.loggingService.debug('카드 더블 클릭 처리', { cardId });

            // 카드 객체 가져오기
            const card = await this.service.getCardById(cardId);
            if (card) {
                // 카드 인라인 편집 시작 이벤트 발송
                this.eventDispatcher.dispatch(new DomainEvent(DomainEventType.CARD_INLINE_EDIT_STARTED, { card }));
            }

            this.analyticsService.trackEvent('card_double_clicked', { cardId });
        } catch (error) {
            this.loggingService.error('카드 더블 클릭 처리 실패', { error, cardId });
            this.errorHandler.handleError(error as Error, 'CardNavigatorViewModel.handleCardDoubleClick');
            throw error;
        } finally {
            timer.stop();
        }
    }

    handleCardDragStart(cardId: string, event: DragEvent): void {
        const timer = this.performanceMonitor.startTimer('CardNavigatorViewModel.handleCardDragStart');
        try {
            this.loggingService.debug('카드 드래그 시작', { cardId });
            if (event.dataTransfer) {
                event.dataTransfer.setData('text/plain', cardId);
                event.dataTransfer.effectAllowed = 'move';
            }
            this.service.getCardById(cardId).then(card => {
                if (card) {
                    this.eventDispatcher.dispatch(new DomainEvent(DomainEventType.CARD_DRAG_START, { card }));
                }
            });
            this.analyticsService.trackEvent('card_drag_started', { cardId });
        } catch (error) {
            this.loggingService.error('카드 드래그 시작 실패', { error, cardId });
            this.errorHandler.handleError(error as Error, 'CardNavigatorViewModel.handleCardDragStart');
            throw error;
        } finally {
            timer.stop();
        }
    }

    handleCardDragEnd(cardId: string, event: DragEvent): void {
        const timer = this.performanceMonitor.startTimer('CardNavigatorViewModel.handleCardDragEnd');
        try {
            this.loggingService.debug('카드 드래그 종료', { cardId });

            // 드래그 오버 시 추가된 클래스 제거
            const cardElements = document.querySelectorAll('.drag-over');
            cardElements.forEach(element => {
                element.classList.remove('drag-over');
            });

            this.analyticsService.trackEvent('card_drag_ended', { cardId });
        } catch (error) {
            this.loggingService.error('카드 드래그 종료 실패', { error, cardId });
            this.errorHandler.handleError(error as Error, 'CardNavigatorViewModel.handleCardDragEnd');
            throw error;
        } finally {
            timer.stop();
        }
    }

    handleCardDragEnter(cardId: string, event: DragEvent): void {
        const timer = this.performanceMonitor.startTimer('CardNavigatorViewModel.handleCardDragEnter');
        try {
            this.loggingService.debug('카드 드래그 엔터', { cardId });

            event.preventDefault();
            
            // 드래그 엔터 시 시각적 피드백 제공
            const cardElement = document.querySelector(`[data-card-id="${cardId}"]`);
            if (cardElement) {
                cardElement.classList.add('drag-over');
            }

            this.analyticsService.trackEvent('card_drag_entered', { cardId });
        } catch (error) {
            this.loggingService.error('카드 드래그 엔터 실패', { error, cardId });
            this.errorHandler.handleError(error as Error, 'CardNavigatorViewModel.handleCardDragEnter');
            throw error;
        } finally {
            timer.stop();
        }
    }

    handleCardDragLeave(cardId: string, event: DragEvent): void {
        const timer = this.performanceMonitor.startTimer('CardNavigatorViewModel.handleCardDragLeave');
        try {
            this.loggingService.debug('카드 드래그 리브', { cardId });

            event.preventDefault();
            
            // 드래그 리브 시 시각적 피드백 제거
            const cardElement = document.querySelector(`[data-card-id="${cardId}"]`);
            if (cardElement) {
                cardElement.classList.remove('drag-over');
            }

            this.analyticsService.trackEvent('card_drag_left', { cardId });
        } catch (error) {
            this.loggingService.error('카드 드래그 리브 실패', { error, cardId });
            this.errorHandler.handleError(error as Error, 'CardNavigatorViewModel.handleCardDragLeave');
            throw error;
        } finally {
            timer.stop();
        }
    }

    async createLinkBetweenCards(sourceCardId: string, targetCardId: string): Promise<void> {
        const timer = this.performanceMonitor.startTimer('CardNavigatorViewModel.createLinkBetweenCards');
        try {
            this.loggingService.debug('카드 간 링크 생성', { sourceCardId, targetCardId });

            // 소스 카드와 타겟 카드 객체 가져오기
            const sourceCard = await this.service.getCardById(sourceCardId);
            const targetCard = await this.service.getCardById(targetCardId);

            if (sourceCard && targetCard) {
                // 카드 간 링크 생성
                await this.service.createLinkBetweenCards(sourceCard, targetCard);

                // 카드 링크 생성 이벤트 발송
                this.eventDispatcher.dispatch(new DomainEvent(DomainEventType.CARD_LINK_CREATED, { card: sourceCard }));

                this.analyticsService.trackEvent('link_created_between_cards', {
                    sourceCardId,
                    targetCardId
                });
            }
        } catch (error) {
            this.loggingService.error('카드 간 링크 생성 실패', { error, sourceCardId, targetCardId });
            this.errorHandler.handleError(error as Error, 'CardNavigatorViewModel.createLinkBetweenCards');
            throw error;
        } finally {
            timer.stop();
        }
    }

    get state(): BehaviorSubject<ICardNavigatorState> {
        return this.state$;
    }

    async changeCardSet(cardSetType: CardSetType): Promise<void> {
        const timer = this.performanceMonitor.startTimer('CardNavigatorViewModel.changeCardSet');
        try {
            this.loggingService.debug('카드셋 변경', { cardSetType });
            
            const criteria: ICardSetCriteria = {
                type: cardSetType
            };
            
            const filter: ICardSetFilter = {
                includeSubfolders: true,
                includeSubtags: true,
                tagCaseSensitive: false,
                linkDepth: 1
            };
            
            const config: ICardSetConfig = {
                criteria,
                filter
            };
            
            const cardSet = await this.cardSetService.createCardSet(cardSetType, config);
            this.updateCardSet(cardSet);
            
            this.analyticsService.trackEvent('card_set_changed', { cardSetType });
        } catch (error) {
            this.loggingService.error('카드셋 변경 실패', { error, cardSetType });
            this.errorHandler.handleError(error as Error, 'CardNavigatorViewModel.changeCardSet');
            throw error;
        } finally {
            timer.stop();
        }
    }

    async search(query: string, config?: ISearchConfig): Promise<void> {
        const timer = this.performanceMonitor.startTimer('CardNavigatorViewModel.search');
        try {
            this.loggingService.debug('카드 검색', { query, config });
            
            const searchConfig = config || DEFAULT_SEARCH_CONFIG;
            const searchResults = await this.service.searchCards(query, searchConfig);
            
            const criteria: ICardSetCriteria = {
                type: CardSetType.FOLDER
            };
            
            const filter: ICardSetFilter = {
                includeSubfolders: true,
                includeSubtags: true,
                tagCaseSensitive: false,
                linkDepth: 1
            };
            
            const cardSetConfig: ICardSetConfig = {
                criteria,
                filter
            };
            
            const cardSet = await this.cardSetService.createCardSet(CardSetType.FOLDER, cardSetConfig);
            this.updateCardSet(cardSet);
            
            this.analyticsService.trackEvent('cards_searched', { query });
        } catch (error) {
            this.loggingService.error('카드 검색 실패', { error, query });
            this.errorHandler.handleError(error as Error, 'CardNavigatorViewModel.search');
            throw error;
        } finally {
            timer.stop();
        }
    }

    async sort(config: ISortConfig): Promise<void> {
        const timer = this.performanceMonitor.startTimer('CardNavigatorViewModel.sort');
        try {
            this.loggingService.debug('카드 정렬', { config });
            
            const currentCardSet = this.getCurrentCardSet();
            if (!currentCardSet) {
                return;
            }
            
            const cards = await this.service.getCards(currentCardSet);
            const sortedCards = this.service.sortCards(cards, config);
            
            const criteria: ICardSetCriteria = {
                type: CardSetType.FOLDER
            };
            
            const filter: ICardSetFilter = {
                includeSubfolders: true,
                includeSubtags: true,
                tagCaseSensitive: false,
                linkDepth: 1
            };
            
            const cardSetConfig: ICardSetConfig = {
                criteria,
                filter
            };
            
            const cardSet = await this.cardSetService.createCardSet(CardSetType.FOLDER, cardSetConfig);
            this.updateCardSet(cardSet);
            
            this.analyticsService.trackEvent('cards_sorted', { config });
        } catch (error) {
            this.loggingService.error('카드 정렬 실패', { error, config });
            this.errorHandler.handleError(error as Error, 'CardNavigatorViewModel.sort');
            throw error;
        } finally {
            timer.stop();
        }
    }

    openSettings(): void {
        const timer = this.performanceMonitor.startTimer('CardNavigatorViewModel.openSettings');
        try {
            this.loggingService.debug('설정 열기');
            
            if (this.view) {
                this.view.showMessage('설정을 여는 기능은 아직 구현되지 않았습니다.');
            }
            
            this.analyticsService.trackEvent('settings_opened');
        } catch (error) {
            this.loggingService.error('설정 열기 실패', { error });
            this.errorHandler.handleError(error as Error, 'CardNavigatorViewModel.openSettings');
            throw error;
        } finally {
            timer.stop();
        }
    }
} 