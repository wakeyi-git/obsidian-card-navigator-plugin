import { ItemView, WorkspaceLeaf } from 'obsidian';
import { VIEW_TYPE_CARD_NAVIGATOR } from '../main';
import CardNavigatorPlugin from '../main';
import { SearchView } from './components/SearchView';
import { CardListView } from './components/CardListView';
import { ICardList } from '../domain/cardlist/CardList';
import { DomainEventBus } from '../domain/events/DomainEventBus';
import { EventType } from '../domain/events/EventTypes';

/**
 * 카드 네비게이터 뷰
 * 카드 네비게이터의 메인 뷰를 담당합니다.
 */
export class CardNavigatorView extends ItemView {
  /**
   * 플러그인 인스턴스
   */
  private plugin: CardNavigatorPlugin;
  
  /**
   * 이벤트 버스
   */
  private eventBus: DomainEventBus;
  
  /**
   * 검색 뷰
   */
  private searchView: SearchView;
  
  /**
   * 카드 리스트 뷰
   */
  private cardListView: CardListView | null = null;
  
  /**
   * 컨테이너 요소
   */
  private containerEl: HTMLElement;
  
  /**
   * 카드 컨테이너 요소
   */
  private cardContainerEl: HTMLElement;
  
  /**
   * 생성자
   * @param leaf 워크스페이스 리프
   * @param plugin 플러그인 인스턴스
   */
  constructor(leaf: WorkspaceLeaf, plugin: CardNavigatorPlugin) {
    super(leaf);
    this.plugin = plugin;
    this.eventBus = DomainEventBus.getInstance();
    
    // 이벤트 리스너 등록
    this.registerEventListeners();
  }
  
  /**
   * 이벤트 리스너 등록
   */
  private registerEventListeners(): void {
    // 카드 리스트 업데이트 이벤트 리스너
    this.eventBus.on(EventType.CARD_LIST_UPDATED, (data) => {
      this.updateCardList(data.cardList);
    });
  }
  
  /**
   * 뷰 타입 가져오기
   * @returns 뷰 타입
   */
  getViewType(): string {
    return VIEW_TYPE_CARD_NAVIGATOR;
  }
  
  /**
   * 뷰 표시 텍스트 가져오기
   * @returns 뷰 표시 텍스트
   */
  getDisplayText(): string {
    return '카드 네비게이터';
  }
  
  /**
   * 아이콘 가져오기
   * @returns 아이콘 이름
   */
  getIcon(): string {
    return 'layout-grid';
  }
  
  /**
   * 뷰 로드
   */
  async onload(): Promise<void> {
    super.onload();
    
    // 컨테이너 초기화
    this.containerEl = this.contentEl.createDiv({ cls: 'card-navigator-container-view' });
    
    // 검색 뷰 초기화
    this.searchView = new SearchView(this.plugin.getSearchService());
    
    // 헤더 생성
    this.createHeader();
    
    // 카드 컨테이너 생성
    this.cardContainerEl = this.containerEl.createDiv({ cls: 'card-navigator-cards-container' });
    
    // 초기 카드 리스트 생성
    this.createInitialCardList();
  }
  
  /**
   * 뷰 언로드
   */
  async onunload(): Promise<void> {
    // 이벤트 리스너 제거
    this.eventBus.off(EventType.CARD_LIST_UPDATED, this.updateCardList);
  }
  
  /**
   * 헤더 생성
   */
  private createHeader(): void {
    const headerEl = this.containerEl.createDiv({ cls: 'card-navigator-header' });
    
    // 검색 뷰 렌더링
    this.searchView.render(headerEl);
    
    // 툴바 생성
    this.createToolbar(headerEl);
  }
  
