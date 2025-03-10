import { ICard, CardType } from '../domain/card/Card';
import { ICardManager } from '../domain/card/CardManager';
import { ICardList } from '../domain/cardlist/CardList';
import { ICardListManager } from '../domain/cardlist/CardListManager';
import { DomainEventBus } from '../domain/events/DomainEventBus';
import { EventType } from '../domain/events/EventTypes';
import { IObsidianApp } from '../domain/obsidian/ObsidianInterfaces';

/**
 * 카드 서비스
 * 카드 관련 비즈니스 로직을 처리합니다.
 */
export class CardService {
  /**
   * 카드 매니저
   */
  private cardManager: ICardManager;
  
  /**
   * 카드 리스트 매니저
   */
  private cardListManager: ICardListManager;
  
  /**
   * Obsidian 앱
   */
  private obsidianApp: IObsidianApp;
  
  /**
   * 이벤트 버스
   */
  private eventBus: DomainEventBus;
  
  /**
   * 생성자
   * @param cardManager 카드 매니저
   * @param cardListManager 카드 리스트 매니저
   * @param obsidianApp Obsidian 앱
   */
  constructor(
    cardManager: ICardManager,
    cardListManager: ICardListManager,
    obsidianApp: IObsidianApp
  ) {
    this.cardManager = cardManager;
    this.cardListManager = cardListManager;
    this.obsidianApp = obsidianApp;
    this.eventBus = DomainEventBus.getInstance();
    
    // 이벤트 리스너 등록
    this.registerEventListeners();
  }
  
  /**
   * 이벤트 리스너 등록
   */
  private registerEventListeners(): void {
    // 검색 결과 이벤트 리스너
    this.eventBus.on(EventType.SEARCH_RESULTS, (data) => {
      this.handleSearchResults(data.results, data.query, data.searchType);
    });
    
    // 카드 선택 요청 이벤트 리스너
    this.eventBus.on(EventType.CARD_SELECT_REQUESTED, (data) => {
      this.selectCard(data.cardId);
    });
    
    // 카드 열기 요청 이벤트 리스너
    this.eventBus.on(EventType.CARD_OPEN_REQUESTED, (data) => {
      this.openCard(data.cardId);
    });
    
    // 카드 편집 요청 이벤트 리스너
    this.eventBus.on(EventType.CARD_EDIT_REQUESTED, (data) => {
      this.editCard(data.cardId);
    });
    
    // 새 카드 요청 이벤트 리스너
    this.eventBus.on(EventType.NEW_CARD_REQUESTED, (data) => {
      this.createNewCard(data.listId);
    });
    
    // 정렬 요청 이벤트 리스너
    this.eventBus.on(EventType.SORT_REQUESTED, (data) => {
      this.sortCards(data.listId, data.sortType, data.sortDirection);
    });
    
    // 페이지 변경 이벤트 리스너
    this.eventBus.on(EventType.PAGE_CHANGED, (data) => {
      this.changePage(data.listId, data.page);
    });
  }
  
  /**
   * 검색 결과 처리
   * @param results 검색 결과
   * @param query 검색어
   * @param searchType 검색 타입
   */
  private handleSearchResults(results: any[], query: string, searchType: string): void {
    // 검색 결과를 카드로 변환
    const cards = this.convertSearchResultsToCards(results, searchType);
    
    // 카드 리스트 생성 또는 업데이트
    const listId = `search-${searchType}-${Date.now()}`;
    const cardList = this.cardListManager.createCardList(listId, `검색 결과: ${query}`, cards);
    
    // 카드 리스트 업데이트 이벤트 발생
    this.eventBus.emit(EventType.CARD_LIST_UPDATED, {
      listId: cardList.id,
      cardList
    });
  }
  
  /**
   * 검색 결과를 카드로 변환
   * @param results 검색 결과
   * @param searchType 검색 타입
   * @returns 카드 배열
   */
  private convertSearchResultsToCards(results: any[], searchType: string): ICard[] {
    return results.map((result, index) => {
      // 파일 정보 가져오기
      const file = this.obsidianApp.getVault().getAbstractFileByPath(result.path);
      
      // 메타데이터 가져오기
      const metadata = file ? this.obsidianApp.getMetadataCache().getFileCache(file) : null;
      
      // 카드 생성
      const card: ICard = {
        id: `${searchType}-${index}-${Date.now()}`,
        type: CardType.NOTE,
        title: result.title || (file ? file.basename : '제목 없음'),
        path: result.path,
        content: result.content || '',
        tags: metadata?.tags?.map(tag => tag.tag) || [],
        created: file?.stat?.ctime,
        modified: file?.stat?.mtime
      };
      
      return card;
    });
  }
  
