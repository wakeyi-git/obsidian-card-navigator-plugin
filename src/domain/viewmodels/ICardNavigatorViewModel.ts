import { ICardNavigatorState } from '@/domain/models/CardNavigatorState';
import { BehaviorSubject } from 'rxjs';

export interface ICardNavigatorViewModel {
  /**
   * 현재 상태
   */
  state: BehaviorSubject<ICardNavigatorState>;

  /**
   * 뷰모델 초기화
   */
  initialize(): void;

  /**
   * 뷰모델 정리
   */
  cleanup(): void;

  /**
   * 현재 상태 가져오기
   */
  getState(): ICardNavigatorState;

  /**
   * 상태 구독
   * @param callback 상태가 변경될 때마다 호출될 콜백 함수
   */
  subscribe(callback: (state: ICardNavigatorState) => void): void;

  /**
   * 상태 구독 해제
   * @param callback 구독 해제할 콜백 함수
   */
  unsubscribe(callback: (state: ICardNavigatorState) => void): void;
} 