  /**
   * 툴바 생성
   * @param headerEl 헤더 요소
   */
  private createToolbar(headerEl: HTMLElement): void {
    const toolbarEl = headerEl.createDiv({ cls: 'card-navigator-toolbar' });
    
    // 레이아웃 토글 버튼
    const layoutToggleEl = toolbarEl.createDiv({ cls: 'card-navigator-layout-toggle' });
    
    // 그리드 레이아웃 버튼
    const gridLayoutBtn = layoutToggleEl.createDiv({
      cls: 'card-navigator-layout-btn card-navigator-grid-layout active',
      attr: {
        'title': '그리드 레이아웃'
      }
    });
    
    gridLayoutBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-grid"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>';
    
    // 매스너리 레이아웃 버튼
    const masonryLayoutBtn = layoutToggleEl.createDiv({
      cls: 'card-navigator-layout-btn card-navigator-masonry-layout',
      attr: {
        'title': '매스너리 레이아웃'
      }
    });
    
    masonryLayoutBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-layout"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>';
    
    // 레이아웃 토글 이벤트
    gridLayoutBtn.addEventListener('click', () => {
      if (!gridLayoutBtn.hasClass('active')) {
        gridLayoutBtn.addClass('active');
        masonryLayoutBtn.removeClass('active');
        this.setLayout('grid');
      }
    });
    
    masonryLayoutBtn.addEventListener('click', () => {
      if (!masonryLayoutBtn.hasClass('active')) {
        masonryLayoutBtn.addClass('active');
        gridLayoutBtn.removeClass('active');
        this.setLayout('masonry');
      }
    });
    
    // 정렬 옵션
    const sortOptionsEl = toolbarEl.createDiv({ cls: 'card-navigator-sort-options' });
    
    // 정렬 라벨
    const sortLabelEl = sortOptionsEl.createSpan({ cls: 'card-navigator-sort-label' });
    sortLabelEl.setText('정렬:');
    
    // 정렬 선택
    const sortSelectEl = sortOptionsEl.createEl('select', { cls: 'card-navigator-sort-select' });
    
    // 정렬 옵션 추가
    const sortOptions = [
      { value: 'title', text: '제목' },
      { value: 'path', text: '경로' },
      { value: 'created', text: '생성일' },
      { value: 'modified', text: '수정일' }
    ];
    
    sortOptions.forEach(option => {
      const optionEl = sortSelectEl.createEl('option', {
        value: option.value,
        text: option.text
      });
      
      // 기본 정렬 옵션 선택
      if (option.value === 'title') {
        optionEl.selected = true;
      }
    });
    
    // 정렬 방향 버튼
    const sortDirectionEl = sortOptionsEl.createDiv({
      cls: 'card-navigator-sort-direction asc'
    });
    
    sortDirectionEl.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-arrow-up"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg>';
    
    // 정렬 이벤트
    sortSelectEl.addEventListener('change', () => {
      const sortType = sortSelectEl.value;
      const sortDirection = sortDirectionEl.hasClass('asc') ? 'asc' : 'desc';
      this.sortCards(sortType, sortDirection);
    });
    
    sortDirectionEl.addEventListener('click', () => {
      if (sortDirectionEl.hasClass('asc')) {
        sortDirectionEl.removeClass('asc');
        sortDirectionEl.addClass('desc');
        sortDirectionEl.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-arrow-down"><line x1="12" y1="5" x2="12" y2="19"></line><polyline points="19 12 12 19 5 12"></polyline></svg>';
      } else {
        sortDirectionEl.removeClass('desc');
        sortDirectionEl.addClass('asc');
        sortDirectionEl.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-arrow-up"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg>';
      }
      
      const sortType = sortSelectEl.value;
      const sortDirection = sortDirectionEl.hasClass('asc') ? 'asc' : 'desc';
      this.sortCards(sortType, sortDirection);
    });
  }
  
  /**
   * 초기 카드 리스트 생성
   */
  private createInitialCardList(): void {
    // 초기 카드 리스트 생성
    this.plugin.getCardService().syncCards();
  }
  
  /**
   * 카드 리스트 업데이트
   * @param cardList 카드 리스트
   */
  private updateCardList(cardList: ICardList): void {
    // 카드 리스트 뷰 생성 또는 업데이트
    if (!this.cardListView) {
      this.cardListView = new CardListView(cardList, this.plugin.getCardInteractionService());
      this.cardListView.render(this.cardContainerEl);
    } else {
      // 카드 리스트 업데이트
      this.cardContainerEl.empty();
      this.cardListView = new CardListView(cardList, this.plugin.getCardInteractionService());
      this.cardListView.render(this.cardContainerEl);
    }
  }
  
  /**
   * 레이아웃 설정
   * @param layout 레이아웃 타입
   */
  private setLayout(layout: 'grid' | 'masonry'): void {
    // 레이아웃 클래스 제거
    this.cardContainerEl.removeClass('card-navigator-grid-layout');
    this.cardContainerEl.removeClass('card-navigator-masonry-layout');
    
    // 레이아웃 클래스 추가
    this.cardContainerEl.addClass(`card-navigator-${layout}-layout`);
    
    // 설정 업데이트
    this.plugin.settings.defaultLayout = layout;
    this.plugin.saveSettings();
  }
  
  /**
   * 카드 정렬
   * @param sortType 정렬 타입
   * @param sortDirection 정렬 방향
   */
  private sortCards(sortType: string, sortDirection: 'asc' | 'desc'): void {
    // 카드 리스트 뷰가 없는 경우 무시
    if (!this.cardListView) return;
    
    // 정렬 이벤트 발생
    this.eventBus.emit(EventType.SORT_REQUESTED, {
      listId: this.cardListView.getCardList().id,
      sortType,
      sortDirection
    });
  }
} 