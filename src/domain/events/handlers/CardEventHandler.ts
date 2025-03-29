import { IDomainEventHandler } from '../IDomainEventHandler';
import { CardEvent, CardCreatedEvent, CardUpdatedEvent, CardDeletedEvent, CardStyleChangedEvent, CardPositionChangedEvent } from '../CardEvents';
import { RefreshType } from '../../models/types';
import CardNavigatorPlugin from '../../../main';

/**
 * 카드 이벤트 핸들러
 */
export class CardEventHandler implements IDomainEventHandler<CardEvent> {
    constructor(private plugin: CardNavigatorPlugin) {}

    /**
     * 이벤트를 처리합니다.
     */
    async handle(event: CardEvent): Promise<void> {
        console.debug(`[CardNavigator] 이벤트 처리 시작: ${event.constructor.name}`);
        
        try {
            switch (event.constructor.name) {
                case 'CardCreatedEvent':
                    await this.handleCardCreated(event as CardCreatedEvent);
                    break;
                case 'CardUpdatedEvent':
                    await this.handleCardUpdated(event as CardUpdatedEvent);
                    break;
                case 'CardDeletedEvent':
                    await this.handleCardDeleted(event as CardDeletedEvent);
                    break;
                case 'CardStyleChangedEvent':
                    await this.handleCardStyleChanged(event as CardStyleChangedEvent);
                    break;
                case 'CardPositionChangedEvent':
                    await this.handleCardPositionChanged(event as CardPositionChangedEvent);
                    break;
                default:
                    console.warn(`[CardNavigator] 알 수 없는 이벤트 타입: ${event.constructor.name}`);
            }
        } catch (error) {
            console.error(`[CardNavigator] 이벤트 처리 중 오류 발생: ${event.constructor.name}`, error);
            throw error;
        }
    }

    /**
     * 카드 생성 이벤트를 처리합니다.
     */
    private async handleCardCreated(event: CardCreatedEvent): Promise<void> {
        console.debug(`[CardNavigator] 카드 생성 이벤트 처리: ${event.card.getId()}`);
        this.plugin.refreshAllViews(RefreshType.CONTENT);
    }

    /**
     * 카드 수정 이벤트를 처리합니다.
     */
    private async handleCardUpdated(event: CardUpdatedEvent): Promise<void> {
        console.debug(`[CardNavigator] 카드 수정 이벤트 처리: ${event.card.getId()}`);
        this.plugin.refreshAllViews(RefreshType.CONTENT);
    }

    /**
     * 카드 삭제 이벤트를 처리합니다.
     */
    private async handleCardDeleted(event: CardDeletedEvent): Promise<void> {
        console.debug(`[CardNavigator] 카드 삭제 이벤트 처리: ${event.cardId}`);
        this.plugin.refreshAllViews(RefreshType.CONTENT);
    }

    /**
     * 카드 스타일 변경 이벤트를 처리합니다.
     */
    private async handleCardStyleChanged(event: CardStyleChangedEvent): Promise<void> {
        console.debug(`[CardNavigator] 카드 스타일 변경 이벤트 처리: ${event.cardId}`);
        this.plugin.refreshAllViews(RefreshType.CONTENT);
    }

    /**
     * 카드 위치 변경 이벤트를 처리합니다.
     */
    private async handleCardPositionChanged(event: CardPositionChangedEvent): Promise<void> {
        console.debug(`[CardNavigator] 카드 위치 변경 이벤트 처리: ${event.cardId}`);
        this.plugin.refreshAllViews(RefreshType.CONTENT);
    }
} 