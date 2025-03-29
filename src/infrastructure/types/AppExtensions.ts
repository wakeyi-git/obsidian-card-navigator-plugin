import { App } from 'obsidian';
import { ICardService } from '../../domain/services/CardService';
import { CardNavigatorView } from '../../presentation/views/CardNavigatorView';

declare module 'obsidian' {
    interface App {
        cardService: ICardService;
        cardNavigatorView: CardNavigatorView;
    }
}

/**
 * Obsidian App 타입을 확장하는 인터페이스
 */
export interface ExtendedApp extends App {
  cardService: ICardService;
  cardNavigatorView: CardNavigatorView;
} 