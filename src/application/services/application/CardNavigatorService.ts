import { CardRenderManager } from '@/application/manager/CardRenderManager';
import { PresetManager } from '@/application/manager/PresetManager';
import { ICard } from '@/domain/models/Card';
import { ICardSet } from '@/domain/models/CardSet';
import { ISearchConfig } from '@/domain/models/Search';
import { ISortConfig, SortField } from '@/domain/models/Sort';
import { IPluginSettings } from '@/domain/models/PluginSettings';
import { Container } from '@/infrastructure/di/Container';
import { TFile, App } from 'obsidian';
import { DEFAULT_CARD_CREATE_CONFIG } from '@/domain/models/Card';
import { ICardNavigatorService } from '@/domain/services/application/ICardNavigatorService';
import { IRenderConfig, RenderType, RenderStatus } from '@/domain/models/Card';
import { ICardStyle } from '@/domain/models/Card';
import { IErrorHandler } from '@/domain/infrastructure/IErrorHandler';
import { ILoggingService } from '@/domain/infrastructure/ILoggingService';
import { IPerformanceMonitor } from '@/domain/infrastructure/IPerformanceMonitor';
import { IAnalyticsService } from '@/domain/infrastructure/IAnalyticsService';
import { IScrollService } from '@/domain/services/application/IScrollService';
import { IEventDispatcher } from '@/domain/infrastructure/IEventDispatcher';
import { PresetService } from '@/application/services/application/PresetService';
import { ToolbarService } from '@/application/services/application/ToolbarService';
import { ICardService } from '@/domain/services/domain/ICardService';
import { ICardSelectionService } from '@/domain/services/domain/ICardSelectionService';
import { ICardManager } from '@/domain/managers/ICardManager';
import { ICardFocusService } from '@/domain/services/application/ICardFocusService';
import { ICardDisplayManager } from '@/domain/managers/ICardDisplayManager';
import { ICardFactory } from '@/domain/factories/ICardFactory';
import { IFocusManager } from '@/domain/managers/IFocusManager';
import { CardSetService } from '@/application/services/domain/CardSetService';
import { PresetMappingType } from '@/domain/models/Preset';

// 상수 정의
const DEFAULT_CARD_STYLE: ICardStyle = {
    classes: ['card'],
    backgroundColor: '#ffffff',
    fontSize: '14px',
    color: '#333333',
    border: {
        width: '1px',
        color: '#e0e0e0',
        style: 'solid',
        radius: '8px'
    },
    padding: '16px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    lineHeight: '1.5',
    fontFamily: 'system-ui, -apple-system, sans-serif'
};

const DEFAULT_RENDER_STATE = {
    status: RenderStatus.PENDING,
    startTime: 0,
    endTime: 0,
    error: null,
    timestamp: Date.now()
};

export class CardNavigatorService implements ICardNavigatorService {
    private static instance: CardNavigatorService | null = null;
    private readonly app: App;
    private readonly errorHandler: IErrorHandler;
    private readonly logger: ILoggingService;
    private readonly performanceMonitor: IPerformanceMonitor;
    private readonly analyticsService: IAnalyticsService;
    private readonly eventDispatcher: IEventDispatcher;
    private readonly cardService: ICardService;
    private readonly cardManager: ICardManager;
    private readonly cardFactory: ICardFactory;
    private readonly cardDisplayManager: ICardDisplayManager;
    private readonly focusManager: IFocusManager;
    private readonly scrollService: IScrollService;
    private readonly cardFocusService: ICardFocusService;
    private readonly presetManager: PresetManager;
    private readonly presetService: PresetService;
    private readonly toolbarService: ToolbarService;
    private readonly cardRenderManager: CardRenderManager;
    private readonly cardSetService: CardSetService;

    private constructor(
        app: App,
        errorHandler: IErrorHandler,
        logger: ILoggingService,
        performanceMonitor: IPerformanceMonitor,
        analyticsService: IAnalyticsService,
        eventDispatcher: IEventDispatcher,
        cardService: ICardService,
        cardManager: ICardManager,
        cardFactory: ICardFactory,
        cardDisplayManager: ICardDisplayManager,
        focusManager: IFocusManager,
        scrollService: IScrollService,
        cardFocusService: ICardFocusService,
        presetManager: PresetManager,
        presetService: PresetService,
        toolbarService: ToolbarService,
        cardRenderManager: CardRenderManager,
        cardSetService: CardSetService
    ) {
        this.app = app;
        this.errorHandler = errorHandler;
        this.logger = logger;
        this.performanceMonitor = performanceMonitor;
        this.analyticsService = analyticsService;
        this.eventDispatcher = eventDispatcher;
        this.cardService = cardService;
        this.cardManager = cardManager;
        this.cardFactory = cardFactory;
        this.cardDisplayManager = cardDisplayManager;
        this.focusManager = focusManager;
        this.scrollService = scrollService;
        this.cardFocusService = cardFocusService;
        this.presetManager = presetManager;
        this.presetService = presetService;
        this.toolbarService = toolbarService;
        this.cardRenderManager = cardRenderManager;
        this.cardSetService = cardSetService;
    }

