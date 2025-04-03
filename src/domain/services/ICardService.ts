import { ICard } from '../models/Card';
import { ICardRenderConfig } from '../models/CardRenderConfig';
import { ICardStyle } from '../models/CardStyle';
import { TFile } from 'obsidian';

/**
 * 카드 서비스 인터페이스
 */
export interface ICardService {
  /**
   * ID로 카드 조회
   * @param id 카드 ID
   */
  getCardById(id: string): Promise<ICard | null>;

  /**
   * 파일 경로로 카드 조회
   * @param filePath 파일 경로
   */
  getCardByPath(filePath: string): Promise<ICard | null>;

  /**
   * 파일로부터 카드 조회
   * @param file 파일
   */
  getCardByFile(file: TFile): Promise<ICard | null>;

  /**
   * 파일로부터 카드 생성
   * @param file 파일
   */
  createFromFile(file: TFile): Promise<ICard | null>;

  /**
   * 카드 업데이트
   * @param card 업데이트할 카드
   */
  updateCard(card: ICard): Promise<void>;

  /**
   * 카드 삭제
   * @param cardId 삭제할 카드 ID
   */
  deleteCard(cardId: string): Promise<void>;

  /**
   * 모든 카드 조회
   */
  getCards(): Promise<ICard[]>;

  /**
   * 카드 렌더링
   * @param card 렌더링할 카드
   * @param config 렌더링 설정
   */
  renderCard(card: ICard, config: ICardRenderConfig): Promise<string>;

  /**
   * 기본 렌더링 설정 반환
   */
  getDefaultRenderConfig(): ICardRenderConfig;

  /**
   * 기본 스타일 반환
   */
  getDefaultStyle(): ICardStyle;
} 