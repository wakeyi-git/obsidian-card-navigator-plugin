import { EventType, IEventPayloads } from './EventTypes';

export interface INavigationEventPublisher {
  publishGridInfoChanged(payload: IEventPayloads[EventType.GRID_INFO_CHANGED]): void;
  publishNavigationModeChanged(payload: IEventPayloads[EventType.NAVIGATION_MODE_CHANGED]): void;
  publishScrollBehaviorChanged(payload: IEventPayloads[EventType.SCROLL_BEHAVIOR_CHANGED]): void;
}

export interface ICardEventPublisher {
  publishCardClicked(payload: IEventPayloads[EventType.CARD_CLICKED]): void;
  publishCardDoubleClicked(payload: IEventPayloads[EventType.CARD_DOUBLE_CLICKED]): void;
  publishCardContextMenu(payload: IEventPayloads[EventType.CARD_CONTEXT_MENU]): void;
  publishCardFocused(payload: IEventPayloads[EventType.CARD_FOCUSED]): void;
  publishCardUnfocused(payload: IEventPayloads[EventType.CARD_UNFOCUSED]): void;
  publishCardSelected(payload: IEventPayloads[EventType.CARD_SELECTED]): void;
  publishCardDeselected(payload: IEventPayloads[EventType.CARD_DESELECTED]): void;
  publishCardOpened(payload: IEventPayloads[EventType.CARD_OPENED]): void;
  publishCardClosed(payload: IEventPayloads[EventType.CARD_CLOSED]): void;
  publishCardScrolled(payload: IEventPayloads[EventType.CARD_SCROLLED]): void;
}

export interface ICardSetEventPublisher {
  publishCardSetClicked(payload: IEventPayloads[EventType.CARDSET_CLICKED]): void;
  publishCardSetDoubleClicked(payload: IEventPayloads[EventType.CARDSET_DOUBLE_CLICKED]): void;
  publishCardSetContextMenu(payload: IEventPayloads[EventType.CARDSET_CONTEXT_MENU]): void;
  publishCardSetCreated(payload: IEventPayloads[EventType.CARDSET_CREATED]): void;
  publishCardSetUpdated(payload: IEventPayloads[EventType.CARDSET_UPDATED]): void;
  publishCardSetDestroyed(payload: IEventPayloads[EventType.CARDSET_DESTROYED]): void;
}

export interface ICardLifecycleEventPublisher {
  publishCardCreated(payload: IEventPayloads[EventType.CARD_LIFECYCLE_CREATED]): void;
  publishCardUpdated(payload: IEventPayloads[EventType.CARD_LIFECYCLE_UPDATED]): void;
  publishCardDeleted(payload: IEventPayloads[EventType.CARD_LIFECYCLE_DELETED]): void;
  publishCardMetadataUpdated(payload: IEventPayloads[EventType.CARD_LIFECYCLE_UPDATED]): void;
  publishCardContentUpdated(payload: IEventPayloads[EventType.CARD_LIFECYCLE_UPDATED]): void;
} 