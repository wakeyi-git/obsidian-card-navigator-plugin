import { App, TFile } from 'obsidian';
import { ICardService } from '../../core/interfaces/service/ICardService';
import { Card } from '../../core/models/Card';
import { CardData } from '../../core/types/card.types';
import { SettingsManager } from '../../managers/settings/SettingsManager';
import { ErrorHandler } from '../../utils/error/ErrorHandler';
import { Log } from '../../utils/log/Log';
import { IFileService } from '../../core/interfaces/service/IFileService';
import { IMetadataService } from '../../core/interfaces/service/IMetadataService';
import { ITagService } from '../../core/interfaces/service/ITagService';
import { ErrorCode } from '../../core/constants/error.constants';
import { ICardRenderService } from '../../core/interfaces/service/ICardRenderService';
import { ICardInteractionService } from '../../core/interfaces/service/ICardInteractionService';
import { SearchIndexService } from '../search/SearchIndexService';
import { ParallelCardProcessor } from './ParallelCardProcessor';
import { VirtualScrollService } from './VirtualScrollService';

/**
 * 카드 서비스 클래스
 * 카드 데이터 생성 및 관리를 담당합니다.
 */
export class CardService implements ICardService {
  /**
   * 카드 캐시
   */
  private cardCache: Map<string, Card> = new Map();
  
  /**
   * 초기화 여부
   */
  private isInitialized: boolean = false;
  
  private searchIndexService: SearchIndexService;
  private parallelProcessor: ParallelCardProcessor;
  private virtualScroller: VirtualScrollService;
  
  /**
   * 생성자
   * @param app Obsidian 앱 인스턴스
   * @param settingsManager 설정 관리자
   * @param fileService 파일 서비스
   * @param metadataService 메타데이터 서비스
   * @param tagService 태그 서비스
   * @param cardRenderService 카드 렌더링 서비스
   * @param cardInteractionService 카드 상호작용 서비스
   */
  constructor(
    private readonly app: App,
    private readonly settingsManager: SettingsManager,
    private readonly fileService: IFileService,
    private readonly metadataService: IMetadataService,
    private readonly tagService: ITagService,
    private readonly cardRenderService: ICardRenderService,
    private readonly cardInteractionService: ICardInteractionService
  ) {
    this.cardCache = new Map();
    this.searchIndexService = new SearchIndexService();
    this.parallelProcessor = new ParallelCardProcessor();
    this.virtualScroller = new VirtualScrollService();
  }
  
  /**
   * 서비스 초기화
   * @param options 초기화 옵션
   */
  public initialize(options?: any): void {
    return ErrorHandler.captureErrorSync(() => {
      Log.debug('CardService 초기화 중...');
      
      // 카드 캐시 초기화
      this.cardCache.clear();
      
      // 추가 초기화 로직이 필요한 경우 여기에 구현
      
      this.isInitialized = true;
      Log.debug('CardService 초기화 완료');
    }, ErrorCode.SERVICE_INITIALIZATION_ERROR, { service: 'CardService' });
  }
  
  /**
   * 파일에서 카드 생성
   * @param file Obsidian 파일
   * @returns 생성된 카드 객체
   */
  public async createCardFromFile(file: TFile): Promise<Card> {
    const result = await ErrorHandler.captureError(async () => {
      if (!this.isInitialized) {
        throw new Error('카드 서비스가 초기화되지 않았습니다.');
      }
      
      // 캐시에 있는지 확인
      const cachedCard = this.cardCache.get(file.path);
      if (cachedCard && !this.isCardStale(cachedCard, file)) {
        return cachedCard;
      }
      
      // 파일이 마크다운 파일인지 확인
      if (!this.fileService.isMarkdownFile(file)) {
        throw new Error(`마크다운 파일이 아닙니다: ${file.path}`);
      }
      
      // 카드 데이터 생성
      const cardData = await this.createCardData(file);
      
      // 카드 객체 생성
      const card = new Card(cardData);
      
      // 캐시에 저장
      this.cardCache.set(file.path, card);
      
      Log.debug(`카드 생성 완료: ${file.path}`);
      return card;
    }, ErrorCode.CARD_CREATION_ERROR, { filePath: file.path });
    
    if (!result) {
      throw new Error(`카드 생성 실패: ${file.path}`);
    }
    
    return result;
  }
  
