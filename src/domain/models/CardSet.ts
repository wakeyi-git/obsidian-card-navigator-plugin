import { ICard } from './Card';
import { ISearchFilter } from './SearchFilter';
import { ISortConfig } from './SortConfig';

/**
 * 카드셋 타입
 */
export enum CardSetType {
  FOLDER = 'folder',
  TAG = 'tag',
  LINK = 'link'
}

/**
 * 링크 타입
 */
export enum LinkType {
  BACKLINK = 'backlink',
  OUTGOING = 'outgoing'
}

/**
 * 카드셋 설정 인터페이스
 * - 새로운 설정 구조와 일치하도록 수정됨
 */
export interface ICardSetConfig {
  /** 카드셋 일반 설정 */
  readonly cardSetGeneral: {
    /** 카드셋 타입 */
    readonly cardSetType: CardSetType;
  };
  
  /** 폴더 카드셋 설정 */
  readonly folderCardSet: {
    /** 폴더 카드셋 모드 (활성/고정) */
    readonly folderCardSetMode: 'active' | 'fixed';
    /** 고정 폴더 경로 */
    readonly fixedFolderPath: string;
    /** 하위 폴더 포함 여부 */
    readonly includeSubfolders: boolean;
  };
  
  /** 태그 카드셋 설정 */
  readonly tagCardSet: {
    /** 태그 카드셋 모드 (활성/고정) */
    readonly tagCardSetMode: 'active' | 'fixed';
    /** 고정 태그 */
    readonly fixedTag: string;
  };
  
  /** 링크 카드셋 설정 */
  readonly linkCardSet: {
    /** 백링크 포함 여부 */
    readonly includeBacklinks: boolean;
    /** 아웃고잉 링크 포함 여부 */
    readonly includeOutgoingLinks: boolean;
    /** 링크 레벨 */
    readonly linkLevel: number;
  };
  
  /** 검색 필터 */
  readonly searchFilter?: ISearchFilter;
  /** 정렬 설정 */
  readonly sortConfig?: ISortConfig;
  
  /**
   * 카드셋 설정 유효성 검사
   */
  validate(): boolean;
  
  /**
   * 카드셋 설정 미리보기
   */
  preview(): {
    cardSetGeneral: {
      cardSetType: CardSetType;
    };
    folderCardSet: {
      folderCardSetMode: 'active' | 'fixed';
      fixedFolderPath: string;
      includeSubfolders: boolean;
    };
    tagCardSet: {
      tagCardSetMode: 'active' | 'fixed';
      fixedTag: string;
    };
    linkCardSet: {
      includeBacklinks: boolean;
      includeOutgoingLinks: boolean;
      linkLevel: number;
    };
  };
}

/**
 * 카드셋 옵션
 */
export interface ICardSetOptions {
  /** 하위 폴더 포함 여부 */
  readonly includeSubfolders?: boolean;
  /** 정렬 설정 */
  readonly sortConfig?: ISortConfig;
}

/**
 * 카드셋 인터페이스
 * - 카드들의 집합을 관리
 * - 카드셋의 타입과 설정을 관리
 */
export interface ICardSet {
  /** 카드셋 ID */
  readonly id: string;
  /** 카드셋 타입 (폴더, 태그, 링크) */
  readonly type: CardSetType;
  /** 카드셋 기준 (폴더 경로 또는 태그) */
  readonly criteria: string;
  /** 카드셋 설정 */
  readonly config: ICardSetConfig;
  /** 카드셋 옵션 */
  readonly options: ICardSetOptions;
  /** 카드 목록 */
  readonly cards: readonly ICard[];

  /**
   * 카드 셋 유효성 검사
   */
  validate(): boolean;
  
  /**
   * 카드셋 미리보기
   */
  preview(): {
    id: string;
    type: CardSetType;
    criteria: string;
    cardCount: number;
  };
}

/**
 * 기본 카드셋 설정
 */
export const DEFAULT_CARD_SET_CONFIG: ICardSetConfig = {
  cardSetGeneral: {
    cardSetType: CardSetType.FOLDER
  },
  folderCardSet: {
    folderCardSetMode: 'active',
    fixedFolderPath: '',
    includeSubfolders: true
  },
  tagCardSet: {
    tagCardSetMode: 'active',
    fixedTag: ''
  },
  linkCardSet: {
    includeBacklinks: true,
    includeOutgoingLinks: false,
    linkLevel: 1
  },
  searchFilter: undefined,
  sortConfig: undefined,
  
  validate(): boolean {
    return true; // 기본값은 항상 유효
  },
  
  preview(): {
    cardSetGeneral: {
      cardSetType: CardSetType;
    };
    folderCardSet: {
      folderCardSetMode: 'active' | 'fixed';
      fixedFolderPath: string;
      includeSubfolders: boolean;
    };
    tagCardSet: {
      tagCardSetMode: 'active' | 'fixed';
      fixedTag: string;
    };
    linkCardSet: {
      includeBacklinks: boolean;
      includeOutgoingLinks: boolean;
      linkLevel: number;
    };
  } {
    return {
      cardSetGeneral: { ...this.cardSetGeneral },
      folderCardSet: { ...this.folderCardSet },
      tagCardSet: { ...this.tagCardSet },
      linkCardSet: { ...this.linkCardSet }
    };
  }
};

/**
 * 기본 카드셋 옵션
 */
export const DEFAULT_CARD_SET_OPTIONS: ICardSetOptions = {
  includeSubfolders: false,
  sortConfig: undefined
};

/**
 * 기본 카드셋
 */
export const DEFAULT_CARD_SET: ICardSet = {
  id: '',
  type: CardSetType.FOLDER,
  criteria: '',
  config: DEFAULT_CARD_SET_CONFIG,
  options: DEFAULT_CARD_SET_OPTIONS,
  cards: [],

  validate(): boolean {
    return this.id !== '' && this.cards.length >= 0;
  },
  
  preview(): {
    id: string;
    type: CardSetType;
    criteria: string;
    cardCount: number;
  } {
    return {
      id: this.id,
      type: this.type,
      criteria: this.criteria,
      cardCount: this.cards.length
    };
  }
}; 