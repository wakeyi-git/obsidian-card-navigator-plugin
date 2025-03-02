import { App } from 'obsidian';
import { ICardSetService } from '../../core/interfaces/ICardSetService';
import { Card } from '../../core/models/Card';
import { CardFilterOption, CardFilterType } from '../../core/types/cardset.types';
import { ErrorHandler } from '../../utils/error/ErrorHandler';
import { Log } from '../../utils/log/Log';

/**
 * 카드셋 필터 서비스 클래스
 * 카드셋 필터링 관련 기능을 제공합니다.
 */
export class CardSetFilterService {
  private app: App;
  private cardSetService: ICardSetService;
  private activeFilters: CardFilterOption[] = [];
  
  /**
   * 카드셋 필터 서비스 생성자
   * @param app Obsidian 앱 인스턴스
   * @param cardSetService 카드셋 서비스 인스턴스
   */
  constructor(app: App, cardSetService: ICardSetService) {
    try {
      this.app = app;
      this.cardSetService = cardSetService;
      
      Log.debug('카드셋 필터 서비스 생성됨');
    } catch (error) {
      ErrorHandler.handleError('카드셋 필터 서비스 생성 중 오류 발생', error);
    }
  }
  
  /**
   * 필터 추가
   * @param filterOption 필터 옵션
   */
  async addFilter(filterOption: CardFilterOption): Promise<void> {
    try {
      Log.debug(`필터 추가: ${filterOption.type}, ${filterOption.value}`);
      
      // 동일한 필터가 이미 있는지 확인
      const existingFilterIndex = this.activeFilters.findIndex(
        filter => filter.type === filterOption.type && 
                 filter.value === filterOption.value && 
                 filter.field === filterOption.field
      );
      
      // 동일한 필터가 없는 경우에만 추가
      if (existingFilterIndex === -1) {
        this.activeFilters.push(filterOption);
      }
    } catch (error) {
      ErrorHandler.handleError('필터 추가 중 오류 발생', error);
    }
  }
  
  /**
   * 필터 제거
   * @param filterOption 필터 옵션
   */
  async removeFilter(filterOption: CardFilterOption): Promise<void> {
    try {
      Log.debug(`필터 제거: ${filterOption.type}, ${filterOption.value}`);
      
      // 동일한 필터 찾기
      const existingFilterIndex = this.activeFilters.findIndex(
        filter => filter.type === filterOption.type && 
                 filter.value === filterOption.value && 
                 filter.field === filterOption.field
      );
      
      // 필터가 있는 경우 제거
      if (existingFilterIndex !== -1) {
        this.activeFilters.splice(existingFilterIndex, 1);
      }
    } catch (error) {
      ErrorHandler.handleError('필터 제거 중 오류 발생', error);
    }
  }
  
  /**
   * 필터 토글
   * @param filterOption 필터 옵션
   */
  async toggleFilter(filterOption: CardFilterOption): Promise<void> {
    try {
      Log.debug(`필터 토글: ${filterOption.type}, ${filterOption.value}`);
      
      // 동일한 필터 찾기
      const existingFilterIndex = this.activeFilters.findIndex(
        filter => filter.type === filterOption.type && 
                 filter.value === filterOption.value && 
                 filter.field === filterOption.field
      );
      
      // 필터가 있는 경우 제거, 없는 경우 추가
      if (existingFilterIndex !== -1) {
        this.activeFilters.splice(existingFilterIndex, 1);
      } else {
        this.activeFilters.push(filterOption);
      }
    } catch (error) {
      ErrorHandler.handleError('필터 토글 중 오류 발생', error);
    }
  }
  
  /**
   * 모든 필터 제거
   */
  async clearFilters(): Promise<void> {
    try {
      Log.debug('모든 필터 제거');
      
      // 필터 배열 초기화
      this.activeFilters = [];
    } catch (error) {
      ErrorHandler.handleError('모든 필터 제거 중 오류 발생', error);
    }
  }
  
  /**
   * 특정 타입의 필터 제거
   * @param filterType 필터 타입
   */
  async clearFiltersByType(filterType: CardFilterType): Promise<void> {
    try {
      Log.debug(`${filterType} 타입 필터 제거`);
      
      // 특정 타입의 필터만 제거
      this.activeFilters = this.activeFilters.filter(filter => filter.type !== filterType);
    } catch (error) {
      ErrorHandler.handleError(`${filterType} 타입 필터 제거 중 오류 발생`, error);
    }
  }
  
