import { ICardSetProvider } from '../../core/interfaces/manager/ICardSetProvider';
import { CardSetMode } from '../../core/types/cardset.types';
import { ErrorHandler } from '../../utils/error/ErrorHandler';

/**
 * 카드셋 제공자 레지스트리 클래스
 * 다양한 카드셋 제공자를 등록하고 관리합니다.
 */
export class CardSetProviderRegistry {
  /**
   * 카드셋 제공자 맵
   * 카드셋 모드와 해당 제공자를 매핑합니다.
   */
  private providers: Map<CardSetMode, ICardSetProvider> = new Map();
  
  /**
   * 카드셋 제공자 등록
   * @param mode 카드셋 모드
   * @param provider 카드셋 제공자
   */
  registerProvider(mode: CardSetMode, provider: ICardSetProvider): void {
    if (this.providers.has(mode)) {
      // 기존 제공자가 있으면 정리
      const existingProvider = this.providers.get(mode);
      if (existingProvider) {
        try {
          existingProvider.destroy();
        } catch (error) {
          ErrorHandler.getInstance().handleError(
            `기존 카드셋 제공자(${mode}) 정리 중 오류 발생`,
            error
          );
        }
      }
    }
    
    this.providers.set(mode, provider);
  }
  
  /**
   * 카드셋 제공자 가져오기
   * @param mode 카드셋 모드
   * @returns 카드셋 제공자 또는 undefined
   */
  getProvider(mode: CardSetMode): ICardSetProvider | undefined {
    return this.providers.get(mode);
  }
  
  /**
   * 모든 카드셋 제공자 초기화
   */
  initializeAllProviders(): void {
    this.providers.forEach((provider, mode) => {
      try {
        provider.initialize();
      } catch (error) {
        ErrorHandler.getInstance().handleError(
          `카드셋 제공자(${mode}) 초기화 중 오류 발생`,
          error
        );
      }
    });
  }
  
  /**
   * 모든 카드셋 제공자 정리
   */
  cleanupAllProviders(): void {
    this.providers.forEach((provider, mode) => {
      try {
        provider.destroy();
      } catch (error) {
        ErrorHandler.getInstance().handleError(
          `카드셋 제공자(${mode}) 정리 중 오류 발생`,
          error
        );
      }
    });
    
    this.providers.clear();
  }
  
  /**
   * 모든 카드셋 제공자 목록 가져오기
   * @returns 카드셋 제공자 배열
   */
  getAllProviders(): ICardSetProvider[] {
    return Array.from(this.providers.values());
  }
  
  /**
   * 등록된 모든 카드셋 모드 가져오기
   * @returns 카드셋 모드 배열
   */
  getRegisteredModes(): CardSetMode[] {
    return Array.from(this.providers.keys());
  }
}