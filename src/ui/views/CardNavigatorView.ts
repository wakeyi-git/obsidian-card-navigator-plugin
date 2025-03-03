import { ItemView, TFile, WorkspaceLeaf } from 'obsidian';
import { Card } from '../../core/models/Card';
import { CardSet } from '../../core/models/CardSet';
import { CardPosition } from '../../core/models/CardPosition';
import { CardSetManager } from '../../managers/cardset/CardSetManager';
import { LayoutManager } from '../../managers/layout/LayoutManager';
import { PresetManager } from '../../managers/preset/PresetManager';
import { SettingsManager } from '../../managers/settings/SettingsManager';
import { SearchService } from '../../services/search/SearchService';
import { CardRenderOptions, CardStateEnum, SortDirection, SortField } from '../../core/types/card.types';
import { LayoutOptions } from '../../core/types/layout.types';
import { Toolbar } from '../components/toolbar/Toolbar';
import { CardSetEvent, CardSetEventData } from '../../core/types/cardset.types';
import { LAYOUT_CLASS_NAMES } from '../../styles/components/layout.styles';

/**
 * 카드 네비게이터 뷰 클래스
 * Obsidian의 ItemView를 확장하여 카드 네비게이터 뷰를 생성하고 관리합니다.
 */
export class CardNavigatorView extends ItemView {
  /**
   * 뷰 타입 ID
   */
  public static readonly VIEW_TYPE = 'card-navigator-view';
  
  /**
   * 뷰 표시 이름
   */
  public static readonly VIEW_DISPLAY_TEXT = '카드 네비게이터';
  
  /**
   * 뷰 아이콘
   */
  public static readonly VIEW_ICON = 'cards';
  
  /**
   * 카드 컨테이너 요소
   */
  private cardContainer: HTMLElement;
  
  /**
   * 툴바 컴포넌트
   */
  private toolbar: Toolbar;
  
  /**
   * 카드셋 관리자
   */
  private cardSetManager: CardSetManager;
  
  /**
   * 레이아웃 관리자
   */
  private layoutManager: LayoutManager;
  
  /**
   * 프리셋 관리자
   */
  private presetManager: PresetManager;
  
  /**
   * 설정 관리자
   */
  private settingsManager: SettingsManager;
  
  /**
   * 검색 서비스
   */
  private searchService: SearchService;
  
  /**
   * 카드 요소 맵 (카드 ID -> 카드 요소)
   */
  private cardElements: Map<string, HTMLElement> = new Map();
  
  /**
   * 카드 객체 맵 (카드 ID -> 카드 객체)
   */
  private cards: Map<string, Card> = new Map();
  
  /**
   * 현재 정렬 필드
   */
  private currentSortField: SortField = 'name';
  
  /**
   * 현재 정렬 방향
   */
  private currentSortDirection: SortDirection = 'asc';
  
  /**
   * 현재 검색어
   */
  private currentSearchTerm: string = '';
  
  /**
   * 카드 네비게이터 뷰 생성자
   * @param leaf 워크스페이스 리프
   * @param cardSetManager 카드셋 관리자
   * @param layoutManager 레이아웃 관리자
   * @param presetManager 프리셋 관리자
   * @param settingsManager 설정 관리자
   * @param searchService 검색 서비스
   */
  constructor(
    leaf: WorkspaceLeaf,
    cardSetManager: CardSetManager,
    layoutManager: LayoutManager,
    presetManager: PresetManager,
    settingsManager: SettingsManager,
    searchService: SearchService
  ) {
    super(leaf);
    
    this.cardSetManager = cardSetManager;
    this.layoutManager = layoutManager;
    this.presetManager = presetManager;
    this.settingsManager = settingsManager;
    this.searchService = searchService;
  }
  
  /**
   * 뷰 타입 가져오기
   * @returns 뷰 타입 ID
   */
  getViewType(): string {
    return CardNavigatorView.VIEW_TYPE;
  }
  
  /**
   * 뷰 표시 텍스트 가져오기
   * @returns 뷰 표시 이름
   */
  getDisplayText(): string {
    return CardNavigatorView.VIEW_DISPLAY_TEXT;
  }
  
