import { debounce } from '../../utils/helpers/performance.helper';
import { Log } from '../../utils/log/Log';
import { 
  IResizeManager, 
  IResizeManagerConstructor,
  ResizeEventType, 
  ResizeEventListener, 
  ResizeEventData 
} from '../../core/interfaces/manager/IResizeManager';

/**
 * 리사이즈 관리자 클래스
 * 컨테이너 크기 변경을 감지하고 처리합니다.
 */
export class ResizeManager implements IResizeManager {
  /**
   * 컨테이너 요소
   */
  private container: HTMLElement;
  
  /**
   * 리사이즈 콜백 함수
   * @deprecated 이벤트 리스너를 사용하는 것이 권장됩니다.
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
   * 이벤트 리스너 맵
   * 이벤트 타입별 리스너 목록을 저장합니다.
   */
  private eventListeners: Map<ResizeEventType, Set<ResizeEventListener>> = new Map();
  
  /**
   * 생성자
   * @param container 컨테이너 요소
   * @param debounceDelay 디바운스 지연 시간 (밀리초)
   */
  constructor(container: HTMLElement, debounceDelay: number = 100) {
    this.container = container;
    
    // 디바운스된 리사이즈 핸들러 생성
    this.debouncedResizeHandler = debounce((width: number, height: number) => {
      // 기존 콜백 호출 (하위 호환성 유지)
      if (this.resizeCallback) {
        this.resizeCallback(width, height);
      }
      
      // 이벤트 리스너 호출
      this.dispatchResizeEvent(width, height);
    }, debounceDelay);
    
    // 이벤트 리스너 맵 초기화
    this.eventListeners.set(ResizeEventType.RESIZE, new Set());
    
    Log.debug('ResizeManager', '리사이즈 관리자 생성');
  }
  
  /**
   * 리사이즈 이벤트 발송
   * @param width 컨테이너 너비
   * @param height 컨테이너 높이
   */
  private dispatchResizeEvent(width: number, height: number): void {
    const eventData: ResizeEventData = { width, height };
    const listeners = this.eventListeners.get(ResizeEventType.RESIZE);
    
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(eventData);
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
          Log.error('ResizeManager', `리사이즈 이벤트 리스너 실행 중 오류 발생: ${errorMessage}`);
        }
      });
    }
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
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      Log.error('ResizeManager', `리사이즈 관리자 초기화 중 오류 발생: ${errorMessage}`);
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
   * @deprecated 이벤트 리스너를 사용하는 것이 권장됩니다.
   */
  setResizeCallback(callback: (width: number, height: number) => void): void {
    this.resizeCallback = callback;
    Log.warn('ResizeManager', 'setResizeCallback은 더 이상 사용되지 않습니다. addEventListener를 사용하세요.');
  }
  
  /**
   * 리사이즈 이벤트 리스너 추가
   * @param eventType 이벤트 타입
   * @param listener 이벤트 리스너
   */
  addEventListener(eventType: ResizeEventType, listener: ResizeEventListener): void {
    const listeners = this.eventListeners.get(eventType);
    
    if (listeners) {
      listeners.add(listener);
      Log.debug('ResizeManager', `리사이즈 이벤트 리스너 추가: ${eventType}`);
    } else {
      Log.warn('ResizeManager', `지원되지 않는 이벤트 타입: ${eventType}`);
    }
  }
  
  /**
   * 리사이즈 이벤트 리스너 제거
   * @param eventType 이벤트 타입
   * @param listener 이벤트 리스너
   */
  removeEventListener(eventType: ResizeEventType, listener: ResizeEventListener): void {
    const listeners = this.eventListeners.get(eventType);
    
    if (listeners) {
      listeners.delete(listener);
      Log.debug('ResizeManager', `리사이즈 이벤트 리스너 제거: ${eventType}`);
    } else {
      Log.warn('ResizeManager', `지원되지 않는 이벤트 타입: ${eventType}`);
    }
  }
  
  /**
   * 현재 컨테이너 크기 가져오기
   * @returns 컨테이너의 현재 너비와 높이
   */
  getCurrentSize(): { width: number; height: number } {
    const { width, height } = this.container.getBoundingClientRect();
    return { width, height };
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
      
      // 이벤트 리스너 정리
      this.eventListeners.forEach(listeners => listeners.clear());
      this.eventListeners.clear();
      
      Log.debug('ResizeManager', '리사이즈 관리자 정리 완료');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      Log.error('ResizeManager', `리사이즈 관리자 정리 중 오류 발생: ${errorMessage}`);
    }
  }
}

// ResizeManager 클래스가 IResizeManagerConstructor 인터페이스를 만족하는지 확인
// 이는 타입 체크 시에만 사용되며 런타임에는 영향을 주지 않습니다.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _typeCheck: IResizeManagerConstructor = ResizeManager; 