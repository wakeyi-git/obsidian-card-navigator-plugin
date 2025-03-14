import { TFile } from 'obsidian';
import { ICard } from '../../domain/card/Card';
import { DomainEventBus } from '../../domain/events/DomainEventBus';
import { EventType } from '../../domain/events/EventTypes';
import { ICardManager } from '../../domain/interaction/InteractionInterfaces';
import { ISettingsService } from '../../domain/settings/SettingsInterfaces';
import { ObsidianService } from '../core/ObsidianService';
import { CardCreationService, ICardCreationService } from './CardCreationService';
import { CardInteractionService, ICardInteractionService } from './CardInteractionService';
import { CardQueryService, ICardQueryService } from './CardQueryService';

/**
 * 카드 서비스 인터페이스
 */
export interface ICardService extends ICardManager {
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
   * 파일로부터 카드 생성
   * @param file 파일
   * @returns 생성된 카드
   */
  createCardFromFile(file: TFile): Promise<ICard>;
  
  /**
   * 이벤트 버스 가져오기
   * @returns 이벤트 버스
   */
  getEventBus(): DomainEventBus;
  
  /**
   * 설정 서비스 가져오기
   * @returns 설정 서비스
   */
  getSettingsService(): ISettingsService;
  
  /**
   * 카드 목록 가져오기
   * @returns 카드 목록
   */
  getCards(): Promise<ICard[]>;
  
  /**
   * 현재 카드 목록 가져오기
   * @returns 현재 카드 목록
   */
  getCurrentCards(): ICard[];
  
  /**
   * 카드 저장소 새로고침
   */
  refreshCards(): Promise<void>;
  
  /**
   * 태그로 카드 필터링
   * @param tag 태그
   * @returns 필터링된 카드 목록
   */
  filterCardsByTag(tag: string): Promise<ICard[]>;
  
  /**
   * 폴더로 카드 필터링
   * @param folder 폴더 경로
   * @returns 필터링된 카드 목록
   */
  filterCardsByFolder(folder: string): Promise<ICard[]>;
  
  /**
   * 텍스트로 카드 검색
   * @param text 검색 텍스트
   * @returns 검색된 카드 목록
   */
  searchCardsByText(text: string): Promise<ICard[]>;
  
  /**
   * 카드 캐시 초기화
   */
  clearCardCache(): void;
}

/**
 * 카드 서비스
 * 카드 관련 기능을 관리합니다.
 * 파사드(Facade) 패턴으로 구현되어 다른 서비스들을 조합합니다.
 */
export class CardService implements ICardService {
  private obsidianService: ObsidianService;
  private settingsService: ISettingsService;
  private eventBus: DomainEventBus;
  
  private cardQueryService: ICardQueryService;
  private cardCreationService: ICardCreationService;
  private cardInteractionService: ICardInteractionService;
  
  /**
   * 생성자
   * @param obsidianService Obsidian 서비스
   * @param settingsService 설정 서비스
   * @param eventBus 이벤트 버스
   */
  constructor(
    obsidianService: ObsidianService,
    settingsService: ISettingsService,
    eventBus: DomainEventBus
  ) {
    this.obsidianService = obsidianService;
    this.settingsService = settingsService;
    this.eventBus = eventBus;
    
    // 서비스 초기화
    this.cardCreationService = new CardCreationService(obsidianService, settingsService, eventBus);
    this.cardInteractionService = new CardInteractionService(obsidianService, settingsService, eventBus);
    this.cardQueryService = new CardQueryService(this, obsidianService, settingsService, eventBus);
    
    // 이벤트 리스너 등록
    this.registerEventListeners();
  }
  
  /**
   * 이벤트 리스너 등록
   */
  private registerEventListeners(): void {
    this.eventBus.on(EventType.SETTINGS_CHANGED, () => {
      // 필요한 경우 상태 초기화
    });
  }
  
  /**
   * 카드 목록 가져오기
   * @returns 카드 목록
   */
  async getCards(): Promise<ICard[]> {
    return this.cardQueryService.getCards();
  }
  
  /**
   * 현재 카드 목록 가져오기
   * @returns 현재 카드 목록
   */
  getCurrentCards(): ICard[] {
    return this.cardQueryService.getCurrentCards();
  }
  