  /**
   * 카드 선택
   * @param cardId 카드 ID
   */
  public selectCard(cardId: string): void {
    // 카드 가져오기
    const card = this.cardManager.getCard(cardId);
    if (!card) return;
    
    // 카드 선택 이벤트 발생
    this.eventBus.emit(EventType.CARD_SELECTED, {
      cardId: card.id,
      card
    });
  }
  
  /**
   * 카드 열기
   * @param cardId 카드 ID
   */
  public openCard(cardId: string): void {
    // 카드 가져오기
    const card = this.cardManager.getCard(cardId);
    if (!card || !card.path) return;
    
    // 파일 열기
    this.obsidianApp.openFile(card.path);
    
    // 카드 열기 이벤트 발생
    this.eventBus.emit(EventType.CARD_OPENED, {
      cardId: card.id,
      card
    });
  }
  
  /**
   * 카드 편집
   * @param cardId 카드 ID
   */
  public editCard(cardId: string): void {
    // 카드 가져오기
    const card = this.cardManager.getCard(cardId);
    if (!card || !card.path) return;
    
    // 파일 편집 모드로 열기
    this.obsidianApp.openFileInEditMode(card.path);
    
    // 카드 편집 이벤트 발생
    this.eventBus.emit(EventType.CARD_EDITED, {
      cardId: card.id,
      card
    });
  }
  
  /**
   * 새 카드 생성
   * @param listId 리스트 ID
   */
  public createNewCard(listId: string): void {
    // 카드 리스트 가져오기
    const cardList = this.cardListManager.getCardList(listId);
    if (!cardList) return;
    
    // 새 노트 생성 다이얼로그 표시
    this.obsidianApp.showNewNoteDialog({
      onSubmit: (path: string) => {
        // 파일 생성 후 카드 추가
        this.obsidianApp.createNewNote(path).then(file => {
          if (!file) return;
          
          // 메타데이터 가져오기
          const metadata = this.obsidianApp.getMetadataCache().getFileCache(file);
          
          // 카드 생성
          const card: ICard = {
            id: `new-${Date.now()}`,
            type: CardType.NOTE,
            title: file.basename,
            path: file.path,
            content: '',
            tags: metadata?.tags?.map(tag => tag.tag) || [],
            created: file.stat.ctime,
            modified: file.stat.mtime
          };
          
          // 카드 추가
          this.cardManager.addCard(card);
          
          // 카드 리스트에 카드 추가
          this.cardListManager.addCardToList(listId, card.id);
          
          // 카드 추가 이벤트 발생
          this.eventBus.emit(EventType.CARD_ADDED, {
            listId,
            cardId: card.id,
            card
          });
          
          // 카드 열기
          this.openCard(card.id);
        });
      }
    });
  }
  
  /**
   * 카드 정렬
   * @param listId 리스트 ID
   * @param sortType 정렬 타입
   * @param sortDirection 정렬 방향
   */
  public sortCards(listId: string, sortType: string, sortDirection: 'asc' | 'desc'): void {
    // 카드 리스트 가져오기
    const cardList = this.cardListManager.getCardList(listId);
    if (!cardList) return;
    
    // 카드 리스트 정렬
    const sortedCardList = this.cardListManager.sortCardList(listId, sortType, sortDirection);
    if (!sortedCardList) return;
    
    // 카드 정렬 이벤트 발생
    this.eventBus.emit(EventType.CARDS_SORTED, {
      listId,
      sortType,
      sortDirection,
      cardList: sortedCardList
    });
  }
  
  /**
   * 페이지 변경
   * @param listId 리스트 ID
   * @param page 페이지 번호
   */
  public changePage(listId: string, page: number): void {
    // 카드 리스트 가져오기
    const cardList = this.cardListManager.getCardList(listId);
    if (!cardList) return;
    
    // 페이지 변경
    const updatedCardList = this.cardListManager.setCardListPage(listId, page);
    if (!updatedCardList) return;
    
    // 카드 리스트 업데이트 이벤트 발생
    this.eventBus.emit(EventType.CARD_LIST_UPDATED, {
      listId,
      cardList: updatedCardList
    });
  }
  
