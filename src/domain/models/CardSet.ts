import { ICard } from './Card';
import { ICardSetConfig, CardSetType, IFolderCardSetConfig, ITagCardSetConfig, ILinkCardSetConfig } from './CardSetConfig';
import { DEFAULT_FILTER_CONFIG } from './FilterConfig';
import { DEFAULT_SORT_CONFIG } from './SortConfig';
import { DEFAULT_SEARCH_CONFIG } from './SearchConfig';

/**
 * 카드셋 인터페이스
 */
export interface ICardSet {
  /** 카드셋 ID */
  readonly id: string;
  /** 카드셋 설정 */
  readonly config: ICardSetConfig;
  /** 카드 목록 */
  readonly cards: ICard[];
  /** 생성일 */
  readonly createdAt: Date;
  /** 수정일 */
  readonly updatedAt: Date;
}

/**
 * 카드셋 클래스
 */
export class CardSet implements ICardSet {
  constructor(
    public readonly id: string,
    public readonly config: ICardSetConfig,
    public readonly cards: ICard[] = [],
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date()
  ) {}

  /**
   * 폴더 카드셋 생성
   * @param id 카드셋 ID
   * @param config 폴더 카드셋 설정
   * @returns 폴더 카드셋
   */
  static createFolderCardSet(id: string, config: IFolderCardSetConfig): CardSet {
    return new CardSet(id, {
      type: CardSetType.FOLDER,
      folder: config,
      filterConfig: DEFAULT_FILTER_CONFIG,
      sortConfig: DEFAULT_SORT_CONFIG,
      searchConfig: DEFAULT_SEARCH_CONFIG
    });
  }

  /**
   * 태그 카드셋 생성
   * @param id 카드셋 ID
   * @param config 태그 카드셋 설정
   * @returns 태그 카드셋
   */
  static createTagCardSet(id: string, config: ITagCardSetConfig): CardSet {
    return new CardSet(id, {
      type: CardSetType.TAG,
      tag: config,
      filterConfig: DEFAULT_FILTER_CONFIG,
      sortConfig: DEFAULT_SORT_CONFIG,
      searchConfig: DEFAULT_SEARCH_CONFIG
    });
  }

  /**
   * 링크 카드셋 생성
   * @param id 카드셋 ID
   * @param config 링크 카드셋 설정
   * @returns 링크 카드셋
   */
  static createLinkCardSet(id: string, config: ILinkCardSetConfig): CardSet {
    return new CardSet(id, {
      type: CardSetType.LINK,
      link: config,
      filterConfig: DEFAULT_FILTER_CONFIG,
      sortConfig: DEFAULT_SORT_CONFIG,
      searchConfig: DEFAULT_SEARCH_CONFIG
    });
  }

  /**
   * 카드셋 유효성 검사
   * @returns 유효성 여부
   */
  validate(): boolean {
    if (!this.id || !this.config) {
      return false;
    }

    switch (this.config.type) {
      case CardSetType.FOLDER:
        return this.validateFolderConfig();
      case CardSetType.TAG:
        return this.validateTagConfig();
      case CardSetType.LINK:
        return this.validateLinkConfig();
      default:
        return false;
    }
  }

  /**
   * 폴더 카드셋 설정 유효성 검사
   * @returns 유효성 여부
   */
  private validateFolderConfig(): boolean {
    const folderConfig = this.config.folder;
    if (!folderConfig) return false;
    return !!folderConfig.path;
  }

  /**
   * 태그 카드셋 설정 유효성 검사
   * @returns 유효성 여부
   */
  private validateTagConfig(): boolean {
    const tagConfig = this.config.tag;
    if (!tagConfig) return false;
    return tagConfig.tags.length > 0;
  }

  /**
   * 링크 카드셋 설정 유효성 검사
   * @returns 유효성 여부
   */
  private validateLinkConfig(): boolean {
    const linkConfig = this.config.link;
    if (!linkConfig) return false;
    return linkConfig.level > 0;
  }

  /**
   * 카드셋 미리보기
   * @returns 카드셋 미리보기
   */
  preview(): ICardSet {
    return {
      id: this.id,
      config: this.config,
      cards: this.cards,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
} 