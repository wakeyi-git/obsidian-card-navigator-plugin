import { ItemView, WorkspaceLeaf, App } from 'obsidian';
import { Root, createRoot } from 'react-dom/client';
import { CardNavigatorService } from '../application/CardNavigatorService';
import { CardRepositoryImpl } from '../infrastructure/CardRepositoryImpl';
import { CardFactory } from '../domain/card/CardFactory';
import CardNavigatorPlugin from '../main';
import { CardNavigatorComponent } from './components/CardNavigatorComponent';
import { createCardNavigatorService } from './utils/serviceFactory';

export const VIEW_TYPE_CARD_NAVIGATOR = 'card-navigator-view';

/**
 * 카드 네비게이터 뷰 클래스
 * Obsidian 뷰를 확장하여 카드 네비게이터 UI를 표시합니다.
 */
export class CardNavigatorView extends ItemView {
  private reactComponent: Root | null = null;
  private service: CardNavigatorService | null = null;

  constructor(leaf: WorkspaceLeaf, private plugin: CardNavigatorPlugin) {
    super(leaf);
  }

  getViewType(): string {
    return VIEW_TYPE_CARD_NAVIGATOR;
  }

  getDisplayText(): string {
    return 'Card Navigator';
  }

  getIcon(): string {
    return 'layout-grid';
  }

  async onOpen(): Promise<void> {
    const container = this.containerEl.children[1];
    container.empty();
    container.addClass('card-navigator-container');

    // React 루트 생성
    this.reactComponent = createRoot(container);

    try {
      // 서비스 생성
      const service = await createCardNavigatorService(this.app);
      this.service = service as CardNavigatorService;

      // React 컴포넌트 렌더링
      this.reactComponent.render(
        <CardNavigatorComponent service={service} />
      );
    } catch (error) {
      console.error('카드 네비게이터 뷰 초기화 실패:', error);
      container.setText('카드 네비게이터를 로드하는 중 오류가 발생했습니다.');
    }
  }

  async onClose(): Promise<void> {
    // React 컴포넌트 언마운트
    if (this.reactComponent) {
      this.reactComponent.unmount();
      this.reactComponent = null;
    }
  }
} 