  /**
   * 카드 태그로 필터링
   * @param tag 태그
   * @returns 필터링된 카드 리스트
   */
  public filterCardsByTag(tag: string): ICardList {
    // 모든 카드 가져오기
    const allCards = this.cardManager.getAllCards();
    
    // 태그로 필터링
    const filteredCards = allCards.filter(card => 
      card.tags && card.tags.includes(tag)
    );
    
    // 카드 리스트 생성
    const listId = `tag-${tag}-${Date.now()}`;
    const cardList = this.cardListManager.createCardList(listId, `태그: ${tag}`, filteredCards);
    
    // 카드 리스트 업데이트 이벤트 발생
    this.eventBus.emit(EventType.CARD_LIST_UPDATED, {
      listId: cardList.id,
      cardList
    });
    
    return cardList;
  }
  
  /**
   * 카드 경로로 필터링
   * @param path 경로
   * @returns 필터링된 카드 리스트
   */
  public filterCardsByPath(path: string): ICardList {
    // 모든 카드 가져오기
    const allCards = this.cardManager.getAllCards();
    
    // 경로로 필터링
    const filteredCards = allCards.filter(card => 
      card.path && card.path.startsWith(path)
    );
    
    // 카드 리스트 생성
    const listId = `path-${path}-${Date.now()}`;
    const cardList = this.cardListManager.createCardList(listId, `경로: ${path}`, filteredCards);
    
    // 카드 리스트 업데이트 이벤트 발생
    this.eventBus.emit(EventType.CARD_LIST_UPDATED, {
      listId: cardList.id,
      cardList
    });
    
    return cardList;
  }
  
  /**
   * 카드 동기화
   * 파일 시스템의 변경 사항을 카드에 반영합니다.
   */
  public syncCards(): void {
    // 모든 파일 가져오기
    const files = this.obsidianApp.getVault().getMarkdownFiles();
    
    // 모든 카드 가져오기
    const allCards = this.cardManager.getAllCards();
    
    // 파일 맵 생성
    const fileMap = new Map<string, any>();
    files.forEach(file => {
      fileMap.set(file.path, file);
    });
    
    // 카드 맵 생성
    const cardMap = new Map<string, ICard>();
    allCards.forEach(card => {
      if (card.path) {
        cardMap.set(card.path, card);
      }
    });
    
    // 새 파일 추가
    files.forEach(file => {
      if (!cardMap.has(file.path)) {
        // 메타데이터 가져오기
        const metadata = this.obsidianApp.getMetadataCache().getFileCache(file);
        
        // 카드 생성
        const card: ICard = {
          id: `file-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          type: CardType.NOTE,
          title: file.basename,
          path: file.path,
          content: '',
          tags: metadata?.tags?.map(tag => tag.tag) || [],
          created: file.stat.ctime,
          modified: file.stat.mtime
        };
        
        // 카드 추가
        this.cardManager.addCard(card);
      }
    });
    
    // 삭제된 파일 제거
    allCards.forEach(card => {
      if (card.path && !fileMap.has(card.path)) {
        // 카드 제거
        this.cardManager.removeCard(card.id);
        
        // 모든 카드 리스트에서 카드 제거
        this.cardListManager.getAllCardLists().forEach(list => {
          if (list.cards.some(c => c.id === card.id)) {
            this.cardListManager.removeCardFromList(list.id, card.id);
            
            // 카드 제거 이벤트 발생
            this.eventBus.emit(EventType.CARD_REMOVED, {
              listId: list.id,
              cardId: card.id
            });
          }
        });
      }
    });
    
    // 변경된 파일 업데이트
    files.forEach(file => {
      const card = cardMap.get(file.path);
      if (card && file.stat.mtime > card.modified) {
        // 메타데이터 가져오기
        const metadata = this.obsidianApp.getMetadataCache().getFileCache(file);
        
        // 카드 업데이트
        const updatedCard: ICard = {
          ...card,
          title: file.basename,
          tags: metadata?.tags?.map(tag => tag.tag) || [],
          modified: file.stat.mtime
        };
        
        // 카드 업데이트
        this.cardManager.updateCard(card.id, updatedCard);
        
        // 카드 업데이트 이벤트 발생
        this.eventBus.emit(EventType.CARD_UPDATED, {
          cardId: card.id,
          card: updatedCard
        });
      }
    });
  }
} 