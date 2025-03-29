import { Card } from '../models/Card';
import { CardStyle } from '../models/types';
import { TFile } from 'obsidian';

/**
 * 카드 서비스 인터페이스
 */
export interface ICardService {
    /**
     * 모든 카드를 가져옵니다.
     */
    getAllCards(): Promise<Card[]>;

    /**
     * 파일로 카드를 찾습니다.
     */
    findCardByFile(file: TFile): Promise<Card | null>;

    /**
     * ID로 카드를 찾습니다.
     */
    findCardById(cardId: string): Promise<Card | null>;

    /**
     * 카드 캐시를 업데이트합니다.
     */
    updateCardCache(card: Card): Promise<void>;

    /**
     * 카드 캐시에서 카드를 제거합니다.
     */
    removeFromCardCache(card: Card): Promise<void>;

    /**
     * 카드를 생성합니다.
     */
    createCard(filePath: string): Promise<Card>;

    /**
     * 카드를 업데이트합니다.
     */
    updateCard(card: Card): Promise<void>;

    /**
     * 카드를 삭제합니다.
     */
    deleteCard(card: Card): Promise<void>;

    /**
     * 카드 스타일을 변경합니다.
     */
    changeCardStyle(card: Card, style: CardStyle): Promise<void>;

    /**
     * 카드 위치를 변경합니다.
     */
    changeCardPosition(card: Card, position: { x: number; y: number }): Promise<void>;
} 