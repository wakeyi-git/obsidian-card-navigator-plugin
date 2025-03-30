import { Card } from '@/domain/models/Card';
import { TFile } from 'obsidian';
import { ICardRenderConfig, ICardStyle } from '@/domain/models/Card';

/**
 * 카드 서비스 인터페이스
 */
export interface ICardService {
  /**
   * ID로 카드 조회
   * @param id 카드 ID
   */
  getCardById(id: string): Promise<Card | null>;

  /**
   * 파일 경로로 카드 조회
   * @param filePath 파일 경로
   */
  getCardByPath(filePath: string): Promise<Card | null>;

  /**
   * 파일로부터 카드 생성
   * @param file 파일
   */
  createFromFile(file: TFile): Promise<Card>;

  /**
   * 카드 업데이트
   * @param card 업데이트할 카드
   */
  updateCard(card: Card): Promise<void>;

  /**
   * 카드 삭제
   * @param cardId 삭제할 카드 ID
   */
  deleteCard(cardId: string): Promise<void>;

  /**
   * 모든 카드 조회
   */
  getCards(): Promise<Card[]>;

  /**
   * 카드 렌더링
   * @param card 렌더링할 카드
   * @param config 렌더링 설정
   */
  renderCard(card: Card, config: ICardRenderConfig): Promise<string>;

  /**
   * 기본 렌더링 설정 반환
   */
  getDefaultRenderConfig(): ICardRenderConfig;

  /**
   * 기본 스타일 반환
   */
  getDefaultStyle(): ICardStyle;
} 