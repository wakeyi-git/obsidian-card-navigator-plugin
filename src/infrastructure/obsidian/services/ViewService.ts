import { ItemView, Plugin, WorkspaceLeaf, View } from 'obsidian';
import { ObsidianService } from '../adapters/ObsidianService';
import { DomainEventBus } from '../../../core/events/DomainEventBus';
import { EventType } from '../../../domain/events/EventTypes';
import { CardNavigatorView } from '../../../ui/views/cardNavigator/CardNavigatorView';

/**
 * 뷰 서비스 인터페이스
 */
export interface IViewService {
  /**
   * 뷰 등록
   * @param viewCreator 뷰 생성자
   */
  registerView(viewCreator: (leaf: WorkspaceLeaf) => View): void;
  
  /**
   * 뷰 활성화
   * @returns 활성화된 리프
   */
  activateView(): Promise<WorkspaceLeaf | null>;
  
  /**
   * 뷰 비활성화
   */
  deactivateView(): Promise<void>;
  
  /**
   * 뷰 타입 가져오기
   * @returns 뷰 타입
   */
  getViewType(): string;
}

/**
 * 뷰 서비스
 * 사이드 패널 뷰를 관리합니다.
 */
export class ViewService implements IViewService {
  private obsidianService: ObsidianService;
  private viewType: string;
  
  /**
   * 생성자
   * @param obsidianService Obsidian 서비스
   * @param viewType 뷰 타입
   */
  constructor(obsidianService: ObsidianService, viewType: string) {
    this.obsidianService = obsidianService;
    this.viewType = viewType;
  }
  
  /**
   * 뷰 등록
   * @param viewCreator 뷰 생성자
   */
  registerView(viewCreator: (leaf: WorkspaceLeaf) => View): void {
    this.obsidianService.registerView(this.viewType, viewCreator);
  }
  
  /**
   * 뷰 활성화
   * @returns 활성화된 리프
   */
  async activateView(): Promise<WorkspaceLeaf | null> {
    return await this.obsidianService.activateView(this.viewType);
  }
  
  /**
   * 뷰 비활성화
   */
  async deactivateView(): Promise<void> {
    const workspace = this.obsidianService.getWorkspace();
    const leaves = workspace.getLeavesOfType(this.viewType);
    
    for (const leaf of leaves) {
      try {
        // 뷰 인스턴스 가져오기
        const view = leaf.view;
        
        // 뷰가 CardNavigatorView 인스턴스인 경우 onunload 호출
        if (view instanceof CardNavigatorView) {
          await view.onunload();
        }
        
        // 리프 분리
        await leaf.detach();
      } catch (error) {
        console.error('뷰 비활성화 중 오류 발생:', error);
      }
    }
    
    console.log('뷰 비활성화 완료');
  }
  
  /**
   * 뷰 타입 가져오기
   * @returns 뷰 타입
   */
  getViewType(): string {
    return this.viewType;
  }
} 