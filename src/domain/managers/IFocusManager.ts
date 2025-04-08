import { ICard } from '@/domain/models/Card';
import { FocusChangedEvent, FocusBlurredEvent, FocusStateUpdatedEvent } from '@/domain/events/FocusEvents';

/**
 * 포커스 상태 인터페이스
 */
export interface IFocusState {
    cardId: string;
    isFocused: boolean;
    timestamp: Date;
}

/**
 * 포커스 매니저 인터페이스
 */
export interface IFocusManager {
    initialize(): void;
    cleanup(): void;
    registerFocusState(cardId: string, isFocused: boolean): void;
    unregisterFocusState(cardId: string): void;
    updateFocusState(cardId: string, isFocused: boolean): void;
    getFocusState(cardId: string): IFocusState | undefined;
    getAllFocusStates(): IFocusState[];
    subscribeToFocusEvents(callback: (event: FocusChangedEvent | FocusBlurredEvent | FocusStateUpdatedEvent) => void): void;
    unsubscribeFromFocusEvents(callback: (event: FocusChangedEvent | FocusBlurredEvent | FocusStateUpdatedEvent) => void): void;
    scrollToCard(card: ICard): void;
    focusCard(card: ICard): void;
    unfocusCard(card: ICard): void;
    getFocusedCard(): ICard | null;
    isCardFocused(card: ICard): boolean;
    focusNextCard(): void;
    focusPreviousCard(): void;
    focusFirstCard(): void;
    focusLastCard(): void;
    focusCardById(cardId: string): void;
    focusCardByIndex(index: number): void;
    scrollToFocusedCard(): void;
    centerFocusedCard(): void;
} 