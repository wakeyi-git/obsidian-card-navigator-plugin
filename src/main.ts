import 'reflect-metadata';
import { Plugin } from 'obsidian';
import { CardNavigatorView, VIEW_TYPE_CARD_NAVIGATOR } from './ui/views/CardNavigatorView';
import { CardNavigatorSettingTab } from '@/ui/settings/CardNavigatorSettingTab';
import { PluginSettings, DEFAULT_PLUGIN_SETTINGS } from '@/domain/models/PluginSettings';
import { CardNavigatorService } from '@/application/services/application/CardNavigatorService';
import { CardNavigatorViewModel } from './application/viewmodels/CardNavigatorViewModel';
import { EventBus } from '@/domain/events/EventBus';
import { DomainEventType } from './domain/events/DomainEventType';
import { DomainEvent } from './domain/events/DomainEvent';
import { Container } from '@/infrastructure/di/Container';
import { registerServices } from '@/infrastructure/di/register';

export default class CardNavigatorPlugin extends Plugin {
    settings: PluginSettings;
    service: CardNavigatorService;
    private eventBus: EventBus;
    private viewModel: CardNavigatorViewModel;

    async onload() {
        // Container 초기화 및 서비스 등록
        const container = Container.getInstance();
        container.registerInstance('App', this.app);
        container.registerInstance('Plugin', this);
        registerServices(container);

        await this.loadSettings();

        // 이벤트 시스템 초기화
        this.eventBus = EventBus.getInstance();
        container.registerInstance('EventBus', this.eventBus);
        this.eventBus.initialize();

        // 서비스 및 뷰모델 초기화
        this.service = CardNavigatorService.getInstance();
        this.viewModel = new CardNavigatorViewModel(this.eventBus);

        // 뷰 등록
        this.registerView(
            VIEW_TYPE_CARD_NAVIGATOR,
            (leaf) => new CardNavigatorView(leaf, this, this.viewModel)
        );

        // 리본 아이콘 추가
        this.addRibbonIcon('layers', 'Card Navigator', () => {
            this.activateView();
        });

        // 설정 탭 추가
        this.addSettingTab(new CardNavigatorSettingTab(this.app, this));

        // 이벤트 리스너 등록
        this.registerEventListeners();

        // 명령어 등록
        this.registerCommands();

        // 플러그인 활성화 시 뷰 자동 활성화
        this.activateView();
    }

    onunload() {
        this.app.workspace.detachLeavesOfType(VIEW_TYPE_CARD_NAVIGATOR);
        this.eventBus.cleanup();
    }

