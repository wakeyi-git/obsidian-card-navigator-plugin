import { App, TFile } from 'obsidian';
import { ICardSetService } from '../../domain/services/ICardSetService';
import { ICard } from '../../domain/models/Card';
import { ICardSet, DEFAULT_CARD_SET_CONFIG } from '../../domain/models/CardSet';
import { CardSetType, LinkType } from '../../domain/models/CardSet';
import { ISortConfig } from '../../domain/models/SortConfig';
import { IErrorHandler } from '@/domain/infrastructure/IErrorHandler';
import { ILoggingService } from '@/domain/infrastructure/ILoggingService';
import { IPerformanceMonitor } from '@/domain/infrastructure/IPerformanceMonitor';
import { IAnalyticsService } from '@/domain/infrastructure/IAnalyticsService';
import { IEventDispatcher } from '@/domain/infrastructure/IEventDispatcher';
import { Container } from '@/infrastructure/di/Container';
import { CardSetError } from '../../domain/errors/CardSetError';
import { ICardService } from '../../domain/services/ICardService';

/**
 * 카드셋 서비스 구현체
 */
export class CardSetService implements ICardSetService {
  private static instance: CardSetService;
  private cardSets: Map<string, ICardSet> = new Map();
  private eventSubscribers: Set<(event: any) => void> = new Set();

  private constructor(
    private readonly app: App,
    private readonly cardService: ICardService,
    private readonly errorHandler: IErrorHandler,
    private readonly loggingService: ILoggingService,
    private readonly performanceMonitor: IPerformanceMonitor,
    private readonly analyticsService: IAnalyticsService,
    private readonly eventDispatcher: IEventDispatcher
  ) {}

  static getInstance(): CardSetService {
    if (!CardSetService.instance) {
      const container = Container.getInstance();
      CardSetService.instance = new CardSetService(
        container.resolve('App'),
        container.resolve('ICardService'),
        container.resolve('IErrorHandler'),
        container.resolve('ILoggingService'),
        container.resolve('IPerformanceMonitor'),
        container.resolve('IAnalyticsService'),
        container.resolve('IEventDispatcher')
      );
    }
    return CardSetService.instance;
  }

  /**
   * 초기화
   */
  initialize(): void {
    // 초기화 로직
  }

  /**
   * 정리
   */
  cleanup(): void {
    this.cardSets.clear();
    this.eventSubscribers.clear();
  }

  /**
   * 카드셋 생성
   * @param type 카드셋 타입
   * @param criteria 기준 (폴더 경로 또는 태그)
   * @param options 옵션
   */
  async createCardSet(
    type: CardSetType,
    criteria: string,
    options?: {
      includeSubfolders?: boolean;
      sortConfig?: ISortConfig;
      linkType?: LinkType;
      linkLevel?: number;
      includeBacklinks?: boolean;
      includeOutgoingLinks?: boolean;
    }
  ): Promise<ICardSet> {
    try {
      this.performanceMonitor.startMeasure('CardSetService.createCardSet');
      this.loggingService.debug('카드셋 생성 시작', { type, criteria });

      // 카드 로드
      let cards: ICard[] = [];
      switch (type) {
        case CardSetType.FOLDER:
          cards = await this.loadCardsFromFolder(criteria, options?.includeSubfolders);
          break;
        case CardSetType.TAG:
          cards = await this.loadCardsFromTag(criteria);
          break;
        case CardSetType.LINK:
          // 링크 관련 옵션 사용
          const linkOptions = {
            type: options?.linkType || LinkType.BACKLINK,
            level: options?.linkLevel || 1,
            includeBacklinks: options?.includeBacklinks !== undefined ? options.includeBacklinks : true,
            includeOutgoingLinks: options?.includeOutgoingLinks !== undefined ? options.includeOutgoingLinks : false
          };
          
          this.loggingService.debug('링크 카드셋 옵션', linkOptions);
          cards = await this.loadCardsFromLink(criteria, linkOptions);
          break;
      }

      // 정렬 적용
      if (options?.sortConfig) {
        cards = await this.sortCards(cards, options.sortConfig);
      }

      // 카드셋 생성
      const cardSet: ICardSet = {
        id: crypto.randomUUID(),
        type,
        criteria,
        config: DEFAULT_CARD_SET_CONFIG,
        cards,
        options: options || {},
        validate: function() {
          return this.id !== '' && this.cards.length >= 0;
        }
      };

      this.cardSets.set(cardSet.id, cardSet);
      this.notifyEvent('create', cardSet.id, cardSet);

      this.loggingService.info('카드셋 생성 완료', { cardSetId: cardSet.id, cardCount: cards.length });
      return cardSet;
    } catch (error) {
      this.loggingService.error('카드셋 생성 실패', { error, type, criteria });
      throw new CardSetError('카드셋 생성 중 오류가 발생했습니다.');
    } finally {
      this.performanceMonitor.endMeasure('CardSetService.createCardSet');
    }
  }

