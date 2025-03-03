import { LayoutDirection } from '../../core/types/layout.types';
import { ErrorHandler } from '../../utils/error/ErrorHandler';
import { Log } from '../../utils/log/Log';
import { throttle } from '../../utils/helpers/performance.helper';

/**
 * 스크롤 서비스 클래스
 * 카드 네비게이터의 스크롤 기능을 관리하는 클래스입니다.
 */
export class ScrollService {
  /**
   * 컨테이너 요소
   */
  private containerElement: HTMLElement | null = null;
  
  /**
   * 스크롤 방향
   */
  private direction: LayoutDirection = LayoutDirection.VERTICAL;
  
  /**
   * 스크롤 이벤트 리스너
   */
  private scrollListener: ((event: Event) => void) | null = null;
  
  /**
   * 스크롤 콜백 함수
   */
  private scrollCallback: ((scrollPosition: number) => void) | null = null;
  
  /**
   * 스로틀링된 스크롤 핸들러
   */
  private throttledScrollHandler = throttle(this.handleScroll.bind(this), 50);
  
  /**
   * 생성자
   */
  constructor() {
    Log.debug('ScrollService', '스크롤 서비스 생성');
  }
  
  /**
   * 초기화
   * @param containerElement 컨테이너 요소
   * @param direction 스크롤 방향
   */
  initialize(containerElement: HTMLElement, direction: LayoutDirection = LayoutDirection.VERTICAL): void {
    try {
      // 기존 리스너 제거
      this.removeScrollListener();
      
      this.containerElement = containerElement;
      this.direction = direction;
      
      // 스크롤 이벤트 리스너 등록
      this.addScrollListener();
      
      Log.debug('ScrollService', `스크롤 서비스 초기화 완료: ${direction}`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      ErrorHandler.handleError(
        'ScrollService.initialize',
        `스크롤 서비스 초기화 중 오류 발생: ${errorMessage}`,
        true
      );
    }
  }
  
  /**
   * 스크롤 방향 설정
   * @param direction 스크롤 방향
   */
  setDirection(direction: LayoutDirection): void {
    try {
      if (this.direction === direction) {
        return;
      }
      
      this.direction = direction;
      
      Log.debug('ScrollService', `스크롤 방향 변경: ${direction}`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      ErrorHandler.handleError(
        'ScrollService.setDirection',
        `스크롤 방향 설정 중 오류 발생: ${errorMessage}`,
        true
      );
    }
  }
  
  /**
   * 스크롤 콜백 설정
   * @param callback 스크롤 콜백 함수
   */
  setScrollCallback(callback: (scrollPosition: number) => void): void {
    this.scrollCallback = callback;
  }
  
  /**
   * 스크롤 이벤트 리스너 추가
   */
  private addScrollListener(): void {
    if (!this.containerElement) {
      return;
    }
    
    // 스크롤 이벤트 리스너 생성
    this.scrollListener = (event: Event) => {
      this.throttledScrollHandler(event);
    };
    
    // 스크롤 이벤트 리스너 등록
    this.containerElement.addEventListener('scroll', this.scrollListener);
  }
  
  /**
   * 스크롤 이벤트 리스너 제거
   */
  private removeScrollListener(): void {
    if (this.containerElement && this.scrollListener) {
      this.containerElement.removeEventListener('scroll', this.scrollListener);
      this.scrollListener = null;
    }
  }
  
  /**
   * 스크롤 이벤트 처리
   * @param event 스크롤 이벤트
   */
  private handleScroll(event: Event): void {
    try {
      if (!this.containerElement || !this.scrollCallback) {
        return;
      }
      
      // 스크롤 위치 계산
      const scrollPosition = this.getScrollPosition();
      
      // 스크롤 콜백 호출
      this.scrollCallback(scrollPosition);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      ErrorHandler.handleError(
        'ScrollService.handleScroll',
        `스크롤 이벤트 처리 중 오류 발생: ${errorMessage}`,
        true
      );
    }
  }
  
  /**
   * 스크롤 위치 가져오기
   * @returns 스크롤 위치
   */
  getScrollPosition(): number {
    if (!this.containerElement) {
      return 0;
    }
    
    return this.direction === LayoutDirection.HORIZONTAL
      ? this.containerElement.scrollLeft
      : this.containerElement.scrollTop;
  }
  
  /**
   * 스크롤 위치 설정
   * @param position 스크롤 위치
   * @param smooth 부드러운 스크롤 여부
   */
  scrollTo(position: number, smooth: boolean = true): void {
    try {
      if (!this.containerElement) {
        return;
      }
      
      const scrollOptions: ScrollToOptions = {
        behavior: smooth ? 'smooth' : 'auto'
      };
      
      if (this.direction === LayoutDirection.HORIZONTAL) {
        scrollOptions.left = position;
      } else {
        scrollOptions.top = position;
      }
      
      this.containerElement.scrollTo(scrollOptions);
      
      Log.debug('ScrollService', `스크롤 위치 설정: ${position}, 부드러움: ${smooth}`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      ErrorHandler.handleError(
        'ScrollService.scrollTo',
        `스크롤 위치 설정 중 오류 발생: ${errorMessage}`,
        true
      );
    }
  }
  
  /**
   * 특정 요소로 스크롤
   * @param element 대상 요소
   * @param smooth 부드러운 스크롤 여부
   * @param offset 오프셋 (픽셀)
   */
  scrollToElement(element: HTMLElement, smooth: boolean = true, offset: number = 0): void {
    try {
      if (!this.containerElement || !element) {
        return;
      }
      
      // 요소의 위치 계산
      const containerRect = this.containerElement.getBoundingClientRect();
      const elementRect = element.getBoundingClientRect();
      
      let position = 0;
      
      if (this.direction === LayoutDirection.HORIZONTAL) {
        position = elementRect.left - containerRect.left + this.containerElement.scrollLeft - offset;
      } else {
        position = elementRect.top - containerRect.top + this.containerElement.scrollTop - offset;
      }
      
      // 스크롤 위치 설정
      this.scrollTo(position, smooth);
      
      Log.debug('ScrollService', `요소로 스크롤: ${element.id || 'unnamed'}, 위치: ${position}`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      ErrorHandler.handleError(
        'ScrollService.scrollToElement',
        `요소로 스크롤 중 오류 발생: ${errorMessage}`,
        true
      );
    }
  }
  
  /**
   * 페이지 단위로 스크롤
   * @param direction 스크롤 방향 (1: 다음 페이지, -1: 이전 페이지)
   * @param smooth 부드러운 스크롤 여부
   */
  scrollPage(direction: 1 | -1, smooth: boolean = true): void {
    try {
      if (!this.containerElement) {
        return;
      }
      
      // 현재 스크롤 위치
      const currentPosition = this.getScrollPosition();
      
      // 페이지 크기 계산
      const pageSize = this.direction === LayoutDirection.HORIZONTAL
        ? this.containerElement.clientWidth
        : this.containerElement.clientHeight;
      
      // 새 스크롤 위치 계산
      const newPosition = currentPosition + pageSize * direction;
      
      // 스크롤 위치 설정
      this.scrollTo(newPosition, smooth);
      
      Log.debug('ScrollService', `페이지 스크롤: ${direction > 0 ? '다음' : '이전'}, 위치: ${newPosition}`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      ErrorHandler.handleError(
        'ScrollService.scrollPage',
        `페이지 스크롤 중 오류 발생: ${errorMessage}`,
        true
      );
    }
  }
  
  /**
   * 스크롤 가능 여부 확인
   * @param direction 스크롤 방향 (1: 앞으로, -1: 뒤로)
   * @returns 스크롤 가능 여부
   */
  canScroll(direction: 1 | -1): boolean {
    if (!this.containerElement) {
      return false;
    }
    
    if (this.direction === LayoutDirection.HORIZONTAL) {
      if (direction < 0) {
        return this.containerElement.scrollLeft > 0;
      } else {
        return this.containerElement.scrollLeft + this.containerElement.clientWidth < this.containerElement.scrollWidth;
      }
    } else {
      if (direction < 0) {
        return this.containerElement.scrollTop > 0;
      } else {
        return this.containerElement.scrollTop + this.containerElement.clientHeight < this.containerElement.scrollHeight;
      }
    }
  }
  
  /**
   * 소멸
   */
  destroy(): void {
    try {
      // 스크롤 이벤트 리스너 제거
      this.removeScrollListener();
      
      // 참조 정리
      this.containerElement = null;
      this.scrollCallback = null;
      
      Log.debug('ScrollService', '스크롤 서비스 정리 완료');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      ErrorHandler.handleError(
        'ScrollService.destroy',
        `스크롤 서비스 정리 중 오류 발생: ${errorMessage}`,
        true
      );
    }
  }
} 