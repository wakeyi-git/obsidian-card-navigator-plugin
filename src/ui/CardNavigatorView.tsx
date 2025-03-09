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
      const service = await createCardNavigatorService(this.app);
      
      // React 컴포넌트 렌더링
      const rootEl = containerEl.createDiv('card-navigator-root');
      this.reactComponent = createRoot(rootEl);
      this.reactComponent.render(
        <CardNavigatorComponent service={service} />
      );
      
      console.log('카드 네비게이터 뷰 열림');
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
      this.reRenderComponent(container as HTMLElement);
    });
  }
  
  private reRenderComponent(rootEl: HTMLElement) {
    rootEl.empty();
    
    createCardNavigatorService(this.app)
      .then(service => {
        rootEl.empty();
        this.reactComponent = createRoot(rootEl);
        this.reactComponent.render(
          <CardNavigatorComponent service={service} />
        );
      })
      .catch(error => {
        console.error('카드 네비게이터 재시도 오류:', error);
        this.handleRenderError(rootEl, error);
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
}

// 캐싱된 서비스 인스턴스
let cachedNavigatorService: ICardNavigatorService | null = null;
// 서비스 초기화 Promise
let serviceInitializationPromise: Promise<ICardNavigatorService> | null = null;

/**
 * 카드 네비게이터 서비스 생성 함수
 * 싱글톤 패턴으로 구현되어 있어 한 번 생성된 서비스는 재사용됩니다.
 * @param app Obsidian App 인스턴스
 * @returns 카드 네비게이터 서비스
 */
export const createCardNavigatorService = async (app: App): Promise<ICardNavigatorService> => {
  const initTimerId = TimerUtil.startTimer('[성능] CardNavigatorService 생성 시간');
  
  // 이미 초기화된 서비스가 있으면 재사용
  if (cachedNavigatorService) {
    console.log(`[CardNavigatorView] 캐시된 서비스 인스턴스 재사용`);
    TimerUtil.endTimer(initTimerId);
    return cachedNavigatorService;
  }
  
  // 초기화 중인 서비스가 있으면 해당 Promise 반환
  if (serviceInitializationPromise) {
    console.log(`[CardNavigatorView] 서비스 초기화 중... 기존 초기화 작업 대기`);
    return serviceInitializationPromise;
  }
  
  // 새로운 초기화 작업 시작
  serviceInitializationPromise = (async () => {
    try {
      // 인프라스트럭처 레이어 초기화
      const obsidianAdapter = new ObsidianAdapter(app);
      const cardFactory = new CardFactory(obsidianAdapter);
      const cardRepository = new CardRepositoryImpl(app);
      
      // 서비스 레이어 초기화
      console.log(`[CardNavigatorView] 서비스 초기화 시작`);
      
      // 플러그인 인스턴스 가져오기
      const plugin = (app as any).plugins.plugins['card-navigator'] as CardNavigatorPlugin;
      
      const navigatorService = new CardNavigatorService(app, cardRepository, plugin);
      
      await navigatorService.initialize();
      
      console.log(`[CardNavigatorView] 서비스 초기화 완료`);
      
      // 서비스 인스턴스 캐싱
      cachedNavigatorService = navigatorService;
      
      TimerUtil.endTimer(initTimerId);
      return navigatorService;
    } catch (error) {
      console.error(`[CardNavigatorView] 서비스 초기화 실패:`, error);
      serviceInitializationPromise = null;
      throw error;
    }
  })();
  
  return serviceInitializationPromise;
}; 