import { ICard } from '@/domain/models/Card';

/**
 * 카드 포커스 서비스 인터페이스
 */
export interface ICardFocusService {
    /**
     * 카드에 포커스 설정
     * @param card 카드
     */
    focusCard(card: ICard): void;

    /**
     * 포커스 해제
     */
    blurCard(): void;

    /**
     * 포커스된 카드 조회
     * @returns 포커스된 카드 또는 null
     */
    getFocusedCard(): ICard | null;

    /**
     * 포커스 이벤트 구독
     * @param callback 콜백 함수
     */
    subscribeToFocusEvents(callback: (event: IFocusEvent) => void): void;

    /**
     * 포커스 이벤트 구독 해제
     * @param callback 콜백 함수
     */
    unsubscribeFromFocusEvents(callback: (event: IFocusEvent) => void): void;
}

/**
 * 포커스 이벤트 인터페이스
 */
export interface IFocusEvent {
    type: 'focus' | 'blur';
    cardId: string;
    previousCardId?: string;
    timestamp: Date;
}