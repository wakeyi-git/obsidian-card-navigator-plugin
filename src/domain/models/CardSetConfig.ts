import { CardSetType } from './CardSet';

/**
 * 카드셋 일반 설정 인터페이스
 */
export interface ICardSetGeneralConfig {
  readonly cardSetType: CardSetType;
}

/**
 * 폴더 카드셋 설정 인터페이스
 */
export interface IFolderCardSetConfig {
  readonly folderCardSetMode: 'active' | 'fixed';
  readonly fixedFolderPath: string;
  readonly includeSubfolders: boolean;
}

/**
 * 태그 카드셋 설정 인터페이스
 */
export interface ITagCardSetConfig {
  readonly tagCardSetMode: 'active' | 'fixed';
  readonly fixedTag: string;
}

/**
 * 링크 카드셋 설정 인터페이스
 */
export interface ILinkCardSetConfig {
  readonly includeBacklinks: boolean;
  readonly includeOutgoingLinks: boolean;
  readonly linkLevel: number;
}

/**
 * 카드셋 설정 인터페이스
 */
export interface ICardSetConfigOptions {
  readonly cardSetGeneral: ICardSetGeneralConfig;
  readonly folderCardSet: IFolderCardSetConfig;
  readonly tagCardSet: ITagCardSetConfig;
  readonly linkCardSet: ILinkCardSetConfig;
}

/**
 * 카드셋 일반 설정 기본값
 */
export const DEFAULT_CARD_SET_GENERAL_CONFIG: ICardSetGeneralConfig = {
  cardSetType: CardSetType.FOLDER
};

/**
 * 폴더 카드셋 설정 기본값
 */
export const DEFAULT_FOLDER_CARD_SET_CONFIG: IFolderCardSetConfig = {
  folderCardSetMode: 'active',
  fixedFolderPath: '',
  includeSubfolders: true
};

/**
 * 태그 카드셋 설정 기본값
 */
export const DEFAULT_TAG_CARD_SET_CONFIG: ITagCardSetConfig = {
  tagCardSetMode: 'active',
  fixedTag: ''
};

/**
 * 링크 카드셋 설정 기본값
 */
export const DEFAULT_LINK_CARD_SET_CONFIG: ILinkCardSetConfig = {
  includeBacklinks: true,
  includeOutgoingLinks: false,
  linkLevel: 1
};

/**
 * 카드셋 설정 기본값
 */
export const DEFAULT_CARD_SET_CONFIG_OPTIONS: ICardSetConfigOptions = {
  cardSetGeneral: DEFAULT_CARD_SET_GENERAL_CONFIG,
  folderCardSet: DEFAULT_FOLDER_CARD_SET_CONFIG,
  tagCardSet: DEFAULT_TAG_CARD_SET_CONFIG,
  linkCardSet: DEFAULT_LINK_CARD_SET_CONFIG
}; 