  /**
   * 활성 필터 가져오기
   * @returns 활성 필터 배열
   */
  getActiveFilters(): CardFilterOption[] {
    return [...this.activeFilters];
  }
  
  /**
   * 필터 적용
   * @returns 필터링된 카드 배열
   */
  async applyFilters(): Promise<Card[]> {
    try {
      Log.debug(`필터 적용: ${this.activeFilters.length}개 필터`);
      
      // 필터가 없는 경우 모든 카드 반환
      if (this.activeFilters.length === 0) {
        return this.cardSetService.getAllCards();
      }
      
      // 카드셋 서비스에 필터링 요청
      return this.cardSetService.filterCards(this.activeFilters);
    } catch (error) {
      ErrorHandler.handleError('필터 적용 중 오류 발생', error);
      return [];
    }
  }
  
  /**
   * 필터 옵션 생성
   * @param type 필터 타입
   * @param value 필터 값
   * @param field 필터 필드 (프론트매터 필터에서 사용)
   * @param operator 필터 연산자 (프론트매터 필터에서 사용)
   * @returns 필터 옵션
   */
  createFilterOption(
    type: CardFilterType, 
    value: string, 
    field?: string, 
    operator?: string
  ): CardFilterOption {
    return {
      type,
      value,
      field,
      operator
    };
  }
  
  /**
   * 사용 가능한 태그 필터 옵션 가져오기
   * @returns 태그 필터 옵션 배열
   */
  async getAvailableTagFilters(): Promise<CardFilterOption[]> {
    try {
      // 모든 카드 가져오기
      const allCards = await this.cardSetService.getAllCards();
      
      // 모든 태그 수집
      const tagSet = new Set<string>();
      
      for (const card of allCards) {
        for (const tag of card.tags) {
          tagSet.add(tag);
        }
      }
      
      // 태그 필터 옵션 생성
      return Array.from(tagSet).map(tag => this.createFilterOption('tag', tag));
    } catch (error) {
      ErrorHandler.handleError('사용 가능한 태그 필터 가져오기 중 오류 발생', error);
      return [];
    }
  }
  
  /**
   * 사용 가능한 폴더 필터 옵션 가져오기
   * @returns 폴더 필터 옵션 배열
   */
  async getAvailableFolderFilters(): Promise<CardFilterOption[]> {
    try {
      // 모든 카드 가져오기
      const allCards = await this.cardSetService.getAllCards();
      
      // 모든 폴더 경로 수집
      const folderSet = new Set<string>();
      
      for (const card of allCards) {
        if (card.folderPath) {
          folderSet.add(card.folderPath);
          
          // 상위 폴더도 추가
          let parentPath = card.folderPath;
          while (parentPath.includes('/')) {
            parentPath = parentPath.substring(0, parentPath.lastIndexOf('/'));
            folderSet.add(parentPath);
          }
        }
      }
      
      // 폴더 필터 옵션 생성
      return Array.from(folderSet).map(folder => this.createFilterOption('folder', folder));
    } catch (error) {
      ErrorHandler.handleError('사용 가능한 폴더 필터 가져오기 중 오류 발생', error);
      return [];
    }
  }
  
  /**
   * 사용 가능한 프론트매터 필드 가져오기
   * @returns 프론트매터 필드 배열
   */
  async getAvailableFrontmatterFields(): Promise<string[]> {
    try {
      // 모든 카드 가져오기
      const allCards = await this.cardSetService.getAllCards();
      
      // 모든 프론트매터 필드 수집
      const fieldSet = new Set<string>();
      
      for (const card of allCards) {
        if (card.frontmatter) {
          for (const field in card.frontmatter) {
            fieldSet.add(field);
          }
        }
      }
      
      // 프론트매터 필드 배열 반환
      return Array.from(fieldSet);
    } catch (error) {
      ErrorHandler.handleError('사용 가능한 프론트매터 필드 가져오기 중 오류 발생', error);
      return [];
    }
  }
  
  /**
   * 필터 서비스 파괴
   */
  destroy(): void {
    try {
      Log.debug('카드셋 필터 서비스 파괴');
      
      // 필터 초기화
      this.activeFilters = [];
    } catch (error) {
      ErrorHandler.handleError('카드셋 필터 서비스 파괴 중 오류 발생', error);
    }
  }
} 