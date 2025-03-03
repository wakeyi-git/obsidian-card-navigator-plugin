import { Menu } from 'obsidian';
import { IToolbarService } from '../../../core/interfaces/service/IToolbarService';
import { CardSetMode } from '../../../core/types/cardset.types';
import { ErrorHandler } from '../../../utils/error/ErrorHandler';
import { Log } from '../../../utils/log/Log';
import { ToolbarButton } from './ToolbarButton';

/**
 * 카드셋 메뉴 옵션 인터페이스
 */
export interface CardSetMenuOptions {
  mode: CardSetMode;
  selectedFolderPath?: string;
  onFolderSelect?: (path: string) => void;
}

/**
 * 카드셋 메뉴 컴포넌트
 */
export class CardSetMenu {
  private toolbarService: IToolbarService;
  private button: ToolbarButton;
  private options: CardSetMenuOptions;

  constructor(toolbarService: IToolbarService, options: CardSetMenuOptions) {
    this.toolbarService = toolbarService;
    this.options = options;
    this.button = this.createCardSetButton();
  }

  /**
   * 카드셋 버튼 생성
   */
  private createCardSetButton(): ToolbarButton {
    try {
      return new ToolbarButton(this.toolbarService, {
        id: 'cardset-menu-button',
        icon: this.getCardSetIcon(),
        tooltip: '카드셋 모드',
        onClick: () => this.showCardSetMenu(),
      });
    } catch (error) {
      ErrorHandler.getInstance().handleError('카드셋 버튼 생성 중 오류가 발생했습니다.', error);
      throw error;
    }
  }

  /**
   * 카드셋 메뉴 표시
   */
  private showCardSetMenu(): void {
    try {
      const menu = new Menu();

      // 활성 폴더 모드
      menu.addItem((item) =>
        item
          .setTitle('활성 폴더')
          .setIcon('folder')
          .setChecked(this.options.mode === CardSetMode.ACTIVE_FOLDER)
          .onClick(() => this.setMode(CardSetMode.ACTIVE_FOLDER))
      );

      // 선택 폴더 모드
      menu.addItem((item) =>
        item
          .setTitle('선택 폴더')
          .setIcon('folder-input')
          .setChecked(this.options.mode === CardSetMode.SELECTED_FOLDER)
          .onClick(() => {
            if (this.options.onFolderSelect) {
              this.options.onFolderSelect(this.options.selectedFolderPath || '');
            }
            this.setMode(CardSetMode.SELECTED_FOLDER);
          })
      );

      // 볼트 전체 모드
      menu.addItem((item) =>
        item
          .setTitle('볼트 전체')
          .setIcon('vault')
          .setChecked(this.options.mode === CardSetMode.VAULT)
          .onClick(() => this.setMode(CardSetMode.VAULT))
      );

      // 검색 결과 모드
      menu.addItem((item) =>
        item
          .setTitle('검색 결과')
          .setIcon('search')
          .setChecked(this.options.mode === CardSetMode.SEARCH)
          .onClick(() => this.setMode(CardSetMode.SEARCH))
      );

      menu.showAtMouseEvent(event);
    } catch (error) {
      ErrorHandler.getInstance().handleError('카드셋 메뉴 표시 중 오류가 발생했습니다.', error);
    }
  }

  /**
   * 카드셋 모드 설정
   */
  private setMode(mode: CardSetMode): void {
    try {
      this.options.mode = mode;
      this.toolbarService.updateCardSetMode(mode);
      this.button.setIcon(this.getCardSetIcon());
    } catch (error) {
      ErrorHandler.getInstance().handleError('카드셋 모드 설정 중 오류가 발생했습니다.', error);
    }
  }

  /**
   * 카드셋 아이콘 반환
   */
  private getCardSetIcon(): string {
    switch (this.options.mode) {
      case CardSetMode.ACTIVE_FOLDER:
        return 'folder';
      case CardSetMode.SELECTED_FOLDER:
        return 'folder-input';
      case CardSetMode.VAULT:
        return 'vault';
      case CardSetMode.SEARCH:
        return 'search';
      default:
        return 'folder';
    }
  }

  /**
   * 버튼 엘리먼트 반환
   */
  public getElement(): HTMLElement {
    return this.button.getElement();
  }

  /**
   * 메뉴 제거
   */
  public remove(): void {
    try {
      this.button.remove();
      Log.debug('카드셋 메뉴가 제거되었습니다.');
    } catch (error) {
      ErrorHandler.getInstance().handleError('카드셋 메뉴 제거 중 오류가 발생했습니다.', error);
    }
  }
} 