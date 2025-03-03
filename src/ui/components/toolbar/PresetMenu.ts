import { Menu } from 'obsidian';
import { IToolbarService } from '../../../core/interfaces/service/IToolbarService';
import { IPreset } from '../../../core/types/preset.types';
import { ErrorHandler } from '../../../utils/error/ErrorHandler';
import { Log } from '../../../utils/log/Log';
import { ToolbarButton } from './ToolbarButton';

/**
 * 프리셋 메뉴 옵션 인터페이스
 */
export interface PresetMenuOptions {
  currentPreset: IPreset | null;
  presets: IPreset[];
  onPresetCreate?: () => void;
  onPresetEdit?: (preset: IPreset) => void;
  onPresetDelete?: (preset: IPreset) => void;
  onPresetImport?: () => void;
  onPresetExport?: (preset: IPreset) => void;
}

/**
 * 프리셋 메뉴 컴포넌트
 */
export class PresetMenu {
  private toolbarService: IToolbarService;
  private button: ToolbarButton;
  private options: PresetMenuOptions;

  constructor(toolbarService: IToolbarService, options: PresetMenuOptions) {
    this.toolbarService = toolbarService;
    this.options = options;
    this.button = this.createPresetButton();
  }

  /**
   * 프리셋 버튼 생성
   */
  private createPresetButton(): ToolbarButton {
    try {
      return new ToolbarButton(this.toolbarService, {
        id: 'preset-menu-button',
        icon: this.getPresetIcon(),
        tooltip: '프리셋 메뉴',
        onClick: () => this.showPresetMenu(),
      });
    } catch (error) {
      ErrorHandler.getInstance().handleError('프리셋 버튼 생성 중 오류가 발생했습니다.', error);
      throw error;
    }
  }

  /**
   * 프리셋 메뉴 표시
   */
  private showPresetMenu(): void {
    try {
      const menu = new Menu();

      // 프리셋 목록
      if (this.options.presets.length > 0) {
        this.options.presets.forEach((preset) => {
          menu.addItem((item) =>
            item
              .setTitle(preset.name)
              .setIcon('check')
              .setChecked(this.options.currentPreset?.id === preset.id)
              .onClick(() => this.selectPreset(preset))
          );
        });

        menu.addSeparator();
      }

      // 프리셋 생성
      menu.addItem((item) =>
        item
          .setTitle('새 프리셋 생성')
          .setIcon('plus')
          .onClick(() => {
            if (this.options.onPresetCreate) {
              this.options.onPresetCreate();
            }
          })
      );

      // 현재 프리셋이 있는 경우 편집/삭제/내보내기 옵션 표시
      if (this.options.currentPreset) {
        menu.addItem((item) =>
          item
            .setTitle('현재 프리셋 편집')
            .setIcon('edit')
            .onClick(() => {
              if (this.options.onPresetEdit) {
                this.options.onPresetEdit(this.options.currentPreset!);
              }
            })
        );

        menu.addItem((item) =>
          item
            .setTitle('현재 프리셋 삭제')
            .setIcon('trash')
            .onClick(() => {
              if (this.options.onPresetDelete) {
                this.options.onPresetDelete(this.options.currentPreset!);
              }
            })
        );

        menu.addItem((item) =>
          item
            .setTitle('현재 프리셋 내보내기')
            .setIcon('export')
            .onClick(() => {
              if (this.options.onPresetExport) {
                this.options.onPresetExport(this.options.currentPreset!);
              }
            })
        );
      }

      // 프리셋 가져오기
      menu.addItem((item) =>
        item
          .setTitle('프리셋 가져오기')
          .setIcon('import')
          .onClick(() => {
            if (this.options.onPresetImport) {
              this.options.onPresetImport();
            }
          })
      );

      menu.showAtMouseEvent(event);
    } catch (error) {
      ErrorHandler.getInstance().handleError('프리셋 메뉴 표시 중 오류가 발생했습니다.', error);
    }
  }

  /**
   * 프리셋 선택
   */
  private selectPreset(preset: IPreset): void {
    try {
      this.options.currentPreset = preset;
      this.toolbarService.updatePreset(preset);
      this.button.setIcon(this.getPresetIcon());
    } catch (error) {
      ErrorHandler.getInstance().handleError('프리셋 선택 중 오류가 발생했습니다.', error);
    }
  }

  /**
   * 프리셋 아이콘 반환
   */
  private getPresetIcon(): string {
    return this.options.currentPreset ? 'check-square' : 'square';
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
      Log.debug('프리셋 메뉴가 제거되었습니다.');
    } catch (error) {
      ErrorHandler.getInstance().handleError('프리셋 메뉴 제거 중 오류가 발생했습니다.', error);
    }
  }
} 