/**
 * 정렬 기준
 */
export enum SortField {
  FILENAME = 'filename',
  UPDATED = 'updated',
  CREATED = 'created'
}

/**
 * 정렬 순서
 */
export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc'
}

/**
 * 정렬 설정 인터페이스
 * - 정렬 조건을 표현하는 값 객체(Value Object)
 * - 불변(Immutable) 객체로 관리
 * - 새로운 설정 구조와 일치하도록 수정됨
 */
export interface ISortConfig {
  /**
   * 정렬 기준
   */
  readonly sortField: SortField;

  /**
   * 정렬 순서
   */
  readonly sortOrder: SortOrder;

  /**
   * 우선순위 태그
   */
  readonly priorityTags: string[];

  /**
   * 우선순위 폴더
   */
  readonly priorityFolders: string[];

  /**
   * 정렬 설정 유효성 검사
   */
  validate(): boolean;
  
  /**
   * 정렬 설정 미리보기
   */
  preview(): {
    sortField: SortField;
    sortOrder: SortOrder;
    priorityTags: string[];
    priorityFolders: string[];
  };
}

/**
 * 기본 정렬 설정
 */
export const DEFAULT_SORT_CONFIG: ISortConfig = {
  sortField: SortField.UPDATED,
  sortOrder: SortOrder.DESC,
  priorityTags: [], // 우선순위 태그 없음
  priorityFolders: [], // 우선순위 폴더 없음

  validate(): boolean {
    return true; // 기본값은 항상 유효
  },
  
  preview(): {
    sortField: SortField;
    sortOrder: SortOrder;
    priorityTags: string[];
    priorityFolders: string[];
  } {
    return {
      sortField: this.sortField,
      sortOrder: this.sortOrder,
      priorityTags: [...this.priorityTags],
      priorityFolders: [...this.priorityFolders]
    };
  }
};

/**
 * 정렬 설정 클래스
 */
export class SortConfig implements ISortConfig {
  readonly priorityTags: string[];
  readonly priorityFolders: string[];

  constructor(
    public readonly sortField: SortField,
    public readonly sortOrder: SortOrder,
    priorityTags: string[] = [],
    priorityFolders: string[] = []
  ) {
    // 배열을 복사하여 할당
    this.priorityTags = [...priorityTags];
    this.priorityFolders = [...priorityFolders];
  }

  /**
   * 정렬 설정 유효성 검사
   */
  validate(): boolean {
    if (!this.sortField || !Object.values(SortField).includes(this.sortField)) {
      return false;
    }

    if (!this.sortOrder || !Object.values(SortOrder).includes(this.sortOrder)) {
      return false;
    }

    return true;
  }
  
  /**
   * 정렬 설정 미리보기
   */
  preview(): {
    sortField: SortField;
    sortOrder: SortOrder;
    priorityTags: string[];
    priorityFolders: string[];
  } {
    return {
      sortField: this.sortField,
      sortOrder: this.sortOrder,
      priorityTags: [...this.priorityTags],
      priorityFolders: [...this.priorityFolders]
    };
  }
} 