    public static getInstance(): CardNavigatorService {
        if (!CardNavigatorService.instance) {
            const container = Container.getInstance();
            CardNavigatorService.instance = new CardNavigatorService(
                container.resolve('App'),
                container.resolve('IErrorHandler'),
                container.resolve('ILoggingService'),
                container.resolve('IPerformanceMonitor'),
                container.resolve('IAnalyticsService'),
                container.resolve('IEventDispatcher'),
                container.resolve('ICardService'),
                container.resolve('ICardManager'),
                container.resolve('ICardFactory'),
                container.resolve('ICardDisplayManager'),
                container.resolve('IFocusManager'),
                container.resolve('IScrollService'),
                container.resolve('ICardFocusService'),
                container.resolve('IPresetManager'),
                container.resolve('IPresetService'),
                container.resolve('IToolbarService'),
                container.resolve('ICardRenderManager'),
                container.resolve('ICardSetService')
            );
        }
        return CardNavigatorService.instance;
    }

    public async getCards(cardSet: ICardSet): Promise<ICard[]> {
        const timer = this.performanceMonitor.startTimer('CardNavigatorService.getCards');
        try {
            this.logger.debug('카드 목록 조회 시작', { cardSetId: cardSet.id });
            const cards = await this.cardSetService.filterCards(cardSet, () => true);
            this.logger.info('카드 목록 조회 완료', { cardSetId: cardSet.id, cardCount: cards.cards.length });
            return [...cards.cards];
        } catch (error) {
            this.logger.error('카드 목록 조회 실패', { error });
            this.errorHandler.handleError(error as Error, 'CardNavigatorService.getCards');
            return [];
        } finally {
            timer.stop();
        }
    }

    public async getCardById(cardId: string): Promise<ICard | null> {
        const timer = this.performanceMonitor.startTimer('CardNavigatorService.getCardById');
        try {
            this.logger.debug('카드 조회 시작', { cardId });
            const card = this.cardSetService.getCardById(cardId);
            this.logger.info('카드 조회 완료', { cardId, found: !!card });
            return card;
        } catch (error) {
            this.logger.error('카드 조회 실패', { error });
            this.errorHandler.handleError(error as Error, 'CardNavigatorService.getCardById');
            return null;
        } finally {
            timer.stop();
        }
    }

    public async searchCards(query: string, config: ISearchConfig): Promise<ICard[]> {
        const timer = this.performanceMonitor.startTimer('CardNavigatorService.searchCards');
        try {
            this.logger.debug('카드 검색 시작', { query, config });
            const activeCardSet = await this.cardSetService.getActiveCardSet();
            if (!activeCardSet) {
                this.logger.warn('활성 카드셋이 없습니다.');
                return [];
            }
            
            const searchResult = await this.cardSetService.filterCards(activeCardSet, (card) => {
                // 검색 로직 구현
                const searchText = `${card.title} ${card.content}`.toLowerCase();
                return searchText.includes(query.toLowerCase());
            });
            
            this.logger.info('카드 검색 완료', { 
                query, 
                resultCount: searchResult.cards.length 
            });
            
            return [...searchResult.cards];
        } catch (error) {
            this.logger.error('카드 검색 실패', { error });
            this.errorHandler.handleError(error as Error, 'CardNavigatorService.searchCards');
            return [];
        } finally {
            timer.stop();
        }
    }

