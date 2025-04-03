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
 */
export interface ISortConfig {
  /**
   * 정렬 기준
   */
  field: SortField;

  /**
   * 정렬 순서
   */
  order: SortOrder;

  /**
   * 우선순위 태그
   */
  readonly priorityTags?: readonly string[];

  /**
   * 우선순위 폴더
   */
  readonly priorityFolders?: readonly string[];

  /**
   * 정렬 설정 유효성 검사
   */
  validate(): boolean;
}

/**
 * 기본 정렬 설정
 */
export const DEFAULT_SORT_CONFIG: ISortConfig = {
  field: SortField.FILENAME,
  order: SortOrder.ASC,
  priorityTags: [], // 우선순위 태그 없음
  priorityFolders: [], // 우선순위 폴더 없음

  validate(): boolean {
    return true; // 기본값은 항상 유효
  }
};

/**
 * 정렬 설정 클래스
 */
export class SortConfig implements ISortConfig {
  readonly priorityTags?: readonly string[];
  readonly priorityFolders?: readonly string[];

  constructor(
    public readonly field: SortField,
    public readonly order: SortOrder,
    priorityTags?: string[],
    priorityFolders?: string[]
  ) {
    // 배열을 불변 배열로 만들어 할당
    this.priorityTags = priorityTags ? Object.freeze([...priorityTags]) : undefined;
    this.priorityFolders = priorityFolders ? Object.freeze([...priorityFolders]) : undefined;
  }

  /**
   * 정렬 설정 유효성 검사
   */
  validate(): boolean {
    if (!this.field || !Object.values(SortField).includes(this.field)) {
      return false;
    }

    if (!this.order || !Object.values(SortOrder).includes(this.order)) {
      return false;
    }

    return true;
  }
} 