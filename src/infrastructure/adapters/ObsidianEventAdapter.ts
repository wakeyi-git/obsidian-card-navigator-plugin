import { App, TFile, TAbstractFile, EventRef } from 'obsidian';
import { DomainEventBus } from '../../core/events/DomainEventBus';
import { EventType, IEventPayloads, BaseEventPayload } from '../../core/events/EventTypes';
import { IObsidianService } from './ObsidianInterfaces';
import { ICard } from '../../domain/card/Card';
import { 
  INavigationEventPublisher,
  ICardEventPublisher,
  ICardSetEventPublisher,
  ICardLifecycleEventPublisher
} from '../../core/events/EventPublishers';
import { IEventBus } from '../../core/events/IEventBus';
import { ICardService } from '../../application/card/CardService';
import { ICardSetService } from '../../application/cardset/CardSetService';
import { INavigationService } from '../../application/navigation/NavigationService';
import { ILayoutService } from '../../application/layout/LayoutService';

/**
 * 옵시디언 이벤트 어댑터
 * 옵시디언의 이벤트를 도메인 이벤트로 변환하여 처리
 */
export class ObsidianEventAdapter implements INavigationEventPublisher, ICardEventPublisher, ICardSetEventPublisher, ICardLifecycleEventPublisher {
  private eventRefs: EventRef[] = [];

  constructor(
    private app: App,
    private eventBus: IEventBus,
    private obsidianService: IObsidianService,
    private cardService: ICardService,
    private cardSetService: ICardSetService,
    private navigationService: INavigationService,
    private layoutService: ILayoutService
  ) {
    this.initializeEventListeners();
  }

  /**
   * 이벤트 리스너 초기화
   */
  private initializeEventListeners(): void {
    // 옵시디언 이벤트 리스너 등록
    this.registerObsidianEventListeners();
  }

  /**
   * 옵시디언 이벤트 리스너 등록
   */
  private registerObsidianEventListeners(): void {
    // 파일 변경 이벤트
    this.registerFileChangeEvents();
    
    // 레이아웃 변경 이벤트
    this.registerLayoutChangeEvents();
    
    // 내비게이션 이벤트
    this.registerNavigationEvents();
  }

  /**
   * 파일 변경 이벤트 등록
   */
  private registerFileChangeEvents(): void {
    // 파일 생성
    this.eventRefs.push(
      this.app.vault.on('create', async (file: TAbstractFile) => {
        if (!(file instanceof TFile) || file.extension !== 'md') return;
        const card = await this.obsidianService.fileToCard(file);
        this.eventBus.publish(
          EventType.CARD_LIFECYCLE_CREATED as keyof IEventPayloads,
          this.createEventPayload(EventType.CARD_LIFECYCLE_CREATED as keyof IEventPayloads, { card })
        );
      })
    );

    // 파일 수정
    this.eventRefs.push(
      this.app.vault.on('modify', async (file: TAbstractFile) => {
        if (!(file instanceof TFile) || file.extension !== 'md') return;
        const card = await this.obsidianService.fileToCard(file);
        this.eventBus.publish(
          EventType.CARD_LIFECYCLE_UPDATED as keyof IEventPayloads,
          this.createEventPayload(EventType.CARD_LIFECYCLE_UPDATED as keyof IEventPayloads, { card })
        );
      })
    );

    // 파일 삭제
    this.eventRefs.push(
      this.app.vault.on('delete', async (file: TAbstractFile) => {
        if (!(file instanceof TFile) || file.extension !== 'md') return;
        this.eventBus.publish(
          EventType.CARD_LIFECYCLE_DELETED as keyof IEventPayloads,
          this.createEventPayload(EventType.CARD_LIFECYCLE_DELETED as keyof IEventPayloads, { cardId: file.path })
        );
      })
    );

    // 파일 이름 변경 이벤트
    this.eventRefs.push(
      this.app.vault.on('rename', async (file: TAbstractFile, oldPath: string) => {
        if (!(file instanceof TFile) || file.extension !== 'md') return;
        const card = await this.obsidianService.fileToCard(file);
        this.eventBus.publish(
          EventType.CARD_LIFECYCLE_UPDATED as keyof IEventPayloads,
          this.createEventPayload(EventType.CARD_LIFECYCLE_UPDATED as keyof IEventPayloads, { card, oldPath })
        );
      })
    );

    // 메타데이터 변경 이벤트
    this.app.metadataCache.on('changed', async (file: TFile) => {
      if (file.extension !== 'md') return;
      const card = await this.obsidianService.fileToCard(file);
      this.eventBus.publish(
        EventType.CARD_LIFECYCLE_UPDATED as keyof IEventPayloads,
        this.createEventPayload(EventType.CARD_LIFECYCLE_UPDATED as keyof IEventPayloads, { card })
      );
    });

    // 활성 파일 변경 이벤트
    this.app.workspace.on('file-open', async (file: TFile | null) => {
      if (!file || file.extension !== 'md') return;
      const card = await this.obsidianService.fileToCard(file);
      this.eventBus.publish(
        EventType.CARD_FOCUSED as keyof IEventPayloads,
        this.createEventPayload(EventType.CARD_FOCUSED as keyof IEventPayloads, { card })
      );
    });
  }

