import { TFile } from 'obsidian';
import { CardSet } from '../models/CardSet';
import { CardSetMode } from '../types/cardset.types';

/**
 * 카드셋 제공자 인터페이스
 * 다양한 소스(폴더, 검색 결과 등)에서 카드셋을 로드하고 관리하는 기능을 정의합니다.
 */
export interface ICardSetProvider {
  /**
   * 제공자 타입
   * 카드셋 제공자의 유형을 식별합니다.
   */
  readonly type: CardSetMode;
  
  /**
   * 카드셋 로드
   * 제공자 유형에 따라 카드셋을 로드합니다.
   * @param options 로드 옵션 (검색 쿼리, 폴더 경로 등)
   * @returns 로드된 카드셋
   */
  loadCardSet(options?: Record<string, any>): Promise<CardSet>;
  
  /**
   * 카드셋 새로고침
   * 기존 카드셋을 새로고침하여 최신 상태로 업데이트합니다.
   * @param currentCardSet 현재 카드셋
   * @returns 새로고침된 카드셋
   * @throws 카드셋 새로고침 중 오류가 발생한 경우
   */
  refreshCardSet(currentCardSet: CardSet): Promise<CardSet>;
  
  /**
   * 파일 변경 처리
   * 파일 생성, 수정, 삭제 등의 변경 사항을 처리합니다.
   * @param file 변경된 파일
   * @param changeType 변경 유형 ('create', 'modify', 'delete' 등)
   * @param currentCardSet 현재 카드셋
   * @returns 업데이트된 카드셋 또는 업데이트 필요 여부
   */
  handleFileChange(file: TFile | null, changeType: string, currentCardSet: CardSet): Promise<CardSet | boolean>;
  
  /**
   * 제공자가 파일을 포함하는지 확인
   * 특정 파일이 이 제공자의 범위에 포함되는지 확인합니다.
   * @param file 확인할 파일
   * @returns 포함 여부
   */
  containsFile(file: TFile): boolean;
  
  /**
   * 제공자 옵션 설정
   * @param options 제공자 옵션
   */
  setOptions(options: Record<string, any>): void;
  
  /**
   * 제공자 초기화
   * 제공자를 초기화하고 필요한 리소스를 설정합니다.
   * @param options 초기화 옵션
   */
  initialize(options?: Record<string, any>): void;
  
  /**
   * 제공자 정리
   * 제공자가 사용한 리소스를 정리합니다.
   */
  destroy(): void;
} 