  /**
   * 뷰 아이콘 가져오기
   * @returns 뷰 아이콘
   */
  getIcon(): string {
    return CardNavigatorView.VIEW_ICON;
  }
  
  /**
   * 뷰 로드 시 호출되는 메서드
   * 뷰 요소 생성 및 초기화
   */
  async onload(): Promise<void> {
    // 기본 컨테이너 생성
    this.contentEl.empty();
    this.contentEl.addClass('card-navigator-container');
    
    // 툴바 생성
    this.toolbar = new Toolbar(this.app, this.presetManager);
    this.contentEl.appendChild(this.toolbar.getElement());
    
    // 카드 컨테이너 생성
    this.cardContainer = document.createElement('div');
    this.cardContainer.addClass('card-navigator-card-container');
    this.contentEl.appendChild(this.cardContainer);
    
    // 레이아웃 관리자 초기화
    const layoutOptions: LayoutOptions = this.settingsManager.getSettings().layout;
    this.layoutManager.initialize(this.cardContainer, layoutOptions);
    
    // 이벤트 리스너 등록
    this.registerEventListeners();
    
    // 초기 카드셋 로드
    await this.loadInitialCardSet();
  }
  
  /**
   * 뷰 언로드 시 호출되는 메서드
   * 리소스 정리
   */
  async onunload(): Promise<void> {
    // 이벤트 리스너 제거
    this.unregisterEventListeners();
    
    // 레이아웃 관리자 정리
    this.layoutManager.destroy();
    
    // 카드 요소 정리
    this.clearCards();
    
    // 컨테이너 비우기
    this.contentEl.empty();
  }
  
  /**
   * 이벤트 리스너 등록
   */
  private registerEventListeners(): void {
    // 툴바 이벤트 리스너
    this.toolbar.on('search', this.handleSearch.bind(this));
    this.toolbar.on('sort-change', this.handleSortChange.bind(this));
    this.toolbar.on('cardset-type-change', this.handleCardSetTypeChange.bind(this));
    this.toolbar.on('preset-change', this.handlePresetChange.bind(this));
    this.toolbar.on('settings', this.handleOpenSettings.bind(this));
    
    // 카드셋 이벤트 리스너
    this.cardSetManager.on('cardset-loaded', this.handleCardSetLoaded.bind(this));
    this.cardSetManager.on('cardset-refreshed', this.handleCardSetRefreshed.bind(this));
    
    // 레이아웃 이벤트 리스너
    this.layoutManager.on('layout-updated', this.handleLayoutUpdated.bind(this));
    this.layoutManager.on('container-resized', this.handleContainerResized.bind(this));
    
    // 설정 변경 이벤트 리스너
    this.settingsManager.registerChangeCallback(this.handleSettingsChanged.bind(this));
  }
  
  /**
   * 이벤트 리스너 제거
   */
  private unregisterEventListeners(): void {
    // 툴바 이벤트 리스너 제거
    this.toolbar.off('search');
    this.toolbar.off('sort-change');
    this.toolbar.off('cardset-type-change');
    this.toolbar.off('preset-change');
    this.toolbar.off('settings');
    
    // 카드셋 이벤트 리스너 제거
    this.cardSetManager.off('cardset-loaded', this.handleCardSetLoaded.bind(this));
    this.cardSetManager.off('cardset-refreshed', this.handleCardSetRefreshed.bind(this));
    
    // 레이아웃 이벤트 리스너 제거
    this.layoutManager.off('layout-updated', this.handleLayoutUpdated.bind(this));
    this.layoutManager.off('container-resized', this.handleContainerResized.bind(this));
    
    // 설정 변경 이벤트 리스너 제거
    this.settingsManager.unregisterChangeCallback(this.handleSettingsChanged.bind(this));
  }
  
  /**
   * 초기 카드셋 로드
   */
  private async loadInitialCardSet(): Promise<void> {
    try {
      // 활성 폴더 카드셋 로드
      await this.cardSetManager.loadActiveFolder();
      
      // 정렬 적용
      this.applySorting();
    } catch (error) {
      console.error('초기 카드셋 로드 실패:', error);
    }
  }
  
