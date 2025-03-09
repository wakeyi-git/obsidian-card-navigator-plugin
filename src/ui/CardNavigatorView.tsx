import { ItemView, WorkspaceLeaf, App } from 'obsidian';
import { Root, createRoot } from 'react-dom/client';
import { CardNavigatorService, ICardNavigatorService } from '../application/CardNavigatorService';
import { CardRepositoryImpl } from '../infrastructure/CardRepositoryImpl';
import { ObsidianAdapter } from '../infrastructure/ObsidianAdapter';
import { CardFactory } from '../domain/card/CardFactory';
import { TimerUtil } from '../infrastructure/TimerUtil';
import { VIEW_TYPE_CARD_NAVIGATOR } from '../main';
import { CardNavigatorComponent } from './components/CardNavigatorComponent';
import CardNavigatorPlugin from '../main';

/**
 * 카드 네비게이터 뷰 클래스
 * Obsidian의 ItemView를 확장하여 카드 네비게이터 UI를 제공합니다.
 */
export class CardNavigatorView extends ItemView {
  private reactComponent: Root | null = null;
  private service: ICardNavigatorService | null = null;
  
  constructor(leaf: WorkspaceLeaf) {
    super(leaf);
  }
  
  getViewType(): string {
    return VIEW_TYPE_CARD_NAVIGATOR;
  }
  
  getDisplayText(): string {
    return '카드 네비게이터';
  }
  
  getIcon(): string {
    return 'layout-grid';
  }
  
  async onOpen() {
    const { containerEl } = this;
    
    try {
      // 컨테이너 초기화
      containerEl.empty();
      containerEl.addClass('card-navigator-container');
      
      // 서비스 생성
      this.service = await createCardNavigatorService(this.app);
      
      // React 컴포넌트 렌더링
      const rootEl = containerEl.createDiv('card-navigator-root');
      this.reactComponent = createRoot(rootEl);
      this.renderComponent();
      
      // 파일 열림 이벤트 리스너 등록
      this.registerEvent(
        this.app.workspace.on('file-open', async () => {
          // 서비스 업데이트 후 컴포넌트 다시 렌더링
          await this.updateService();
          this.renderComponent();
        })
      );
    } catch (error) {
      console.error('카드 네비게이터 뷰 초기화 오류:', error);
      this.handleRenderError(containerEl, error);
    }
  }
  
  private handleRenderError(container: Element, error: unknown) {
    container.empty();
    
    const errorContainer = container.createDiv('card-navigator-error');
    errorContainer.createEl('h2', { text: '카드 네비게이터 오류' });
    
    const errorMessage = errorContainer.createEl('div', { cls: 'card-navigator-error-message' });
    errorMessage.createEl('p', { text: '카드 네비게이터를 로드하는 중 오류가 발생했습니다:' });
    
    const errorDetails = errorMessage.createEl('pre');
    errorDetails.createEl('code', {
      text: error instanceof Error 
        ? `${error.name}: ${error.message}\n\n${error.stack || '스택 정보 없음'}`
        : String(error)
    });
    
    const retryButton = errorContainer.createEl('button', {
      text: '다시 시도',
      cls: 'mod-cta'
    });
    
    retryButton.addEventListener('click', () => {
      this.reInitialize();
    });
  }
  
  private renderComponent() {
    if (!this.reactComponent || !this.service) return;
    
    // 컴포넌트 렌더링
    this.reactComponent.render(
      <CardNavigatorComponent service={this.service} />
    );
  }
  
  private reInitialize() {
    const { containerEl } = this;
    containerEl.empty();
    
    createCardNavigatorService(this.app)
      .then(service => {
        this.service = service;
        const rootEl = containerEl.createDiv('card-navigator-root');
        this.reactComponent = createRoot(rootEl);
        this.renderComponent();
      })
      .catch(error => {
        console.error('카드 네비게이터 재시도 오류:', error);
        this.handleRenderError(containerEl, error);
      });
  }
  
  async onClose() {
    // React 컴포넌트 언마운트
    if (this.reactComponent) {
      this.reactComponent.unmount();
      this.reactComponent = null;
    }
    
    console.log('카드 네비게이터 뷰 닫힘');
  }
  
  // 서비스 인스턴스 업데이트 메서드
  private async updateService() {
    try {
      // 서비스 다시 생성
      this.service = await createCardNavigatorService(this.app);
    } catch (error) {
      console.error('[CardNavigatorView] 서비스 업데이트 오류:', error);
    }
  }
}

// 캐싱된 서비스 인스턴스
let cachedNavigatorService: ICardNavigatorService | null = null;

/**
 * 카드 네비게이터 서비스 생성 함수
 * @param app Obsidian App 인스턴스
 * @returns 카드 네비게이터 서비스
 */
export const createCardNavigatorService = async (app: App): Promise<ICardNavigatorService> => {
  try {
    // 캐시된 서비스 인스턴스가 있으면 재사용
    if (cachedNavigatorService) {
      return cachedNavigatorService;
    }
    
    // 플러그인 인스턴스 가져오기 시도
    // @ts-ignore - app.plugins.plugins는 타입 정의에 없을 수 있음
    const pluginInstance = app.plugins.plugins['card-navigator'];
    
    if (pluginInstance && pluginInstance.getCardNavigatorService && pluginInstance.getCardNavigatorService()) {
      const pluginService = pluginInstance.getCardNavigatorService();
      if (pluginService) {
        // 타입 단언을 사용하여 null이 아님을 명시
        cachedNavigatorService = pluginService as ICardNavigatorService;
        return cachedNavigatorService;
      }
    }
    
    // 새 서비스 인스턴스 생성
    const obsidianAdapter = new ObsidianAdapter(app);
    const cardFactory = new CardFactory(obsidianAdapter);
    const cardRepository = new CardRepositoryImpl(obsidianAdapter, cardFactory);
    
    // 플러그인 인스턴스를 찾지 못한 경우 임시 플러그인 객체 생성
    const plugin = pluginInstance || {
      settings: {
        defaultCardSetSource: 'folder',
        defaultLayout: 'grid',
        cardWidth: 300,
        cardHeight: 200,
        priorityTags: [],
        priorityFolders: [],
        includeSubfolders: true,
        defaultFolderCardSet: '',
        defaultTagCardSet: '',
        isCardSetFixed: false
      },
      saveSettings: async () => {}
    };
    
    const service = new CardNavigatorService(app, cardRepository, plugin);
    await service.initialize();
    
    // 캐시에 저장
    cachedNavigatorService = service;
    return service;
  } catch (error) {
    console.error('서비스 생성 오류:', error);
    throw error;
  }
}; 