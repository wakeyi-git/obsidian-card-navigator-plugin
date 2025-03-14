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
   * 모든 카드를 가져옵니다.
   * @returns 카드 배열
   */
  getCards(): ICard[];
  
  /**
   * 현재 카드 세트의 카드를 가져옵니다.
   * @returns 카드 배열
   */
  getCurrentCards(): ICard[];
  
  /**
   * ID로 카드를 가져옵니다.
   * @param id 카드 ID
   * @returns 카드 또는 undefined
   */
  getCardById(id: string): ICard | undefined;
  
  /**
   * 경로로 카드를 가져옵니다.
   * @param path 카드 경로
   * @returns 카드 또는 undefined
   */
  getCardByPath(path: string): ICard | undefined;
  
  /**
   * 태그로 카드를 필터링합니다.
   * @param tag 태그
   * @returns 필터링된 카드 배열
   */
  filterCardsByTag(tag: string): ICard[];
  
  /**
   * 폴더로 카드를 필터링합니다.
   * @param folder 폴더 경로
   * @returns 필터링된 카드 배열
   */
  filterCardsByFolder(folder: string): ICard[];
  
  /**
   * 텍스트로 카드를 검색합니다.
   * @param text 검색 텍스트
   * @returns 검색된 카드 배열
   */
  searchCardsByText(text: string): ICard[];
  
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
  
  private allCards: ICard[] = [];
  private currentCards: ICard[] = [];
  
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
   * 모든 카드를 가져옵니다.
   * @returns 카드 배열
   */
  getCards(): ICard[] {
    return this.allCards;
  }
  
  /**
   * 현재 카드 세트의 카드를 가져옵니다.
   * @returns 카드 배열
   */
  getCurrentCards(): ICard[] {
    return this.currentCards;
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
      this.allCards = await Promise.all(files.map(file => this.cardCreator.createCardFromFile(file)));
      
      console.log(`카드 저장소 새로고침 완료: ${this.allCards.length}개의 카드 생성됨`);
      
      // 카드 변경 이벤트 발생
      this.eventBus.emit(EventType.CARDS_CHANGED, {
        cards: this.allCards,
        totalCount: this.allCards.length,
        filteredCount: this.allCards.length
      });
    } catch (error) {
      console.error('카드 저장소 새로고침 오류:', error);
    }
  }
  
  /**
   * ID로 카드를 가져옵니다.
   * @param id 카드 ID
   * @returns 카드 또는 undefined
   */
  getCardById(id: string): ICard | undefined {
    return this.allCards.find(card => card.getId() === id);
  }
  
  /**
   * 경로로 카드를 가져옵니다.
   * @param path 카드 경로
   * @returns 카드 또는 undefined
   */
  getCardByPath(path: string): ICard | undefined {
    return this.allCards.find(card => card.path === path);
  }
  
  /**
   * 태그로 카드를 필터링합니다.
   * @param tag 태그
   * @returns 필터링된 카드 배열
   */
  filterCardsByTag(tag: string): ICard[] {
    if (!tag) {
      return this.allCards;
    }

    // 태그 앞에 #이 있는 경우 제거
    const normalizedTag = tag.startsWith('#') ? tag.substring(1) : tag;

    return this.allCards.filter(card => {
      if (!card.tags) {
        return false;
      }

      return card.tags.some(cardTag => {
        // 태그 앞에 #이 있는 경우 제거
        const normalizedCardTag = cardTag.startsWith('#') ? cardTag.substring(1) : cardTag;
        return normalizedCardTag.toLowerCase() === normalizedTag.toLowerCase();
      });
    });
  }
  
  /**
   * 폴더로 카드를 필터링합니다.
   * @param folder 폴더 경로
   * @returns 필터링된 카드 배열
   */
  filterCardsByFolder(folder: string): ICard[] {
    if (!folder) {
      return this.allCards;
    }

    return this.allCards.filter(card => {
      const filePath = card.path;
      if (!filePath) {
        return false;
      }
      
      return filePath.startsWith(folder);
    });
  }
  
  /**
   * 텍스트로 카드를 검색합니다.
   * @param text 검색 텍스트
   * @returns 검색된 카드 배열
   */
  searchCardsByText(text: string): ICard[] {
    if (!text) {
      return this.allCards;
    }

    const searchText = text.toLowerCase();

    return this.allCards.filter(card => {
      // 제목 검색
      if (card.title && card.title.toLowerCase().includes(searchText)) {
        return true;
      }
      
      // 내용 검색
      if (card.content && card.content.toLowerCase().includes(searchText)) {
        return true;
      }
      
      // 태그 검색
      if (card.tags && card.tags.some(tag => tag.toLowerCase().includes(searchText))) {
        return true;
      }
      
      // 경로 검색
      if (card.path && card.path.toLowerCase().includes(searchText)) {
        return true;
      }
      
      return false;
    });
  }
} 