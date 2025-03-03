import { ItemView, TFile, WorkspaceLeaf, Menu } from 'obsidian';
import { Card } from '../../core/models/Card';
import { CardRenderOptions, CardStateEnum, CardEventType, CardEventData } from '../../core/types/card.types';
import { SettingsManager } from '../../managers/settings/SettingsManager';
import { ErrorHandler } from '../../utils/error/ErrorHandler';
import { ICardService } from '../../core/interfaces/service/ICardService';
import { ICardRenderService } from '../../core/interfaces/service/ICardRenderService';
import { ICardInteractionService } from '../../core/interfaces/service/ICardInteractionService';
import { ICardSetService } from '../../core/interfaces/service/ICardSetService';
import { CardSetMode } from '../../core/types/cardset.types';

/**
 * 카드 뷰 클래스
 * 단일 카드를 표시하는 뷰를 생성하고 관리합니다.
 */
export class CardView extends ItemView {
  /**
   * 뷰 타입 ID
   */
  public static readonly VIEW_TYPE = 'card-view';
  
  /**
   * 뷰 표시 이름
   */
  public static readonly VIEW_DISPLAY_TEXT = '카드 뷰';
  
  /**
   * 뷰 아이콘
   */
  public static readonly VIEW_ICON = 'card';
  
  /**
   * 카드 컨테이너 요소
   */
  private cardContainer: HTMLElement | null = null;
  
  /**
   * 현재 카드
   */
  private currentCard: Card | null = null;
  
  /**
   * 카드셋 구독 ID
   */
  private cardSetSubscriptionId: string | null = null;
  
  /**
   * 생성자
   */
  constructor(
    leaf: WorkspaceLeaf,
    private readonly settingsManager: SettingsManager,
    private readonly cardService: ICardService,
    private readonly cardRenderService: ICardRenderService,
    private readonly cardInteractionService: ICardInteractionService,
    private readonly cardSetService: ICardSetService
  ) {
    super(leaf);
  }
  
  /**
   * 뷰 타입 가져오기
   */
  getViewType(): string {
    return CardView.VIEW_TYPE;
  }
  
  /**
   * 뷰 표시 텍스트 가져오기
   */
  getDisplayText(): string {
    return this.currentCard?.filename || CardView.VIEW_DISPLAY_TEXT;
  }
  
  /**
   * 뷰 아이콘 가져오기
   */
  getIcon(): string {
    return CardView.VIEW_ICON;
  }
  
  /**
   * 뷰 로드
   */
  async onload(): Promise<void> {
    try {
      // 컨테이너 초기화
      this.contentEl.empty();
      this.contentEl.addClass('card-view-container');
      
      // 카드 컨테이너 생성
      this.cardContainer = this.contentEl.createDiv('card-view-card-container');
      
      // 이벤트 리스너 등록
      this.registerEventListeners();
      
      // 카드셋 서비스 초기화
      await this.initializeCardSetService();
      
      // 빈 상태 표시
      this.showEmptyState();
    } catch (error) {
      ErrorHandler.getInstance().handleError(
        '카드 뷰를 로드하는 중 오류가 발생했습니다.',
        error
      );
    }
  }
  
  /**
   * 카드셋 서비스 초기화
   */
  private async initializeCardSetService(): Promise<void> {
    try {
      // 카드셋 서비스 초기화
      await this.cardSetService.initialize({
        mode: CardSetMode.ACTIVE_FOLDER,
        autoRefresh: true
      });

      // 카드셋 변경 구독
      this.cardSetSubscriptionId = this.cardSetService.subscribeToChanges(async (cardSet) => {
        // 현재 카드가 카드셋에 포함되어 있는지 확인
        if (this.currentCard) {
          const cardInSet = cardSet.files.some(file => file.path === this.currentCard?.path);
          if (!cardInSet) {
            // 현재 카드가 카드셋에 없으면 카드 제거
            this.clearCard();
            this.showEmptyState();
          }
        }
      });
    } catch (error) {
      ErrorHandler.getInstance().handleError(
        '카드셋 서비스를 초기화하는 중 오류가 발생했습니다.',
        error
      );
    }
  }
  
