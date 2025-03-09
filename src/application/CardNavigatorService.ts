import { App, MarkdownRenderer, Component } from 'obsidian';
import { ICard } from '../domain/card/index';
import { CardSetSourceType, CardSetType } from '../domain/cardset/index';
import { LayoutType } from '../domain/layout/index';
import { SearchType, SearchScope } from '../domain/search/index';
import { 
  ICardNavigatorService,
  ICardNavigatorInitializer, 
  ICardManager, 
  ICardSetSourceController, 
  ILayoutController, 
  IPresetController, 
  ISearchController, 
  ISettingsController,
  IServiceProvider,
  IMarkdownRenderer,
  ICardInteraction,
  IKeyboardNavigation,
  IMultiSelection,
  KeyboardNavigationDirection
} from '../domain/interaction/InteractionInterfaces';
import { EventType, CardsChangedEventData, LayoutChangedEventData } from '../domain/events/EventTypes';
import { DomainEventBus } from '../domain/events/DomainEventBus';
import { InitializationError, CardError, LayoutError } from '../domain/errors';

import { ICardService } from './CardService';
import { ICardSetService } from './CardSetService';
import { ILayoutService } from './LayoutService';
import { ISearchService } from './SearchService';
import { IInteractionService } from './InteractionService';

// ICardNavigatorService 인터페이스 export
export type { ICardNavigatorService } from '../domain/interaction/InteractionInterfaces';

/**
 * 카드 내비게이터 서비스 클래스
 * 모든 서비스를 통합하고 조정하는 메인 서비스입니다.
 */
export class CardNavigatorService implements ICardNavigatorService {
  private app: App;
  private cardService: ICardService;
  private cardSetService: ICardSetService;
  private layoutService: ILayoutService;
  private searchService: ISearchService;
  private interactionService: IInteractionService;
  private eventBus = DomainEventBus.getInstance();
  
  private currentCards: ICard[] = [];
  private isInitialized: boolean = false;
  
  /**
   * 생성자
   * @param app Obsidian App 객체
   * @param cardService 카드 서비스
   * @param cardSetService 카드셋 서비스
   * @param layoutService 레이아웃 서비스
   * @param searchService 검색 서비스
   * @param interactionService 상호작용 서비스
   */
  constructor(
    app: App,
    cardService: ICardService,
    cardSetService: ICardSetService,
    layoutService: ILayoutService,
    searchService: ISearchService,
    interactionService: IInteractionService
  ) {
    this.app = app;
    this.cardService = cardService;
    this.cardSetService = cardSetService;
    this.layoutService = layoutService;
    this.searchService = searchService;
    this.interactionService = interactionService;
  }
  
  /**
   * 초기화
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }
    
    try {
      // 카드셋 서비스 초기화
      await this.cardSetService.initialize();
      
      // 초기화 완료
      this.isInitialized = true;
    } catch (error: unknown) {
      console.error('카드 네비게이터 서비스 초기화 오류:', error);
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      throw new InitializationError(`카드 네비게이터 서비스 초기화 중 오류가 발생했습니다: ${errorMessage}`);
    }
  }
  
  /**
   * 모든 설정 초기화
   */
  async reset(): Promise<void> {
    // 카드셋 소스 초기화
    await this.setCardSetSource('folder');
    
    // 레이아웃 초기화
    this.layoutService.changeLayoutType('grid');
  }
  
  /**
   * 카드 목록 가져오기
   * @returns 카드 목록
   */
  async getCards(): Promise<ICard[]> {
    try {
      // 카드셋 서비스에서 카드 목록 가져오기
      const cards = await this.cardSetService.getCards();
      
      // 현재 카드 목록 업데이트
      this.currentCards = cards;
      
      // 카드 변경 이벤트 발생
      const cardsChangedData: CardsChangedEventData = {
        cards: this.currentCards,
        totalCount: this.currentCards.length,
        filteredCount: this.currentCards.length
      };
      this.eventBus.emit(EventType.CARDS_CHANGED, cardsChangedData);
      
      return this.currentCards;
    } catch (error) {
      console.error('카드 목록 가져오기 오류:', error);
      return [];
    }
  }
  
