import { ICard } from '../../domain/card/Card';
import { DomainEventBus } from '../../domain/events/DomainEventBus';
import { EventType } from '../../domain/events/EventTypes';
import { ISort, IPrioritySettings, ISortingService, SortDirection, SortType } from '../../domain/sorting/SortingInterfaces';
import { Sort } from '../../domain/sorting/Sort';
import { ISettingsService } from '../../domain/settings/SettingsInterfaces';

/**
 * 정렬 서비스
 * 정렬 관련 기능을 관리합니다.
 */
export class SortingService implements ISortingService {
  private settingsService: ISettingsService;
  private eventBus: DomainEventBus;
  private currentSort: ISort;
  
  /**
   * 생성자
   * @param settingsService 설정 서비스
   * @param eventBus 이벤트 버스
   */
  constructor(settingsService: ISettingsService, eventBus: DomainEventBus) {
    this.settingsService = settingsService;
    this.eventBus = eventBus;
    
    // 기본 정렬 설정
    const settings = this.settingsService.getSettings();
    this.currentSort = this.createSort(
      settings.sortBy as SortType || 'filename',
      settings.sortOrder || 'asc',
      settings.customSortKey,
      {
        priorityTags: settings.priorityTags || [],
        priorityFolders: settings.priorityFolders || [],
        applyPriorities: true
      }
    );
  }
  
  /**
   * 정렬 생성
   * @param type 정렬 타입
   * @param direction 정렬 방향
   * @param frontmatterKey 프론트매터 키
   * @param prioritySettings 우선 순위 설정
   * @returns 정렬 객체
   */
  createSort(
    type: SortType,
    direction: SortDirection,
    frontmatterKey?: string,
    prioritySettings?: IPrioritySettings
  ): ISort {
    return new Sort(type, direction, frontmatterKey, prioritySettings);
  }
  
  /**
   * 현재 정렬 가져오기
   * @returns 현재 정렬
   */
  getCurrentSort(): ISort {
    return this.currentSort;
  }
  
  /**
   * 정렬 변경
   * @param type 정렬 타입
   * @param direction 정렬 방향
   * @param frontmatterKey 프론트매터 키
   */
  async changeSort(type: SortType, direction: SortDirection, frontmatterKey?: string): Promise<void> {
    // 정렬 설정 업데이트
    this.currentSort = this.createSort(type, direction, frontmatterKey);
    
    // 설정 업데이트
    await this.settingsService.updateSettings({
      sortBy: type,
      sortOrder: direction,
      customSortKey: frontmatterKey
    });
    
    // 정렬 변경 이벤트 발생
    this.eventBus.emit(EventType.SORT_TYPE_CHANGED, {
      sortType: type
    });
    
    // 정렬 방향 변경 이벤트 발생
    this.eventBus.emit(EventType.SORT_DIRECTION_CHANGED, {
      sortDirection: direction
    });
  }
  
  /**
   * 우선 순위 설정 업데이트
   * @param prioritySettings 우선 순위 설정
   */
  async updatePrioritySettings(prioritySettings: IPrioritySettings): Promise<void> {
    // 우선 순위 설정 업데이트
    this.currentSort.prioritySettings = prioritySettings;
    
    // 설정 업데이트
    await this.settingsService.updateSettings({
      priorityTags: prioritySettings.priorityTags,
      priorityFolders: prioritySettings.priorityFolders
    });
    
    // 정렬 변경 이벤트 발생
    this.eventBus.emit(EventType.LAYOUT_SETTINGS_CHANGED, {
      settings: prioritySettings
    });
  }
  
  /**
   * 정렬 방향 전환
   */
  async toggleSortDirection(): Promise<void> {
    // 정렬 방향 전환
    const newDirection = this.currentSort.direction === 'asc' ? 'desc' : 'asc';
    await this.changeSort(this.currentSort.type, newDirection, this.currentSort.frontmatterKey);
  }
  
  /**
   * 카드 정렬
   * @param cards 카드 목록
   * @returns 정렬된 카드 목록
   */
  sortCards(cards: ICard[]): ICard[] {
    return this.currentSort.apply(cards);
  }
  
  /**
   * 우선 순위 적용
   * @param cards 카드 목록
   * @returns 우선 순위가 적용된 카드 목록
   */
  applyPriorities(cards: ICard[]): ICard[] {
    return this.currentSort.applyPriorities(cards);
  }
} 