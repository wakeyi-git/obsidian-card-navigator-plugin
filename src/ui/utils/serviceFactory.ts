import { App } from 'obsidian';
import { CardNavigatorService, ICardNavigatorService } from '../../application/CardNavigatorService';
import { CardRepositoryImpl } from '../../infrastructure/CardRepositoryImpl';
import { ObsidianAdapter } from '../../infrastructure/ObsidianAdapter';
import { TimerUtil } from '../../infrastructure/TimerUtil';
import CardNavigatorPlugin from '../../main';
import { CardService } from '../../application/CardService';
import { CardSetService } from '../../application/CardSetService';
import { LayoutService } from '../../application/LayoutService';
import { SearchService } from '../../application/SearchService';
import { InteractionService } from '../../application/InteractionService';

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
      const cardRepository = new CardRepositoryImpl(app);
      
      // 서비스 레이어 초기화
      console.log(`[CardNavigatorView] 서비스 초기화 시작`);
      
      // 플러그인 인스턴스 가져오기
      const plugin = (app as any).plugins.plugins['card-navigator'] as CardNavigatorPlugin;
      
      // 필요한 서비스 인스턴스 생성
      const cardService = new CardService(app, cardRepository);
      const cardSetService = new CardSetService(app, cardService);
      const layoutService = new LayoutService();
      const searchService = new SearchService(app, cardService);
      const interactionService = new InteractionService(app, cardService);
      
      // CardNavigatorService 생성 시 모든 필요한 매개변수 전달
      const navigatorService = new CardNavigatorService(
        app,
        cardService,
        cardSetService,
        layoutService,
        searchService,
        interactionService
      );
      
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