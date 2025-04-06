/**
 * 필터 타입 열거형
 */
export enum FilterType {
  TAG = 'tag',
  FOLDER = 'folder',
  LINK = 'link'
}

/**
 * 날짜 범위 인터페이스
 */
export interface IDateRange {
  /** 시작일 */
  readonly start: Date;
  /** 종료일 */
  readonly end: Date;
}

/**
 * 필터 설정 인터페이스
 */
export interface IFilterConfig {
  /** 필터 타입 */
  readonly type: FilterType;
  /** 필터 기준 */
  readonly criteria: string;
  /** 하위 폴더 포함 여부 */
  readonly includeSubfolders: boolean;
  /** 하위 태그 포함 여부 */
  readonly includeSubtags: boolean;
  /** 링크 깊이 */
  readonly linkDepth: number;
  /** 우선순위 태그 */
  readonly priorityTags?: string[];
  /** 우선순위 폴더 */
  readonly priorityFolders?: string[];
  /** 태그 목록 */
  readonly tags?: string[];
  /** 폴더 목록 */
  readonly folders?: string[];
  /** 생성일 범위 */
  readonly createdDateRange?: IDateRange;
  /** 수정일 범위 */
  readonly modifiedDateRange?: IDateRange;
}

/**
 * 기본 필터 설정
 */
export const DEFAULT_FILTER_CONFIG: IFilterConfig = {
  type: FilterType.FOLDER,
  criteria: '',
  includeSubfolders: false,
  includeSubtags: false,
  linkDepth: 1,
  priorityTags: [],
  priorityFolders: [],
  tags: [],
  folders: []
};

/**
 * 필터 설정 클래스
 */
export class FilterConfig implements IFilterConfig {
  constructor(
    public readonly type: FilterType,
    public readonly criteria: string,
    public readonly includeSubfolders: boolean = false,
    public readonly includeSubtags: boolean = false,
    public readonly linkDepth: number = 1,
    public readonly priorityTags: string[] = [],
    public readonly priorityFolders: string[] = [],
    public readonly tags: string[] = [],
    public readonly folders: string[] = [],
    public readonly createdDateRange?: IDateRange,
    public readonly modifiedDateRange?: IDateRange
  ) {}

  /**
   * 필터 설정 유효성 검사
   */
  validate(): boolean {
    if (!Object.values(FilterType).includes(this.type)) {
      return false;
    }

    if (!this.criteria) {
      return false;
    }

    if (this.type === FilterType.LINK && (!this.linkDepth || this.linkDepth < 1)) {
      return false;
    }

    return true;
  }
} 