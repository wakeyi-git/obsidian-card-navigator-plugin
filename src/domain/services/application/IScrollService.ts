import { ICard } from '@/domain/models/Card';

/**
 * 스크롤 서비스 인터페이스
 */
export interface IScrollService {
  /**
   * 초기화
   */
  initialize(): void;

  /**
   * 정리
   */
  cleanup(): void;

  /**
   * 초기화 여부 확인
   * @returns 초기화 완료 여부
   */
  isInitialized(): boolean;

  /**
   * 카드를 뷰포트 중앙에 위치
   * @param card 카드
   */
  centerCard(card: ICard): void;

  /**
   * 카드를 스크롤 위치로 이동
   * @param card 카드
   */
  scrollToCard(card: ICard): void;

  /**
   * 부드러운 스크롤 여부 설정
   * @param enabled 부드러운 스크롤 사용 여부
   */
  setSmoothScroll(enabled: boolean): void;

  /**
   * 부드러운 스크롤 여부 확인
   * @returns 부드러운 스크롤 사용 여부
   */
  isSmoothScrollEnabled(): boolean;

  /**
   * 스크롤 동작 설정
   * @param behavior 스크롤 동작
   */
  setScrollBehavior(behavior: 'auto' | 'smooth' | 'instant'): void;

  /**
   * 스크롤 동작 확인
   * @returns 스크롤 동작
   */
  getScrollBehavior(): 'auto' | 'smooth' | 'instant';

  /**
   * 스크롤 컨테이너 설정
   * @param container 스크롤 컨테이너 요소
   */
  setScrollContainer(container: HTMLElement): void;

  /**
   * 스크롤 컨테이너 확인
   * @returns 스크롤 컨테이너 요소
   */
  getScrollContainer(): HTMLElement | null;
} 