  /**
   * 카드셋 로드 이벤트 핸들러
   * @param data 카드셋 이벤트 데이터
   */
  private handleCardSetLoaded(data: CardSetEventData): void {
    this.renderCardSet(data.cardSet);
  }
  
  /**
   * 카드셋 새로고침 이벤트 핸들러
   * @param data 카드셋 이벤트 데이터
   */
  private handleCardSetRefreshed(data: CardSetEventData): void {
    this.renderCardSet(data.cardSet);
  }
  
  /**
   * 카드셋 렌더링
   * @param cardSet 카드셋
   */
  private renderCardSet(cardSet: CardSet): void {
    // 기존 카드 정리
    this.clearCards();
    
    // 카드셋이 비어있는 경우 빈 상태 표시
    if (cardSet.files.length === 0) {
      this.showEmptyState();
      return;
    }
    
    // 카드 생성 및 렌더링
    const cardModels = this.createCardModels(cardSet.files);
    this.renderCards(cardModels);
    
    // 레이아웃 업데이트
    this.updateLayout();
  }
  
  /**
   * 카드 모델 생성
   * @param files 파일 목록
   * @returns 카드 모델 배열
   */
  private createCardModels(files: TFile[]): Card[] {
    const cardModels: Card[] = [];
    
    for (const file of files) {
      // 파일 메타데이터 가져오기
      const cache = this.app.metadataCache.getFileCache(file);
      
      // 카드 모델 생성
      const card = new Card(file, {
        firstHeader: cache?.headings?.[0]?.heading,
        tags: cache?.tags?.map(tag => tag.tag.substring(1)) || [],
        state: 'normal'
      });
      
      cardModels.push(card);
      this.cards.set(card.id, card);
    }
    
    return cardModels;
  }
  
  /**
   * 카드 렌더링
   * @param cardModels 카드 모델 배열
   */
  private renderCards(cardModels: Card[]): void {
    const renderOptions = this.getRenderOptions();
    
    for (const cardModel of cardModels) {
      // 카드 요소 생성
      const cardElement = this.createCardElement(cardModel, renderOptions);
      
      // 카드 컨테이너에 추가
      this.cardContainer.appendChild(cardElement);
      
      // 카드 요소 맵에 추가
      this.cardElements.set(cardModel.id, cardElement);
    }
  }
  
  /**
   * 카드 요소 생성
   * @param cardModel 카드 모델
   * @param renderOptions 렌더링 옵션
   * @returns 카드 HTML 요소
   */
  private createCardElement(cardModel: Card, renderOptions: CardRenderOptions): HTMLElement {
    // 카드 UI 컴포넌트 생성 (실제 구현에서는 Card 컴포넌트 사용)
    const cardElement = document.createElement('div');
    cardElement.addClass('card-navigator-card');
    cardElement.setAttribute('data-card-id', cardModel.id);
    
    // 카드 상태 클래스 추가
    cardElement.addClass(`card-navigator-card-${cardModel.state}`);
    
    // 카드 클릭 이벤트 리스너
    cardElement.addEventListener('click', (event) => {
      this.handleCardClick(event, cardModel);
    });
    
    // 카드 컨텍스트 메뉴 이벤트 리스너
    cardElement.addEventListener('contextmenu', (event) => {
      this.handleCardContextMenu(event, cardModel);
    });
    
    // 카드 내용 렌더링 (실제 구현에서는 CardHeader, CardBody, CardFooter 컴포넌트 사용)
    // 여기서는 간단한 구현만 제공
    
    // 헤더 생성
    const header = document.createElement('div');
    header.addClass('card-navigator-card-header');
    
    // 제목 생성
    const title = document.createElement('div');
    title.addClass('card-navigator-card-title');
    title.textContent = renderOptions.showFirstHeader && cardModel.firstHeader
      ? cardModel.firstHeader
      : cardModel.fileName;
    header.appendChild(title);
    
    // 본문 생성
    const body = document.createElement('div');
    body.addClass('card-navigator-card-body');
    
    // 태그 생성
    const footer = document.createElement('div');
    footer.addClass('card-navigator-card-footer');
    
    if (renderOptions.showTags && cardModel.tags.length > 0) {
      const tagContainer = document.createElement('div');
      tagContainer.addClass('card-navigator-card-tags');
      
      for (const tag of cardModel.tags) {
        const tagElement = document.createElement('span');
        tagElement.addClass('card-navigator-card-tag');
        tagElement.textContent = tag;
        tagContainer.appendChild(tagElement);
      }
      
      footer.appendChild(tagContainer);
    }
    
    // 요소 조합
    cardElement.appendChild(header);
    cardElement.appendChild(body);
    cardElement.appendChild(footer);
    
    return cardElement;
  }
  