    private async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_PLUGIN_SETTINGS, await this.loadData());
    }

    private async saveSettings() {
        await this.saveData(this.settings);
    }

    private async activateView() {
        const { workspace } = this.app;
        
        let leaf = workspace.getLeavesOfType(VIEW_TYPE_CARD_NAVIGATOR)[0];
        
        if (!leaf) {
            const rightLeaf = workspace.getRightLeaf(false);
            if (rightLeaf) {
                await rightLeaf.setViewState({
                    type: VIEW_TYPE_CARD_NAVIGATOR,
                    active: true,
                });
                leaf = rightLeaf;
            }
        }
        
        if (leaf) {
            workspace.revealLeaf(leaf);
        }
    }

    private registerEventListeners() {
        // 이벤트 리스너 등록
        this.eventBus.subscribe(DomainEventType.CARDSET_CREATED, (event: DomainEvent<typeof DomainEventType.CARDSET_CREATED>) => {
            const cardSet = event.data.cardSet;
            this.viewModel.updateCardSet(cardSet);
        });

        this.eventBus.subscribe(DomainEventType.CARDSET_SORTED, (event: DomainEvent<typeof DomainEventType.CARDSET_SORTED>) => {
            const cardSet = event.data.cardSet;
            this.viewModel.updateCardSet(cardSet);
        });

        this.eventBus.subscribe(DomainEventType.CARD_SELECTED, (event: DomainEvent<typeof DomainEventType.CARD_SELECTED>) => {
            const card = event.data.card;
            this.viewModel.selectCard(card.id);
        });

        this.eventBus.subscribe(DomainEventType.CARD_FOCUSED, (event: DomainEvent<typeof DomainEventType.CARD_FOCUSED>) => {
            const card = event.data.card;
            this.viewModel.focusCard(card.id);
        });

        this.eventBus.subscribe(DomainEventType.PRESET_APPLIED, (event: DomainEvent<typeof DomainEventType.PRESET_APPLIED>) => {
            const preset = event.data.preset;
            this.viewModel.updateState({
                ...this.viewModel.state.value,
                settings: {
                    ...this.viewModel.state.value.settings,
                    card: {
                        ...this.viewModel.state.value.settings.card,
                        stateStyle: preset.config.cardStateStyle,
                        displayOptions: preset.config.cardDisplayOptions,
                        sections: preset.config.cardSections,
                        renderConfig: preset.config.cardRenderConfig
                    },
                    cardSet: {
                        ...this.viewModel.state.value.settings.cardSet,
                        config: preset.config.cardSetConfig
                    },
                    search: {
                        ...this.viewModel.state.value.settings.search,
                        config: preset.config.searchConfig
                    },
                    sort: {
                        ...this.viewModel.state.value.settings.sort,
                        config: preset.config.sortConfig
                    },
                    layout: {
                        ...this.viewModel.state.value.settings.layout,
                        config: preset.config.layoutConfig
                    }
                }
            });
        });

        this.eventBus.subscribe(DomainEventType.CARD_CLICKED, (event: DomainEvent<typeof DomainEventType.CARD_CLICKED>) => {
            const card = event.data.card;
            this.viewModel.handleCardClick(card.id);
        });

        this.eventBus.subscribe(DomainEventType.PRESET_UPDATED, (event: DomainEvent<typeof DomainEventType.PRESET_UPDATED>) => {
            const preset = event.data.preset;
            this.viewModel.updateState({
                ...this.viewModel.state.value,
                settings: {
                    ...this.viewModel.state.value.settings,
                    card: {
                        ...this.viewModel.state.value.settings.card,
                        stateStyle: preset.config.cardStateStyle,
                        displayOptions: preset.config.cardDisplayOptions,
                        sections: preset.config.cardSections,
                        renderConfig: preset.config.cardRenderConfig
                    },
                    cardSet: {
                        ...this.viewModel.state.value.settings.cardSet,
                        config: preset.config.cardSetConfig
                    },
                    search: {
                        ...this.viewModel.state.value.settings.search,
                        config: preset.config.searchConfig
                    },
                    sort: {
                        ...this.viewModel.state.value.settings.sort,
                        config: preset.config.sortConfig
                    },
                    layout: {
                        ...this.viewModel.state.value.settings.layout,
                        config: preset.config.layoutConfig
                    }
                }
            });
        });

        this.eventBus.subscribe(DomainEventType.CARD_STYLE_CHANGED, (event: DomainEvent<typeof DomainEventType.CARD_STYLE_CHANGED>) => {
            const { oldStyle, newStyle } = event.data;
            this.viewModel.updateState({
                ...this.viewModel.state.value,
                settings: {
                    ...this.viewModel.state.value.settings,
                    card: {
                        ...this.viewModel.state.value.settings.card,
                        style: newStyle
                    }
                }
            });
        });

        this.eventBus.subscribe(DomainEventType.TOOLBAR_ACTION, (event: DomainEvent<typeof DomainEventType.TOOLBAR_ACTION>) => {
            const { cardSetType, searchConfig, sortConfig, cardSection, cardStyle, layoutConfig } = event.data;
            this.viewModel.updateState({
                ...this.viewModel.state.value,
                settings: {
                    ...this.viewModel.state.value.settings,
                    cardSet: {
                        ...this.viewModel.state.value.settings.cardSet,
                        type: cardSetType
                    },
                    search: {
                        ...this.viewModel.state.value.settings.search,
                        config: searchConfig
                    },
                    sort: {
                        ...this.viewModel.state.value.settings.sort,
                        config: sortConfig
                    },
                    card: {
                        ...this.viewModel.state.value.settings.card,
                        sections: {
                            ...this.viewModel.state.value.settings.card.sections,
                            header: cardSection,
                            body: cardSection,
                            footer: cardSection
                        },
                        style: cardStyle
                    },
                    layout: {
                        ...this.viewModel.state.value.settings.layout,
                        config: layoutConfig
                    }
                }
            });
        });

        this.eventBus.subscribe(DomainEventType.LAYOUT_CONFIG_CHANGED, (event: DomainEvent<typeof DomainEventType.LAYOUT_CONFIG_CHANGED>) => {
            const { oldConfig, newConfig } = event.data;
            this.viewModel.updateState({
                ...this.viewModel.state.value,
                settings: {
                    ...this.viewModel.state.value.settings,
                    layout: {
                        ...this.viewModel.state.value.settings.layout,
                        config: newConfig
                    }
                }
            });
        });
    }

    private registerCommands() {
        this.addCommand({
            id: 'open-card-navigator',
            name: 'Open Card Navigator',
            callback: () => {
                this.activateView();
            },
        });
    }
} 