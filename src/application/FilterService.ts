import { ICard } from '../domain/card/Card';
import { IFilter, FilterType } from '../domain/filter/Filter';
import { FrontmatterFilter } from '../domain/filter/FrontmatterFilter';
import { TagFilter } from '../domain/filter/TagFilter';
import { FolderFilter } from '../domain/filter/FolderFilter';

/**
 * 필터 서비스 인터페이스
 * 필터 관리를 위한 인터페이스입니다.
 */
export interface IFilterService {
  /**
   * 필터 추가
   * @param filter 추가할 필터
   */
  addFilter(filter: IFilter): void;
  
  /**
   * 필터 제거
   * @param type 제거할 필터 타입
   */
  removeFilter(type: FilterType): void;
  
  /**
   * 특정 타입의 필터 가져오기
   * @param type 필터 타입
   * @returns 필터 또는 null
   */
  getFilter(type: FilterType): IFilter | null;
  
  /**
   * 모든 필터 가져오기
   * @returns 모든 필터 목록
   */
  getAllFilters(): IFilter[];
  
  /**
   * 필터 옵션 가져오기
   * @returns 필터 옵션 객체
   */
  getFilterOptions(): Promise<{
    tags: string[];
    folders: string[];
    frontmatterKeys: string[];
    frontmatterValues: Record<string, string[]>;
  }>;
  
  /**
   * 태그 필터 추가
   * @param tag 태그
   */
  addTagFilter(tag: string): Promise<void>;
  
  /**
   * 폴더 필터 추가
   * @param folder 폴더 경로
   */
  addFolderFilter(folder: string): Promise<void>;
  
  /**
   * 프론트매터 필터 추가
   * @param key 프론트매터 키
   * @param value 프론트매터 값
   */
  addFrontmatterFilter(key: string, value: string): Promise<void>;
  
  /**
   * 모든 필터 가져오기 (별칭)
   * @returns 모든 필터 목록
   */
  getFilters(): Promise<IFilter[]>;
  
  /**
   * 필터 적용
   * @param cards 카드 목록
   * @returns 필터링된 카드 목록
   */
  applyFilters(cards: ICard[]): ICard[];
  
  /**
   * 모든 필터 초기화
   */
  clearFilters(): void;
}

/**
 * 필터 서비스 클래스
 * 필터 관리를 위한 클래스입니다.
 */
export class FilterService implements IFilterService {
  private filters: Map<FilterType, IFilter>;
  
  constructor() {
    this.filters = new Map<FilterType, IFilter>();
  }
  
  addFilter(filter: IFilter): void {
    this.filters.set(filter.type, filter);
  }
  
  removeFilter(type: FilterType): void {
    this.filters.delete(type);
  }
  
  getFilter(type: FilterType): IFilter | null {
    return this.filters.get(type) || null;
  }
  
  getAllFilters(): IFilter[] {
    return Array.from(this.filters.values());
  }
  
  applyFilters(cards: ICard[]): ICard[] {
    let filteredCards = [...cards];
    
    for (const filter of this.filters.values()) {
      filteredCards = filter.apply(filteredCards);
    }
    
    return filteredCards;
  }
  
  clearFilters(): void {
    this.filters.clear();
  }
  
  /**
   * 필터 옵션 가져오기
   * @returns 필터 옵션 객체
   */
  async getFilterOptions(): Promise<{
    tags: string[];
    folders: string[];
    frontmatterKeys: string[];
    frontmatterValues: Record<string, string[]>;
  }> {
    // 실제 구현에서는 Obsidian API를 통해 태그, 폴더, 프론트매터 정보를 가져와야 함
    // 여기서는 임시 데이터 반환
    return {
      tags: [],
      folders: [],
      frontmatterKeys: [],
      frontmatterValues: {}
    };
  }
  
  /**
   * 태그 필터 추가
   * @param tag 태그
   */
  async addTagFilter(tag: string): Promise<void> {
    // TagFilter 클래스가 있다고 가정
    const filter = new TagFilter(tag);
    this.addFilter(filter);
  }
  
  /**
   * 폴더 필터 추가
   * @param folder 폴더 경로
   */
  async addFolderFilter(folder: string): Promise<void> {
    // FolderFilter 클래스가 있다고 가정
    const filter = new FolderFilter(folder);
    this.addFilter(filter);
  }
  
  /**
   * 프론트매터 필터 추가
   * @param key 프론트매터 키
   * @param value 프론트매터 값
   */
  async addFrontmatterFilter(key: string, value: string): Promise<void> {
    let frontmatterFilter = this.getFilter('frontmatter') as FrontmatterFilter;
    
    if (!frontmatterFilter) {
      frontmatterFilter = new FrontmatterFilter(key, [value]);
      this.addFilter(frontmatterFilter);
    } else {
      // 기존 필터의 키가 다르면 새 필터로 교체
      if (frontmatterFilter.getKey() !== key) {
        frontmatterFilter = new FrontmatterFilter(key, [value]);
        this.addFilter(frontmatterFilter);
      } else {
        // 같은 키면 값만 추가
        frontmatterFilter.addValue(value);
      }
    }
  }
  
  /**
   * 모든 필터 가져오기 (별칭)
   * @returns 모든 필터 목록
   */
  async getFilters(): Promise<IFilter[]> {
    return this.getAllFilters();
  }
  
  /**
   * 프론트매터 필터 설정
   * @param key 프론트매터 키
   * @param values 필터 값 목록
   */
  setFrontmatterFilter(key: string, values: string[]): void {
    let frontmatterFilter = this.getFilter('frontmatter') as FrontmatterFilter;
    
    if (!frontmatterFilter) {
      frontmatterFilter = new FrontmatterFilter(key, values);
      this.addFilter(frontmatterFilter);
    } else {
      frontmatterFilter.setKey(key);
      frontmatterFilter.setValue(values);
    }
  }
  
  /**
   * 태그 필터 설정
   * @param tags 태그 목록
   */
  setTagFilter(tags: string[]): void {
    const tagFilter = this.getFilter('tag');
    if (tagFilter) {
      tagFilter.setValue(tags);
    }
  }
  
  /**
   * 폴더 필터 설정
   * @param folders 폴더 목록
   */
  setFolderFilter(folders: string[]): void {
    const folderFilter = this.getFilter('folder');
    if (folderFilter) {
      folderFilter.setValue(folders);
    }
  }
} 