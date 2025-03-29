import { Layout } from '@/domain/models/Layout';

/**
 * 레이아웃 리포지토리 인터페이스
 */
export interface ILayoutRepository {
  /**
   * 레이아웃 저장
   * @param layout 저장할 레이아웃
   */
  save(layout: Layout): Promise<void>;

  /**
   * ID로 레이아웃 찾기
   * @param id 레이아웃 ID
   */
  findById(id: string): Promise<Layout | undefined>;

  /**
   * 모든 레이아웃 찾기
   */
  findAll(): Promise<Layout[]>;

  /**
   * 레이아웃 삭제
   * @param id 레이아웃 ID
   */
  delete(id: string): Promise<void>;
} 