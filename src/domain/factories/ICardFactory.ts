import { ICard } from '../models/Card';

/**
 * 카드 생성 담당
 * - 카드 객체 생성
 * - 파일 기반 카드 생성
 */
export interface ICardFactory {
  /**
   * 기본 카드 생성
   * @param filePath 파일 경로
   * @param fileName 파일명
   * @param firstHeader 첫 번째 헤더
   * @param content 내용
   * @param tags 태그 목록
   * @param createdAt 생성일
   * @param updatedAt 수정일
   * @param metadata 메타데이터
   */
  create(
    filePath: string,
    fileName: string,
    firstHeader: string | null,
    content: string,
    tags: string[],
    createdAt: Date,
    updatedAt: Date,
    metadata: Record<string, any>
  ): ICard;

  /**
   * 파일 기반 카드 생성
   * @param filePath 파일 경로
   */
  createFromFile(filePath: string): Promise<ICard>;
} 