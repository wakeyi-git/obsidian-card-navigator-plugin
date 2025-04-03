import { IUseCase } from './IUseCase';
import { ICardSetService } from '../../domain/services/ICardSetService';
import { ILayoutService } from '../../domain/services/ILayoutService';
import { IFocusManager } from '../../domain/services/IFocusManager';
import { IActiveFileWatcher } from '../../domain/services/IActiveFileWatcher';
import { TFile } from 'obsidian';
import { CardSetType } from '../../domain/models/CardSet';
import { DEFAULT_SORT_CONFIG } from '../../domain/models/SortConfig';
import { IErrorHandler } from '@/domain/interfaces/infrastructure/IErrorHandler';
import { ILoggingService } from '@/domain/interfaces/infrastructure/ILoggingService';
import { IPerformanceMonitor } from '@/domain/interfaces/infrastructure/IPerformanceMonitor';
import { IAnalyticsService } from '@/domain/interfaces/infrastructure/IAnalyticsService';
import { Container } from '@/infrastructure/di/Container';

/**
 * 카드 내비게이터를 여는 유즈케이스
 */
export class OpenCardNavigatorUseCase implements IUseCase<void, void> {
  private static instance: OpenCardNavigatorUseCase;

  private constructor(
    private readonly cardSetService: ICardSetService,
    private readonly layoutService: ILayoutService,
    private readonly focusManager: IFocusManager,
    private readonly activeFileWatcher: IActiveFileWatcher,
    private readonly errorHandler: IErrorHandler,
    private readonly loggingService: ILoggingService,
    private readonly performanceMonitor: IPerformanceMonitor,
    private readonly analyticsService: IAnalyticsService
  ) {}

  public static getInstance(): OpenCardNavigatorUseCase {
    if (!OpenCardNavigatorUseCase.instance) {
      const container = Container.getInstance();
      OpenCardNavigatorUseCase.instance = new OpenCardNavigatorUseCase(
        container.resolve<ICardSetService>('ICardSetService'),
        container.resolve<ILayoutService>('ILayoutService'),
        container.resolve<IFocusManager>('IFocusManager'),
        container.resolve<IActiveFileWatcher>('IActiveFileWatcher'),
        container.resolve<IErrorHandler>('IErrorHandler'),
        container.resolve<ILoggingService>('ILoggingService'),
        container.resolve<IPerformanceMonitor>('IPerformanceMonitor'),
        container.resolve<IAnalyticsService>('IAnalyticsService')
      );
    }
    return OpenCardNavigatorUseCase.instance;
  }

  async execute(): Promise<void> {
    const startTime = performance.now();
    this.loggingService.info('카드 내비게이터 열기 시작');

    try {
      // 1. 활성 파일 감지
      this.loggingService.debug('활성 파일 감지 시작');
      const activeFile = this.activeFileWatcher.getActiveFile();
      if (!activeFile) {
        this.loggingService.warn('활성 파일이 없음');
        // 활성 파일이 없을 때는 루트 폴더의 카드셋을 생성
        const rootFolder = { path: '/' };
        this.loggingService.debug('루트 폴더 카드셋 생성 시작');
        const cardSet = await this.cardSetService.createCardSet(
          CardSetType.FOLDER,
          rootFolder.path,
          {
            includeSubfolders: true,
            sortConfig: DEFAULT_SORT_CONFIG
          }
        );
        this.loggingService.debug('루트 폴더 카드셋 생성 완료', { 
          cardSetId: cardSet.id,
          cardCount: cardSet.cards.length 
        });

        // 카드셋 정렬
        this.loggingService.debug('카드셋 정렬 시작');
        await this.cardSetService.sortCardSet(cardSet, DEFAULT_SORT_CONFIG);
        this.loggingService.debug('카드셋 정렬 완료');

        // 레이아웃 계산
        this.loggingService.debug('레이아웃 계산 시작');
        const containerWidth = window.innerWidth;
        const containerHeight = window.innerHeight;
        const layout = this.layoutService.calculateLayout(
          cardSet,
          containerWidth,
          containerHeight
        );
        this.loggingService.debug('레이아웃 계산 완료', {
          containerWidth,
          containerHeight,
          layoutPositions: layout.cardPositions.length
        });

        const duration = performance.now() - startTime;
        this.performanceMonitor.startMeasure('openCardNavigator');
        this.performanceMonitor.endMeasure('openCardNavigator');
        this.analyticsService.trackEvent('card_navigator_opened', {
          duration,
          cardCount: cardSet.cards.length,
          activeFile: null
        });

        this.loggingService.info('카드 내비게이터 열기 완료 (활성 파일 없음)', { duration });
        return;
      }
      this.loggingService.debug('활성 파일 감지 완료', { filePath: activeFile.path });

      // 2. 활성 폴더 식별
      this.loggingService.debug('활성 폴더 식별 시작');
      const activeFolder = this.getActiveFolder(activeFile);
      this.loggingService.debug('활성 폴더 식별 완료', { folderPath: activeFolder.path });

      // 3. 카드셋 생성
      this.loggingService.debug('카드셋 생성 시작');
      const cardSet = await this.cardSetService.createCardSet(
        CardSetType.FOLDER,
        activeFolder.path,
        {
          includeSubfolders: false,
          sortConfig: DEFAULT_SORT_CONFIG
        }
      );
      this.loggingService.debug('카드셋 생성 완료', { 
        cardSetId: cardSet.id,
        cardCount: cardSet.cards.length 
      });

      // 4. 카드셋 정렬
      this.loggingService.debug('카드셋 정렬 시작');
      await this.cardSetService.sortCardSet(cardSet, DEFAULT_SORT_CONFIG);
      this.loggingService.debug('카드셋 정렬 완료');

      // 5. 레이아웃 계산
      this.loggingService.debug('레이아웃 계산 시작');
      const containerWidth = window.innerWidth;
      const containerHeight = window.innerHeight;
      const layout = this.layoutService.calculateLayout(
        cardSet,
        containerWidth,
        containerHeight
      );
      this.loggingService.debug('레이아웃 계산 완료', {
        containerWidth,
        containerHeight,
        layoutPositions: layout.cardPositions.length
      });

      // 6. 활성 카드 포커싱
      this.loggingService.debug('활성 카드 포커싱 시작');
      const activeCard = cardSet.cards.find(card => card.file.path === activeFile.path);
      if (activeCard) {
        this.focusManager.focusByCard(activeCard);
        this.loggingService.debug('활성 카드 포커싱 완료', { cardId: activeCard.id });
      } else {
        this.loggingService.warn('활성 카드를 찾을 수 없음');
      }

      const duration = performance.now() - startTime;
      this.performanceMonitor.startMeasure('openCardNavigator');
      this.performanceMonitor.endMeasure('openCardNavigator');
      this.analyticsService.trackEvent('card_navigator_opened', {
        duration,
        cardCount: cardSet.cards.length,
        activeFile: activeFile.path
      });

      this.loggingService.info('카드 내비게이터 열기 완료', { duration });
    } catch (error) {
      this.loggingService.error('카드 내비게이터 열기 실패', { error });
      this.errorHandler.handleError(error, '카드 내비게이터 열기 중 오류 발생');
      throw error;
    }
  }

  private getActiveFolder(file: TFile): { path: string } {
    return {
      path: file.parent?.path || '/'
    };
  }
} 