  /**
   * 레이아웃 변경 이벤트 등록
   */
  private registerLayoutChangeEvents(): void {
    // 레이아웃 변경
    this.eventRefs.push(
      this.eventBus.subscribe(EventType.LAYOUT_RESIZED, (payload) => {
        this.handleLayoutChanged(payload);
      })
    );
  }

  /**
   * 내비게이션 이벤트 등록
   */
  private registerNavigationEvents(): void {
    // 내비게이션 모드 변경
    this.eventRefs.push(
      this.eventBus.subscribe(EventType.NAVIGATION_MODE_CHANGED, (payload) => {
        this.handleNavigationModeChanged(payload);
      })
    );

    // 스크롤 동작 변경
    this.eventRefs.push(
      this.eventBus.subscribe(EventType.SCROLL_BEHAVIOR_CHANGED, (payload) => {
        this.handleScrollBehaviorChanged(payload);
      })
    );
  }

  /**
   * 레이아웃 변경 이벤트 처리
   */
  private handleLayoutChanged(payload: any): void {
    const { layoutId, type, options } = payload;
    if (type && layoutId) {
      this.layoutService.setLayoutType(layoutId, type);
    }
    if (options && layoutId) {
      this.layoutService.setLayoutOptions(layoutId, options);
    }
  }

  /**
   * 내비게이션 모드 변경 이벤트 처리
   */
  private handleNavigationModeChanged(payload: any): void {
    const { mode } = payload;
    if (mode) {
      this.navigationService.setNavigationMode(mode);
    }
  }

  /**
   * 스크롤 동작 변경 이벤트 처리
   */
  private handleScrollBehaviorChanged(payload: any): void {
    const { behavior } = payload;
    if (behavior) {
      this.navigationService.setScrollBehavior(behavior);
    }
  }

  /**
   * 이벤트 페이로드에 공통 필드를 추가하는 유틸리티 메서드
   */
  private createEventPayload<T extends keyof IEventPayloads>(
    type: T,
    payload: Omit<IEventPayloads[T], keyof BaseEventPayload>
  ): IEventPayloads[T] {
    return {
      ...payload,
      timestamp: Date.now(),
      source: 'ObsidianEventAdapter'
    } as IEventPayloads[T];
  }

  /**
   * 이벤트 리스너 제거
   */
  unregisterEvents(): void {
    this.eventRefs.forEach(ref => this.app.vault.offref(ref));
    this.eventRefs = [];
  }

  // Navigation Events
  publishGridInfoChanged(payload: IEventPayloads[EventType.GRID_INFO_CHANGED]): void {
    this.eventBus.publish(EventType.GRID_INFO_CHANGED, this.createEventPayload(EventType.GRID_INFO_CHANGED, payload));
  }

  publishNavigationModeChanged(payload: IEventPayloads[EventType.NAVIGATION_MODE_CHANGED]): void {
    this.eventBus.publish(EventType.NAVIGATION_MODE_CHANGED, this.createEventPayload(EventType.NAVIGATION_MODE_CHANGED, payload));
  }

  publishScrollBehaviorChanged(payload: IEventPayloads[EventType.SCROLL_BEHAVIOR_CHANGED]): void {
    this.eventBus.publish(EventType.SCROLL_BEHAVIOR_CHANGED, this.createEventPayload(EventType.SCROLL_BEHAVIOR_CHANGED, payload));
  }

  // Card Events
  publishCardClicked(payload: IEventPayloads[EventType.CARD_CLICKED]): void {
    this.eventBus.publish(EventType.CARD_CLICKED, this.createEventPayload(EventType.CARD_CLICKED, payload));
  }

  publishCardDoubleClicked(payload: IEventPayloads[EventType.CARD_DOUBLE_CLICKED]): void {
    this.eventBus.publish(EventType.CARD_DOUBLE_CLICKED, this.createEventPayload(EventType.CARD_DOUBLE_CLICKED, payload));
  }

  publishCardContextMenu(payload: IEventPayloads[EventType.CARD_CONTEXT_MENU]): void {
    this.eventBus.publish(EventType.CARD_CONTEXT_MENU, this.createEventPayload(EventType.CARD_CONTEXT_MENU, payload));
  }

  publishCardFocused(payload: IEventPayloads[EventType.CARD_FOCUSED]): void {
    this.eventBus.publish(EventType.CARD_FOCUSED, this.createEventPayload(EventType.CARD_FOCUSED, payload));
  }

  publishCardUnfocused(payload: IEventPayloads[EventType.CARD_UNFOCUSED]): void {
    this.eventBus.publish(EventType.CARD_UNFOCUSED, this.createEventPayload(EventType.CARD_UNFOCUSED, payload));
  }

