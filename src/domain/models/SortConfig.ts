/**
 * 정렬 필드
 */
export enum SortField {
  FILENAME = 'filename',
  UPDATED_AT = 'updatedAt',
  CREATED_AT = 'createdAt',
  CUSTOM_FIELD = 'customField'
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
  readonly field: SortField;

  /**
   * 정렬 순서
   */
  readonly order: SortOrder;

  /**
   * 사용자 정의 필드
   */
  readonly customField?: string;

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
  field: SortField.UPDATED_AT, // 수정일 기준 정렬
  order: SortOrder.DESC, // 내림차순 정렬
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
    public readonly customField?: string,
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

    if (this.field === SortField.CUSTOM_FIELD && !this.customField) {
      return false;
    }

    return true;
  }
} 