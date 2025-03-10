import { ICard } from '../domain/card/Card';
import { DomainEventBus } from '../domain/events/DomainEventBus';
import { EventType } from '../domain/events/EventTypes';
import { ICardInteractionHandler } from '../domain/interaction/CardInteraction';
import { CardService } from './CardService';
import { SearchService } from './SearchService';

/**
 * 카드 상호작용 서비스
 * 카드와의 상호작용을 처리합니다.
 */
export class CardInteractionService implements ICardInteractionHandler {
  /**
   * 카드 서비스
   */
  private cardService: CardService;
  
  /**
   * 검색 서비스
   */
  private searchService: SearchService;
  
  /**
   * 이벤트 버스
   */
  private eventBus: DomainEventBus;
  
  /**
   * 생성자
   * @param cardService 카드 서비스
   * @param searchService 검색 서비스
   */
  constructor(cardService: CardService, searchService: SearchService) {
    this.cardService = cardService;
    this.searchService = searchService;
    this.eventBus = DomainEventBus.getInstance();
  }
  
  /**
   * 카드 클릭 처리
   * @param card 카드 데이터
   */
  public onCardClick(card: ICard): void {
    // 카드 선택 요청 이벤트 발생
    this.eventBus.emit(EventType.CARD_SELECT_REQUESTED, {
      cardId: card.id
    });
  }
  
  /**
   * 카드 더블 클릭 처리
   * @param card 카드 데이터
   */
  public onCardDoubleClick(card: ICard): void {
    // 카드 열기 요청 이벤트 발생
    this.eventBus.emit(EventType.CARD_OPEN_REQUESTED, {
      cardId: card.id
    });
  }
  
  /**
   * 카드 컨텍스트 메뉴 처리
   * @param card 카드 데이터
   * @param event 이벤트
   */
  public onCardContextMenu(card: ICard, event: MouseEvent): void {
    // 컨텍스트 메뉴 이벤트 발생
    this.eventBus.emit(EventType.CONTEXT_MENU_REQUESTED, {
      cardId: card.id,
      card,
      x: event.clientX,
      y: event.clientY,
      items: [
        {
          id: 'open',
          label: '열기',
          icon: 'external-link',
          action: () => this.onOpenClick(card)
        },
        {
          id: 'edit',
          label: '편집',
          icon: 'edit-2',
          action: () => this.onEditClick(card)
        },
        {
          id: 'copy-path',
          label: '경로 복사',
          icon: 'clipboard',
          action: () => this.copyCardPath(card)
        },
        {
          id: 'copy-link',
          label: '링크 복사',
          icon: 'link',
          action: () => this.copyCardLink(card)
        }
      ]
    });
  }
  
  /**
   * 카드 드래그 시작 처리
   * @param card 카드 데이터
   * @param event 드래그 이벤트
   */
  public onCardDragStart(card: ICard, event: DragEvent): void {
    // 드래그 데이터 설정
    if (event.dataTransfer) {
      event.dataTransfer.setData('text/plain', card.id);
      event.dataTransfer.effectAllowed = 'move';
    }
    
    // 카드 드래그 시작 이벤트 발생
    this.eventBus.emit(EventType.CARD_DRAG_STARTED, {
      cardId: card.id,
      card
    });
  }
  
  /**
   * 카드 드래그 종료 처리
   * @param card 카드 데이터
   * @param event 드래그 이벤트
   */
  public onCardDragEnd(card: ICard, event: DragEvent): void {
    // 카드 드래그 종료 이벤트 발생
    this.eventBus.emit(EventType.CARD_DRAG_ENDED, {
      cardId: card.id,
      card,
      success: event.dataTransfer?.dropEffect !== 'none'
    });
  }
  
  /**
   * 태그 클릭 처리
   * @param tag 태그
   * @param card 카드 데이터
   */
  public onTagClick(tag: string, card: ICard): void {
    // 태그 검색 실행
    this.searchService.search(tag, 'tag');
    
    // 태그 클릭 이벤트 발생
    this.eventBus.emit(EventType.TAG_CLICKED, {
      tag,
      cardId: card.id,
      card
    });
  }
  
  /**
   * 편집 버튼 클릭 처리
   * @param card 카드 데이터
   */
  public onEditClick(card: ICard): void {
    // 카드 편집 요청 이벤트 발생
    this.eventBus.emit(EventType.CARD_EDIT_REQUESTED, {
      cardId: card.id
    });
  }
  
  /**
   * 열기 버튼 클릭 처리
   * @param card 카드 데이터
   */
  public onOpenClick(card: ICard): void {
    // 카드 열기 요청 이벤트 발생
    this.eventBus.emit(EventType.CARD_OPEN_REQUESTED, {
      cardId: card.id
    });
  }
  
  /**
   * 카드 경로 복사
   * @param card 카드 데이터
   */
  private copyCardPath(card: ICard): void {
    if (!card.path) return;
    
    // 클립보드에 복사
    navigator.clipboard.writeText(card.path).then(() => {
      // 알림 표시
      this.eventBus.emit(EventType.NOTIFICATION, {
        message: '카드 경로가 클립보드에 복사되었습니다.',
        type: 'info'
      });
    });
  }
  
  /**
   * 카드 링크 복사
   * @param card 카드 데이터
   */
  private copyCardLink(card: ICard): void {
    if (!card.path) return;
    
    // 옵시디언 링크 생성
    const link = `[[${card.path}]]`;
    
    // 클립보드에 복사
    navigator.clipboard.writeText(link).then(() => {
      // 알림 표시
      this.eventBus.emit(EventType.NOTIFICATION, {
        message: '카드 링크가 클립보드에 복사되었습니다.',
        type: 'info'
      });
    });
  }
} 