  private async loadCardsFromFolder(folderPath: string, includeSubfolders: boolean = false): Promise<ICard[]> {
    try {
      this.performanceMonitor.startMeasure('CardSetService.loadCardsFromFolder');
      this.loggingService.debug('폴더에서 카드 로드 시작', { folderPath, includeSubfolders });

      const files = this.app.vault.getFiles();
      this.loggingService.debug('볼트에서 파일 가져옴', { totalFiles: files.length });
      
      const cards: ICard[] = [];
      const BATCH_SIZE = 5; // 한 번에 처리할 파일 수

      // 파일 필터링
      const targetFiles = files.filter(file => {
        // 루트 폴더인 경우
        if (folderPath === '/') {
          return file.parent === null || file.parent.path === '/';
        }

        // 폴더 경로에 슬래시를 추가하여 정확한 경로 검사
        const folderPathWithSlash = folderPath.endsWith('/') ? folderPath : folderPath + '/';
        
        // 파일이 해당 폴더 내에 있는지 확인
        const isInFolder = file.path.startsWith(folderPathWithSlash) || file.path === folderPath;
        
        // 하위 폴더 포함 옵션에 따른 처리
        if (!includeSubfolders) {
          // 하위 폴더 미포함 시 직접적인 자식 파일만 포함
          return isInFolder && (file.parent?.path === folderPath);
        }
        
        // 하위 폴더 포함 옵션이 활성화된 경우 모든 하위 파일 포함
        return isInFolder;
      });
      
      this.loggingService.debug('필터링된 파일', { 
        targetFilesCount: targetFiles.length,
        folderPath,
        includeSubfolders
      });

      if (targetFiles.length === 0) {
        this.loggingService.warn('폴더에 파일이 없음', { folderPath });
        return [];
      }

      // 배치 처리
      for (let i = 0; i < targetFiles.length; i += BATCH_SIZE) {
        const batch = targetFiles.slice(i, i + BATCH_SIZE);
        this.loggingService.debug(`배치 처리 중 (${i+1}-${Math.min(i+BATCH_SIZE, targetFiles.length)}/${targetFiles.length})`);
        
        const batchPromises = batch.map(file => this.cardService.createFromFile(file));
        const batchResults = await Promise.all(batchPromises);
        const validCards = batchResults.filter((card): card is ICard => card !== null);
        
        this.loggingService.debug('배치 결과', { 
          batchSize: batch.length, 
          validCardsCount: validCards.length 
        });
        
        cards.push(...validCards);
      }

      this.loggingService.info('폴더에서 카드 로드 완료', { folderPath, cardCount: cards.length });
      return cards;
    } catch (error) {
      this.loggingService.error('폴더에서 카드 로드 실패', { error, folderPath });
      throw new CardSetError(`폴더에서 카드 로드 중 오류가 발생했습니다: ${error.message}`);
    } finally {
      this.performanceMonitor.endMeasure('CardSetService.loadCardsFromFolder');
    }
  }