  /**
   * 현재 카드 목록 가져오기
   * 마지막으로 로드된 카드 목록을 반환합니다.
   * @returns 현재 카드 목록
   */
  getCurrentCards(): ICard[] {
    return this.currentCards;
  }
  
  /**
   * 카드 저장소 새로고침
   */
  async refreshCards(): Promise<void> {
    // 카드셋 새로고침
    await this.cardSetService.reset();
    
    // 카드 목록 다시 로드
    await this.getCards();
  }
  
  /**
   * 카드 세트 변경
   * @param type 변경할 카드 세트 타입
   */
  async changeCardSetSource(type: CardSetSourceType): Promise<void> {
    await this.setCardSetSource(type);
  }
  
  /**
   * 카드 세트 선택
   * @param cardSet 선택할 카드 세트
   */
  async selectCardSet(cardSet: string, isFixed: boolean = false): Promise<void> {
    await this.cardSetService.selectCardSet(cardSet, isFixed);
    await this.refreshCards();
  }
  
  /**
   * 카드 세트 변경 알림 처리
   * @param cardSetSourceType 변경된 카드 세트 타입
   */
  notifyCardSetSourceChanged(cardSetSourceType: CardSetSourceType): void {
    // 카드셋 소스 변경 알림 처리 로직
    console.log(`카드셋 소스 변경됨: ${cardSetSourceType}`);
    
    // 카드 목록 새로고침
    this.refreshCards();
  }
  
  /**
   * 레이아웃 변경
   * @param type 변경할 레이아웃 타입
   */
  async changeLayout(type: LayoutType): Promise<void> {
    try {
      // 레이아웃 서비스에서 레이아웃 변경
      await this.layoutService.changeLayoutType(type);
      
      // 레이아웃 변경 이벤트 발생
      const layoutChangedData: LayoutChangedEventData = {
        previousLayout: type, // 이전 레이아웃 정보가 없으므로 현재 레이아웃으로 대체
        newLayout: type
      };
      this.eventBus.emit(EventType.LAYOUT_CHANGED, layoutChangedData);
    } catch (error: unknown) {
      console.error('레이아웃 변경 오류:', error);
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      throw new LayoutError(`레이아웃 변경 중 오류가 발생했습니다: ${errorMessage}`);
    }
  }
  
  /**
   * 프리셋 적용
   * @param presetId 프리셋 ID
   */
  async applyPreset(presetId: string): Promise<boolean> {
    // 프리셋 적용 로직 구현
    return true;
  }
  
  /**
   * 현재 설정을 프리셋으로 저장
   * @param name 프리셋 이름
   * @param description 프리셋 설명
   */
  saveAsPreset(name: string, description?: string): any {
    // 프리셋 저장 로직 구현
    return { id: Date.now().toString(), name, description };
  }
  
  /**
   * 검색 수행
   * @param query 검색어
   * @param searchType 검색 타입
   * @param caseSensitive 대소문자 구분 여부
   * @param frontmatterKey 프론트매터 키
   */
  async search(
    query: string, 
    searchType: SearchType = 'filename', 
    caseSensitive: boolean = false, 
    frontmatterKey?: string
  ): Promise<void> {
    // 검색 수행 로직 구현
    await this.refreshCards();
  }
  
  /**
   * 검색 타입 변경
   * @param searchType 검색 타입
   * @param frontmatterKey 프론트매터 키
   */
  async changeSearchType(searchType: SearchType, frontmatterKey?: string): Promise<void> {
    // 검색 타입 변경 로직 구현
  }
  
  /**
   * 대소문자 구분 설정
   * @param caseSensitive 대소문자 구분 여부
   */
  async setCaseSensitive(caseSensitive: boolean): Promise<void> {
    // 대소문자 구분 설정 로직 구현
  }
  
  /**
   * 설정 업데이트
   * @param settings 설정 객체
   */
  async updateSettings(settings: any): Promise<void> {
    // 설정 업데이트 로직 구현
  }
  
  /**
   * 마크다운을 HTML로 렌더링
   * @param markdown 마크다운 텍스트
   * @returns 렌더링된 HTML
   */
  renderMarkdown(markdown: string): string {
    try {
      const el = document.createElement('div');
      // 임시 컴포넌트 객체 생성
      const component = new (class extends Component {})();
      MarkdownRenderer.render(this.app, markdown, el, '', component);
      return el.innerHTML;
    } catch (error) {
      console.error('마크다운 렌더링 오류:', error);
      return markdown;
    }
  }
  
