import { TFile } from 'obsidian';
import { CardSetMode, CardSetOptions, ICardSet } from '../../types/cardset.types';
import { SortOption } from '../../types/common.types';
import { ICardSetProvider } from './ICardSetProvider';

/**
 * 카드셋 관리자 인터페이스
 * 카드셋의 상태 관리와 기본 CRUD 작업을 담당합니다.
 */
export interface ICardSetManager {
  /**
   * 카드셋 초기화
   * @param options 카드셋 옵션
   */
  initialize(options?: Partial<CardSetOptions>): Promise<void>;
  
  /**
   * 카드셋 제공자 등록
   * @param provider 카드셋 제공자
   */
  registerProvider(provider: ICardSetProvider): void;
  
  /**
   * 카드셋 모드 설정
   * @param mode 카드셋 모드
   * @param options 모드별 옵션
   */
  setMode(mode: CardSetMode, options?: Partial<CardSetOptions>): Promise<void>;
  
  /**
   * 현재 카드셋 모드 가져오기
   * @returns 카드셋 모드
   */
  getMode(): CardSetMode;
  
  /**
   * 현재 카드셋 가져오기
   * @returns 카드셋
   */
  getCurrentCardSet(): ICardSet;
  
  /**
   * 카드셋 업데이트
   * @param forceRefresh 강제 새로고침 여부
   */
  updateCardSet(forceRefresh?: boolean): Promise<void>;
  
  /**
   * 카드셋에 파일 추가
   * @param file 파일
   * @returns 추가 성공 여부
   */
  addFile(file: TFile): Promise<boolean>;
  
  /**
   * 카드셋에서 파일 제거
   * @param filePath 파일 경로
   * @returns 제거 성공 여부
   */
  removeFile(filePath: string): boolean;
  
  /**
   * 파일 변경 처리
   * @param file 변경된 파일
   * @param changeType 변경 유형
   */
  handleFileChange(file: TFile | null, changeType: string): Promise<void>;
  
  /**
   * 카드셋 정렬 옵션 설정
   * @param sortOption 정렬 옵션
   */
  setSortOption(sortOption: SortOption): void;
  
  /**
   * 현재 정렬 옵션 가져오기
   * @returns 정렬 옵션
   */
  getSortOption(): SortOption;
  
  /**
   * 카드셋 옵션 가져오기
   * @returns 카드셋 옵션
   */
  getOptions(): CardSetOptions;
  
  /**
   * 카드셋 옵션 설정
   * @param options 카드셋 옵션
   */
  setOptions(options: Partial<CardSetOptions>): void;
  
  /**
   * 카드셋 변경 이벤트 구독
   * @param callback 콜백 함수
   * @returns 구독 ID
   */
  subscribeToChanges(callback: (cardSet: ICardSet) => void): string;
  
  /**
   * 카드셋 변경 구독 취소
   * @param subscriptionId 구독 ID
   */
  unsubscribeFromChanges(subscriptionId: string): void;
  
  /**
   * 카드셋 파괴
   */
  destroy(): void;
  
  /**
   * 카드셋 모드 문자열 설정
   * @param mode 카드셋 모드 문자열 ('ACTIVE_FOLDER', 'SELECTED_FOLDER', 'VAULT', 'SEARCH_RESULTS', 'TAG', 'CUSTOM')
   */
  setCardSetType(mode: string): Promise<void>;
} 