import { ICard } from '../models/Card';
import { ICardRenderConfig } from '../models/CardRenderConfig';
import { NoteTitleDisplayType } from '../models/Card';

/**
 * 카드 생성 설정
 */
export interface ICardCreateConfig {
  filePath: string;
  fileName: string;
  firstHeader: string | null;
  content: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  metadata: Record<string, any>;
  renderConfig: ICardRenderConfig;
  titleDisplayType?: NoteTitleDisplayType;
}

/**
 * 카드 팩토리 인터페이스
 */
export interface ICardFactory {
  /**
   * 기본 카드 생성
   * @param config 카드 생성 설정
   */
  create(config: ICardCreateConfig): ICard;

  /**
   * 파일 기반 카드 생성
   * @param filePath 파일 경로
   * @param renderConfig 렌더링 설정
   */
  createFromFile(
    filePath: string,
    renderConfig: ICardRenderConfig
  ): Promise<ICard>;
} 