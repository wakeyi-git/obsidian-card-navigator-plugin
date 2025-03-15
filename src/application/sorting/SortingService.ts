import { ICard } from '../../domain/card/Card';
import { DomainEventBus } from '../../core/events/DomainEventBus';
import { EventType } from '../../domain/events/EventTypes';
import { ISettingsService } from '../../domain/settings/SettingsInterfaces';
import { ISort, IPrioritySettings } from '../../domain/sorting/SortingInterfaces';

/**
 * 정렬 타입
 */
export type SortType = 'filename' | 'title' | 'created' | 'modified' | 'path' | 'frontmatter';

/**
 * 정렬 방향
 */
export type SortDirection = 'asc' | 'desc';

/**
 * 정렬 서비스 인터페이스
 */
export interface ISortingService {
  /**
   * 카드 정렬
   * @param cards 카드 목록
   * @param sortType 정렬 타입
   * @param sortDirection 정렬 방향
   * @returns 정렬된 카드 목록
   */
  sortCards(cards: ICard[], sortType?: SortType, sortDirection?: SortDirection): ICard[];
  
  /**
   * 현재 정렬 타입 가져오기
   * @returns 현재 정렬 타입
   */
  getCurrentSortType(): SortType;
  
  /**
   * 현재 정렬 방향 가져오기
   * @returns 현재 정렬 방향
   */
  getCurrentSortDirection(): SortDirection;
  
  /**
   * 정렬 타입 설정
   * @param sortType 정렬 타입
   */
  setSortType(sortType: SortType): void;
  
  /**
   * 정렬 방향 설정
   * @param sortDirection 정렬 방향
   */
  setSortDirection(sortDirection: SortDirection): void;
  
  /**
   * 프론트매터 정렬 키 설정
   * @param key 프론트매터 키
   */
  setFrontmatterSortKey(key: string): void;
  
  /**
   * 프론트매터 정렬 키 가져오기
   * @returns 프론트매터 정렬 키
   */
  getFrontmatterSortKey(): string;
  
  /**
   * 정렬 변경
   * @param sortType 정렬 타입
   * @param sortDirection 정렬 방향
   * @param frontmatterKey 프론트매터 키
   */
  changeSort(sortType: SortType, sortDirection: SortDirection, frontmatterKey?: string): Promise<void>;
}

/**
 * 정렬 서비스
 * 카드 정렬을 관리합니다.
 */
export class SortingService implements ISortingService {
  private settingsService: ISettingsService;
  private eventBus: DomainEventBus;
  private currentSortType: SortType;
  private currentSortDirection: SortDirection;
  private frontmatterSortKey: string;
  
  /**
   * 생성자
   * @param settingsService 설정 서비스
   * @param eventBus 이벤트 버스
   */
  constructor(settingsService: ISettingsService, eventBus: DomainEventBus) {
    this.settingsService = settingsService;
    this.eventBus = eventBus;
    
    // 설정에서 정렬 설정 로드
    const settings = this.settingsService.getSettings();
    this.currentSortType = settings.defaultSortType as SortType || 'filename';
    this.currentSortDirection = settings.defaultSortDirection as SortDirection || 'asc';
    this.frontmatterSortKey = settings.frontmatterKey || 'status';
    
    // 설정 변경 이벤트 리스너 등록
    this.eventBus.on(EventType.SETTINGS_CHANGED, this.handleSettingsChanged.bind(this));
  }
  
  /**
   * 카드 정렬
   * @param cards 카드 목록
   * @param sortType 정렬 타입
   * @param sortDirection 정렬 방향
   * @returns 정렬된 카드 목록
   */
  sortCards(cards: ICard[], sortType?: SortType, sortDirection?: SortDirection): ICard[] {
    // 정렬 타입과 방향 설정
    const type = sortType || this.currentSortType;
    const direction = sortDirection || this.currentSortDirection;
    
    // 정렬 함수 선택
    let sortFn: (a: ICard, b: ICard) => number;
    
    switch (type) {
      case 'filename':
        sortFn = this.sortByFilename.bind(this);
        break;
      case 'title':
        sortFn = this.sortByTitle.bind(this);
        break;
      case 'created':
        sortFn = this.sortByCreated.bind(this);
        break;
      case 'modified':
        sortFn = this.sortByModified.bind(this);
        break;
      case 'path':
        sortFn = this.sortByPath.bind(this);
        break;
      case 'frontmatter':
        sortFn = this.sortByFrontmatter.bind(this);
        break;
      default:
        sortFn = this.sortByFilename.bind(this);
    }
    
    // 정렬 방향에 따라 정렬
    const sortedCards = [...cards].sort((a, b) => {
      const result = sortFn(a, b);
      return direction === 'asc' ? result : -result;
    });
    
    return sortedCards;
  }
  
  /**
   * 현재 정렬 타입 가져오기
   * @returns 현재 정렬 타입
   */
  getCurrentSortType(): SortType {
    return this.currentSortType;
  }
  
  /**
   * 현재 정렬 방향 가져오기
   * @returns 현재 정렬 방향
   */
  getCurrentSortDirection(): SortDirection {
    return this.currentSortDirection;
  }
  
  /**
   * 정렬 타입 설정
   * @param sortType 정렬 타입
   */
  setSortType(sortType: SortType): void {
    this.currentSortType = sortType;
    
    // 설정 저장
    this.settingsService.updateSettings({
      defaultSortType: sortType
    });
    
    // 정렬 변경 이벤트 발생
    this.eventBus.emit(EventType.SOURCE_CHANGED, {
      sortType: this.currentSortType,
      sortDirection: this.currentSortDirection
    });
  }
  
