import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { ItemView, WorkspaceLeaf, App } from 'obsidian';
import { ICardNavigatorService } from '../application/CardNavigatorService';
import { CardNavigatorService } from '../application/CardNavigatorService';
import { CardRepositoryImpl } from '../infrastructure/CardRepositoryImpl';
import { ObsidianAdapter } from '../infrastructure/ObsidianAdapter';
import { CardFactory } from '../domain/card/CardFactory';
import { TimerUtil } from '../infrastructure/TimerUtil';
import { VIEW_TYPE_CARD_NAVIGATOR } from '../main';
import { CardNavigatorComponent } from './components/CardNavigatorComponent';

/**
 * 카드 네비게이터 뷰 클래스
 * Obsidian의 ItemView를 확장하여 구현
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
    console.log('[CardNavigatorView] onOpen 시작');
    
    // 컨테이너 생성
    const container = this.containerEl.children[1];
    container.empty();
    container.addClass('card-navigator-container-view');
    
    try {
      // React 루트 생성
      const root = createRoot(container);
      console.log('[CardNavigatorView] React 루트 생성 완료, 렌더링 시작');
      
      // React 컴포넌트 렌더링
      root.render(
        <React.StrictMode>
          <CardNavigatorComponent app={this.app} />
        </React.StrictMode>
      );
      
      console.log('[CardNavigatorView] 컴포넌트 렌더링 완료');
      
      // 렌더링된 컴포넌트 저장
      this.reactComponent = root;
    } catch (error) {
      this.handleRenderError(container, error);
    }
  }
  
  /**
   * 렌더링 오류 처리
   * @param container 컨테이너 요소
   * @param error 오류 객체
   */
  private handleRenderError(container: Element, error: unknown) {
    console.error('[CardNavigatorView] 렌더링 오류:', error);
    
    // 오류 메시지 표시
    container.empty();
    const errorEl = container.createDiv({ cls: 'card-navigator-error' });
    errorEl.createDiv({ text: '카드 네비게이터를 렌더링하는 중 오류가 발생했습니다.' });
    errorEl.createDiv({ text: error instanceof Error ? error.message : String(error) });
    
    // 스택 트레이스 표시
    if (error instanceof Error && error.stack) {
      const stackEl = errorEl.createDiv({ cls: 'card-navigator-error-stack' });
      stackEl.createEl('pre', { text: error.stack });
    }
  }
  
  /**
   * 컴포넌트 다시 렌더링
   * @param rootEl 루트 요소
   */
  private reRenderComponent(rootEl: HTMLElement) {
    try {
      // React 루트 생성
      const root = createRoot(rootEl);
      
      // React 컴포넌트 렌더링
      root.render(
        <React.StrictMode>
          <CardNavigatorComponent app={this.app} />
        </React.StrictMode>
      );
      
      // 렌더링된 컴포넌트 저장
      this.reactComponent = root;
    } catch (error) {
      this.handleRenderError(rootEl, error);
    }
  }
  
  async onClose() {
    // 필요한 정리 작업 수행
    console.log('[CardNavigatorView] onClose 호출됨');
    
    // React 컴포넌트 언마운트
    if (this.reactComponent) {
      try {
        this.reactComponent.unmount();
        this.reactComponent = null;
      } catch (error) {
        console.error('[CardNavigatorView] 컴포넌트 언마운트 중 오류:', error);
      }
    }
    
    return Promise.resolve();
  }
}

// 카드 네비게이터 서비스 인스턴스 캐싱
let cachedNavigatorService: ICardNavigatorService | null = null;
let serviceInitializationPromise: Promise<ICardNavigatorService> | null = null;

/**
 * 카드 네비게이터 서비스 생성 함수
 * @param app Obsidian 앱 인스턴스
 * @returns 카드 네비게이터 서비스 인스턴스
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
      const cardFactory = new CardFactory();
      const cardRepository = new CardRepositoryImpl(obsidianAdapter, cardFactory);
      
      // 서비스 레이어 초기화
      console.log(`[CardNavigatorView] 서비스 초기화 시작`);
      const navigatorService = new CardNavigatorService(app, cardRepository, 'folder');
      
      await navigatorService.initialize();
      
      console.log(`[CardNavigatorView] 서비스 초기화 완료`);
      
      // 서비스 인스턴스 캐싱
      cachedNavigatorService = navigatorService;
      
      return navigatorService;
    } catch (initError: unknown) {
      console.error(`[CardNavigatorView] 서비스 초기화 오류:`, initError);
      throw new Error(`서비스 초기화 중 오류가 발생했습니다: ${initError instanceof Error ? initError.message : String(initError)}`);
    } finally {
      // 초기화 작업 완료 후 Promise 참조 제거
      serviceInitializationPromise = null;
      TimerUtil.endTimer(initTimerId);
    }
  })();
  
  return serviceInitializationPromise;
}; 