  /**
   * 뷰 언로드
   */
  async onunload(): Promise<void> {
    try {
      // 카드셋 구독 해제
      if (this.cardSetSubscriptionId) {
        this.cardSetService.unsubscribeFromChanges(this.cardSetSubscriptionId);
        this.cardSetSubscriptionId = null;
      }

      this.unregisterEventListeners();
      this.clearCard();
      this.contentEl.empty();
    } catch (error) {
      ErrorHandler.getInstance().handleError(
        '카드 뷰를 언로드하는 중 오류가 발생했습니다.',
        error
      );
    }
  }
  
  /**
   * 카드 설정
   */
  public async setCard(card: Card): Promise<void> {
    try {
      this.currentCard = card;
      await this.renderCard();
      
      // 뷰 상태 업데이트
      this.leaf.setViewState({
        type: this.getViewType(),
        state: { file: card.path }
      });

      // 카드셋 업데이트
      await this.cardSetService.updateCardSet(true);
    } catch (error) {
      ErrorHandler.getInstance().handleError(
        '카드를 설정하는 중 오류가 발생했습니다.',
        error
      );
    }
  }
  
  /**
   * 파일로부터 카드 설정
   */
  public async setCardFromFile(file: TFile): Promise<void> {
    try {
      const card = await this.cardService.createCardFromFile(file);
      await this.setCard(card);
    } catch (error) {
      ErrorHandler.getInstance().handleError(
        '파일로부터 카드를 설정하는 중 오류가 발생했습니다.',
        error
      );
    }
  }
  
  /**
   * 카드 렌더링
   */
  private async renderCard(): Promise<void> {
    try {
      if (!this.cardContainer || !this.currentCard) {
        this.showEmptyState();
        return;
      }
      
      // 기존 카드 정리
      this.clearCard();
      
      // 카드 요소 생성
      const cardElement = this.cardRenderService.createCardElement(
        this.currentCard,
        this.getRenderOptions()
      );
      
      // 상호작용 설정
      this.cardInteractionService.setupCardInteractions(
        this.currentCard,
        cardElement,
        {
          onClick: this.handleCardClick.bind(this),
          onContextMenu: this.handleCardContextMenu.bind(this),
          onHover: this.handleCardHover.bind(this)
        }
      );
      
      // 카드 컨테이너에 추가
      this.cardContainer.appendChild(cardElement);
    } catch (error) {
      ErrorHandler.getInstance().handleError(
        '카드를 렌더링하는 중 오류가 발생했습니다.',
        error
      );
    }
  }
  
  /**
   * 이벤트 리스너 등록
   */
  private registerEventListeners(): void {
    // 설정 변경 이벤트
    const settingsChangeCallback = this.handleSettingsChanged.bind(this);
    (this.settingsManager as any).changeCallbacks['cardView'] = settingsChangeCallback;
    
    // 카드 이벤트
    this.cardInteractionService.addEventListener(
      CardEventType.CLICK,
      (data: CardEventData) => {
        if (data.originalEvent instanceof MouseEvent) {
          this.handleCardClick(data.originalEvent);
        }
      }
    );
  }
  
  /**
   * 이벤트 리스너 제거
   */
  private unregisterEventListeners(): void {
    // 설정 변경 이벤트 제거
    delete (this.settingsManager as any).changeCallbacks['cardView'];
    
    // 카드 이벤트 제거
    this.cardInteractionService.removeEventListener(
      CardEventType.CLICK,
      (data: CardEventData) => {
        if (data.originalEvent instanceof MouseEvent) {
          this.handleCardClick(data.originalEvent);
        }
      }
    );
  }
  
