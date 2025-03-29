import { Card } from '@/domain/models/Card';

/**
 * 카드 리포지토리 인터페이스
 */
export interface ICardRepository {
  /**
   * 카드 저장
   * @param card 저장할 카드
   */
  save(card: Card): Promise<void>;

  /**
   * ID로 카드 찾기
   * @param id 카드 ID
   */
  findById(id: string): Promise<Card | undefined>;

  /**
   * 경로로 카드 찾기
   * @param filePath 파일 경로
   */
  findByPath(filePath: string): Promise<Card | undefined>;

  /**
   * 모든 카드 찾기
   */
  findAll(): Promise<Card[]>;

  /**
   * 카드 삭제
   * @param id 카드 ID
   */
  delete(id: string): Promise<void>;
} 