import { CardSet } from '../../core/models/CardSet';
import { CardSetMode, CardSetOptions, CardSortOption, ICardSet } from '../../core/types/cardset.types';
import { ErrorHandler } from '../../utils/error/ErrorHandler';
import { generateUniqueId } from '../../utils/helpers/string.helper';

/**
 * 카드셋 상태 관리자 클래스
 * 카드셋의 상태(모드, 옵션, 정렬 등)를 관리합니다.
 */
export class CardSetStateManager {
  /**
   * 현재 카드셋
   */
  private currentCardSet: CardSet;
  
  /**
   * 현재 카드셋 모드
   */
  private currentMode: CardSetMode = CardSetMode.ACTIVE_FOLDER;
  
  /**
   * 카드셋 옵션
   */
  private options: CardSetOptions;
  
  /**
   * 정렬 옵션
   */
  private sortOption: CardSortOption;
  
  /**
   * 변경 구독자 맵
   * 구독 ID와 콜백 함수를 매핑합니다.
   */
  private changeSubscribers: Map<string, (cardSet: CardSet) => void> = new Map();
  
  /**
   * 생성자
   * @param options 초기 카드셋 옵션
   */
  constructor(options?: Partial<CardSetOptions>) {
    // 기본 옵션 설정
    this.options = {
      mode: CardSetMode.ACTIVE_FOLDER,
      sortOption: {
        field: 'name',
        direction: 'asc'
      },
      filterOptions: [],
      groupOption: {
        by: 'none'
      },
      includeSubfolders: true,
      showHiddenFiles: false,
      autoRefresh: true,
      ...options
    };
    
    // 기본 정렬 옵션 설정
    this.sortOption = {
      field: 'name',
      direction: 'asc'
    };
    
    // 빈 카드셋으로 초기화
    this.currentCardSet = new CardSet(
      `cardset-${Date.now()}`,
      this.currentMode,
      null,
      []
    );
  }
  
  /**
   * 현재 카드셋 모드 설정
   * @param mode 카드셋 모드
   */
  setMode(mode: CardSetMode): void {
    this.currentMode = mode;
  }
  
  /**
   * 현재 카드셋 모드 가져오기
   * @returns 카드셋 모드
   */
  getMode(): CardSetMode {
    return this.currentMode;
  }
  
  /**
   * 현재 카드셋 설정
   * @param cardSet 카드셋
   */
  setCurrentCardSet(cardSet: ICardSet): void {
    // ICardSet을 CardSet으로 변환하여 저장
    if (cardSet instanceof CardSet) {
      this.currentCardSet = cardSet;
    } else {
      // ICardSet 인터페이스만 구현한 객체인 경우 CardSet 인스턴스로 변환
      this.currentCardSet = new CardSet(
        cardSet.id,
        cardSet.mode,
        cardSet.source,
        cardSet.files
      );
    }
    this.notifySubscribers();
  }
  
  /**
   * 현재 카드셋 가져오기
   * @returns 카드셋
   */
  getCurrentCardSet(): ICardSet {
    return this.currentCardSet;
  }
  
  /**
   * 카드셋 정렬 옵션 설정
   * @param sortOption 정렬 옵션
   */
  setSortOption(sortOption: CardSortOption): void {
    this.sortOption = sortOption;
  }
  
  /**
   * 현재 정렬 옵션 가져오기
   * @returns 정렬 옵션
   */
  getSortOption(): CardSortOption {
    return this.sortOption;
  }
  
  /**
   * 카드셋 옵션 가져오기
   * @returns 카드셋 옵션
   */
  getOptions(): CardSetOptions {
    return { ...this.options };
  }
  
  /**
   * 카드셋 옵션 설정
   * @param options 카드셋 옵션
   */
  setOptions(options: Partial<CardSetOptions>): void {
    this.options = {
      ...this.options,
      ...options
    };
  }
  
  /**
   * 카드셋 변경 이벤트 구독
   * @param callback 콜백 함수
   * @returns 구독 ID
   */
  subscribeToChanges(callback: (cardSet: ICardSet) => void): string {
    const subscriptionId = generateUniqueId();
    // 타입 호환성을 위해 콜백 함수를 래핑
    this.changeSubscribers.set(subscriptionId, (cardSet: CardSet) => {
      callback(cardSet);
    });
    return subscriptionId;
  }
  
  /**
   * 카드셋 변경 구독 취소
   * @param subscriptionId 구독 ID
   */
  unsubscribeFromChanges(subscriptionId: string): void {
    this.changeSubscribers.delete(subscriptionId);
  }
  
  /**
   * 구독자에게 변경 알림
   */
  private notifySubscribers(): void {
    try {
      this.changeSubscribers.forEach(callback => {
        try {
          callback(this.currentCardSet);
        } catch (error) {
          ErrorHandler.getInstance().handleError(
            '카드셋 변경 구독자 콜백 실행 중 오류 발생',
            error
          );
        }
      });
    } catch (error) {
      ErrorHandler.getInstance().handleError(
        '카드셋 변경 구독자 알림 중 오류 발생',
        error
      );
    }
  }
  
  /**
   * 상태 관리자 정리
   */
  destroy(): void {
    this.changeSubscribers.clear();
  }
} 