  /**
   * 카드 클릭 이벤트 처리
   */
  private async handleCardClick(event: MouseEvent): Promise<void> {
    try {
      if (!this.currentCard?.file) return;
      
      // 파일 열기
      await this.app.workspace.getLeaf().openFile(this.currentCard.file);
    } catch (error) {
      ErrorHandler.getInstance().handleError(
        '카드 클릭 이벤트를 처리하는 중 오류가 발생했습니다.',
        error
      );
    }
  }
  
  /**
   * 카드 컨텍스트 메뉴 이벤트 처리
   */
  private handleCardContextMenu(event: MouseEvent): void {
    try {
      if (!this.currentCard) return;
      
      const menu = new Menu();
      this.app.workspace.trigger('file-menu', this.currentCard.file, menu);
      menu.showAtPosition({ x: event.clientX, y: event.clientY });
    } catch (error) {
      ErrorHandler.getInstance().handleError(
        '카드 컨텍스트 메뉴 이벤트를 처리하는 중 오류가 발생했습니다.',
        error
      );
    }
  }
  
  /**
   * 카드 호버 이벤트 처리
   */
  private handleCardHover(event: MouseEvent): void {
    try {
      if (!this.currentCard) return;
      
      const isEnter = event.type === 'mouseenter';
      this.cardContainer?.toggleClass('card-hover', isEnter);
    } catch (error) {
      ErrorHandler.getInstance().handleError(
        '카드 호버 이벤트를 처리하는 중 오류가 발생했습니다.',
        error
      );
    }
  }
  
  /**
   * 설정 변경 이벤트 처리
   */
  private async handleSettingsChanged(): Promise<void> {
    try {
      await this.renderCard();
    } catch (error) {
      ErrorHandler.getInstance().handleError(
        '설정 변경 이벤트를 처리하는 중 오류가 발생했습니다.',
        error
      );
    }
  }
  
  /**
   * 렌더링 옵션 가져오기
   */
  private getRenderOptions(): CardRenderOptions {
    return {
      showFileName: true,
      showFirstHeader: true,
      showContent: true,
      maxBodyLength: 200,
      showTags: true,
      showCreationDate: true,
      showModificationDate: true,
      fileNameFontSize: 14,
      titleFontSize: 16,
      bodyFontSize: 14,
      tagsFontSize: 12,
      renderMarkdown: true,
      highlightCodeBlocks: true,
      renderMathEquations: true,
      showImages: true,
      themeMode: 'system',
      showEmptyTagsMessage: true,
      maxTagCount: 0,
      useTagColors: true,
      tagColorMap: {} as Record<string, string>
    };
  }
  
  /**
   * 카드 요소 제거
   */
  private clearCard(): void {
    if (!this.cardContainer) return;
    this.cardContainer.empty();
  }
  
  /**
   * 빈 상태 아이콘 생성
   * @returns HTMLElement SVG 아이콘 요소
   */
  private createEmptyStateIcon(): HTMLElement {
    const iconContainer = document.createElement('div');
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const paths = [
      {d: 'M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z'},
      {d: 'M10 10.3c.2-.4.5-.8.9-1a2.1 2.1 0 0 1 2.6.4c.3.4.5.8.5 1.3 0 1.3-2 2-2 2'},
      {d: 'M12 17h.01'}
    ];
    
    svg.setAttribute('width', '48');
    svg.setAttribute('height', '48');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '2');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    
    paths.forEach(pathData => {
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', pathData.d);
      svg.appendChild(path);
    });
    
    iconContainer.appendChild(svg);
    return iconContainer;
  }
  
  /**
   * 빈 상태 표시
   */
  private showEmptyState(): void {
    if (!this.cardContainer) return;
    
    const emptyState = this.cardContainer.createDiv('card-view-empty-state');
    
    const icon = emptyState.createDiv('card-view-empty-icon');
    icon.appendChild(this.createEmptyStateIcon());
    
    const text = emptyState.createDiv('card-view-empty-text');
    text.textContent = '카드가 선택되지 않았습니다.';
    
    const subtext = emptyState.createDiv('card-view-empty-subtext');
    subtext.textContent = '카드 네비게이터에서 카드를 선택하세요.';
  }
} 