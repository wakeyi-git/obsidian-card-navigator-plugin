import { IToolbarService } from '../../core/interfaces/service/IToolbarService';
import { CardSetMode } from '../../core/types/cardset.types';
import { SortBy, SortDirection, SortOption } from '../../core/types/common.types';
import { Preset } from '../../core/models/Preset';
import { EventManager } from '../../managers/event/EventManager';
import { ErrorHandler } from '../../utils/error/ErrorHandler';
import { Log } from '../../utils/log/Log';

/**
 * 툴바 서비스 구현체
 */
export class ToolbarService implements IToolbarService {
  private eventManager: EventManager;
  private currentSortBy: SortBy = SortBy.MODIFIED;
  private currentSortDirection: SortDirection = SortDirection.DESC;
  private currentCardSetMode: CardSetMode = CardSetMode.ACTIVE_FOLDER;
  private currentPreset: Preset | null = null;
  private buttonStates: Map<string, { enabled: boolean; visible: boolean }> = new Map();
  private menuStates: Map<string, boolean> = new Map();

  constructor(eventManager: EventManager) {
    this.eventManager = eventManager;
  }

  public setCardSetMode(mode: CardSetMode): void {
    try {
      this.currentCardSetMode = mode;
      this.eventManager.emit('cardset:mode_change', { mode });
      Log.debug('카드셋 모드가 변경되었습니다.', { mode });
    } catch (error) {
      ErrorHandler.getInstance().handleError('카드셋 모드 변경 중 오류가 발생했습니다.', error);
    }
  }

  public getCardSetMode(): CardSetMode {
    return this.currentCardSetMode;
  }

  public setSortOption(option: SortOption): void {
    try {
      this.currentSortBy = option.field;
      this.currentSortDirection = option.direction;
      this.eventManager.emit('sort:change', option);
      Log.debug('정렬 옵션이 변경되었습니다.', option);
    } catch (error) {
      ErrorHandler.getInstance().handleError('정렬 옵션 변경 중 오류가 발생했습니다.', error);
    }
  }

  public getSortOption(): SortOption {
    return {
      field: this.currentSortBy,
      direction: this.currentSortDirection
    };
  }

  public applyPreset(preset: Preset): void {
    try {
      this.currentPreset = preset;
      this.eventManager.emit('preset:change', { preset });
      Log.debug('프리셋이 적용되었습니다.', { preset });
    } catch (error) {
      ErrorHandler.getInstance().handleError('프리셋 적용 중 오류가 발생했습니다.', error);
    }
  }

  public getCurrentPreset(): Preset | null {
    return this.currentPreset;
  }

  public setButtonEnabled(buttonId: string, enabled: boolean): void {
    try {
      const state = this.buttonStates.get(buttonId) || { enabled: true, visible: true };
      state.enabled = enabled;
      this.buttonStates.set(buttonId, state);
      this.eventManager.emit('button:enabled', { buttonId, enabled });
      Log.debug('버튼 활성화 상태가 변경되었습니다.', { buttonId, enabled });
    } catch (error) {
      ErrorHandler.getInstance().handleError('버튼 활성화 상태 변경 중 오류가 발생했습니다.', error);
    }
  }

  public isButtonEnabled(buttonId: string): boolean {
    return this.buttonStates.get(buttonId)?.enabled ?? true;
  }

  public setButtonVisible(buttonId: string, visible: boolean): void {
    try {
      const state = this.buttonStates.get(buttonId) || { enabled: true, visible: true };
      state.visible = visible;
      this.buttonStates.set(buttonId, state);
      this.eventManager.emit('button:visible', { buttonId, visible });
      Log.debug('버튼 표시 상태가 변경되었습니다.', { buttonId, visible });
    } catch (error) {
      ErrorHandler.getInstance().handleError('버튼 표시 상태 변경 중 오류가 발생했습니다.', error);
    }
  }

  public isButtonVisible(buttonId: string): boolean {
    return this.buttonStates.get(buttonId)?.visible ?? true;
  }

  public toggleMenu(menuId: string, open?: boolean): void {
    try {
      const isOpen = open ?? !this.menuStates.get(menuId);
      this.menuStates.set(menuId, isOpen);
      this.eventManager.emit('menu:toggle', { menuId, isOpen });
      Log.debug('메뉴 상태가 변경되었습니다.', { menuId, isOpen });
    } catch (error) {
      ErrorHandler.getInstance().handleError('메뉴 상태 변경 중 오류가 발생했습니다.', error);
    }
  }

  public isMenuOpen(menuId: string): boolean {
    return this.menuStates.get(menuId) ?? false;
  }

  public initialize(): void {
    try {
      Log.info('툴바 서비스가 초기화되었습니다.');
    } catch (error) {
      ErrorHandler.getInstance().handleError('툴바 서비스 초기화 중 오류가 발생했습니다.', error);
    }
  }

  public cleanup(): void {
    try {
      this.eventManager.removeAllListeners('sort:change');
      this.eventManager.removeAllListeners('cardset:mode_change');
      this.eventManager.removeAllListeners('preset:change');
      this.eventManager.removeAllListeners('button:enabled');
      this.eventManager.removeAllListeners('button:visible');
      this.eventManager.removeAllListeners('menu:toggle');
      Log.info('툴바 서비스가 정리되었습니다.');
    } catch (error) {
      ErrorHandler.getInstance().handleError('툴바 서비스 정리 중 오류가 발생했습니다.', error);
    }
  }
} 
  }
} 