  /**
   * 정렬 방향 설정
   * @param sortDirection 정렬 방향
   */
  setSortDirection(sortDirection: SortDirection): void {
    this.currentSortDirection = sortDirection;
    
    // 설정 저장
    this.settingsService.updateSettings({
      defaultSortDirection: sortDirection
    });
    
    // 정렬 변경 이벤트 발생
    this.eventBus.emit(EventType.SOURCE_CHANGED, {
      sortType: this.currentSortType,
      sortDirection: this.currentSortDirection
    });
  }
  
  /**
   * 프론트매터 정렬 키 설정
   * @param key 프론트매터 키
   */
  setFrontmatterSortKey(key: string): void {
    this.frontmatterSortKey = key;
    
    // 설정 저장
    this.settingsService.updateSettings({
      frontmatterKey: key
    });
    
    // 정렬 변경 이벤트 발생
    this.eventBus.emit(EventType.SOURCE_CHANGED, {
      sortType: this.currentSortType,
      sortDirection: this.currentSortDirection,
      frontmatterSortKey: key
    });
  }
  
  /**
   * 프론트매터 정렬 키 가져오기
   * @returns 프론트매터 정렬 키
   */
  getFrontmatterSortKey(): string {
    return this.frontmatterSortKey;
  }
  
  /**
   * 정렬 변경
   * @param sortType 정렬 타입
   * @param sortDirection 정렬 방향
   * @param frontmatterKey 프론트매터 키
   */
  async changeSort(sortType: SortType, sortDirection: SortDirection, frontmatterKey?: string): Promise<void> {
    // 정렬 상태 업데이트
    this.currentSortType = sortType;
    this.currentSortDirection = sortDirection;
    if (frontmatterKey) {
      this.frontmatterSortKey = frontmatterKey;
    }
    
    // 설정 업데이트
    await this.settingsService.updateSettings({
      sortBy: sortType,
      sortDirection: sortDirection,
      frontmatterKey: frontmatterKey
    });
    
    // 정렬 변경 이벤트 발생
    this.eventBus.emit(EventType.SOURCE_CHANGED, {
      sortType: this.currentSortType,
      sortDirection: this.currentSortDirection,
      frontmatterKey: this.frontmatterSortKey
    });
  }
  
  /**
   * 파일명으로 정렬
   * @param a 카드 A
   * @param b 카드 B
   * @returns 비교 결과
   */
  private sortByFilename(a: ICard, b: ICard): number {
    return a.filename.localeCompare(b.filename);
  }
  
  /**
   * 제목으로 정렬
   * @param a 카드 A
   * @param b 카드 B
   * @returns 비교 결과
   */
  private sortByTitle(a: ICard, b: ICard): number {
    return (a.title || '').localeCompare(b.title || '');
  }
  
  /**
   * 생성일로 정렬
   * @param a 카드 A
   * @param b 카드 B
   * @returns 비교 결과
   */
  private sortByCreated(a: ICard, b: ICard): number {
    const dateA = a.created ? new Date(a.created).getTime() : 0;
    const dateB = b.created ? new Date(b.created).getTime() : 0;
    return dateA - dateB;
  }
  
  /**
   * 수정일로 정렬
   * @param a 카드 A
   * @param b 카드 B
   * @returns 비교 결과
   */
  private sortByModified(a: ICard, b: ICard): number {
    const dateA = a.modified ? new Date(a.modified).getTime() : 0;
    const dateB = b.modified ? new Date(b.modified).getTime() : 0;
    return dateA - dateB;
  }
  
  /**
   * 경로로 정렬
   * @param a 카드 A
   * @param b 카드 B
   * @returns 비교 결과
   */
  private sortByPath(a: ICard, b: ICard): number {
    return (a.path || '').localeCompare(b.path || '');
  }
  
  /**
   * 프론트매터로 정렬
   * @param a 카드 A
   * @param b 카드 B
   * @returns 비교 결과
   */
  private sortByFrontmatter(a: ICard, b: ICard): number {
    const valueA = a.frontmatter?.[this.frontmatterSortKey] || '';
    const valueB = b.frontmatter?.[this.frontmatterSortKey] || '';
    
    // 숫자인 경우 숫자 비교
    if (!isNaN(Number(valueA)) && !isNaN(Number(valueB))) {
      return Number(valueA) - Number(valueB);
    }
    
    // 문자열 비교
    return String(valueA).localeCompare(String(valueB));
  }
  
  /**
   * 설정 변경 처리
   * @param data 이벤트 데이터
   */
  private handleSettingsChanged(data: any): void {
    if (!data || !data.settings) return;
    
    const settings = data.settings;
    const changedKeys = data.changedKeys || [];
    
    // 정렬 관련 설정이 변경된 경우
    if (
      changedKeys.includes('defaultSortType') ||
      changedKeys.includes('defaultSortDirection') ||
      changedKeys.includes('frontmatterKey')
    ) {
      // 정렬 타입 업데이트
      if (settings.defaultSortType && settings.defaultSortType !== this.currentSortType) {
        this.currentSortType = settings.defaultSortType as SortType;
      }
      
      // 정렬 방향 업데이트
      if (settings.defaultSortDirection && settings.defaultSortDirection !== this.currentSortDirection) {
        this.currentSortDirection = settings.defaultSortDirection as SortDirection;
      }
      
      // 프론트매터 정렬 키 업데이트
      if (settings.frontmatterKey && settings.frontmatterKey !== this.frontmatterSortKey) {
        this.frontmatterSortKey = settings.frontmatterKey;
      }
    }
  }
} 