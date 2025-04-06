import { IUseCase } from './IUseCase';
import { ICardSetService } from '../../domain/services/ICardSetService';
import { ILayoutService } from '../../domain/services/ILayoutService';
import { ICardSet } from '../../domain/models/CardSet';
import { CardSetType } from '../../domain/models/CardSetConfig';
import { ISortConfig } from '../../domain/models/SortConfig';
import { IErrorHandler } from '@/domain/infrastructure/IErrorHandler';
import { ILoggingService } from '@/domain/infrastructure/ILoggingService';
import { IPerformanceMonitor } from '@/domain/infrastructure/IPerformanceMonitor';
import { IAnalyticsService } from '@/domain/infrastructure/IAnalyticsService';
import { Container } from '@/infrastructure/di/Container';
import { FilterType } from '../../domain/models/FilterConfig';
import { SortType, SortOrder } from '../../domain/models/SortConfig';
import { SearchScope } from '../../domain/models/SearchResult';
import { DomainEvent } from '@/domain/events/DomainEvent';
import { DomainEventType } from '@/domain/events/DomainEventType';
import { IEventDispatcher } from '@/domain/infrastructure/IEventDispatcher';

/**
 * 카드셋 생성 유스케이스 입력
 */
export interface CreateCardSetInput {
  /** 카드셋 타입 */
  type: CardSetType;
  /** 카드셋 기준 (폴더 경로 또는 태그) */
  criteria: string;
  /** 하위 폴더 포함 여부 */
  includeSubfolders?: boolean;
  /** 정렬 설정 */
  sortConfig?: ISortConfig;
  /** 컨테이너 너비 */
  containerWidth: number;
  /** 컨테이너 높이 */
  containerHeight: number;
  /** 링크 레벨 (1: 직접 링크, 2: 2단계 링크, ...) */
  linkLevel?: number;
  /** 백링크 포함 여부 */
  includeBacklinks?: boolean;
  /** 아웃고잉 링크 포함 여부 */
  includeOutgoingLinks?: boolean;
  /** 트랜잭션 ID (중복 요청 식별용) */
  transactionId?: string;
  /** 현재 파일 경로 */
  currentFilePath?: string;
}

/**
 * 카드셋 생성 유스케이스
 */
export class CreateCardSetUseCase implements IUseCase<CreateCardSetInput, ICardSet> {
  private static instance: CreateCardSetUseCase;

  private constructor(
    private readonly cardSetService: ICardSetService,
    private readonly layoutService: ILayoutService,
    private readonly errorHandler: IErrorHandler,
    private readonly loggingService: ILoggingService,
    private readonly performanceMonitor: IPerformanceMonitor,
    private readonly analyticsService: IAnalyticsService,
    private readonly eventDispatcher: IEventDispatcher
  ) {}

  static getInstance(): CreateCardSetUseCase {
    if (!CreateCardSetUseCase.instance) {
      const container = Container.getInstance();
      CreateCardSetUseCase.instance = new CreateCardSetUseCase(
        container.resolve('ICardSetService'),
        container.resolve('ILayoutService'),
        container.resolve('IErrorHandler'),
        container.resolve('ILoggingService'),
        container.resolve('IPerformanceMonitor'),
        container.resolve('IAnalyticsService'),
        container.resolve('IEventDispatcher')
      );
    }
    return CreateCardSetUseCase.instance;
  }

  /**
   * 카드셋 생성
   * @param input 입력
   */
  async execute(input: CreateCardSetInput): Promise<ICardSet> {
    const timer = this.performanceMonitor.startTimer('CreateCardSetUseCase.execute');
    
    try {
      this.loggingService.debug('카드셋 생성 시작', { 
        type: input.type, 
        criteria: input.criteria,
        includeSubfolders: input.includeSubfolders,
        containerWidth: input.containerWidth,
        containerHeight: input.containerHeight,
        transactionId: input.transactionId || 'none',
        currentFilePath: input.currentFilePath || ''
      });

      // 1. 카드셋 생성
      this.loggingService.debug('카드셋 서비스 호출 시작');
      const cardSet = await this.cardSetService.createCardSet(
        input.type,
        {
          type: input.type,
          folder: {
            path: input.criteria,
            includeSubfolders: input.includeSubfolders ?? false
          },
          filterConfig: {
            type: FilterType.FOLDER,
            criteria: input.criteria,
            includeSubfolders: input.includeSubfolders ?? false,
            includeSubtags: false,
            linkDepth: 1,
            priorityTags: [],
            priorityFolders: [],
            tags: [],
            folders: []
          },
          sortConfig: {
            type: SortType.NAME,
            order: SortOrder.ASC,
            field: 'fileName',
            direction: 'asc'
          },
          searchConfig: {
            scope: SearchScope.ALL,
            caseSensitive: false,
            useRegex: false,
            fields: {
              filename: true,
              content: true,
              tags: true,
              frontmatter: true
            },
            realtimeSearch: true,
            resultLimit: 100,
            currentFilePath: input.currentFilePath || ''
          }
        }
      );
      this.loggingService.debug('카드셋 서비스 호출 완료', {
        cardSetId: cardSet.id,
        cardCount: cardSet.cards.length
      });

      // 2. 정렬 적용
      if (input.sortConfig) {
        this.loggingService.debug('카드셋 정렬 시작');
        await this.cardSetService.sortCards(cardSet, input.sortConfig);
        this.loggingService.debug('카드셋 정렬 완료');
      }

      // 3. 레이아웃 계산 및 적용
      this.loggingService.debug('레이아웃 계산 시작');
      const layoutResult = this.layoutService.calculateLayout(
        cardSet,
        input.containerWidth,
        input.containerHeight
      );
      this.loggingService.debug('레이아웃 계산 완료', {
        layoutPositions: layoutResult.cardPositions.size
      });

      // 레이아웃 결과 적용
      this.loggingService.debug('레이아웃 결과 적용 시작');
      layoutResult.cardPositions.forEach((position, cardId) => {
        this.layoutService.updateCardPosition(cardId, position.x, position.y);
      });
      this.loggingService.debug('레이아웃 결과 적용 완료');

      // 4. 이벤트 발송
      const event = new DomainEvent(
        DomainEventType.CARDSET_CREATED,
        {
          cardSet
        }
      );
      this.eventDispatcher.dispatch(event);

      this.analyticsService.trackEvent('card_set_created', {
        type: input.type,
        criteria: input.criteria,
        includeSubfolders: input.includeSubfolders,
        containerWidth: input.containerWidth,
        containerHeight: input.containerHeight,
        cardCount: cardSet.cards.length
      });

      this.loggingService.info('카드셋 생성 완료', { 
        cardSetId: cardSet.id,
        cardCount: cardSet.cards.length 
      });
      return cardSet;
    } catch (error) {
      this.loggingService.error('카드셋 생성 실패', { 
        error,
        type: input.type,
        criteria: input.criteria
      });
      this.errorHandler.handleError(error as Error, 'CreateCardSetUseCase.execute');
      throw error;
    } finally {
      timer.stop();
    }
  }
} 