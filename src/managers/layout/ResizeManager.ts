import { debounce } from '../../utils/helpers/performance.helper';
import { Log } from '../../utils/log/Log';

/**
 * 리사이즈 관리자 클래스
 * 컨테이너 크기 변경을 감지하고 처리합니다.
 */
export class ResizeManager {
  /**
   * 컨테이너 요소
   */
  private container: HTMLElement;
  
  /**
   * 리사이즈 콜백 함수
   */
  private resizeCallback: ((width: number, height: number) => void) | null = null;
  
  /**
   * 리사이즈 옵저버
   */
  private resizeObserver: ResizeObserver | null = null;
  
  /**
   * 디바운스된 리사이즈 핸들러
   */
  private debouncedResizeHandler: (width: number, height: number) => void;
  
  /**
   * 생성자
   * @param container 컨테이너 요소
   * @param debounceDelay 디바운스 지연 시간 (밀리초)
   */
  constructor(container: HTMLElement, debounceDelay: number = 100) {
    this.container = container;
    
    // 디바운스된 리사이즈 핸들러 생성
    this.debouncedResizeHandler = debounce((width: number, height: number) => {
      if (this.resizeCallback) {
        this.resizeCallback(width, height);
      }
    }, debounceDelay);
    
    Log.debug('ResizeManager', '리사이즈 관리자 생성');
  }
  
  /**
   * 리사이즈 관리자 초기화
   */
  initialize(): void {
    try {
      // ResizeObserver 지원 확인
      if (typeof ResizeObserver === 'undefined') {
        Log.warn('ResizeManager', 'ResizeObserver가 지원되지 않습니다. 대체 방법을 사용합니다.');
        this.initializeFallback();
        return;
      }
      
      // ResizeObserver 생성
      this.resizeObserver = new ResizeObserver(entries => {
        for (const entry of entries) {
          if (entry.target === this.container) {
            const { width, height } = entry.contentRect;
            this.handleResize(width, height);
          }
        }
      });
      
      // 컨테이너 관찰 시작
      this.resizeObserver.observe(this.container);
      
      Log.debug('ResizeManager', '리사이즈 관리자 초기화 완료');
    } catch (error) {
      Log.error('ResizeManager', `리사이즈 관리자 초기화 중 오류 발생: ${error.message}`);
      this.initializeFallback();
    }
  }
  
  /**
   * 대체 리사이즈 감지 방법 초기화
   * ResizeObserver가 지원되지 않는 환경에서 사용됩니다.
   */
  private initializeFallback(): void {
    // 윈도우 리사이즈 이벤트 리스너 등록
    window.addEventListener('resize', this.handleWindowResize);
    
    // 초기 크기 처리
    const { width, height } = this.container.getBoundingClientRect();
    this.handleResize(width, height);
    
    Log.debug('ResizeManager', '대체 리사이즈 감지 방법 초기화 완료');
  }
  
  /**
   * 윈도우 리사이즈 이벤트 핸들러
   */
  private handleWindowResize = (): void => {
    const { width, height } = this.container.getBoundingClientRect();
    this.handleResize(width, height);
  };
  
  /**
   * 리사이즈 처리
   * @param width 새 너비
   * @param height 새 높이
   */
  private handleResize(width: number, height: number): void {
    // 디바운스된 핸들러 호출
    this.debouncedResizeHandler(width, height);
  }
  
  /**
   * 리사이즈 콜백 설정
   * @param callback 리사이즈 콜백 함수
   */
  setResizeCallback(callback: (width: number, height: number) => void): void {
    this.resizeCallback = callback;
  }
  
  /**
   * 리사이즈 관리자 정리
   */
  destroy(): void {
    try {
      // ResizeObserver 정리
      if (this.resizeObserver) {
        this.resizeObserver.disconnect();
        this.resizeObserver = null;
      }
      
      // 윈도우 리사이즈 이벤트 리스너 제거
      window.removeEventListener('resize', this.handleWindowResize);
      
      // 콜백 제거
      this.resizeCallback = null;
      
      Log.debug('ResizeManager', '리사이즈 관리자 정리 완료');
    } catch (error) {
      Log.error('ResizeManager', `리사이즈 관리자 정리 중 오류 발생: ${error.message}`);
    }
  }
} 