  private async loadCardsFromTag(tag: string): Promise<ICard[]> {
    try {
      this.performanceMonitor.startMeasure('CardSetService.loadCardsFromTag');
      this.loggingService.debug('태그에서 카드 로드 시작', { tag });

      const files = this.app.vault.getFiles();
      const cards: ICard[] = [];
      const tagWithoutHash = tag.startsWith('#') ? tag.substring(1) : tag;

      for (const file of files) {
        let hasTag = false;
        
        // 메타데이터 캐시를 통해 태그 확인
        const cache = this.app.metadataCache.getFileCache(file);
        if (cache) {
          // 1. 인라인 태그 확인 (예: #태그)
          if (cache.tags) {
            for (const tagObj of cache.tags) {
              // #tag 형식으로 저장된 태그를 검사
              if (tagObj.tag === tag || tagObj.tag === '#' + tagWithoutHash) {
                hasTag = true;
                break;
              }
            }
          }
          
          // 2. 프론트매터 태그 확인
          if (!hasTag && cache.frontmatter) {
            // 2.1 frontmatter.tags 배열 확인
            if (cache.frontmatter.tags && Array.isArray(cache.frontmatter.tags)) {
              if (cache.frontmatter.tags.includes(tagWithoutHash)) {
                hasTag = true;
              }
            }
            // 2.2 frontmatter.tags 문자열 확인
            else if (cache.frontmatter.tags && typeof cache.frontmatter.tags === 'string') {
              if (cache.frontmatter.tags === tagWithoutHash) {
                hasTag = true;
              }
            }
            // 2.3 frontmatter.tag 문자열 확인 (단수형)
            else if (cache.frontmatter.tag && typeof cache.frontmatter.tag === 'string') {
              if (cache.frontmatter.tag === tagWithoutHash) {
                hasTag = true;
              }
            }
          }
        }
        
        // 3. 위 검사로 태그를 찾지 못했다면, 파일 내용도 확인 (기존 방식 유지)
        if (!hasTag) {
          const content = await this.app.vault.read(file);
          if (content.includes(tag)) {
            hasTag = true;
          }
        }
        
        // 태그가 있으면 카드 생성
        if (hasTag) {
          const card = await this.cardService.createFromFile(file);
          if (card) {
            cards.push(card);
            this.loggingService.debug('태그가 있는 카드 추가', { filePath: file.path, tag });
          }
        }
      }

      this.loggingService.info('태그에서 카드 로드 완료', { tag, cardCount: cards.length });
      return cards;
    } catch (error) {
      this.loggingService.error('태그에서 카드 로드 실패', { error, tag });
      throw new CardSetError('태그에서 카드 로드 중 오류가 발생했습니다.');
    } finally {
      this.performanceMonitor.endMeasure('CardSetService.loadCardsFromTag');
    }
  }

  private async loadCardsFromLink(filePath: string, options: {
    type: LinkType;
    level: number;
    includeBacklinks: boolean;
    includeOutgoingLinks: boolean;
  }): Promise<ICard[]> {
    try {
      this.performanceMonitor.startMeasure('CardSetService.loadCardsFromLink');
      this.loggingService.debug('링크에서 카드 로드 시작', { filePath, options });

      const file = this.app.vault.getAbstractFileByPath(filePath);
      if (!file || !(file instanceof TFile)) {
        this.loggingService.warn('링크 카드셋 대상 파일을 찾을 수 없음', { filePath });
        return [];
      }

      // 링크 수집을 위한 집합
      const linkedFilePaths = new Set<string>();
      
      // 링크 레벨 (깊이) 제한
      const maxLevel = Math.min(options.level, 3); // 최대 3단계까지만 허용
      
      // 백링크 처리
      if (options.includeBacklinks || options.type === LinkType.BACKLINK) {
        await this.collectBacklinks(file, linkedFilePaths, maxLevel);
      }
      
      // 아웃고잉 링크 처리
      if (options.includeOutgoingLinks || options.type === LinkType.OUTGOING) {
        await this.collectOutgoingLinks(file, linkedFilePaths, maxLevel);
      }
      
      // 수집된 파일 경로로부터 카드 생성
      const cards: ICard[] = [];
      for (const linkedPath of linkedFilePaths) {
        const linkedFile = this.app.vault.getAbstractFileByPath(linkedPath);
        if (linkedFile && linkedFile instanceof TFile) {
          const card = await this.cardService.createFromFile(linkedFile);
          if (card) {
            cards.push(card);
          }
        }
      }

      this.loggingService.info('링크에서 카드 로드 완료', { 
        filePath, 
        cardCount: cards.length,
        linkLevel: maxLevel,
        backlinks: options.includeBacklinks,
        outgoingLinks: options.includeOutgoingLinks
      });
      return cards;
    } catch (error) {
      this.loggingService.error('링크에서 카드 로드 실패', { error, filePath });
      throw new CardSetError('링크에서 카드 로드 중 오류가 발생했습니다.');
    } finally {
      this.performanceMonitor.endMeasure('CardSetService.loadCardsFromLink');
    }
  }
  
