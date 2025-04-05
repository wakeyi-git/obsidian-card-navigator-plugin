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
            includeOutgoingLinks: options?.includeOutgoingLinks !== undefined ? options.includeOutgoingLinks : true
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
        },
        preview: function() {
          return {
            id: this.id,
            type: this.type,
            criteria: this.criteria,
            cardCount: this.cards.length
          };
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

  /**
   * 폴더에서 카드 로드
   * @param folderPath 폴더 경로
   * @param includeSubfolders 하위 폴더 포함 여부
   */
  private async loadCardsFromFolder(folderPath: string, includeSubfolders: boolean = false): Promise<ICard[]> {
    try {
      this.performanceMonitor.startMeasure('CardSetService.loadCardsFromFolder');
      this.loggingService.debug('폴더에서 카드 로드 시작', { folderPath, includeSubfolders });

      // 카드 서비스에서 폴더 경로 기반 카드 캐시 확인
      const cacheKey = `folder:${folderPath}:${includeSubfolders}`;
      const cachedCards = this.getCachedCards(cacheKey);
      if (cachedCards) {
        this.loggingService.debug('캐시된 카드 사용', { 
          cacheKey, 
          cardCount: cachedCards.length 
        });
        return cachedCards;
      }

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

      // 병렬 처리를 위한 프로미스 배열
      const createCardPromises: Promise<ICard | null>[] = [];
      
      // 배치 처리
      for (let i = 0; i < targetFiles.length; i += BATCH_SIZE) {
        const batch = targetFiles.slice(i, i + BATCH_SIZE);
        this.loggingService.debug(`배치 처리 중 (${i+1}-${Math.min(i+BATCH_SIZE, targetFiles.length)}/${targetFiles.length})`);
        
        // 배치의 모든 파일에 대해 카드 생성 프로미스 추가
        batch.forEach(file => {
          createCardPromises.push(this.cardService.createFromFile(file));
        });
      }
      
      // 모든 카드 생성 프로미스 병렬 실행
      const results = await Promise.all(createCardPromises);
      
      // null이 아닌 카드만 필터링
      const validCards = results.filter((card): card is ICard => card !== null);
      
      this.loggingService.debug('카드 생성 결과', { 
        totalPromises: createCardPromises.length, 
        validCardsCount: validCards.length 
      });
      
      // 생성된 카드 캐싱
      this.cacheCards(cacheKey, validCards);

      this.loggingService.info('폴더에서 카드 로드 완료', { folderPath, cardCount: validCards.length });
      return validCards;
    } catch (error) {
      this.loggingService.error('폴더에서 카드 로드 실패', { error, folderPath });
      throw new CardSetError(`폴더에서 카드 로드 중 오류가 발생했습니다: ${error.message}`);
    } finally {
      this.performanceMonitor.endMeasure('CardSetService.loadCardsFromFolder');
    }
  }

  // 카드 캐싱을 위한 임시 맵
  private cardCache: Map<string, { cards: ICard[], timestamp: number }> = new Map();
  private readonly CACHE_TIMEOUT = 30000; // 30초 캐시 유효 시간

  /**
   * 캐시에서 카드 가져오기
   * @param cacheKey 캐시 키
   * @returns 캐시된 카드 또는 null
   */
  private getCachedCards(cacheKey: string): ICard[] | null {
    const cached = this.cardCache.get(cacheKey);
    if (!cached) return null;
    
    // 캐시 유효 시간 체크
    const now = Date.now();
    if (now - cached.timestamp > this.CACHE_TIMEOUT) {
      this.loggingService.debug('캐시 만료됨', { cacheKey });
      this.cardCache.delete(cacheKey);
      return null;
    }
    
    return cached.cards;
  }

  /**
   * 카드 캐싱
   * @param cacheKey 캐시 키
   * @param cards 카드 배열
   */
  private cacheCards(cacheKey: string, cards: ICard[]): void {
    this.cardCache.set(cacheKey, {
      cards,
      timestamp: Date.now()
    });
    this.loggingService.debug('카드 캐싱 완료', { 
      cacheKey, 
      cardCount: cards.length 
    });
  }

  /**
   * 태그에서 카드 로드
   * @param tag 태그
   */
  private async loadCardsFromTag(tag: string): Promise<ICard[]> {
    try {
      this.performanceMonitor.startMeasure('CardSetService.loadCardsFromTag');
      this.loggingService.debug('태그에서 카드 로드 시작', { tag });

      // 태그 기반 카드 캐시 확인
      const cacheKey = `tag:${tag}`;
      const cachedCards = this.getCachedCards(cacheKey);
      if (cachedCards) {
        this.loggingService.debug('캐시된 태그 카드 사용', { 
          cacheKey, 
          cardCount: cachedCards.length 
        });
        return cachedCards;
      }

      const files = this.app.vault.getFiles();
      const cards: ICard[] = [];
      const tagWithoutHash = tag.startsWith('#') ? tag.substring(1) : tag;

      // 태그가 있는 파일을 먼저 필터링
      const filesWithTag: TFile[] = [];
      
      // 메타데이터 캐시를 통해 태그가 있는 파일 필터링
      for (const file of files) {
        const cache = this.app.metadataCache.getFileCache(file);
        let hasTag = false;
        
        if (cache) {
          // 1. 인라인 태그 확인
          if (cache.tags && cache.tags.some(tagObj => 
            tagObj.tag === tag || tagObj.tag === '#' + tagWithoutHash)) {
            hasTag = true;
          }
          
          // 2. 프론트매터 태그 확인
          if (!hasTag && cache.frontmatter) {
            // 2.1 배열 형태 태그
            if (cache.frontmatter.tags && Array.isArray(cache.frontmatter.tags)) {
              if (cache.frontmatter.tags.includes(tagWithoutHash)) {
                hasTag = true;
              }
            }
            // 2.2 문자열 형태 태그
            else if (cache.frontmatter.tags && typeof cache.frontmatter.tags === 'string') {
              if (cache.frontmatter.tags === tagWithoutHash) {
                hasTag = true;
              }
            }
            // 2.3 단수형 태그
            else if (cache.frontmatter.tag && typeof cache.frontmatter.tag === 'string') {
              if (cache.frontmatter.tag === tagWithoutHash) {
                hasTag = true;
              }
            }
          }
        }
        
        // 태그가 있는 파일 목록에 추가
        if (hasTag) {
          filesWithTag.push(file);
        }
      }
      
      this.loggingService.debug('태그가 있는 파일 필터링 완료', { 
        tag, 
        fileCount: filesWithTag.length 
      });
      
      // 병렬로 카드 생성
      if (filesWithTag.length > 0) {
        const createCardPromises = filesWithTag.map(file => 
          this.cardService.createFromFile(file)
        );
        
        const results = await Promise.all(createCardPromises);
        const validCards = results.filter((card): card is ICard => card !== null);
        
        // 생성된 카드 캐싱
        this.cacheCards(cacheKey, validCards);
        
        this.loggingService.info('태그에서 카드 로드 완료', { 
          tag, 
          fileCount: filesWithTag.length,
          cardCount: validCards.length 
        });
        
        return validCards;
      }

      this.loggingService.info('태그와 일치하는 카드 없음', { tag });
      return [];
    } catch (error) {
      this.loggingService.error('태그에서 카드 로드 실패', { error, tag });
      throw new CardSetError('태그에서 카드 로드 중 오류가 발생했습니다.');
    } finally {
      this.performanceMonitor.endMeasure('CardSetService.loadCardsFromTag');
    }
  }

  /**
   * 링크에서 카드 로드
   * @param filePath 파일 경로
   * @param options 옵션 (링크 레벨, 백링크 포함 여부, 아웃고잉 링크 포함 여부)
   */
  private async loadCardsFromLink(filePath: string, options: {
    level: number;
    includeBacklinks: boolean;
    includeOutgoingLinks: boolean;
  }): Promise<ICard[]> {
    try {
      this.performanceMonitor.startMeasure('CardSetService.loadCardsFromLink');
      this.loggingService.debug('링크에서 카드 로드 시작', { filePath, options });

      // 링크 기반 카드 캐시 확인
      const cacheKey = `link:${filePath}:${options.level}:${options.includeBacklinks}:${options.includeOutgoingLinks}`;
      const cachedCards = this.getCachedCards(cacheKey);
      if (cachedCards) {
        this.loggingService.debug('캐시된 링크 카드 사용', { 
          cacheKey, 
          cardCount: cachedCards.length 
        });
        return cachedCards;
      }

      const file = this.app.vault.getAbstractFileByPath(filePath);
      if (!file || !(file instanceof TFile)) {
        this.loggingService.warn('링크 카드셋 대상 파일을 찾을 수 없음', { filePath });
        return [];
      }

      // 링크 수집을 위한 집합
      const linkedFilePaths = new Set<string>();
      
      // 링크 레벨 (깊이) 제한
      const maxLevel = Math.min(options.level, 3); // 최대 3단계까지만 허용

      // 기본 설정이 없는 경우 양쪽 모두 활성화
      const includeBacklinks = options.includeBacklinks !== undefined ? options.includeBacklinks : true;
      const includeOutgoingLinks = options.includeOutgoingLinks !== undefined ? options.includeOutgoingLinks : true;
      
      this.loggingService.debug('링크 설정 적용', { 
        includeBacklinks, 
        includeOutgoingLinks, 
        maxLevel
      });
      
      // 백링크와 아웃고잉 링크 병렬 수집
      const collectPromises: Promise<void>[] = [];
      
      // 백링크 처리
      if (includeBacklinks) {
        collectPromises.push(this.collectBacklinks(file, linkedFilePaths, maxLevel));
      }
      
      // 아웃고잉 링크 처리
      if (includeOutgoingLinks) {
        collectPromises.push(this.collectOutgoingLinks(file, linkedFilePaths, maxLevel));
      }
      
      // 모든 링크 수집 작업 완료 대기
      await Promise.all(collectPromises);
      
      this.loggingService.debug('링크 수집 완료', { count: linkedFilePaths.size });

      // 활성 파일은 제외 (자기 자신의 링크는 제외)
      linkedFilePaths.delete(file.path);
      
      if (linkedFilePaths.size === 0) {
        this.loggingService.debug('수집된 링크 파일이 없음');
        return [];
      }
      
      // 링크된 파일 경로 배열
      const linkedPaths = Array.from(linkedFilePaths);
      this.loggingService.debug('수집된 링크 파일 경로', { 
        linkedPathsCount: linkedPaths.length
      });
      
      // 링크된 파일에서 카드 병렬 생성
      const createCardPromises: Promise<ICard | null>[] = [];
      
      for (const linkedPath of linkedPaths) {
        const linkedFile = this.app.vault.getAbstractFileByPath(linkedPath);
        if (linkedFile && linkedFile instanceof TFile) {
          createCardPromises.push(this.cardService.createFromFile(linkedFile));
        }
      }
      
      // 모든 카드 생성 병렬 완료 대기
      const results = await Promise.all(createCardPromises);
      const validCards = results.filter((card): card is ICard => card !== null);
      
      // 생성된 카드 캐싱
      this.cacheCards(cacheKey, validCards);

      this.loggingService.info('링크에서 카드 로드 완료', { 
        filePath, 
        cardCount: validCards.length,
        linkLevel: maxLevel,
        backlinks: includeBacklinks,
        outgoingLinks: includeOutgoingLinks
      });
      
      return validCards;
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
    this.loggingService.debug('백링크 수집 시작', { filePath: file.path, currentLevel, maxLevel });
    
    // 메타데이터 캐시에서 백링크 정보 가져오기
    const resolvedLinks = this.app.metadataCache.resolvedLinks;
    if (!resolvedLinks) {
      this.loggingService.warn('resolvedLinks가 null입니다', { filePath: file.path });
      return;
    }

    let backlinkCount = 0;
    // 현재 파일을 참조하는 모든 파일 찾기
    for (const [sourcePath, links] of Object.entries(resolvedLinks)) {
      // 현재 파일 경로가 링크에 포함되어 있는지 확인
      if (Object.keys(links).includes(file.path)) {
        result.add(sourcePath);
        backlinkCount++;
        this.loggingService.debug('백링크 발견', { filePath: file.path, backlinkPath: sourcePath });
        
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
    
    this.loggingService.debug('백링크 수집 완료', { 
      filePath: file.path, 
      backlinkCount, 
      currentLevel, 
      totalLinks: result.size 
    });
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
    this.loggingService.debug('아웃고잉 링크 수집 시작', { filePath: file.path, currentLevel, maxLevel });
    
    // 메타데이터 캐시에서 파일 정보 가져오기
    const cache = this.app.metadataCache.getFileCache(file);
    if (!cache) {
      this.loggingService.warn('파일 캐시가 null입니다', { filePath: file.path });
      return;
    }
    
    if (!cache.links || cache.links.length === 0) {
      this.loggingService.debug('파일에 링크가 없습니다', { filePath: file.path });
      return;
    }
    
    this.loggingService.debug('파일의 링크 정보', { 
      filePath: file.path, 
      linkCount: cache.links?.length || 0
    });
    
    // 아웃고잉 링크 처리
    let outgoingCount = 0;
    for (const link of cache.links) {
      const linkedFilePath = this.app.metadataCache.getFirstLinkpathDest(link.link, file.path)?.path;
      
      if (linkedFilePath) {
        result.add(linkedFilePath);
        outgoingCount++;
        this.loggingService.debug('아웃고잉 링크 발견', { filePath: file.path, linkedPath: linkedFilePath });
        
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
    
    this.loggingService.debug('아웃고잉 링크 수집 완료', { 
      filePath: file.path, 
      outgoingCount, 
      currentLevel, 
      totalLinks: result.size 
    });
  }

  private async sortCards(cards: ICard[], sortConfig: ISortConfig): Promise<ICard[]> {
    try {
      this.performanceMonitor.startMeasure('CardSetService.sortCards');
      this.loggingService.debug('카드 정렬 시작', { sortConfig });

      const sortedCards = [...cards].sort((a, b) => {
        const aValue = this.getSortValue(a, sortConfig.sortField);
        const bValue = this.getSortValue(b, sortConfig.sortField);

        if (aValue < bValue) return sortConfig.sortOrder === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.sortOrder === 'asc' ? 1 : -1;
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