import { Layout, ILayoutConfig } from '@/domain/models/Layout';
import { ILayoutService } from '@/domain/services/ILayoutService';
import { Card } from '@/domain/models/Card';
import { LayoutServiceError } from '@/domain/errors/LayoutServiceError';
import { CardSet } from '@/domain/models/CardSet';

/**
 * 레이아웃 유스케이스 클래스
 */
export class LayoutUseCases {
  constructor(private readonly layoutService: ILayoutService) {}

  /**
   * 레이아웃 생성
   */
  async createLayout(name: string, description: string, config: ILayoutConfig): Promise<Layout> {
    try {
      return await this.layoutService.createLayout(name, description, config);
    } catch (error) {
      throw new LayoutServiceError(`레이아웃 생성 실패: ${error.message}`);
    }
  }

  /**
   * 레이아웃 업데이트
   */
  async updateLayout(layout: Layout): Promise<void> {
    try {
      const existingLayout = await this.layoutService.getLayout(layout.id);
      if (!existingLayout) {
        throw new LayoutServiceError(`레이아웃을 찾을 수 없습니다: ${layout.id}`);
      }
      await this.layoutService.updateLayout(layout);
    } catch (error) {
      throw new LayoutServiceError(`레이아웃 업데이트 실패: ${error.message}`);
    }
  }

  /**
   * 레이아웃 삭제
   */
  async deleteLayout(id: string): Promise<void> {
    try {
      const layout = await this.layoutService.getLayout(id);
      if (!layout) {
        throw new LayoutServiceError(`레이아웃을 찾을 수 없습니다: ${id}`);
      }
      await this.layoutService.deleteLayout(id);
    } catch (error) {
      throw new LayoutServiceError(`레이아웃 삭제 실패: ${error.message}`);
    }
  }

  /**
   * 레이아웃 조회
   */
  async getLayout(id: string): Promise<Layout> {
    const layout = await this.layoutService.getLayout(id);
    if (!layout) {
      throw new LayoutServiceError(`레이아웃을 찾을 수 없습니다: ${id}`);
    }
    return layout;
  }

  /**
   * 모든 레이아웃 조회
   */
  async getAllLayouts(): Promise<Layout[]> {
    try {
      return await this.layoutService.getAllLayouts();
    } catch (error) {
      throw new LayoutServiceError(`레이아웃 목록 조회 실패: ${error.message}`);
    }
  }

  /**
   * 카드 위치 업데이트
   */
  async updateCardPosition(card: Card, x: number, y: number): Promise<void> {
    try {
      this.layoutService.updateCardPosition(card, x, y);
    } catch (error) {
      throw new LayoutServiceError(`카드 위치 업데이트 실패: ${error.message}`);
    }
  }

  /**
   * 카드 크기 업데이트
   */
  async updateCardSize(card: Card, width: number, height: number): Promise<void> {
    try {
      this.layoutService.updateCardSize(card, width, height);
    } catch (error) {
      throw new LayoutServiceError(`카드 크기 업데이트 실패: ${error.message}`);
    }
  }

  /**
   * 카드 Z-인덱스 업데이트
   */
  async updateCardZIndex(card: Card, zIndex: number): Promise<void> {
    try {
      this.layoutService.updateCardZIndex(card, zIndex);
    } catch (error) {
      throw new LayoutServiceError(`카드 Z-인덱스 업데이트 실패: ${error.message}`);
    }
  }

  /**
   * 카드 위치 초기화
   */
  async resetCardPositions(layoutId: string): Promise<void> {
    try {
      const layout = await this.layoutService.getLayout(layoutId);
      if (!layout) {
        throw new LayoutServiceError(`레이아웃을 찾을 수 없습니다: ${layoutId}`);
      }
      await this.layoutService.resetCardPositions(layoutId);
    } catch (error) {
      throw new LayoutServiceError(`카드 위치 초기화 실패: ${error.message}`);
    }
  }

  /**
   * 레이아웃 계산
   */
  async calculateLayout(layoutId: string, containerWidth: number, containerHeight: number): Promise<void> {
    try {
      const layout = await this.layoutService.getLayout(layoutId);
      if (!layout) {
        throw new LayoutServiceError(`레이아웃을 찾을 수 없습니다: ${layoutId}`);
      }

      // 현재 레이아웃의 카드셋 가져오기
      const cardSet = await this._getCurrentCardSet();
      if (!cardSet) {
        throw new LayoutServiceError('현재 카드셋이 없습니다.');
      }

      this.layoutService.calculateLayout(cardSet, containerWidth, containerHeight);
    } catch (error) {
      throw new LayoutServiceError(`레이아웃 계산 실패: ${error.message}`);
    }
  }

  /**
   * 현재 카드셋 가져오기
   */
  private async _getCurrentCardSet(): Promise<CardSet | null> {
    // TODO: CardSetRepository를 통해 현재 카드셋 가져오기
    return null;
  }
} 