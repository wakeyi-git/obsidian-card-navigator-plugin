import { ItemView, WorkspaceLeaf } from 'obsidian';

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
   * 뷰 새로고침
   * 뷰의 내용을 새로고침합니다.
   */
  refresh(): void {
    // 뷰 컨테이너 가져오기
    const container = this.containerEl.children[1].querySelector('.card-navigator-container');
    if (container) {
      // 이벤트 발생 - 뷰 새로고침 요청
      const event = new CustomEvent('card-navigator-refresh', {
        detail: { container }
      });
      document.dispatchEvent(event);
    }
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
    // 컨테이너 비우기
    const container = this.containerEl.children[1];
    container.empty();
    
    // 부모 클래스의 onunload 호출
    await super.onunload();
    
    console.log('카드 네비게이터 뷰 언로드 완료');
  }
} 