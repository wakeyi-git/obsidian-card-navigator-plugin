import { TFile } from 'obsidian';
import { ICard } from '../../domain/card/Card';
import { EventType } from '../../domain/events/EventTypes';
import { DomainEventBus } from '../../domain/events/DomainEventBus';
import { ISettingsService } from '../../domain/settings/SettingsInterfaces';
import { IObsidianService } from '../../domain/obsidian/ObsidianInterfaces';

/**
 * 카드 상호작용 서비스 인터페이스
 */
export interface ICardInteractionService {
  /**
   * 모든 카드를 가져옵니다.
   * @returns 카드 배열
   */
  getCards(): ICard[];

  /**
   * 현재 카드 세트의 카드를 가져옵니다.
   * @returns 카드 배열
   */
  getCurrentCards(): ICard[];

  /**
   * 카드를 새로고침합니다.
   */
  refreshCards(): Promise<void>;

  /**
   * 선택된 카드 ID 목록을 가져옵니다.
   * @returns 선택된 카드 ID 배열
   */
  getSelectedCardIds(): string[];

  /**
   * 활성화된 카드를 가져옵니다.
   * @returns 활성화된 카드 또는 undefined
   */
  getActiveCard(): ICard | undefined;

  /**
   * 포커스된 카드를 가져옵니다.
   * @returns 포커스된 카드 또는 undefined
   */
  getFocusedCard(): ICard | undefined;

  /**
   * 카드를 선택합니다.
   * @param card 카드 객체
   * @param clearPrevious 이전 선택 초기화 여부
   */
  selectCard(card: ICard, clearPrevious?: boolean): void;

  /**
   * 카드 선택을 해제합니다.
   * @param card 카드 객체
   */
  deselectCard(card: ICard): void;

  /**
   * 모든 카드 선택을 해제합니다.
   */
  deselectAllCards(): void;

  /**
   * 카드를 활성화합니다.
   * @param card 카드 객체
   */
  activateCard(card: ICard): void;

  /**
   * 카드 활성화를 해제합니다.
   */
  deactivateCard(): void;

  /**
   * 카드에 포커스합니다.
   * @param card 카드 객체
   */
  focusCard(card: ICard): void;

  /**
   * 카드 포커스를 해제합니다.
   */
  unfocusCard(): void;

  /**
   * 카드 파일을 엽니다.
   * @param card 카드 객체
   * @param newLeaf 새 탭에서 열기 여부
   */
  openCard(card: ICard, newLeaf?: boolean): void;
}

/**
 * 카드 상호작용 서비스 구현 클래스
 */
export class CardInteractionService implements ICardInteractionService {
  private obsidianService: IObsidianService;
  private settingsService: ISettingsService;
  private eventBus: DomainEventBus;
  private selectedCards: Set<string> = new Set();
  private activeCard?: ICard;
  private focusedCard?: ICard;
  private allCards: ICard[] = [];
  private currentCards: ICard[] = [];

  /**
   * 생성자
   * @param obsidianService Obsidian 서비스
   * @param settingsService 설정 서비스
   * @param eventBus 이벤트 버스
   */
  constructor(
    obsidianService: IObsidianService,
    settingsService: ISettingsService,
    eventBus: DomainEventBus
  ) {
    this.obsidianService = obsidianService;
    this.settingsService = settingsService;
    this.eventBus = eventBus;
  }

  /**
   * 모든 카드를 가져옵니다.
   * @returns 카드 배열
   */
  getCards(): ICard[] {
    return this.allCards;
  }

  /**
   * 현재 카드 세트의 카드를 가져옵니다.
   * @returns 카드 배열
   */
  getCurrentCards(): ICard[] {
    return this.currentCards;
  }

  /**
   * 카드를 새로고침합니다.
   */
  async refreshCards(): Promise<void> {
    // 실제 구현은 CardService에서 처리
    // 여기서는 인터페이스 구현을 위한 빈 메서드
  }