  /**
   * 백링크 수집
   * @param file 대상 파일
   * @param result 결과 저장 집합
   * @param maxLevel 최대 레벨(깊이)
   * @param currentLevel 현재 레벨(깊이)
   * @param visited 방문한 파일 집합
   */
  private async collectBacklinks(
    file: TFile, 
    result: Set<string>, 
    maxLevel: number,
    currentLevel: number = 1,
    visited: Set<string> = new Set()
  ): Promise<void> {
    if (currentLevel > maxLevel || visited.has(file.path)) {
      return;
    }
    
    visited.add(file.path);
    
    // 메타데이터 캐시에서 백링크 정보 가져오기
    const resolvedLinks = this.app.metadataCache.resolvedLinks;
    if (!resolvedLinks) {
      return;
    }

    // 현재 파일을 참조하는 모든 파일 찾기
    for (const [sourcePath, links] of Object.entries(resolvedLinks)) {
      // 현재 파일 경로가 링크에 포함되어 있는지 확인
      if (Object.keys(links).includes(file.path)) {
        result.add(sourcePath);
        
        // 재귀적으로 다음 레벨 탐색 (현재 레벨이 maxLevel보다 작을 경우)
        if (currentLevel < maxLevel) {
          const backlinkFile = this.app.vault.getAbstractFileByPath(sourcePath);
          if (backlinkFile && backlinkFile instanceof TFile) {
            await this.collectBacklinks(
              backlinkFile, 
              result, 
              maxLevel, 
              currentLevel + 1, 
              visited
            );
          }
        }
      }
    }
  }
  
  /**
   * 아웃고잉 링크 수집
   * @param file 대상 파일
   * @param result 결과 저장 집합
   * @param maxLevel 최대 레벨(깊이)
   * @param currentLevel 현재 레벨(깊이)
   * @param visited 방문한 파일 집합
   */
  private async collectOutgoingLinks(
    file: TFile, 
    result: Set<string>, 
    maxLevel: number,
    currentLevel: number = 1,
    visited: Set<string> = new Set()
  ): Promise<void> {
    if (currentLevel > maxLevel || visited.has(file.path)) {
      return;
    }
    
    visited.add(file.path);
    
    // 메타데이터 캐시에서 파일 정보 가져오기
    const cache = this.app.metadataCache.getFileCache(file);
    if (!cache || !cache.links) {
      return;
    }
    
    // 아웃고잉 링크 처리
    for (const link of cache.links) {
      const linkedFilePath = this.app.metadataCache.getFirstLinkpathDest(link.link, file.path)?.path;
      
      if (linkedFilePath) {
        result.add(linkedFilePath);
        
        // 재귀적으로 다음 레벨 탐색 (현재 레벨이 maxLevel보다 작을 경우)
        if (currentLevel < maxLevel) {
          const linkedFile = this.app.vault.getAbstractFileByPath(linkedFilePath);
          if (linkedFile && linkedFile instanceof TFile) {
            await this.collectOutgoingLinks(
              linkedFile, 
              result, 
              maxLevel, 
              currentLevel + 1, 
              visited
            );
          }
        }
      }
    }
  }