  /**
   * 카드 클릭 이벤트 핸들러
   * @param event 마우스 이벤트
   * @param cardModel 카드 모델
   */
  private handleCardClick(event: MouseEvent, cardModel: Card): void {
    // 파일 열기
    this.app.workspace.getLeaf().openFile(cardModel.file);
  }
  
  /**
   * 카드 컨텍스트 메뉴 이벤트 핸들러
   * @param event 마우스 이벤트
   * @param cardModel 카드 모델
   */
  private handleCardContextMenu(event: MouseEvent, cardModel: Card): void {
    // 컨텍스트 메뉴 표시 (실제 구현에서는 CardContextMenu 컴포넌트 사용)
    // 여기서는 기본 동작 유지
  }
  
  /**
   * 검색 이벤트 핸들러
   * @param searchTerm 검색어
   */
  private async handleSearch(searchTerm: string): Promise<void> {
    this.currentSearchTerm = searchTerm;
    
    if (!searchTerm) {
      // 검색어가 없는 경우 현재 카드셋 타입에 따라 카드셋 새로고침
      await this.cardSetManager.refreshCardSet();
      return;
    }
    
    // 검색 결과 카드셋 로드
    await this.cardSetManager.loadSearchResults(searchTerm);
  }
  
  /**
   * 정렬 변경 이벤트 핸들러
   * @param field 정렬 필드
   * @param direction 정렬 방향
   */
  private handleSortChange(field: SortField, direction: SortDirection): void {
    this.currentSortField = field;
    this.currentSortDirection = direction;
    
    // 정렬 적용
    this.applySorting();
  }
  
  /**
   * 카드셋 모드 변경 처리
   * @param mode 카드셋 모드 문자열
   * @param source 카드셋 소스 (선택적)
   */
  private async handleCardSetTypeChange(mode: string, source?: string): Promise<void> {
    // 카드셋 모드 설정
    await this.cardSetManager.setCardSetType(mode);
    
    // 카드셋 모드에 따라 카드셋 로드
    switch (mode) {
      case 'active-folder':
        await this.cardSetManager.loadActiveFolder();
        break;
      case 'selected-folder':
        if (source) {
          await this.cardSetManager.loadSelectedFolder(source);
        }
        break;
      case 'vault':
        await this.cardSetManager.loadVault();
        break;
      case 'search-results':
        // 검색 결과 처리
        break;
      default:
        break;
    }
  }
  
  /**
   * 프리셋 변경 이벤트 핸들러
   * @param presetName 프리셋 이름
   */
  private handlePresetChange(presetName: string): void {
    // 프리셋 활성화
    this.presetManager.setActivePreset(presetName);
    
    // 설정 업데이트 (설정 변경 콜백에서 UI 업데이트 처리)
  }
  
  /**
   * 설정 열기 이벤트 핸들러
   */
  private handleOpenSettings(): void {
    // 설정 탭 열기
    this.app.setting.open();
    this.app.setting.openTabById('card-navigator');
  }
  
  /**
   * 설정 변경 이벤트 핸들러
   * @param settings 변경된 설정
   */
  private handleSettingsChanged(settings: any): void {
    // 레이아웃 옵션 업데이트
    this.layoutManager.updateOptions(settings.layout);
    
    // 카드 다시 렌더링
    this.refreshCards();
  }
  
  /**
   * 레이아웃 업데이트 이벤트 핸들러
   */
  private handleLayoutUpdated(): void {
    // 필요한 경우 추가 처리
  }
  
  /**
   * 컨테이너 크기 변경 이벤트 핸들러
   */
  private handleContainerResized(): void {
    // 레이아웃 업데이트
    this.updateLayout();
  }
  