  /**
   * 카드 데이터 생성
   * @param file Obsidian 파일
   * @returns 생성된 카드 데이터
   */
  public async createCardData(file: TFile): Promise<CardData> {
    const result = await ErrorHandler.captureError(async () => {
      // 메타데이터 로드 대기
      await this.metadataService.waitForMetadata(file);
      
      // 카드 정보 수집
      const title = this.metadataService.getFileTitle(file);
      const content = await this.metadataService.getFileSummary(file, 150);
      const tags = this.metadataService.getTags(file);
      const creationDate = this.metadataService.getCreationTime(file) || file.stat.ctime;
      const modificationDate = this.metadataService.getModificationTime(file) || file.stat.mtime;
      
      // 카드 데이터 생성
      const cardData: CardData = {
        id: file.path,
        file,
        path: file.path,
        filename: file.basename,
        firstHeader: title,
        content: content || '',
        tags,
        creationDate,
        modificationDate,
        fileSize: file.stat.size
      };
      
      return cardData;
    }, ErrorCode.CARD_CREATION_ERROR, { filePath: file.path });
    
    if (!result) {
      throw new Error(`카드 데이터 생성 실패: ${file.path}`);
    }
    
    return result;
  }
  
  /**
   * 카드 데이터 업데이트
   * @param card 업데이트할 카드
   * @returns 업데이트된 카드
   */
  public async updateCardData(card: Card): Promise<Card> {
    const result = await ErrorHandler.captureError(async () => {
      if (!card.file) {
        Log.warn(`카드에 파일이 없습니다: ${card.id}`);
        return card;
      }
      
      // 새 카드 데이터 생성
      const cardData = await this.createCardData(card.file);
      
      // 카드 업데이트
      card.update(cardData);
      
      // 캐시 업데이트
      this.cardCache.set(card.id, card);
      
      return card;
    }, ErrorCode.CARD_UPDATE_ERROR, { cardId: card.id });
    
    if (!result) {
      throw new Error(`카드 업데이트 실패: ${card.id}`);
    }
    
    return result;
  }
  
  /**
   * 카드 ID로 카드 찾기
   * @param cardId 카드 ID
   * @returns 찾은 카드 또는 undefined
   */
  public getCardById(cardId: string): Card | undefined {
    return ErrorHandler.captureErrorSync(() => {
      return this.cardCache.get(cardId);
    }, ErrorCode.CARD_NOT_FOUND, { cardId });
  }
  
  /**
   * 파일 경로로 카드 찾기
   * @param filePath 파일 경로
   * @returns 찾은 카드 또는 undefined
   */
  public getCardByPath(filePath: string): Card | undefined {
    return ErrorHandler.captureErrorSync(() => {
      return this.cardCache.get(filePath);
    }, ErrorCode.CARD_NOT_FOUND, { filePath });
  }
  
  /**
   * 카드 캐시 초기화
   */
  public clearCache(): void {
    ErrorHandler.captureErrorSync(() => {
      this.cardCache.clear();
      Log.debug('카드 캐시 초기화 완료');
    }, ErrorCode.OPERATION_FAILED);
  }
  
  /**
   * 카드 캐시 새로고침
   * @returns 새로고침된 카드 목록
   */
  public async refreshCache(): Promise<Card[]> {
    const result = await ErrorHandler.captureError(async () => {
      // 캐시 초기화
      this.clearCache();
      
      // 모든 마크다운 파일 가져오기
      const files = this.fileService.getMarkdownFiles('/', true, false);
      
      // 각 파일에 대해 카드 생성
      const cards: Card[] = [];
      for (const file of files) {
        try {
          const card = await this.createCardFromFile(file);
          cards.push(card);
        } catch (error) {
          Log.error(`파일에서 카드 생성 실패: ${file.path}`, error);
        }
      }
      
      Log.debug(`카드 캐시 새로고침 완료: ${cards.length}개 카드`);
      return cards;
    }, ErrorCode.OPERATION_FAILED);
    
    if (!result) {
      return [];
    }
    
    return result;
  }
  
  /**
   * 카드 목록 가져오기
   * @returns 현재 캐시된 카드 목록
   */
  public getCards(): Card[] {
    const result = ErrorHandler.captureErrorSync(() => {
      return Array.from(this.cardCache.values());
    }, ErrorCode.OPERATION_FAILED);
    
    if (!result) {
      return [];
    }
    
    return result;
  }
  
