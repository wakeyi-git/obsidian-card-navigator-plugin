import { ICard, ICardCreateConfig } from '../models/Card';
import { TFile } from 'obsidian';

/**
 * 카드 생성 담당
 * - 카드 객체 생성
 * - 파일 기반 카드 생성
 */
export interface ICardFactory {
  /**
   * 기본 카드 생성
   * @param id 카드 ID
   * @param file 파일 객체
   * @param filePath 파일 경로
   * @param title 노트 제목
   * @param fileName 파일명
   * @param firstHeader 첫 번째 헤더
   * @param content 내용
   * @param tags 태그 목록
   * @param properties 속성
   * @param createdAt 생성일
   * @param updatedAt 수정일
   * @param config 카드 생성 설정
   */
  create(
    id: string,
    file: TFile | null,
    filePath: string,
    title: string,
    fileName: string,
    firstHeader: string | null,
    content: string,
    tags: string[],
    properties: Record<string, unknown>,
    createdAt: Date,
    updatedAt: Date,
    config: ICardCreateConfig
  ): ICard;

  /**
   * 파일 기반 카드 생성
   * @param filePath 파일 경로
   * @param config 카드 생성 설정
   */
  createFromFile(filePath: string, config: ICardCreateConfig): Promise<ICard>;

  /**
   * 카드 ID 생성
   * @param filePath 파일 경로
   * @returns 카드 ID
   */
  generateCardId(filePath: string): string;

  /**
   * 카드 제목 생성
   * @param fileName 파일명
   * @param firstHeader 첫 번째 헤더
   * @param config 카드 생성 설정
   * @returns 카드 제목
   */
  generateCardTitle(
    fileName: string,
    firstHeader: string | null,
    config: ICardCreateConfig
  ): string;

  createCard(file: TFile): Promise<ICard>;
  createCards(files: TFile[]): Promise<ICard[]>;
  updateCard(card: ICard, file: TFile): Promise<ICard>;
  updateCards(cards: ICard[], files: TFile[]): Promise<ICard[]>;
} 