  private async sortCards(cards: ICard[], sortConfig: ISortConfig): Promise<ICard[]> {
    try {
      this.performanceMonitor.startMeasure('CardSetService.sortCards');
      this.loggingService.debug('카드 정렬 시작', { sortConfig });

      const sortedCards = [...cards].sort((a, b) => {
        const aValue = this.getSortValue(a, sortConfig.field);
        const bValue = this.getSortValue(b, sortConfig.field);

        if (aValue < bValue) return sortConfig.order === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.order === 'asc' ? 1 : -1;
        return 0;
      });

      this.loggingService.info('카드 정렬 완료', { cardCount: sortedCards.length });
      return sortedCards;
    } catch (error) {
      this.loggingService.error('카드 정렬 실패', { error });
      throw new CardSetError('카드 정렬 중 오류가 발생했습니다.');
    } finally {
      this.performanceMonitor.endMeasure('CardSetService.sortCards');
    }
  }

  private getSortValue(card: ICard, field: string): string | number | Date {
    switch (field) {
      case 'name':
        return card.fileName;
      case 'createdAt':
        return card.createdAt;
      case 'updatedAt':
        return card.updatedAt;
      default:
        return '';
    }
  }

  /**
   * 카드셋 업데이트
   * @param cardSet 카드셋
   */
  async updateCardSet(cardSet: ICardSet): Promise<void> {
    this.cardSets.set(cardSet.id, cardSet);
    this.notifyEvent('update', cardSet.id, cardSet);
  }

  /**
   * 카드셋 삭제
   * @param cardSetId 카드셋 ID
   */
  async deleteCardSet(cardSetId: string): Promise<void> {
    this.cardSets.delete(cardSetId);
    this.notifyEvent('delete', cardSetId);
  }

  /**
   * 카드셋 가져오기
   * @param cardSetId 카드셋 ID
   */
  async getCardSet(cardSetId: string): Promise<ICardSet | null> {
    return this.cardSets.get(cardSetId) || null;
  }

  /**
   * 모든 카드셋 가져오기
   */
  async getAllCardSets(): Promise<ICardSet[]> {
    return Array.from(this.cardSets.values());
  }

  /**
   * 폴더별 카드셋 가져오기
   * @param folderPath 폴더 경로
   */
  async getCardSetByFolder(folderPath: string): Promise<ICardSet | null> {
    try {
      this.performanceMonitor.startMeasure('CardSetService.getCardSetByFolder');
      this.loggingService.debug('폴더별 카드셋 가져오기 시작', { folderPath });

      // 폴더 경로 유효성 검사
      if (!folderPath) {
        folderPath = '/';
        this.loggingService.warn('폴더 경로가 없어 루트 폴더로 설정');
      }

      // 기존 카드셋 찾기
      for (const cardSet of this.cardSets.values()) {
        if (cardSet.type === CardSetType.FOLDER && cardSet.criteria === folderPath) {
          this.loggingService.debug('기존 카드셋 찾음', { 
            cardSetId: cardSet.id,
            cardCount: cardSet.cards.length
          });
          return cardSet;
        }
      }

      // 새로운 카드셋 생성
      this.loggingService.debug('새로운 카드셋 생성 시작', { folderPath });
      try {
        const cardSet = await this.createCardSet(
          CardSetType.FOLDER,
          folderPath,
          {
            includeSubfolders: false,
            sortConfig: DEFAULT_CARD_SET_CONFIG.sortConfig
          }
        );

        this.loggingService.debug('폴더별 카드셋 생성 완료', { 
          cardSetId: cardSet.id,
          cardCount: cardSet.cards.length
        });
        return cardSet;
      } catch (error) {
        this.loggingService.error('새로운 카드셋 생성 실패', { error, folderPath });
        throw error;
      }
    } catch (error) {
      this.loggingService.error('폴더별 카드셋 가져오기 실패', { error, folderPath });
      throw new CardSetError('폴더별 카드셋 가져오기 중 오류가 발생했습니다.');
    } finally {
      this.performanceMonitor.endMeasure('CardSetService.getCardSetByFolder');
    }
  }