  /**
   * 카드 정렬
   * @param cards 정렬할 카드 목록
   * @param sortBy 정렬 기준
   * @param sortDirection 정렬 방향
   * @returns 정렬된 카드 목록
   */
  public sortCards(
    cards: Card[],
    sortBy: string,
    sortDirection: 'asc' | 'desc'
  ): Card[] {
    const result = ErrorHandler.captureErrorSync(() => {
      const sortedCards = [...cards];
      
      sortedCards.sort((a, b) => {
        let result = 0;
        
        // 정렬 기준에 따라 비교
        switch (sortBy) {
          case 'filename':
            result = a.filename.localeCompare(b.filename);
            break;
          case 'title':
            result = (a.firstHeader || '').localeCompare(b.firstHeader || '');
            break;
          case 'created':
            result = a.creationDate - b.creationDate;
            break;
          case 'modified':
            result = a.modificationDate - b.modificationDate;
            break;
          case 'path':
            result = a.path.localeCompare(b.path);
            break;
          default:
            result = a.filename.localeCompare(b.filename);
        }
        
        // 정렬 방향 적용
        return sortDirection === 'asc' ? result : -result;
      });
      
      return sortedCards;
    }, ErrorCode.OPERATION_FAILED, { sortBy, sortDirection });
    
    if (!result) {
      return [...cards];
    }
    
    return result;
  }
  
  /**
   * 카드 필터링
   * @param cards 필터링할 카드 목록
   * @param filterFn 필터 함수
   * @returns 필터링된 카드 목록
   */
  public filterCards(
    cards: Card[],
    filterFn: (card: Card) => boolean
  ): Card[] {
    const result = ErrorHandler.captureErrorSync(() => {
      return cards.filter(filterFn);
    }, ErrorCode.OPERATION_FAILED);
    
    if (!result) {
      return [...cards];
    }
    
    return result;
  }
  
  /**
   * 카드가 오래되었는지 확인
   * @param card 카드
   * @param file 파일
   * @returns 오래됨 여부
   */
  private isCardStale(card: Card, file: TFile): boolean {
    // 파일 수정 시간과 카드 수정 시간 비교
    return card.modificationDate !== file.stat.mtime;
  }

  /**
   * 카드 검색을 수행합니다.
   */
  public async searchCards(query: string): Promise<Card[]> {
    try {
      const cardIds = this.searchIndexService.search(query);
      return cardIds.map(id => this.getCardById(id)).filter(card => card !== undefined) as Card[];
    } catch (error) {
      ErrorHandler.handleError('CardService.searchCards', `카드 검색 실패: ${error}`, false);
      return [];
    }
  }

  /**
   * 카드를 일괄 처리합니다.
   */
  public async processBatchCards(
    cards: Card[],
    processor: (card: Card) => Promise<void>,
    onProgress?: (progress: number) => void
  ): Promise<void> {
    try {
      await this.parallelProcessor.processCards(cards, processor, onProgress);
    } catch (error) {
      ErrorHandler.handleError('CardService.processBatchCards', `일괄 처리 실패: ${error}`, false);
      throw error;
    }
  }

  /**
   * 가상 스크롤링을 초기화합니다.
   */
  public initializeVirtualScroll(
    cards: Card[],
    containerHeight: number,
    cardHeight: number
  ): void {
    try {
      this.virtualScroller.initialize(cards, containerHeight, cardHeight);
    } catch (error) {
      ErrorHandler.handleError(
        'CardService.initializeVirtualScroll',
        `가상 스크롤 초기화 실패: ${error}`,
        false
      );
    }
  }

  /**
   * 보이는 카드 목록을 업데이트합니다.
   */
  public updateVisibleCards(scrollTop: number): Card[] {
    try {
      return this.virtualScroller.updateVisibleCards(scrollTop);
    } catch (error) {
      ErrorHandler.handleError(
        'CardService.updateVisibleCards',
        `보이는 카드 업데이트 실패: ${error}`,
        false
      );
      return [];
    }
  }

  /**
   * 카드를 생성하거나 업데이트할 때 검색 인덱스를 업데이트합니다.
   */
  private updateSearchIndex(card: Card): void {
    try {
      this.searchIndexService.indexCard(card);
    } catch (error) {
      ErrorHandler.handleError(
        'CardService.updateSearchIndex',
        `검색 인덱스 업데이트 실패: ${error}`,
        false
      );
    }
  }

  // Override existing methods to integrate new services

  public createCard(card: Card): void {
    // 카드 생성 로직
    this.cardCache.set(card.id, card);
    this.updateSearchIndex(card);
  }

  public updateCard(card: Card): void {
    // 카드 업데이트 로직
    this.cardCache.set(card.id, card);
    this.updateSearchIndex(card);
  }

  public deleteCard(cardId: string): void {
    // 카드 삭제 로직
    this.cardCache.delete(cardId);
    // 검색 인덱스에서도 카드 제거
    this.searchIndexService.clearIndex();
    this.getCards().forEach((card: Card) => this.updateSearchIndex(card));
  }
} 