    public sortCards(cards: ICard[], config: ISortConfig): ICard[] {
        const timer = this.performanceMonitor.startTimer('CardNavigatorService.sortCards');
        try {
            this.logger.debug('카드 정렬 시작', { config });
            
            const sortedCards = [...cards].sort((a, b) => {
                let comparison = 0;
                switch (config.field) {
                    case 'fileName':
                        comparison = a.fileName.localeCompare(b.fileName);
                        break;
                    case 'created':
                        comparison = a.createdAt.getTime() - b.createdAt.getTime();
                        break;
                    case 'modified':
                        comparison = a.updatedAt.getTime() - b.updatedAt.getTime();
                        break;
                    default:
                        comparison = 0;
                }
                return config.order === 'asc' ? comparison : -comparison;
            });

            this.logger.info('카드 정렬 완료');
            return sortedCards;
        } catch (error) {
            this.logger.error('카드 정렬 실패', { error });
            this.errorHandler.handleError(error as Error, 'CardNavigatorService.sortCards');
            return cards;
        } finally {
            timer.stop();
        }
    }

    public renderCard(card: ICard): HTMLElement {
        const timer = this.performanceMonitor.startTimer('CardNavigatorService.renderCard');
        try {
            this.logger.debug('카드 렌더링 시작', { cardId: card.id });
            
            const cardElement = this.cardRenderManager.renderCard(card);
            
            this.logger.info('카드 렌더링 완료', { cardId: card.id });
            return cardElement;
        } catch (error) {
            this.logger.error('카드 렌더링 실패', { error });
            this.errorHandler.handleError(error as Error, 'CardNavigatorService.renderCard');
            
            // 에러 발생 시 빈 div 반환
            const errorElement = document.createElement('div');
            errorElement.classList.add('card-error');
            errorElement.textContent = '카드를 렌더링할 수 없습니다.';
            return errorElement;
        } finally {
            timer.stop();
        }
    }

    public applyDisplayOptions(card: ICard, settings: IPluginSettings): void {
        const timer = this.performanceMonitor.startTimer('CardNavigatorService.applyDisplayOptions');
        try {
            this.logger.debug('카드 표시 옵션 적용 시작', { cardId: card.id });
            
            this.cardDisplayManager.updateCardStyle(card, settings.card.style as unknown as 'normal' | 'active' | 'focused');
            
            this.logger.info('카드 표시 옵션 적용 완료', { cardId: card.id });
        } catch (error) {
            this.logger.error('카드 표시 옵션 적용 실패', { error });
            this.errorHandler.handleError(error as Error, 'CardNavigatorService.applyDisplayOptions');
        } finally {
            timer.stop();
        }
    }

    public focusCard(card: ICard): void {
        const timer = this.performanceMonitor.startTimer('CardNavigatorService.focusCard');
        try {
            this.logger.debug('카드 포커스 설정 시작', { cardId: card.id });
            
            this.cardFocusService.focusCard(card);
            
            this.logger.info('카드 포커스 설정 완료', { cardId: card.id });
        } catch (error) {
            this.logger.error('카드 포커스 설정 실패', { error });
            this.errorHandler.handleError(error as Error, 'CardNavigatorService.focusCard');
        } finally {
            timer.stop();
        }
    }

    public async savePreset(name: string, settings: IPluginSettings): Promise<void> {
        const timer = this.performanceMonitor.startTimer('CardNavigatorService.savePreset');
        try {
            this.logger.debug('프리셋 저장 시작', { name });
            
            await this.presetService.createPreset(
                name,
                '',
                'custom',
                settings.card.sections.header,
                settings.cardSet.config,
                settings.layout.config,
                settings.sort.config,
                settings.search.config
            );
            
            this.logger.info('프리셋 저장 완료', { name });
        } catch (error) {
            this.logger.error('프리셋 저장 실패', { error });
            this.errorHandler.handleError(error as Error, 'CardNavigatorService.savePreset');
        } finally {
            timer.stop();
        }
    }

    public async loadPreset(name: string): Promise<IPluginSettings> {
        const timer = this.performanceMonitor.startTimer('CardNavigatorService.loadPreset');
        try {
            this.logger.debug('프리셋 로드 시작', { name });
            const preset = await this.presetService.getPreset(name);
            if (!preset) {
                throw new Error('프리셋을 찾을 수 없습니다.');
            }
            const settings = await this.presetService.getPreset(preset.metadata.id);
            if (!settings) {
                throw new Error('프리셋 설정을 찾을 수 없습니다.');
            }
            this.logger.info('프리셋 로드 완료', { name });
            return settings as unknown as IPluginSettings;
        } catch (error) {
            this.logger.error('프리셋 로드 실패', { error });
            this.errorHandler.handleError(error as Error, 'CardNavigatorService.loadPreset');
            throw error;
        } finally {
            timer.stop();
        }
    }