  /**
   * 선택된 카드 ID 목록을 가져옵니다.
   * @returns 선택된 카드 ID 배열
   */
  getSelectedCardIds(): string[] {
    return Array.from(this.selectedCards);
  }

  /**
   * 활성화된 카드를 가져옵니다.
   * @returns 활성화된 카드 또는 undefined
   */
  getActiveCard(): ICard | undefined {
    return this.activeCard;
  }

  /**
   * 포커스된 카드를 가져옵니다.
   * @returns 포커스된 카드 또는 undefined
   */
  getFocusedCard(): ICard | undefined {
    return this.focusedCard;
  }

  /**
   * 카드를 선택합니다.
   * @param card 카드 객체
   * @param clearPrevious 이전 선택 초기화 여부
   */
  selectCard(card: ICard, clearPrevious = false): void {
    if (!card || !card.id) return;

    // 이전 선택 초기화
    if (clearPrevious) {
      this.deselectAllCards();
    }

    // 카드 선택
    this.selectedCards.add(card.id || '');

    // 이벤트 발생
    this.eventBus.emit(EventType.CARD_SELECTED, {
      cardId: card.id,
      card: card
    });
  }

  /**
   * 카드 선택을 해제합니다.
   * @param card 카드 객체
   */
  deselectCard(card: ICard): void {
    if (!card || !card.id) return;

    // 카드 선택 해제
    this.selectedCards.delete(card.id || '');

    // 이벤트 발생
    this.eventBus.emit(EventType.CARD_DESELECTED, {
      cardId: card.id,
      card: card
    });
  }

  /**
   * 모든 카드 선택을 해제합니다.
   */
  deselectAllCards(): void {
    this.selectedCards.clear();

    // 이벤트 발생
    this.eventBus.emit(EventType.CARD_DESELECTED, {});
  }

  /**
   * 카드를 활성화합니다.
   * @param card 카드 객체
   */
  activateCard(card: ICard): void {
    if (!card) return;

    this.activeCard = card;

    // 이벤트 발생
    this.eventBus.emit(EventType.CARD_SELECTED, {
      cardId: card.id,
      card: card,
      isActive: true
    });
  }

  /**
   * 카드 활성화를 해제합니다.
   */
  deactivateCard(): void {
    if (this.activeCard) {
      const card = this.activeCard;
      this.activeCard = undefined;

      // 이벤트 발생
      this.eventBus.emit(EventType.CARD_DESELECTED, {
        cardId: card.id,
        card: card,
        isActive: true
      });
    }
  }

  /**
   * 카드에 포커스합니다.
   * @param card 카드 객체
   */
  focusCard(card: ICard): void {
    if (!card) return;

    this.focusedCard = card;

    // 이벤트 발생
    this.eventBus.emit(EventType.CARD_SELECTED, {
      cardId: card.id,
      card: card,
      isFocused: true
    });
  }

  /**
   * 카드 포커스를 해제합니다.
   */
  unfocusCard(): void {
    if (this.focusedCard) {
      const card = this.focusedCard;
      this.focusedCard = undefined;

      // 이벤트 발생
      this.eventBus.emit(EventType.CARD_DESELECTED, {
        cardId: card.id,
        card: card,
        isFocused: true
      });
    }
  }

  /**
   * 카드 파일을 엽니다.
   * @param card 카드 객체
   * @param newLeaf 새 탭에서 열기 여부
   */
  openCard(card: ICard, newLeaf = false): void {
    if (!card || !card.path) return;

    this.obsidianService.openFile(card.path);
  }

  /**
   * 카드 배열을 설정합니다.
   * @param cards 카드 배열
   */
  setCards(cards: ICard[]): void {
    this.allCards = cards;
  }

  /**
   * 현재 카드 배열을 설정합니다.
   * @param cards 카드 배열
   */
  setCurrentCards(cards: ICard[]): void {
    this.currentCards = cards;
  }
} 