  /**
   * 태그별 카드셋 가져오기
   * @param tag 태그
   */
  async getCardSetByTag(tag: string): Promise<ICardSet | null> {
    try {
      this.performanceMonitor.startMeasure('CardSetService.getCardSetByTag');
      this.loggingService.debug('태그별 카드셋 가져오기 시작', { tag });

      // 태그 유효성 검사
      if (!tag) {
        this.loggingService.warn('태그가 없어 빈 카드셋 반환');
        return null;
      }

      // 기존 카드셋 찾기
      for (const cardSet of this.cardSets.values()) {
        if (cardSet.type === CardSetType.TAG && cardSet.criteria === tag) {
          this.loggingService.debug('기존 카드셋 찾음', { 
            cardSetId: cardSet.id,
            cardCount: cardSet.cards.length
          });
          return cardSet;
        }
      }

      // 새로운 카드셋 생성
      this.loggingService.debug('새로운 태그 카드셋 생성 시작', { tag });
      try {
        const cardSet = await this.createCardSet(
          CardSetType.TAG,
          tag,
          {
            sortConfig: DEFAULT_CARD_SET_CONFIG.sortConfig
          }
        );

        this.loggingService.debug('태그별 카드셋 생성 완료', { 
          cardSetId: cardSet.id,
          cardCount: cardSet.cards.length
        });
        return cardSet;
      } catch (error) {
        this.loggingService.error('새로운 태그 카드셋 생성 실패', { error, tag });
        throw error;
      }
    } catch (error) {
      this.loggingService.error('태그별 카드셋 가져오기 실패', { error, tag });
      throw new CardSetError('태그별 카드셋 가져오기 중 오류가 발생했습니다.');
    } finally {
      this.performanceMonitor.endMeasure('CardSetService.getCardSetByTag');
    }
  }

  /**
   * 카드셋 필터링
   * @param cardSet 카드셋
   * @param filter 필터 함수
   */
  async filterCardSet(
    cardSet: ICardSet,
    filter: (card: ICard) => boolean
  ): Promise<ICardSet> {
    const filteredCards = cardSet.cards.filter(filter);
    const filteredCardSet = { ...cardSet, cards: filteredCards };
    this.notifyEvent('filter', cardSet.id, filteredCardSet);
    return filteredCardSet;
  }

  /**
   * 카드셋 정렬
   * @param cardSet 카드셋
   * @param sortConfig 정렬 설정
   */
  async sortCardSet(
    cardSet: ICardSet,
    sortConfig: ISortConfig
  ): Promise<ICardSet> {
    // 정렬 로직
    const sortedCards = [...cardSet.cards];
    // 정렬 로직 구현
    const sortedCardSet = { ...cardSet, cards: sortedCards };
    this.notifyEvent('sort', cardSet.id, sortedCardSet);
    return sortedCardSet;
  }

  /**
   * 카드셋 이벤트 구독
   * @param callback 콜백 함수
   */
  subscribeToCardSetEvents(callback: (event: any) => void): void {
    this.eventSubscribers.add(callback);
  }

  /**
   * 카드셋 이벤트 구독 해제
   * @param callback 콜백 함수
   */
  unsubscribeFromCardSetEvents(callback: (event: any) => void): void {
    this.eventSubscribers.delete(callback);
  }

  /**
   * 이벤트 알림
   * @param type 이벤트 타입
   * @param cardSetId 카드셋 ID
   * @param data 이벤트 데이터
   */
  private notifyEvent(type: string, cardSetId: string, data?: any): void {
    const event = { type, cardSetId, data };
    this.eventSubscribers.forEach(callback => callback(event));
  }

  /**
   * ID로 카드를 가져옵니다.
   * @param cardId 카드 ID
   * @returns 카드 또는 null
   */
  getCardById(cardId: string): ICard | null {
    try {
      this.performanceMonitor.startMeasure('CardSetService.getCardById');
      this.loggingService.debug('ID로 카드 조회 시작', { cardId });

      // 모든 카드셋에서 해당 ID의 카드 찾기
      for (const cardSet of this.cardSets.values()) {
        const card = cardSet.cards.find(c => c.id === cardId);
        if (card) {
          this.loggingService.debug('카드 찾음', { cardId, cardSetId: cardSet.id });
          return card;
        }
      }

      this.loggingService.debug('카드를 찾을 수 없음', { cardId });
      return null;
    } catch (error) {
      this.loggingService.error('ID로 카드 조회 중 오류 발생', { error, cardId });
      return null;
    } finally {
      this.performanceMonitor.endMeasure('CardSetService.getCardById');
    }
  }
} 