import { App } from 'obsidian';
import { ICardSetProvider } from '../../core/interfaces/ICardSetProvider';
import { CardSetType } from '../../core/types/cardset.types';
import { ActiveFolderCardSetProvider } from './ActiveFolderCardSetProvider';
import { SelectedFolderCardSetProvider } from './SelectedFolderCardSetProvider';
import { VaultCardSetProvider } from './VaultCardSetProvider';
import { SearchResultCardSetProvider } from './SearchResultCardSetProvider';
import { ErrorHandler } from '../../utils/error/ErrorHandler';
import { ErrorCode } from '../../core/constants/error.constants';

/**
 * 카드셋 제공자 팩토리 클래스
 * 카드셋 제공자 인스턴스를 생성하는 팩토리 클래스입니다.
 */
export class CardSetProviderFactory {
  /**
   * Obsidian 앱 인스턴스
   */
  private app: App;
  
  /**
   * 생성자
   * @param app Obsidian 앱 인스턴스
   */
  constructor(app: App) {
    this.app = app;
  }
  
  /**
   * 카드셋 제공자 생성
   * @param type 카드셋 제공자 타입
   * @param options 카드셋 제공자 옵션
   * @returns 카드셋 제공자 인스턴스
   * @throws 지원하지 않는 카드셋 제공자 타입인 경우
   */
  createProvider(type: CardSetType, options?: any): ICardSetProvider {
    try {
      switch (type) {
        case CardSetType.ACTIVE_FOLDER:
          return new ActiveFolderCardSetProvider(
            this.app, 
            options?.includeSubfolders ?? true
          );
          
        case CardSetType.SELECTED_FOLDER:
          return new SelectedFolderCardSetProvider(
            this.app, 
            options?.folderPath,
            options?.includeSubfolders ?? true
          );
          
        case CardSetType.VAULT:
          return new VaultCardSetProvider(
            this.app,
            options?.includeHiddenFiles ?? false
          );
          
        case CardSetType.SEARCH_RESULT:
          return new SearchResultCardSetProvider(
            this.app,
            options?.searchQuery ?? ''
          );
          
        default:
          throw ErrorHandler.createError(
            ErrorCode.INVALID_CARDSET_PROVIDER_TYPE,
            `지원하지 않는 카드셋 제공자 타입: ${type}`
          );
      }
    } catch (error) {
      ErrorHandler.handleError(
        'CardSetProviderFactory.createProvider',
        `카드셋 제공자 생성 중 오류 발생: ${error.message}`,
        error
      );
      throw error;
    }
  }
} 