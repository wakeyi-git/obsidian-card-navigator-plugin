import { Menu } from 'obsidian';
import { IToolbarService } from '../../../core/interfaces/service/IToolbarService';
import { SortBy, SortDirection } from '../../../core/types/common.types';
import { ErrorHandler } from '../../../utils/error/ErrorHandler';
import { Log } from '../../../utils/log/Log';
import { ToolbarButton } from './ToolbarButton';

/**
 * 정렬 메뉴 옵션 인터페이스
 */
export interface SortMenuOptions {
  sortBy: SortBy;
  direction: SortDirection;
}

/**
 * 정렬 메뉴 컴포넌트
 */
export class SortMenu {
  private toolbarService: IToolbarService;
  private button: ToolbarButton;
  private options: SortMenuOptions;

  constructor(toolbarService: IToolbarService, options: SortMenuOptions) {
    this.toolbarService = toolbarService;
    this.options = options;
    this.button = this.createSortButton();
  }

  /**
   * 정렬 버튼 생성
   */
  private createSortButton(): ToolbarButton {
    try {
      return new ToolbarButton(this.toolbarService, {
        id: 'sort-menu-button',
        icon: this.getSortIcon(),
        tooltip: '정렬 옵션',
        onClick: () => this.showSortMenu(),
      });
    } catch (error) {
      ErrorHandler.getInstance().handleError('정렬 버튼 생성 중 오류가 발생했습니다.', error);
      throw error;
    }
  }

  /**
   * 정렬 메뉴 표시
   */
  private showSortMenu(): void {
    try {
      const menu = new Menu();

      // 파일명으로 정렬
      menu.addItem((item) =>
        item
          .setTitle('파일명')
          .setIcon('document')
          .setChecked(this.options.sortBy === SortBy.NAME)
          .onClick(() => this.updateSort(SortBy.NAME))
      );

      // 생성일로 정렬
      menu.addItem((item) =>
        item
          .setTitle('생성일')
          .setIcon('calendar')
          .setChecked(this.options.sortBy === SortBy.CREATED)
          .onClick(() => this.updateSort(SortBy.CREATED))
      );

      // 수정일로 정렬
      menu.addItem((item) =>
        item
          .setTitle('수정일')
          .setIcon('clock')
          .setChecked(this.options.sortBy === SortBy.MODIFIED)
          .onClick(() => this.updateSort(SortBy.MODIFIED))
      );

      // 파일 크기로 정렬
      menu.addItem((item) =>
        item
          .setTitle('파일 크기')
          .setIcon('file')
          .setChecked(this.options.sortBy === SortBy.SIZE)
          .onClick(() => this.updateSort(SortBy.SIZE))
      );

      menu.addSeparator();

      // 정렬 방향
      menu.addItem((item) =>
        item
          .setTitle('오름차순')
          .setIcon('arrow-up')
          .setChecked(this.options.direction === SortDirection.ASC)
          .onClick(() => this.toggleSortDirection())
      );

      menu.showAtMouseEvent(event);
    } catch (error) {
      ErrorHandler.getInstance().handleError('정렬 메뉴 표시 중 오류가 발생했습니다.', error);
    }
  }

  /**
   * 정렬 기준 업데이트
   */
  private updateSort(sortBy: SortBy): void {
    try {
      this.options.sortBy = sortBy;
      this.toolbarService.updateSort(sortBy, this.options.direction);
      this.button.setIcon(this.getSortIcon());
    } catch (error) {
      ErrorHandler.getInstance().handleError('정렬 기준 업데이트 중 오류가 발생했습니다.', error);
    }
  }

  /**
   * 정렬 방향 토글
   */
  private toggleSortDirection(): void {
    try {
      const newDirection = this.options.direction === SortDirection.ASC
        ? SortDirection.DESC
        : SortDirection.ASC;
      
      this.options.direction = newDirection;
      this.toolbarService.updateSort(this.options.sortBy, newDirection);
      this.button.setIcon(this.getSortIcon());
    } catch (error) {
      ErrorHandler.getInstance().handleError('정렬 방향 토글 중 오류가 발생했습니다.', error);
    }
  }

  /**
   * 정렬 아이콘 반환
   */
  private getSortIcon(): string {
    const directionIcon = this.options.direction === SortDirection.ASC ? 'arrow-up' : 'arrow-down';
    
    switch (this.options.sortBy) {
      case SortBy.NAME:
        return `sort-by-alpha-${directionIcon}`;
      case SortBy.CREATED:
        return `calendar-${directionIcon}`;
      case SortBy.MODIFIED:
        return `clock-${directionIcon}`;
      case SortBy.SIZE:
        return `file-${directionIcon}`;
      default:
        return `sort-${directionIcon}`;
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
      Log.debug('정렬 메뉴가 제거되었습니다.');
    } catch (error) {
      ErrorHandler.getInstance().handleError('정렬 메뉴 제거 중 오류가 발생했습니다.', error);
    }
  }
} 