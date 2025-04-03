import { ICardSet } from '@/domain/models/CardSet';

export interface ICardNavigatorView {
  updateCardSet(cardSet: ICardSet): void;
  showLoading(): void;
  showError(message: string): void;
} 