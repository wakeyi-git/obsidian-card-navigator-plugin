import { ICard } from '../../models/Card';
import { ICardSet, ICardSetConfig, CardSetType, LinkType } from '../../models/CardSet';
import { TFile } from 'obsidian';

/**
 * 카드셋 서비스 인터페이스
 * 
 * @remarks
 * 카드셋 서비스는 카드셋 생성, 관리, 필터링을 담당합니다.
 */
export interface ICardSetService {
  /**
   * 초기화
   */
  initialize(): void;

  /**
   * 정리
   */
  cleanup(): void;

  /**
   * 카드셋 생성
   * @param type 카드셋 타입
   * @param config 카드셋 설정
   * @returns 생성된 카드셋
   */
  createCardSet(type: CardSetType, config: ICardSetConfig): Promise<ICardSet>;

  /**
   * 카드셋 업데이트
   * @param cardSet 업데이트할 카드셋
   * @param config 카드셋 설정
   * @returns 업데이트된 카드셋
   */
  updateCardSet(cardSet: ICardSet, config: ICardSetConfig): Promise<ICardSet>;

  /**
   * 카드셋에 카드 추가
   * @param cardSet 대상 카드셋
   * @param file 추가할 파일
   */
  addCardToSet(cardSet: ICardSet, file: TFile): Promise<void>;

  /**
   * 카드셋에서 카드 제거
   * @param cardSet 대상 카드셋
   * @param file 제거할 파일
   */
  removeCardFromSet(cardSet: ICardSet, file: TFile): Promise<void>;

  /**
   * 카드셋 유효성 검사
   * @param cardSet 검사할 카드셋
   * @returns 유효성 여부
   */
  validateCardSet(cardSet: ICardSet): boolean;

  /**
   * 카드셋의 카드 필터링
   * @param cardSet 카드셋
   * @param filter 필터 함수
   * @returns 필터링된 카드셋
   */
  filterCards(cardSet: ICardSet, filter: (card: ICard) => boolean): Promise<ICardSet>;

  /**
   * 활성 폴더 카드셋 생성
   * @param activeFile 활성 파일
   * @returns 생성된 카드셋
   */
  createActiveFolderCardSet(activeFile: TFile): Promise<ICardSet>;

  /**
   * 지정 폴더 카드셋 생성
   * @param folderPath 폴더 경로
   * @param includeSubfolders 하위 폴더 포함 여부
   * @returns 생성된 카드셋
   */
  createSpecifiedFolderCardSet(folderPath: string, includeSubfolders: boolean): Promise<ICardSet>;

  /**
   * 활성 태그 카드셋 생성
   * @param activeFile 활성 파일
   * @param includeSubtags 하위 태그 포함 여부
   * @param caseSensitive 태그 대소문자 구분 여부
   * @returns 생성된 카드셋
   */
  createActiveTagCardSet(activeFile: TFile, includeSubtags: boolean, caseSensitive: boolean): Promise<ICardSet>;

  /**
   * 지정 태그 카드셋 생성
   * @param tag 태그
   * @param includeSubtags 하위 태그 포함 여부
   * @param caseSensitive 태그 대소문자 구분 여부
   * @returns 생성된 카드셋
   */
  createSpecifiedTagCardSet(tag: string, includeSubtags: boolean, caseSensitive: boolean): Promise<ICardSet>;

  /**
   * 링크 카드셋 생성
   * @param filePath 파일 경로
   * @param linkType 링크 타입
   * @param linkDepth 링크 깊이
   * @returns 생성된 카드셋
   */
  createLinkCardSet(filePath: string, linkType: LinkType, linkDepth: number): Promise<ICardSet>;

  /**
   * 폴더 경로 목록 조회
   * @returns 폴더 경로 목록
   */
  getFolderPaths(): Promise<string[]>;

  /**
   * 태그 목록 조회
   * @returns 태그 목록
   */
  getTags(): Promise<string[]>;

  /**
   * 카드셋 활성화
   * @param cardSetId 카드셋 ID
   */
  activateCardSet(cardSetId: string): Promise<void>;

  /**
   * 카드셋 비활성화
   * @param cardSetId 카드셋 ID
   */
  deactivateCardSet(cardSetId: string): Promise<void>;

  /**
   * 활성 카드셋 조회
   * @returns 활성 카드셋 또는 null
   */
  getActiveCardSet(): Promise<ICardSet | null>;
} 