  /**
   * 카드 저장소 새로고침
   */
  async refreshCards(): Promise<void> {
    // 카드 캐시 초기화
    this.clearCardCache();
    
    // 카드 쿼리 서비스를 통해 카드 목록 새로고침
    await this.cardQueryService.refreshCards();
  }
  
  /**
   * 카드 가져오기
   * @param id 카드 ID
   * @returns 카드 또는 undefined
   */
  async getCardById(id: string): Promise<ICard | undefined> {
    return this.cardQueryService.getCardById(id);
  }
  
  /**
   * 경로로 카드 가져오기
   * @param path 파일 경로
   * @returns 카드 또는 null
   */
  async getCardByPath(path: string): Promise<ICard | null> {
    return this.cardQueryService.getCardByPath(path);
  }
  
  /**
   * 파일로부터 카드 생성
   * @param file 파일
   * @returns 생성된 카드
   */
  async createCardFromFile(file: TFile): Promise<ICard> {
    return this.cardCreationService.createCardFromFile(file);
  }
  
  /**
   * 태그로 카드 필터링
   * @param tag 태그
   * @returns 필터링된 카드 목록
   */
  async filterCardsByTag(tag: string): Promise<ICard[]> {
    return this.cardQueryService.filterCardsByTag(tag);
  }
  
  /**
   * 폴더로 카드 필터링
   * @param folder 폴더 경로
   * @returns 필터링된 카드 목록
   */
  async filterCardsByFolder(folder: string): Promise<ICard[]> {
    return this.cardQueryService.filterCardsByFolder(folder);
  }
  
  /**
   * 텍스트로 카드 검색
   * @param text 검색 텍스트
   * @returns 검색된 카드 목록
   */
  async searchCardsByText(text: string): Promise<ICard[]> {
    return this.cardQueryService.searchCardsByText(text);
  }
  
  /**
   * 카드 선택
   * @param card 카드
   */
  selectCard(card: ICard): void {
    this.cardInteractionService.selectCard(card);
  }
  
  /**
   * 카드 선택 해제
   * @param card 카드
   */
  deselectCard(card: ICard): void {
    this.cardInteractionService.deselectCard(card);
  }
  
  /**
   * 모든 카드 선택 해제
   */
  deselectAllCards(): void {
    this.cardInteractionService.deselectAllCards();
  }
  
  /**
   * 카드 활성화
   * @param card 카드
   */
  activateCard(card: ICard): void {
    this.cardInteractionService.activateCard(card);
  }
  
  /**
   * 카드 비활성화
   * @param card 카드
   */
  deactivateCard(card: ICard): void {
    this.cardInteractionService.deactivateCard(card);
  }
  
  /**
   * 카드 포커스
   * @param card 카드
   */
  focusCard(card: ICard): void {
    this.cardInteractionService.focusCard(card);
  }
  
  /**
   * 카드 포커스 해제
   * @param card 카드
   */
  unfocusCard(card: ICard): void {
    this.cardInteractionService.unfocusCard(card);
  }
  
  /**
   * 카드 열기
   * @param card 카드
   * @param newLeaf 새 탭에서 열기 여부
   */
  openCard(card: ICard, newLeaf: boolean = false): void {
    this.cardInteractionService.openCard(card, newLeaf);
  }
  
  /**
   * 선택된 카드 ID 목록 가져오기
   * @returns 선택된 카드 ID 목록
   */
  getSelectedCardIds(): string[] {
    return this.cardInteractionService.getSelectedCardIds();
  }
  
  /**
   * 활성 카드 가져오기
   * @returns 활성 카드 또는 null
   */
  getActiveCard(): ICard | null {
    return this.cardInteractionService.getActiveCard();
  }
  
  /**
   * 포커스 카드 가져오기
   * @returns 포커스 카드 또는 null
   */
  getFocusedCard(): ICard | null {
    return this.cardInteractionService.getFocusedCard();
  }
  
  /**
   * 이벤트 버스 가져오기
   * @returns 이벤트 버스
   */
  getEventBus(): DomainEventBus {
    return this.eventBus;
  }
  
  /**
   * 설정 서비스 가져오기
   * @returns 설정 서비스
   */
  getSettingsService(): ISettingsService {
    return this.settingsService;
  }
  
  /**
   * 카드 캐시 초기화
   * 설정 변경 시 카드를 새로 생성하기 위해 캐시를 초기화합니다.
   */
  clearCardCache(): void {
    console.log('카드 캐시 초기화');
    this.cardCreationService.clearCardCache();
  }
} 