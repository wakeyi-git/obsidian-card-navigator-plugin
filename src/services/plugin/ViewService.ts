import { ItemView, View, WorkspaceLeaf } from 'obsidian';
import { ObsidianService } from '../core/ObsidianService';

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
      await leaf.detach();
    }
  }
  
  /**
   * 뷰 타입 가져오기
   * @returns 뷰 타입
   */
  getViewType(): string {
    return this.viewType;
  }
}

/**
 * 카드 네비게이터 뷰
 * 카드 네비게이터 플러그인의 사이드 패널 뷰입니다.
 */
export class CardNavigatorView extends ItemView {
  /**
   * 생성자
   * @param leaf 워크스페이스 리프
   */
  constructor(leaf: WorkspaceLeaf) {
    super(leaf);
  }
  
  /**
   * 뷰 타입 가져오기
   * @returns 뷰 타입
   */
  getViewType(): string {
    return 'card-navigator';
  }
  
  /**
   * 뷰 표시 이름 가져오기
   * @returns 뷰 표시 이름
   */
  getDisplayText(): string {
    return '카드 네비게이터';
  }
  
  /**
   * 아이콘 가져오기
   * @returns 아이콘 ID
   */
  getIcon(): string {
    return 'layers-3';
  }
  
  /**
   * 뷰 로드
   */
  async onload(): Promise<void> {
    super.onload();
    
    // 뷰 컨테이너 생성
    const container = this.containerEl.children[1];
    container.empty();
    container.createEl('div', { cls: 'card-navigator-container' });
  }
  
  /**
   * 뷰 언로드
   */
  async onunload(): Promise<void> {
    // 정리 작업 수행
  }
} 