  /**
   * 카드셋 소스 서비스 설정
   * @param service 카드셋 소스 서비스
   */
  setCardSetSourceService(service: ICardSetService): void {
    this.cardSetService = service;
  }
  
  /**
   * 검색 서비스 설정
   * @param service 검색 서비스
   */
  setSearchService(service: ISearchService): void {
    this.searchService = service;
  }
  
  /**
   * Obsidian App 객체 가져오기
   */
  getApp(): App {
    return this.app;
  }
  
  /**
   * 카드셋 소스 서비스 가져오기
   */
  getCardSetSourceService(): ICardSetService {
    return this.cardSetService;
  }
  
  /**
   * 카드 서비스 가져오기
   */
  getCardService(): ICardService {
    return this.cardService;
  }
  
  /**
   * 검색 서비스 가져오기
   */
  getSearchService(): ISearchService {
    return this.searchService;
  }
  
  /**
   * 정렬 서비스 가져오기
   * @returns 정렬 서비스
   */
  getSortService(): ICardSetService {
    return this.cardSetService;
  }
  
  /**
   * 레이아웃 서비스 가져오기
   */
  getLayoutService(): ILayoutService {
    return this.layoutService;
  }
  
  /**
   * 프리셋 서비스 가져오기
   * @returns 프리셋 서비스
   */
  getPresetService(): ICardSetService {
    return this.cardSetService;
  }
  
  /**
   * 플러그인 인스턴스 가져오기
   * @returns 플러그인 인스턴스
   */
  getPlugin(): any {
    // 실제 구현에서는 플러그인 인스턴스를 반환해야 합니다.
    return null;
  }
  
  /**
   * 설정 가져오기
   * @returns 현재 설정
   */
  getSettings(): any {
    return this.getPlugin().settings;
  }
  
  /**
   * 카드 클릭 이벤트 처리
   * @param card 클릭된 카드
   */
  onClick(card: ICard): void {
    this.interactionService.onClick(card);
  }
  
  /**
   * 카드 더블 클릭 이벤트 처리
   * @param card 더블 클릭된 카드
   */
  onDoubleClick(card: ICard): void {
    this.interactionService.onDoubleClick(card);
  }
  
  /**
   * 카드 우클릭 이벤트 처리
   * @param card 우클릭된 카드
   * @param event 마우스 이벤트
   */
  onRightClick(card: ICard, event: MouseEvent): void {
    this.interactionService.onRightClick(card, event);
  }
  
  /**
   * 카드 드래그 시작 이벤트 처리
   * @param card 드래그 시작된 카드
   * @param event 드래그 이벤트
   */
  onDragStart(card: ICard, event: DragEvent): void {
    this.interactionService.onDragStart(card, event);
  }
  
  /**
   * 카드 드래그 종료 이벤트 처리
   * @param card 드래그 종료된 카드
   * @param event 드래그 이벤트
   */
  onDragEnd(card: ICard, event: DragEvent): void {
    this.interactionService.onDragEnd(card, event);
  }
  
  /**
   * 카드 드롭 이벤트 처리
   * @param card 드롭된 카드
   * @param event 드래그 이벤트
   */
  onDrop(card: ICard, event: DragEvent): void {
    this.interactionService.onDrop(card, event);
  }
  
  /**
   * 키보드 이벤트 처리
   * @param event 키보드 이벤트
   * @returns 이벤트 처리 여부
   */
  async handleKeyEvent(event: KeyboardEvent): Promise<boolean> {
    return this.interactionService.handleKeyEvent(event);
  }
  
  /**
   * 방향키 이동
   * @param direction 이동 방향
   * @returns 이동 성공 여부
   */
  navigate(direction: KeyboardNavigationDirection): boolean {
    return this.interactionService.navigate(direction);
  }
  
  /**
   * 현재 포커스된 카드 열기
   * @returns 성공 여부
   */
  async openFocusedCard(): Promise<boolean> {
    return this.interactionService.openFocusedCard();
  }
  
  /**
   * 현재 포커스된 카드 편집
   * @returns 성공 여부
   */
  async editFocusedCard(): Promise<boolean> {
    return this.interactionService.editFocusedCard();
  }
  
