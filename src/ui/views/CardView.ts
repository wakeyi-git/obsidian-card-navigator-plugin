import { ItemView, TFile, WorkspaceLeaf } from 'obsidian';
import { Card } from '../../core/models/Card';
import { CardRenderOptions, CardStateEnum } from '../../core/types/card.types';
import { SettingsManager } from '../../managers/settings/SettingsManager';
import { ErrorHandler } from '../../utils/error/ErrorHandler';

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
  private cardContainer: HTMLElement;
  
  /**
   * 카드 요소
   */
  private cardElement: HTMLElement | null = null;
  
  /**
   * 카드 모델
   */
  private card: Card | null = null;
  
  /**
   * 설정 관리자
   */
  private settingsManager: SettingsManager;
  
  /**
   * 카드 상태
   */
  private cardState: CardStateEnum = CardStateEnum.NORMAL;
  
  /**
   * 생성자
   * @param leaf 워크스페이스 리프
   * @param settingsManager 설정 관리자
   */
  constructor(
    leaf: WorkspaceLeaf,
    settingsManager: SettingsManager
  ) {
    super(leaf);
    this.settingsManager = settingsManager;
  }
  
  /**
   * 뷰 타입 가져오기
   * @returns 뷰 타입 ID
   */
  getViewType(): string {
    return CardView.VIEW_TYPE;
  }
  
  /**
   * 뷰 표시 텍스트 가져오기
   * @returns 뷰 표시 이름
   */
  getDisplayText(): string {
    return CardView.VIEW_DISPLAY_TEXT;
  }
  
  /**
   * 뷰 아이콘 가져오기
   * @returns 뷰 아이콘
   */
  getIcon(): string {
    return CardView.VIEW_ICON;
  }
  
  /**
   * 뷰 로드 시 호출되는 메서드
   * 뷰 요소 생성 및 초기화
   */
  async onload(): Promise<void> {
    try {
      // 기본 컨테이너 생성
      this.contentEl.empty();
      this.contentEl.addClass('card-view-container');
      
      // 카드 컨테이너 생성
      this.cardContainer = document.createElement('div');
      this.cardContainer.addClass('card-view-card-container');
      this.contentEl.appendChild(this.cardContainer);
      
      // 이벤트 리스너 등록
      this.registerEventListeners();
    } catch (error) {
      ErrorHandler.getInstance().handleError(
        '카드 뷰를 로드하는 중 오류가 발생했습니다.',
        error
      );
    }
  }
  
  /**
   * 뷰 언로드 시 호출되는 메서드
   * 리소스 정리
   */
  async onunload(): Promise<void> {
    try {
      // 이벤트 리스너 제거
      this.unregisterEventListeners();
      
      // 카드 요소 정리
      this.clearCard();
      
      // 컨테이너 비우기
      this.contentEl.empty();
    } catch (error) {
      ErrorHandler.getInstance().handleError(
        '카드 뷰를 언로드하는 중 오류가 발생했습니다.',
        error
      );
    }
  }
  
  /**
   * 이벤트 리스너 등록
   */
  private registerEventListeners(): void {
    try {
      // 설정 변경 이벤트 리스너
      this.settingsManager.registerChangeCallback(this.handleSettingsChanged.bind(this));
    } catch (error) {
      ErrorHandler.getInstance().handleError(
        '이벤트 리스너를 등록하는 중 오류가 발생했습니다.',
        error
      );
    }
  }
  
  /**
   * 이벤트 리스너 제거
   */
  private unregisterEventListeners(): void {
    try {
      // 설정 변경 이벤트 리스너 제거
      this.settingsManager.unregisterChangeCallback(this.handleSettingsChanged.bind(this));
    } catch (error) {
      ErrorHandler.getInstance().handleError(
        '이벤트 리스너를 제거하는 중 오류가 발생했습니다.',
        error
      );
    }
  }
  
  /**
   * 카드 설정
   * @param card 카드 모델
   */
  public setCard(card: Card): void {
    try {
      this.card = card;
      this.renderCard();
      
      // 뷰 제목 업데이트
      this.leaf.setViewState({
        type: this.getViewType(),
        state: { file: card.file.path }
      });
    } catch (error) {
      ErrorHandler.getInstance().handleError(
        '카드를 설정하는 중 오류가 발생했습니다.',
        error
      );
    }
  }
  
  /**
   * 파일로부터 카드 설정
   * @param file 파일
   */
  public async setCardFromFile(file: TFile): Promise<void> {
    try {
      // 파일 메타데이터 가져오기
      const cache = this.app.metadataCache.getFileCache(file);
      
      // 카드 모델 생성
      const card = new Card({
        id: file.path,
        file: file,
        fileName: file.basename,
        firstHeader: cache?.headings?.[0]?.heading || '',
        content: await this.app.vault.read(file),
        tags: cache?.tags?.map(tag => tag.tag.substring(1)) || [],
        created: file.stat.ctime,
        modified: file.stat.mtime,
        path: file.path
      });
      
      this.setCard(card);
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
  private renderCard(): void {
    try {
      if (!this.card) {
        this.showEmptyState();
        return;
      }
      
      // 기존 카드 요소 제거
      this.clearCard();
      
      // 카드 요소 생성
      this.cardElement = this.createCardElement(this.card, this.getRenderOptions());
      
      // 카드 컨테이너에 추가
      this.cardContainer.appendChild(this.cardElement);
    } catch (error) {
      ErrorHandler.getInstance().handleError(
        '카드를 렌더링하는 중 오류가 발생했습니다.',
        error
      );
    }
  }
  
  /**
   * 카드 요소 생성
   * @param cardModel 카드 모델
   * @param renderOptions 렌더링 옵션
   * @returns 카드 HTML 요소
   */
  private createCardElement(cardModel: Card, renderOptions: CardRenderOptions): HTMLElement {
    try {
      // 카드 요소 생성
      const cardEl = document.createElement('div');
      cardEl.className = 'card';
      cardEl.dataset.id = cardModel.id;
      cardEl.dataset.path = cardModel.path;
      cardEl.setAttribute('tabindex', '0');
      cardEl.setAttribute('role', 'article');
      cardEl.setAttribute('aria-label', cardModel.fileName);
      
      // 카드 상태 클래스 추가
      cardEl.classList.add(`card-state-${this.cardState}`);
      
      // 카드 헤더 생성
      const cardHeader = document.createElement('div');
      cardHeader.className = 'card-header';
      
      // 파일 이름 표시
      if (renderOptions.showFileName) {
        const fileNameEl = document.createElement('div');
        fileNameEl.className = 'card-filename';
        fileNameEl.textContent = cardModel.fileName;
        fileNameEl.style.fontSize = `${renderOptions.fileNameFontSize}px`;
        cardHeader.appendChild(fileNameEl);
      }
      
      // 첫 번째 헤더 표시
      if (renderOptions.showFirstHeader && cardModel.firstHeader) {
        const headerEl = document.createElement('div');
        headerEl.className = 'card-first-header';
        headerEl.textContent = cardModel.firstHeader;
        headerEl.style.fontSize = `${renderOptions.firstHeaderFontSize}px`;
        cardHeader.appendChild(headerEl);
      }
      
      cardEl.appendChild(cardHeader);
      
      // 카드 본문 생성
      if (renderOptions.showBody) {
        const cardBody = document.createElement('div');
        cardBody.className = 'card-body';
        
        let content = cardModel.content;
        
        // 본문 길이 제한
        if (renderOptions.bodyLengthLimit && content.length > renderOptions.bodyLength) {
          content = content.substring(0, renderOptions.bodyLength) + '...';
        }
        
        // HTML 렌더링 여부
        if (renderOptions.renderContentAsHtml) {
          // 마크다운을 HTML로 렌더링
          const contentEl = document.createElement('div');
          contentEl.className = 'card-content markdown-rendered';
          
          // Obsidian의 마크다운 렌더러 사용
          this.app.renderMarkdown(content, contentEl);
          
          cardBody.appendChild(contentEl);
        } else {
          // 일반 텍스트로 표시
          const contentEl = document.createElement('div');
          contentEl.className = 'card-content';
          contentEl.textContent = content;
          cardBody.appendChild(contentEl);
        }
        
        cardBody.style.fontSize = `${renderOptions.bodyFontSize}px`;
        cardEl.appendChild(cardBody);
      }
      
      // 카드 푸터 생성
      if (renderOptions.showTags && cardModel.tags.length > 0) {
        const cardFooter = document.createElement('div');
        cardFooter.className = 'card-footer';
        
        const tagsContainer = document.createElement('div');
        tagsContainer.className = 'card-tags';
        
        // 태그 요소 생성
        cardModel.tags.forEach(tag => {
          const tagEl = document.createElement('span');
          tagEl.className = 'card-tag';
          tagEl.textContent = `#${tag}`;
          tagEl.style.fontSize = `${renderOptions.tagsFontSize}px`;
          tagsContainer.appendChild(tagEl);
        });
        
        cardFooter.appendChild(tagsContainer);
        cardEl.appendChild(cardFooter);
      }
      
      // 카드 클릭 이벤트 설정
      cardEl.addEventListener('click', (event) => {
        this.handleCardClick(event, cardModel);
      });
      
      // 카드 컨텍스트 메뉴 이벤트 설정
      cardEl.addEventListener('contextmenu', (event) => {
        this.handleCardContextMenu(event, cardModel);
      });
      
      return cardEl;
    } catch (error) {
      ErrorHandler.getInstance().handleError(
        '카드 요소를 생성하는 중 오류가 발생했습니다.',
        error
      );
      
      // 오류 발생 시 기본 요소 반환
      const errorEl = document.createElement('div');
      errorEl.className = 'card card-error';
      errorEl.textContent = '카드를 로드할 수 없습니다.';
      return errorEl;
    }
  }
  
  /**
   * 카드 클릭 이벤트 핸들러
   * @param event 마우스 이벤트
   * @param cardModel 카드 모델
   */
  private handleCardClick(event: MouseEvent, cardModel: Card): void {
    try {
      // 파일 열기
      this.app.workspace.getLeaf().openFile(cardModel.file);
    } catch (error) {
      ErrorHandler.getInstance().handleError(
        '카드 클릭 이벤트를 처리하는 중 오류가 발생했습니다.',
        error
      );
    }
  }
  
  /**
   * 카드 컨텍스트 메뉴 이벤트 핸들러
   * @param event 마우스 이벤트
   * @param cardModel 카드 모델
   */
  private handleCardContextMenu(event: MouseEvent, cardModel: Card): void {
    try {
      // 컨텍스트 메뉴 표시
      const menu = this.app.getMenu();
      menu.addItem(item => {
        item.setTitle('편집')
          .setIcon('pencil')
          .onClick(() => {
            this.app.workspace.getLeaf('tab').openFile(cardModel.file, { mode: 'source' });
          });
      });
      
      menu.addItem(item => {
        item.setTitle('새 탭에서 열기')
          .setIcon('lucide-external-link')
          .onClick(() => {
            this.app.workspace.getLeaf('tab').openFile(cardModel.file);
          });
      });
      
      menu.showAtMouseEvent(event);
    } catch (error) {
      ErrorHandler.getInstance().handleError(
        '카드 컨텍스트 메뉴 이벤트를 처리하는 중 오류가 발생했습니다.',
        error
      );
    }
  }
  
  /**
   * 설정 변경 이벤트 핸들러
   * @param settings 설정 객체
   */
  private handleSettingsChanged(settings: any): void {
    try {
      // 카드 다시 렌더링
      this.renderCard();
    } catch (error) {
      ErrorHandler.getInstance().handleError(
        '설정 변경 이벤트를 처리하는 중 오류가 발생했습니다.',
        error
      );
    }
  }
  
  /**
   * 카드 요소 제거
   */
  private clearCard(): void {
    try {
      if (this.cardElement) {
        this.cardElement.remove();
        this.cardElement = null;
      }
      
      this.cardContainer.empty();
    } catch (error) {
      ErrorHandler.getInstance().handleError(
        '카드 요소를 제거하는 중 오류가 발생했습니다.',
        error
      );
    }
  }
  
  /**
   * 빈 상태 표시
   */
  private showEmptyState(): void {
    try {
      this.clearCard();
      
      const emptyStateEl = document.createElement('div');
      emptyStateEl.className = 'card-view-empty-state';
      
      const iconEl = document.createElement('div');
      iconEl.className = 'card-view-empty-icon';
      iconEl.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-file-question"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><path d="M10 10.3c.2-.4.5-.8.9-1a2.1 2.1 0 0 1 2.6.4c.3.4.5.8.5 1.3 0 1.3-2 2-2 2"/><path d="M12 17h.01"/></svg>`;
      
      const textEl = document.createElement('div');
      textEl.className = 'card-view-empty-text';
      textEl.textContent = '카드가 선택되지 않았습니다.';
      
      const subtextEl = document.createElement('div');
      subtextEl.className = 'card-view-empty-subtext';
      subtextEl.textContent = '카드 네비게이터에서 카드를 선택하세요.';
      
      emptyStateEl.appendChild(iconEl);
      emptyStateEl.appendChild(textEl);
      emptyStateEl.appendChild(subtextEl);
      
      this.cardContainer.appendChild(emptyStateEl);
    } catch (error) {
      ErrorHandler.getInstance().handleError(
        '빈 상태를 표시하는 중 오류가 발생했습니다.',
        error
      );
    }
  }
  
  /**
   * 렌더링 옵션 가져오기
   * @returns 카드 렌더링 옵션
   */
  private getRenderOptions(): CardRenderOptions {
    try {
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
    } catch (error) {
      ErrorHandler.getInstance().handleError(
        '렌더링 옵션을 가져오는 중 오류가 발생했습니다.',
        error
      );
      
      // 오류 발생 시 기본 옵션 반환
      return {
        showFileName: true,
        showFirstHeader: true,
        showBody: true,
        showTags: true,
        bodyLengthLimit: true,
        bodyLength: 150,
        renderContentAsHtml: true,
        fileNameFontSize: 16,
        firstHeaderFontSize: 18,
        bodyFontSize: 14,
        tagsFontSize: 12
      };
    }
  }
} 