    public async mapPresetToFolder(presetId: string, folderPath: string): Promise<void> {
        const timer = this.performanceMonitor.startTimer('CardNavigatorService.mapPresetToFolder');
        try {
            this.logger.debug('폴더 프리셋 매핑 시작', { presetId, folderPath });
            await this.presetService.createPresetMapping(presetId, {
                presetId,
                type: PresetMappingType.FOLDER,
                target: folderPath,
                priority: 0,
                enabled: true,
                options: {
                    includeSubfolders: false
                }
            });
            this.logger.info('폴더 프리셋 매핑 완료', { presetId, folderPath });
        } catch (error) {
            this.logger.error('폴더 프리셋 매핑 실패', { error });
            this.errorHandler.handleError(error as Error, 'CardNavigatorService.mapPresetToFolder');
            throw error;
        } finally {
            timer.stop();
        }
    }

    public async mapPresetToTag(presetId: string, tag: string): Promise<void> {
        const timer = this.performanceMonitor.startTimer('CardNavigatorService.mapPresetToTag');
        try {
            this.logger.debug('태그 프리셋 매핑 시작', { presetId, tag });
            await this.presetService.createPresetMapping(presetId, {
                presetId,
                type: PresetMappingType.TAG,
                target: tag,
                priority: 0,
                enabled: true,
                options: {
                    includeSubtags: false
                }
            });
            this.logger.info('태그 프리셋 매핑 완료', { presetId, tag });
        } catch (error) {
            this.logger.error('태그 프리셋 매핑 실패', { error });
            this.errorHandler.handleError(error as Error, 'CardNavigatorService.mapPresetToTag');
            throw error;
        } finally {
            timer.stop();
        }
    }

    public async createLinkBetweenCards(card1: ICard, card2: ICard): Promise<void> {
        const timer = this.performanceMonitor.startTimer('CardNavigatorService.createLinkBetweenCards');
        try {
            this.logger.debug('카드 간 링크 생성 시작', { card1Id: card1.id, card2Id: card2.id });
            if (!card1.file || !card2.file) {
                throw new Error('카드 파일이 없습니다.');
            }
            await this.cardService.createCardFromFile(card1.file, {
                type: 'body',
                displayOptions: DEFAULT_CARD_CREATE_CONFIG.body.displayOptions,
                style: DEFAULT_CARD_CREATE_CONFIG.body.style
            });
            await this.cardService.createCardFromFile(card2.file, {
                type: 'body',
                displayOptions: DEFAULT_CARD_CREATE_CONFIG.body.displayOptions,
                style: DEFAULT_CARD_CREATE_CONFIG.body.style
            });
            this.logger.info('카드 간 링크 생성 완료', { card1Id: card1.id, card2Id: card2.id });
        } catch (error) {
            this.logger.error('카드 간 링크 생성 실패', { error });
            this.errorHandler.handleError(error as Error, 'CardNavigatorService.createLinkBetweenCards');
            throw error;
        } finally {
            timer.stop();
        }
    }

    public scrollToCard(card: ICard): void {
        const timer = this.performanceMonitor.startTimer('CardNavigatorService.scrollToCard');
        try {
            this.logger.debug('카드로 스크롤 시작', { cardId: card.id });
            this.scrollService.scrollToCard(card);
            this.logger.info('카드로 스크롤 완료', { cardId: card.id });
        } catch (error) {
            this.logger.error('카드로 스크롤 실패', { error });
            this.errorHandler.handleError(error as Error, 'CardNavigatorService.scrollToCard');
        } finally {
            timer.stop();
        }
    }

    public getContainerDimensions(): { width: number; height: number } {
        const container = document.querySelector('.card-navigator-container');
        if (!container) {
            return { width: 0, height: 0 };
        }
        return {
            width: container.clientWidth,
            height: container.clientHeight
        };
    }

    public getRenderConfig(): IRenderConfig {
        return {
            type: RenderType.MARKDOWN,
            contentLengthLimitEnabled: false,
            contentLengthLimit: 200,
            style: DEFAULT_CARD_STYLE,
            state: DEFAULT_RENDER_STATE
        };
    }

    public getCardStyle(): ICardStyle {
        return {
            classes: ['card'],
            backgroundColor: '#ffffff',
            fontSize: '14px',
            color: '#333333',
            border: {
                width: '1px',
                color: '#e0e0e0',
                style: 'solid',
                radius: '8px'
            },
            padding: '16px',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
            lineHeight: '1.5',
            fontFamily: 'system-ui, -apple-system, sans-serif'
        };
    }
} 