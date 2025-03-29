import { App, TFile } from 'obsidian';
import { Card } from '../models/Card';
import { CardContent, CardStyle, CardPosition } from '../models/types';

/**
 * 카드 리포지토리 인터페이스
 */
export interface ICardRepository {
  /**
   * 파일로부터 카드를 생성합니다.
   */
  createFromFile(file: TFile, app: App): Promise<Card>;

  /**
   * ID로 카드를 조회합니다.
   */
  findById(id: string): Promise<Card | null>;

  /**
   * 파일로 카드를 조회합니다.
   */
  findByFile(file: TFile): Promise<Card | null>;

  /**
   * 카드의 컨텐츠를 업데이트합니다.
   */
  updateContent(id: string, content: CardContent): Promise<void>;

  /**
   * 카드의 스타일을 업데이트합니다.
   */
  updateStyle(id: string, style: CardStyle): Promise<void>;

  /**
   * 카드의 위치를 업데이트합니다.
   */
  updatePosition(id: string, position: CardPosition): Promise<void>;

  /**
   * 카드를 삭제합니다.
   */
  delete(id: string): Promise<void>;
} 