/**
 * 정렬 필드 타입
 */
export type SortField = 'fileName' | 'created' | 'modified' | 'custom';

/**
 * 정렬 방향 타입
 */
export type SortDirection = 'asc' | 'desc';

/**
 * 정렬 타입 열거형
 */
export enum SortType {
  NAME = 'name',
  DATE = 'date'
}

/**
 * 정렬 순서 열거형
 */
export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc'
}

/**
 * 정렬 설정 인터페이스
 */
export interface ISortConfig {
  /** 정렬 타입 */
  readonly type: SortType;
  /** 정렬 순서 */
  readonly order: SortOrder;
  /** 정렬 필드 */
  readonly field: SortField;
  /** 정렬 방향 */
  readonly direction: SortDirection;
  /** 사용자 정의 정렬 필드 */
  readonly customField?: string;
}

/**
 * 기본 정렬 설정
 */
export const DEFAULT_SORT_CONFIG: ISortConfig = {
  type: SortType.NAME,
  order: SortOrder.ASC,
  field: 'fileName',
  direction: 'asc'
};

/**
 * 정렬 설정 클래스
 */
export class SortConfig implements ISortConfig {
  constructor(
    public readonly type: SortType,
    public readonly order: SortOrder,
    public readonly field: SortField,
    public readonly direction: SortDirection,
    public readonly customField?: string
  ) {}

  /**
   * 정렬 설정 유효성 검사
   */
  validate(): boolean {
    if (!this.field || !['fileName', 'created', 'modified', 'custom'].includes(this.field)) {
      return false;
    }

    if (!this.direction || !['asc', 'desc'].includes(this.direction)) {
      return false;
    }

    if (this.field === 'custom' && !this.customField) {
      return false;
    }

    return true;
  }

  /**
   * 정렬 설정 미리보기
   */
  preview(): ISortConfig {
    return {
      type: this.type,
      order: this.order,
      field: this.field,
      direction: this.direction,
      customField: this.customField
    };
  }
} 