  publishCardSelected(payload: IEventPayloads[EventType.CARD_SELECTED]): void {
    this.eventBus.publish(EventType.CARD_SELECTED, this.createEventPayload(EventType.CARD_SELECTED, payload));
  }

  publishCardDeselected(payload: IEventPayloads[EventType.CARD_DESELECTED]): void {
    this.eventBus.publish(EventType.CARD_DESELECTED, this.createEventPayload(EventType.CARD_DESELECTED, payload));
  }

  publishCardOpened(payload: IEventPayloads[EventType.CARD_OPENED]): void {
    this.eventBus.publish(EventType.CARD_OPENED, this.createEventPayload(EventType.CARD_OPENED, payload));
  }

  publishCardClosed(payload: IEventPayloads[EventType.CARD_CLOSED]): void {
    this.eventBus.publish(EventType.CARD_CLOSED, this.createEventPayload(EventType.CARD_CLOSED, payload));
  }

  publishCardScrolled(payload: IEventPayloads[EventType.CARD_SCROLLED]): void {
    this.eventBus.publish(EventType.CARD_SCROLLED, this.createEventPayload(EventType.CARD_SCROLLED, payload));
  }

  // CardSet Events
  publishCardSetClicked(payload: IEventPayloads[EventType.CARDSET_CLICKED]): void {
    this.eventBus.publish(EventType.CARDSET_CLICKED, this.createEventPayload(EventType.CARDSET_CLICKED, payload));
  }

  publishCardSetDoubleClicked(payload: IEventPayloads[EventType.CARDSET_DOUBLE_CLICKED]): void {
    this.eventBus.publish(EventType.CARDSET_DOUBLE_CLICKED, this.createEventPayload(EventType.CARDSET_DOUBLE_CLICKED, payload));
  }

  publishCardSetContextMenu(payload: IEventPayloads[EventType.CARDSET_CONTEXT_MENU]): void {
    this.eventBus.publish(EventType.CARDSET_CONTEXT_MENU, this.createEventPayload(EventType.CARDSET_CONTEXT_MENU, payload));
  }

  publishCardSetCreated(payload: IEventPayloads[EventType.CARDSET_CREATED]): void {
    this.eventBus.publish(EventType.CARDSET_CREATED, this.createEventPayload(EventType.CARDSET_CREATED, payload));
  }

  publishCardSetUpdated(payload: IEventPayloads[EventType.CARDSET_UPDATED]): void {
    this.eventBus.publish(EventType.CARDSET_UPDATED, this.createEventPayload(EventType.CARDSET_UPDATED, payload));
  }

  publishCardSetDestroyed(payload: IEventPayloads[EventType.CARDSET_DESTROYED]): void {
    this.eventBus.publish(EventType.CARDSET_DESTROYED, this.createEventPayload(EventType.CARDSET_DESTROYED, payload));
  }

  // Card Lifecycle Events
  publishCardCreated(payload: IEventPayloads[EventType.CARD_LIFECYCLE_CREATED]): void {
    this.eventBus.publish(EventType.CARD_LIFECYCLE_CREATED, this.createEventPayload(EventType.CARD_LIFECYCLE_CREATED, payload));
  }

  publishCardUpdated(payload: IEventPayloads[EventType.CARD_LIFECYCLE_UPDATED]): void {
    this.eventBus.publish(EventType.CARD_LIFECYCLE_UPDATED, this.createEventPayload(EventType.CARD_LIFECYCLE_UPDATED, payload));
  }

  publishCardDeleted(payload: IEventPayloads[EventType.CARD_LIFECYCLE_DELETED]): void {
    this.eventBus.publish(EventType.CARD_LIFECYCLE_DELETED, this.createEventPayload(EventType.CARD_LIFECYCLE_DELETED, payload));
  }

  publishCardMetadataUpdated(payload: IEventPayloads[EventType.CARD_LIFECYCLE_UPDATED]): void {
    this.eventBus.publish(EventType.CARD_LIFECYCLE_UPDATED, this.createEventPayload(EventType.CARD_LIFECYCLE_UPDATED, payload));
  }

  publishCardContentUpdated(payload: IEventPayloads[EventType.CARD_LIFECYCLE_UPDATED]): void {
    this.eventBus.publish(EventType.CARD_LIFECYCLE_UPDATED, this.createEventPayload(EventType.CARD_LIFECYCLE_UPDATED, payload));
  }

  /**
   * 어댑터 정리
   */
  destroy(): void {
    // 이벤트 리스너 해제
    this.unregisterEvents();
  }

  /**
   * 레이아웃 생성
   */
  private createLayout(): void {
    const layout = this.layoutService.createLayout('grid', {
      columns: 3,
      spacing: 16,
      cardWidth: 300,
      cardHeight: 200
    });
    this.layoutService.initializeLayout(layout.getId());
  }
} 