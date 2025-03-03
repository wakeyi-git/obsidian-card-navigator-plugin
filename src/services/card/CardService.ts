import { App, TFile } from 'obsidian';
import { ICardService } from '../../core/interfaces/service/ICardService';
import { Card } from '../../core/models/Card';
import { CardData } from '../../core/types/card.types';
import { SettingsManager } from '../../managers/settings/SettingsManager';
import { ErrorHandler } from '../../utils/error/ErrorHandler';
import { Log } from '../../utils/log/Log';
import { FileService } from '../file/FileService';
import { MetadataService } from '../file/MetadataService';
import { TagService } from '../file/TagService';

/**
 * 카드 서비스 클래스
 * 카드 데이터 생성 및 관리를 담당합니다.
 */
export class CardService implements ICardService {
  /**
   * 앱 인스턴스
   */
  private app: App;
  
  /**
   * 설정 관리자
   */
  private settingsManager: SettingsManager;
  
  /**
   * 파일 서비스
   */
  private fileService: FileService;
  
  /**
   * 메타데이터 서비스
   */
  private metadataService: MetadataService;
  
  /**
   * 태그 서비스
   */
  private tagService: TagService;
  
  /**
   * 카드 캐시
   */
  private cardCache: Map<string, Card> = new Map();
  
  /**
   * 초기화 여부
   */
  private isInitialized: boolean = false;
  
  /**
   * 생성자
   * @param app Obsidian 앱 인스턴스
   * @param settingsManager 설정 관리자
   * @param fileService 파일 서비스
   * @param metadataService 메타데이터 서비스
   * @param tagService 태그 서비스
   */
  constructor(
    app: App,
    settingsManager: SettingsManager,
    fileService: FileService,
    metadataService: MetadataService,
    tagService: TagService
  ) {
    this.app = app;
    this.settingsManager = settingsManager;
    this.fileService = fileService;
    this.metadataService = metadataService;
    this.tagService = tagService;
    
    Log.debug('CardService 초기화 완료');
    this.isInitialized = true;
  }
  
  /**
   * 파일에서 카드 생성
   * @param file Obsidian 파일
   * @returns 생성된 카드 객체
   */
  public async createCardFromFile(file: TFile): Promise<Card> {
    return ErrorHandler.captureError(async () => {
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
    }, 'CARD_CREATION_ERROR', { filePath: file.path });
  }
  
  /**
   * 카드 데이터 생성
   * @param file Obsidian 파일
   * @returns 생성된 카드 데이터
   */
  public async createCardData(file: TFile): Promise<CardData> {
    return ErrorHandler.captureError(async () => {
      // 메타데이터 로드 대기
      await this.metadataService.waitForMetadata(file);
      
      // 카드 정보 수집
      const title = this.metadataService.getFileTitle(file);
      const content = await this.metadataService.getFileSummary(file, 150);
      const tags = this.metadataService.getTags(file);
      const created = this.metadataService.getCreationTime(file);
      const modified = this.metadataService.getModificationTime(file);
      
      // 카드 데이터 생성
      const cardData: CardData = {
        id: file.path,
        file,
        fileName: file.basename,
        firstHeader: title,
        content: content || '',
        tags,
        created,
        modified,
        path: file.path
      };
      
      return cardData;
    }, 'CARD_DATA_CREATION_ERROR', { filePath: file.path });
  }
  
  /**
   * 카드 데이터 업데이트
   * @param card 업데이트할 카드
   * @returns 업데이트된 카드
   */
  public async updateCardData(card: Card): Promise<Card> {
    return ErrorHandler.captureError(async () => {
      if (!card.file) {
        throw new Error(`카드에 파일이 없습니다: ${card.id}`);
      }
      
      // 새 카드 데이터 생성
      const cardData = await this.createCardData(card.file);
      
      // 카드 업데이트
      card.update(cardData);
      
      // 캐시 업데이트
      this.cardCache.set(card.id, card);
      
      return card;
    }, 'CARD_UPDATE_ERROR', { cardId: card.id });
  }
  
  /**
   * 카드 ID로 카드 찾기
   * @param cardId 카드 ID
   * @returns 찾은 카드 또는 undefined
   */
  public getCardById(cardId: string): Card | undefined {
    return ErrorHandler.captureErrorSync(() => {
      return this.cardCache.get(cardId);
    }, 'GET_CARD_BY_ID_ERROR', { cardId });
  }
  
  /**
   * 파일 경로로 카드 찾기
   * @param filePath 파일 경로
   * @returns 찾은 카드 또는 undefined
   */
  public getCardByPath(filePath: string): Card | undefined {
    return ErrorHandler.captureErrorSync(() => {
      return this.cardCache.get(filePath);
    }, 'GET_CARD_BY_PATH_ERROR', { filePath });
  }
  
  /**
   * 카드 캐시 초기화
   */
  public clearCache(): void {
    return ErrorHandler.captureErrorSync(() => {
      this.cardCache.clear();
      Log.debug('카드 캐시 초기화 완료');
    }, 'CLEAR_CACHE_ERROR');
  }
  
  /**
   * 카드 캐시 새로고침
   * @returns 새로고침된 카드 목록
   */
  public async refreshCache(): Promise<Card[]> {
    return ErrorHandler.captureError(async () => {
      // 캐시 초기화
      this.clearCache();
      
      // 모든 마크다운 파일 가져오기
      const files = this.fileService.getMarkdownFiles();
      
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
    }, 'REFRESH_CACHE_ERROR');
  }
  
  /**
   * 카드 목록 가져오기
   * @returns 현재 캐시된 카드 목록
   */
  public getCards(): Card[] {
    return ErrorHandler.captureErrorSync(() => {
      return Array.from(this.cardCache.values());
    }, 'GET_CARDS_ERROR');
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
    return ErrorHandler.captureErrorSync(() => {
      const sortedCards = [...cards];
      
      sortedCards.sort((a, b) => {
        let result = 0;
        
        // 정렬 기준에 따라 비교
        switch (sortBy) {
          case 'fileName':
            result = a.fileName.localeCompare(b.fileName);
            break;
          case 'title':
            result = a.firstHeader.localeCompare(b.firstHeader);
            break;
          case 'created':
            result = a.created - b.created;
            break;
          case 'modified':
            result = a.modified - b.modified;
            break;
          case 'path':
            result = a.path.localeCompare(b.path);
            break;
          default:
            result = a.fileName.localeCompare(b.fileName);
        }
        
        // 정렬 방향 적용
        return sortDirection === 'asc' ? result : -result;
      });
      
      return sortedCards;
    }, 'SORT_CARDS_ERROR', { sortBy, sortDirection });
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
    return ErrorHandler.captureErrorSync(() => {
      return cards.filter(filterFn);
    }, 'FILTER_CARDS_ERROR');
  }
  
  /**
   * 카드가 오래되었는지 확인
   * @param card 카드
   * @param file 파일
   * @returns 오래됨 여부
   */
  private isCardStale(card: Card, file: TFile): boolean {
    // 파일 수정 시간과 카드 수정 시간 비교
    return card.modified !== file.stat.mtime;
  }
} 