  /**
   * 정렬 적용
   */
  private applySorting(): void {
    const sortFn = this.createSortFunction(this.currentSortField, this.currentSortDirection);
    this.cardSetManager.sortCardSet(sortFn);
  }
  
  /**
   * 정렬 함수 생성
   * @param field 정렬 필드
   * @param direction 정렬 방향
   * @returns 정렬 함수
   */
  private createSortFunction(field: SortField, direction: SortDirection): (a: TFile, b: TFile) => number {
    const directionMultiplier = direction === 'asc' ? 1 : -1;
    
    return (a: TFile, b: TFile) => {
      switch (field) {
        case 'name':
          return a.basename.localeCompare(b.basename) * directionMultiplier;
        case 'created':
          return (a.stat.ctime - b.stat.ctime) * directionMultiplier;
        case 'modified':
          return (a.stat.mtime - b.stat.mtime) * directionMultiplier;
        case 'size':
          return (a.stat.size - b.stat.size) * directionMultiplier;
        case 'path':
          return a.path.localeCompare(b.path) * directionMultiplier;
        default:
          return 0;
      }
    };
  }
  
  /**
   * 레이아웃 업데이트
   */
  private updateLayout(): void {
    // 카드 배열 생성
    const cardArray = Array.from(this.cards.values());
    
    // 레이아웃 업데이트
    this.layoutManager.updateLayout(cardArray);
  }
  
  /**
   * 카드 새로고침
   */
  private refreshCards(): void {
    // 현재 카드셋 가져오기
    const cardSet = this.cardSetManager.getCurrentCardSet();
    
    // 카드셋 다시 렌더링
    this.renderCardSet(cardSet);
  }
  
  /**
   * 카드 정리
   */
  private clearCards(): void {
    // 카드 요소 제거
    this.cardElements.forEach(element => {
      element.remove();
    });
    
    // 맵 초기화
    this.cardElements.clear();
    this.cards.clear();
  }
  
  /**
   * 빈 상태 표시
   */
  private showEmptyState(): void {
    const emptyStateElement = document.createElement('div');
    emptyStateElement.addClass('card-navigator-empty-state');
    
    const icon = document.createElement('div');
    icon.addClass('card-navigator-empty-state-icon');
    icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-file-question"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><path d="M10 10.3c.2-.4.5-.8.9-1a2.1 2.1 0 0 1 2.6.4c.3.4.5.8.5 1.3 0 1.3-2 2-2 2"/><path d="M12 17h.01"/></svg>';
    
    const title = document.createElement('h3');
    title.textContent = '노트가 없습니다';
    
    const description = document.createElement('p');
    description.textContent = '이 폴더에 마크다운 노트가 없거나 검색 결과가 없습니다.';
    
    emptyStateElement.appendChild(icon);
    emptyStateElement.appendChild(title);
    emptyStateElement.appendChild(description);
    
    this.cardContainer.appendChild(emptyStateElement);
  }
  
  /**
   * 렌더링 옵션 가져오기
   * @returns 카드 렌더링 옵션
   */
  private getRenderOptions(): CardRenderOptions {
    const settings = this.settingsManager.getSettings();
    
    return {
      showFileName: settings.card.showFileName,
      showFirstHeader: settings.card.showFirstHeader,
      showBody: settings.card.showBody,
      showTags: settings.card.showTags,
      bodyLengthLimit: settings.card.bodyLengthLimit,
      bodyLength: settings.card.bodyLength,
      renderContentAsHtml: settings.card.renderContentAsHtml,
      fileNameFontSize: settings.card.fileNameFontSize,
      firstHeaderFontSize: settings.card.firstHeaderFontSize,
      bodyFontSize: settings.card.bodyFontSize,
      tagsFontSize: settings.card.tagsFontSize
    };
  }
  
  /**
   * 카드 ID로 카드 요소 가져오기
   * @param cardId 카드 ID
   * @returns 카드 HTML 요소 또는 null
   */
  private getCardElementById(cardId: string): HTMLElement | null {
    return this.cardElements.get(cardId) || null;
  }
} 