  /**
   * 현재 포커스된 카드 인덱스 가져오기
   * @returns 포커스된 카드 인덱스 또는 -1
   */
  getFocusedIndex(): number {
    return this.interactionService.getFocusedIndex();
  }
  
  /**
   * 선택된 카드 목록 가져오기
   */
  get selectedCards(): ICard[] {
    return this.interactionService.selectedCards;
  }
  
  /**
   * 카드 선택
   * @param card 선택할 카드
   * @param addToSelection 기존 선택에 추가할지 여부
   */
  selectCard(card: ICard, addToSelection?: boolean): void {
    this.interactionService.selectCard(card, addToSelection);
  }
  
  /**
   * 카드 선택 해제
   * @param card 선택 해제할 카드
   */
  deselectCard(card: ICard): void {
    this.interactionService.deselectCard(card);
  }
  
  /**
   * 모든 카드 선택
   * @param cards 선택할 카드 목록
   */
  selectAll(cards: ICard[]): void {
    this.interactionService.selectAll(cards);
  }
  
  /**
   * 모든 카드 선택 해제
   */
  deselectAll(): void {
    this.interactionService.deselectAll();
  }
  
  /**
   * 범위 선택
   * @param startCard 시작 카드
   * @param endCard 끝 카드
   * @param cards 전체 카드 목록
   */
  selectRange(startCard: ICard, endCard: ICard, cards: ICard[]): void {
    this.interactionService.selectRange(startCard, endCard, cards);
  }
  
  /**
   * 카드 선택 여부 확인
   * @param card 확인할 카드
   * @returns 선택 여부
   */
  isSelected(card: ICard): boolean {
    return this.interactionService.isSelected(card);
  }
  
  /**
   * 선택된 카드 수 가져오기
   * @returns 선택된 카드 수
   */
  getSelectionCount(): number {
    return this.interactionService.getSelectionCount();
  }
  
  /**
   * 선택된 카드 목록 가져오기
   * @returns 선택된 카드 목록
   */
  getSelectedCards(): ICard[] {
    return this.interactionService.getSelectedCards();
  }
  
  /**
   * 선택된 카드에 대한 일괄 작업 수행
   * @param action 수행할 작업 함수
   */
  async performBatchAction(action: (cards: ICard[]) => Promise<void>): Promise<void> {
    await this.interactionService.performBatchAction(action);
  }
  
  /**
   * 카드 열기
   * @param card 열 카드
   * @param newLeaf 새 창에서 열기 여부
   * @returns 성공 여부
   */
  async openCard(card: ICard, newLeaf: boolean = false): Promise<boolean> {
    if (!card) {
      throw new CardError('카드가 제공되지 않았습니다.');
    }
    
    try {
      // 파일 열기
      await this.app.workspace.getLeaf(newLeaf).openFile(card.file);
      return true;
    } catch (error: unknown) {
      console.error('카드 열기 오류:', error);
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      throw new CardError(`카드를 열 수 없습니다: ${errorMessage}`);
    }
  }
  
  /**
   * 카드 편집
   * @param card 편집할 카드
   * @returns 성공 여부
   */
  async editCard(card: ICard): Promise<boolean> {
    try {
      // 카드 서비스를 통해 카드 편집
      await this.cardService.editCard(card);
      return true;
    } catch (error) {
      console.error('카드 편집 오류:', error);
      return false;
    }
  }
  
  /**
   * 카드셋 소스 변경
   * @param type 변경할 카드셋 소스 타입
   */
  async setCardSetSource(type: CardSetSourceType): Promise<void> {
    // 카드셋 소스 변경
    if (type === 'folder') {
      // 폴더 소스로 변경
      this.cardSetService.getCurrentSource().type = 'folder';
    } else if (type === 'tag') {
      // 태그 소스로 변경
      this.cardSetService.getCurrentSource().type = 'tag';
    } else if (type === 'search') {
      // 검색 소스로 변경
      this.cardSetService.getCurrentSource().type = 'search';
    }
    
    // 카드 새로고침
    await this.refreshCards();
    
    // 카드셋 소스 변경 알림
    this.notifyCardSetSourceChanged(type);
  }
}