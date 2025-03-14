import { TFile } from 'obsidian';
import { ICard } from '../../domain/card/Card';
import { DomainEventBus } from '../../domain/events/DomainEventBus';
import { EventType } from '../../domain/events/EventTypes';
import { ISettingsService } from '../../domain/settings/SettingsInterfaces';
import { ObsidianService } from '../core/ObsidianService';

/**
 * 카드 생성 서비스 인터페이스
 * 순환 참조 문제를 해결하기 위해 필요한 메서드만 정의합니다.
 */
interface ICardCreator {
  /**
   * 파일로부터 카드 생성
   * @param file 파일
   * @returns 생성된 카드
   */
  createCardFromFile(file: TFile): Promise<ICard>;
}

/**
 * 카드 쿼리 서비스 인터페이스
 * 카드 조회 관련 기능을 정의합니다.
 */
export interface ICardQueryService {
  /**
   * 모든 카드 가져오기
   * @returns 카드 배열
   */
  getCards(): Promise<ICard[]>;
  
  /**
   * 현재 카드 가져오기
   * @returns 현재 카드 배열
   */
  getCurrentCards(): ICard[];
  
  /**
   * 카드 가져오기
   * @param id 카드 ID
   * @returns 카드 또는 undefined
   */
  getCardById(id: string): Promise<ICard | undefined>;
  
  /**
   * 경로로 카드 가져오기
   * @param path 파일 경로
   * @returns 카드 또는 null
   */
  getCardByPath(path: string): Promise<ICard | null>;
  
  /**
   * 태그로 카드 필터링
   * @param tag 태그
   * @returns 필터링된 카드 배열
   */
  filterCardsByTag(tag: string): Promise<ICard[]>;
  
  /**
   * 폴더로 카드 필터링
   * @param folder 폴더 경로
   * @returns 필터링된 카드 배열
   */
  filterCardsByFolder(folder: string): Promise<ICard[]>;
  
  /**
   * 텍스트로 카드 검색
   * @param text 검색 텍스트
   * @returns 검색된 카드 배열
   */
  searchCardsByText(text: string): Promise<ICard[]>;
  
  /**
   * 카드 저장소 새로고침
   * 모든 마크다운 파일을 가져와서 카드를 생성합니다.
   */
  refreshCards(): Promise<void>;
}

/**
 * 카드 쿼리 서비스
 * 카드 조회 관련 기능을 구현합니다.
 */
export class CardQueryService implements ICardQueryService {
  private cardCreator: ICardCreator;
  private obsidianService: ObsidianService;
  private settingsService: ISettingsService;
  private eventBus: DomainEventBus;
  
  private cards: ICard[] = [];
  
  /**
   * 생성자
   * @param cardCreator 카드 생성 서비스
   * @param obsidianService Obsidian 서비스
   * @param settingsService 설정 서비스
   * @param eventBus 이벤트 버스
   */
  constructor(
    cardCreator: ICardCreator,
    obsidianService: ObsidianService,
    settingsService: ISettingsService,
    eventBus: DomainEventBus
  ) {
    this.cardCreator = cardCreator;
    this.obsidianService = obsidianService;
    this.settingsService = settingsService;
    this.eventBus = eventBus;
    
    // 이벤트 리스너 등록
    this.registerEventListeners();
  }
  
  /**
   * 이벤트 리스너 등록
   */
  private registerEventListeners(): void {
    // 설정 변경 이벤트 리스너
    this.eventBus.on(EventType.SETTINGS_CHANGED, () => {
      // 필요한 경우 캐시 초기화 등의 작업 수행
    });
    
    // 카드셋 변경 이벤트 리스너
    this.eventBus.on(EventType.CARDSET_CHANGED, () => {
      this.refreshCards();
    });
  }
  
  /**
   * 모든 카드 가져오기
   * @returns 카드 배열
   */
  async getCards(): Promise<ICard[]> {
    if (this.cards.length === 0) {
      await this.refreshCards();
    }
    return this.cards;
  }
  
  /**
   * 현재 카드 가져오기
   * @returns 현재 카드 배열
   */
  getCurrentCards(): ICard[] {
    return this.cards;
  }
  
  /**
   * 카드 저장소 새로고침
   * 모든 마크다운 파일을 가져와서 카드를 생성합니다.
   */
  async refreshCards(): Promise<void> {
    try {
      console.log('카드 저장소 새로고침 시작');
      
      // 현재 카드셋 소스에 따라 파일 목록 가져오기
      const files = this.obsidianService.getMarkdownFiles();
      
      // 파일로부터 카드 생성
      this.cards = await Promise.all(files.map(file => this.cardCreator.createCardFromFile(file)));
      
      console.log(`카드 저장소 새로고침 완료: ${this.cards.length}개의 카드 생성됨`);
      
      // 카드 변경 이벤트 발생
      this.eventBus.emit(EventType.CARDS_CHANGED, {
        cards: this.cards,
        totalCount: this.cards.length,
        filteredCount: this.cards.length
      });
    } catch (error) {
      console.error('카드 저장소 새로고침 오류:', error);
    }
  }
  
  /**
   * 카드 가져오기
   * @param id 카드 ID
   * @returns 카드 또는 undefined
   */
  async getCardById(id: string): Promise<ICard | undefined> {
    const cards = await this.getCards();
    return cards.find(card => card.getId() === id);
  }
  
  /**
   * 경로로 카드 가져오기
   * @param path 파일 경로
   * @returns 카드 또는 null
   */
  async getCardByPath(path: string): Promise<ICard | null> {
    try {
      const file = this.obsidianService.getVault().getAbstractFileByPath(path);
      if (file instanceof TFile) {
        // 파일로부터 카드 생성
        return await this.cardCreator.createCardFromFile(file);
      }
    } catch (error) {
      console.error('카드 가져오기 오류:', error);
    }
    return null;
  }
  
  /**
   * 태그로 카드 필터링
   * @param tag 태그
   * @returns 필터링된 카드 배열
   */
  async filterCardsByTag(tag: string): Promise<ICard[]> {
    const cards = await this.getCards();
    return cards.filter(card => {
      const cardTags = card.tags || [];
      return cardTags.includes(tag);
    });
  }
  
  /**
   * 폴더로 카드 필터링
   * @param folder 폴더 경로
   * @returns 필터링된 카드 배열
   */
  async filterCardsByFolder(folder: string): Promise<ICard[]> {
    const cards = await this.getCards();
    return cards.filter(card => {
      const filePath = card.path;
      return filePath.startsWith(folder);
    });
  }
  
  /**
   * 텍스트로 카드 검색
   * @param text 검색 텍스트
   * @returns 검색된 카드 배열
   */
  async searchCardsByText(text: string): Promise<ICard[]> {
    const cards = await this.getCards();
    const searchLower = text.toLowerCase();
    
    return cards.filter(card => {
      // 제목 검색
      if (card.title && card.title.toLowerCase().includes(searchLower)) {
        return true;
      }
      
      // 내용 검색
      if (card.content && card.content.toLowerCase().includes(searchLower)) {
        return true;
      }
      
      // 태그 검색
      if (card.tags && card.tags.some(tag => tag.toLowerCase().includes(searchLower))) {
        return true;
      }
      
      return false;
    });
  }
} 