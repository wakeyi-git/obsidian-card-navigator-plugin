import { App } from 'obsidian';
import { ICardSetProvider } from '../../core/interfaces/manager/ICardSetProvider';
import { CardSetMode } from '../../core/types/cardset.types';
import { ErrorHandler } from '../../utils/error/ErrorHandler';
import { ActiveFolderCardSetProvider } from './ActiveFolderCardSetProvider';
import { SearchResultCardSetProvider } from './SearchResultCardSetProvider';
import { SelectedFolderCardSetProvider } from './SelectedFolderCardSetProvider';
import { VaultCardSetProvider } from './VaultCardSetProvider';

/**
 * 카드셋 제공자 팩토리 클래스
 * 카드셋 모드에 따라 적절한 카드셋 제공자를 생성합니다.
 */
export class CardSetProviderFactory {
  /**
   * 생성자
   * @param app Obsidian 앱 인스턴스
   */
  constructor(private app: App) {}
  
  /**
   * 카드셋 제공자 생성
   * @param mode 카드셋 모드
   * @returns 카드셋 제공자
   */
  createProvider(mode: CardSetMode): ICardSetProvider | null {
    try {
      switch (mode) {
        case CardSetMode.ACTIVE_FOLDER:
          return new ActiveFolderCardSetProvider(this.app);
          
        case CardSetMode.SELECTED_FOLDER:
          return new SelectedFolderCardSetProvider(this.app);
          
        case CardSetMode.VAULT:
          return new VaultCardSetProvider(this.app);
          
        case CardSetMode.SEARCH_RESULTS:
          return new SearchResultCardSetProvider(this.app);
          
        default:
          throw new Error(`지원되지 않는 카드셋 모드: ${mode}`);
      }
    } catch (error) {
      ErrorHandler.getInstance().handleError(
        `카드셋 제공자 생성 중 오류 발생: ${mode}`,
        error
      );
      return null;
    }
  }
} 