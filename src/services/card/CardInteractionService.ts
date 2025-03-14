import { ICard } from '../../domain/card/Card';
import { DomainEventBus } from '../../domain/events/DomainEventBus';
import { CardInteractionEventData, EventType } from '../../domain/events/EventTypes';
import { ICardManager } from '../../domain/interaction/InteractionInterfaces';
import { ISettingsService } from '../../domain/settings/SettingsInterfaces';
import { ObsidianService } from '../core/ObsidianService';

/**
 * 카드 상호작용 서비스 인터페이스
 * 카드 상호작용 관련 기능을 정의합니다.
 */
export interface ICardInteractionService extends ICardManager {
  /**
   * 카드 선택
   * @param card 카드
   */
  selectCard(card: ICard): void;
  
  /**
   * 카드 선택 해제
   * @param card 카드
   */
  deselectCard(card: ICard): void;
  
  /**
   * 모든 카드 선택 해제
   */
  deselectAllCards(): void;
  
  /**
   * 카드 활성화
   * @param card 카드
   */
  activateCard(card: ICard): void;
  
  /**
   * 카드 비활성화
   * @param card 카드
   */
  deactivateCard(card: ICard): void;
  
  /**
   * 카드 포커스
   * @param card 카드
   */
  focusCard(card: ICard): void;
  
  /**
   * 카드 포커스 해제
   * @param card 카드
   */
  unfocusCard(card: ICard): void;
  
  /**
   * 카드 열기
   * @param card 카드
   * @param newLeaf 새 탭에서 열기 여부
   */
  openCard(card: ICard, newLeaf?: boolean): void;
}

/**
 * 카드 상호작용 서비스
 * 카드 상호작용 관련 기능을 구현합니다.
 */
export class CardInteractionService implements ICardInteractionService {
  private obsidianService: ObsidianService;
  private settingsService: ISettingsService;
  private eventBus: DomainEventBus;
  
  private selectedCards: Set<string> = new Set();
  private activeCard: ICard | null = null;
  private focusedCard: ICard | null = null;
  
  /**
   * 생성자
   * @param obsidianService Obsidian 서비스
   * @param settingsService 설정 서비스
   * @param eventBus 이벤트 버스
   */
  constructor(
    obsidianService: ObsidianService,
    settingsService: ISettingsService,
    eventBus: DomainEventBus
  ) {
    this.obsidianService = obsidianService;
    this.settingsService = settingsService;
    this.eventBus = eventBus;
    
    // 이벤트 리스너 등록
    this.registerEventListeners();
  }
  
  /**
   * 이벤트 리스너 등록
   */
  private registerEventListeners(): void {
    // 설정 변경 이벤트 리스너
    this.eventBus.on(EventType.SETTINGS_CHANGED, () => {
      // 필요한 경우 상태 초기화
    });
  }
  
  /**
   * 카드 선택
   * @param card 카드
   */
  selectCard(card: ICard): void {
    const settings = this.settingsService.getSettings();
    const selectionMode = settings.selectionMode || 'single';
    
    // 단일 선택 모드인 경우 기존 선택 해제
    if (selectionMode === 'single') {
      this.deselectAllCards();
    }
    
    // 카드 선택
    this.selectedCards.add(card.id);
    
    // 이벤트 발생
    this.eventBus.emit(EventType.CARD_SELECTED, {
      card,
      selectionMode
    } as CardInteractionEventData);
  }
  
  /**
   * 카드 선택 해제
   * @param card 카드
   */
  deselectCard(card: ICard): void {
    // 카드 선택 해제
    this.selectedCards.delete(card.id);
    
    // 이벤트 발생
    this.eventBus.emit(EventType.CARD_DESELECTED, {
      card
    } as CardInteractionEventData);
  }
  
  /**
   * 모든 카드 선택 해제
   */
  deselectAllCards(): void {
    // 모든 카드 선택 해제
    this.selectedCards.clear();
    
    // 이벤트 발생
    this.eventBus.emit(EventType.CARD_DESELECTED_ALL, {});
  }
  
  /**
   * 카드 활성화
   * @param card 카드
   */
  activateCard(card: ICard): void {
    // 기존 활성 카드 비활성화
    if (this.activeCard && this.activeCard.id !== card.id) {
      this.deactivateCard(this.activeCard);
    }
    
    // 카드 활성화
    this.activeCard = card;
    
    // 이벤트 발생
    this.eventBus.emit(EventType.CARD_ACTIVATED, {
      card
    } as CardInteractionEventData);
  }
  
  /**
   * 카드 비활성화
   * @param card 카드
   */
  deactivateCard(card: ICard): void {
    // 활성 카드가 현재 카드인 경우에만 비활성화
    if (this.activeCard && this.activeCard.id === card.id) {
      this.activeCard = null;
      
      // 이벤트 발생
      this.eventBus.emit(EventType.CARD_DEACTIVATED, {
        card
      } as CardInteractionEventData);
    }
  }
  
  /**
   * 카드 포커스
   * @param card 카드
   */
  focusCard(card: ICard): void {
    // 기존 포커스 카드 포커스 해제
    if (this.focusedCard && this.focusedCard.id !== card.id) {
      this.unfocusCard(this.focusedCard);
    }
    
    // 카드 포커스
    this.focusedCard = card;
    
    // 이벤트 발생
    this.eventBus.emit(EventType.CARD_FOCUSED, {
      card
    } as CardInteractionEventData);
  }
  
  /**
   * 카드 포커스 해제
   * @param card 카드
   */
  unfocusCard(card: ICard): void {
    // 포커스 카드가 현재 카드인 경우에만 포커스 해제
    if (this.focusedCard && this.focusedCard.id === card.id) {
      this.focusedCard = null;
      
      // 이벤트 발생
      this.eventBus.emit(EventType.CARD_UNFOCUSED, {
        card
      } as CardInteractionEventData);
    }
  }
  
  /**
   * 카드 열기
   * @param card 카드
   * @param newLeaf 새 탭에서 열기 여부
   */
  openCard(card: ICard, newLeaf: boolean = false): void {
    // 카드 파일 열기
    this.obsidianService.openFile(card.path, newLeaf);
    
    // 이벤트 발생
    this.eventBus.emit(EventType.CARD_OPENED, {
      card,
      newLeaf
    } as CardInteractionEventData);
  }
  
  /**
   * 선택된 카드 가져오기
   * @returns 선택된 카드 ID 배열
   */
  getSelectedCardIds(): string[] {
    return Array.from(this.selectedCards);
  }
  
  /**
   * 활성 카드 가져오기
   * @returns 활성 카드 또는 null
   */
  getActiveCard(): ICard | null {
    return this.activeCard;
  }
  
  /**
   * 포커스 카드 가져오기
   * @returns 포커스 카드 또는 null
   */
  getFocusedCard(): ICard | null {
    return this.focusedCard;
  }
} 