import { IPopupComponent } from './PopupComponent';
import { PopupFactory } from './PopupFactory';
import { IToolbarService, IToolbarPopup } from '../../services/toolbar/ToolbarService';
import { ISettingsService } from '../../domain/settings/SettingsInterfaces';

/**
 * 팝업 관리자 인터페이스
 */
export interface IPopupManager {
  /**
   * 팝업 표시
   * @param popup 팝업 정보
   * @returns 팝업 ID
   */
  showPopup(popup: IToolbarPopup): string;
  
  /**
   * 팝업 닫기
   * @param popupId 팝업 ID
   * @returns 닫기 성공 여부
   */
  closePopup(popupId: string): boolean;
  
  /**
   * 현재 팝업 가져오기
   * @returns 현재 팝업
   */
  getCurrentPopup(): IToolbarPopup | undefined;
  
  /**
   * 정리
   */
  cleanup(): void;
}

/**
 * 팝업 관리자
 * 팝업 컴포넌트를 관리하고 표시합니다.
 */
export class PopupManager implements IPopupManager {
  private toolbarService: IToolbarService;
  private settingsService: ISettingsService;
  private popupFactory: PopupFactory;
  private currentPopup: IToolbarPopup | undefined;
  private currentPopupComponent: IPopupComponent | undefined;
  private popupContainer: HTMLElement | null = null;
  
  /**
   * 생성자
   * @param toolbarService 툴바 서비스
   * @param settingsService 설정 서비스
   */
  constructor(toolbarService: IToolbarService, settingsService: ISettingsService) {
    this.toolbarService = toolbarService;
    this.settingsService = settingsService;
    this.popupFactory = new PopupFactory(toolbarService, settingsService);
    
    // 팝업 컨테이너 생성
    this.createPopupContainer();
  }
  
  /**
   * 팝업 컨테이너 생성
   */
  private createPopupContainer(): void {
    // 기존 컨테이너가 있으면 제거
    if (this.popupContainer) {
      document.body.removeChild(this.popupContainer);
    }
    
    // 새 컨테이너 생성
    this.popupContainer = document.createElement('div');
    this.popupContainer.className = 'card-navigator-popup-container';
    document.body.appendChild(this.popupContainer);
    
    // 외부 클릭 이벤트 리스너 등록
    document.addEventListener('click', this.handleOutsideClick);
    
    // ESC 키 이벤트 리스너 등록
    document.addEventListener('keydown', this.handleKeyDown);
  }
  
  /**
   * 팝업 표시
   * @param popup 팝업 정보
   * @returns 팝업 ID
   */
  showPopup(popup: IToolbarPopup): string {
    // 이미 표시 중인 팝업이 있으면 닫기
    if (this.currentPopup) {
      this.closePopup(this.currentPopup.id);
    }
    
    // 팝업 ID가 없는 경우 생성
    if (!popup.id) {
      popup.id = `popup_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    }
    
    // 팝업 타입이 없는 경우 기본값 설정
    if (!popup.type) {
      popup.type = 'default';
    }
    
    try {
      // 팝업 컴포넌트 생성
      this.currentPopupComponent = this.popupFactory.createPopup(popup.type);
      
      // 팝업 내용 생성
      popup.content = this.currentPopupComponent.generateContent();
      
      // 현재 팝업 설정
      this.currentPopup = popup;
      
      // 팝업 렌더링
      this.renderPopup();
      
      // 팝업 컨테이너 활성화
      if (this.popupContainer) {
        this.popupContainer.classList.add('active');
      }
      
      return popup.id;
    } catch (error) {
      console.error('팝업 표시 오류:', error);
      return popup.id;
    }
  }
  
  /**
   * 팝업 렌더링
   */
  private renderPopup(): void {
    if (!this.currentPopup || !this.popupContainer) return;
    
    // 팝업 요소 생성
    const popupElement = document.createElement('div');
    popupElement.className = 'popup';
    popupElement.setAttribute('data-popup-id', this.currentPopup.id);
    
    // 초기 스타일 설정 - 보이지 않게 설정
    popupElement.style.visibility = 'hidden';
    popupElement.style.display = 'block';
    
    // 팝업 크기 설정
    if (this.currentPopup.width) {
      popupElement.style.width = `${this.currentPopup.width}px`;
    }
    
    // 팝업 컨테이너에 추가 (내용 추가 전에 DOM에 추가하여 크기 계산 가능하게 함)
    this.popupContainer.innerHTML = '';
    this.popupContainer.appendChild(popupElement);
    
    // 팝업 헤더 생성
    const popupHeader = document.createElement('div');
    popupHeader.className = 'popup-header';
    
    // 팝업 제목 생성
    const popupTitle = document.createElement('div');
    popupTitle.className = 'popup-title';
    popupTitle.textContent = this.currentPopup.title || this.currentPopupComponent?.getPopupTitle() || '';
    popupHeader.appendChild(popupTitle);
    
    // 팝업 닫기 버튼 생성
    const closeButton = document.createElement('button');
    closeButton.className = 'popup-close-button';
    closeButton.innerHTML = '&times;';
    closeButton.addEventListener('click', () => {
      this.closePopup(this.currentPopup?.id || '');
    });
    popupHeader.appendChild(closeButton);
    
    // 팝업 요소에 헤더 추가
    popupElement.appendChild(popupHeader);
    
    // 팝업 내용 컨테이너 생성
    const contentContainer = document.createElement('div');
    contentContainer.className = 'popup-content';
    contentContainer.innerHTML = this.currentPopup.content;
    
    // 팝업 요소에 내용 추가
    popupElement.appendChild(contentContainer);
    
    // 팝업 위치 설정 - 내용 추가 후 크기 계산하여 위치 설정
    this.positionPopup(popupElement);
    
    // 이벤트 리스너 등록
    if (this.currentPopupComponent) {
      this.currentPopupComponent.setCurrentPopupElement(popupElement);
    }
  }
  
  /**
   * 팝업 위치 설정
   * @param popupElement 팝업 요소
   */
  private positionPopup(popupElement: HTMLElement): void {
    if (!this.currentPopup) return;
    
    // 팝업 위치가 지정되어 있으면 사용
    if (this.currentPopup.position) {
      // 툴바 요소 찾기
      const toolbarElement = document.querySelector('.card-navigator-toolbar');
      const toolbarRect = toolbarElement ? toolbarElement.getBoundingClientRect() : null;
      
      // 팝업 크기 가져오기
      const popupRect = popupElement.getBoundingClientRect();
      const popupWidth = popupRect.width;
      
      // 화면 크기 가져오기
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      // 초기 위치 설정 - 버튼 위치 기준
      let left = this.currentPopup.position.x - (popupWidth / 2); // 버튼 중앙에 맞춤
      let top = toolbarRect ? toolbarRect.bottom : this.currentPopup.position.y;
      
      // 오른쪽 경계 확인
      if (left + popupWidth > viewportWidth) {
        left = viewportWidth - popupWidth - 10; // 10px 여백
      }
      
      // 왼쪽 경계 확인
      if (left < 10) {
        left = 10; // 10px 여백
      }
      
      // 최종 위치 설정
      popupElement.style.left = `${left}px`;
      popupElement.style.top = `${top}px`;
      
      // 팝업 높이 계산 후 최대 높이 설정
      const popupHeight = popupElement.offsetHeight;
      const maxHeight = viewportHeight - top - 20; // 20px 여백
      
      if (popupHeight > maxHeight) {
        popupElement.style.maxHeight = `${maxHeight}px`;
        popupElement.style.overflowY = 'auto';
      }
      
      // 다시 보이게 설정 - 모든 계산이 끝난 후에 표시
      setTimeout(() => {
        popupElement.style.visibility = 'visible';
      }, 0);
    } else {
      // 중앙 정렬
      popupElement.style.left = '50%';
      popupElement.style.top = '50%';
      popupElement.style.transform = 'translate(-50%, -50%)';
      
      // 팝업 크기 설정
      if (this.currentPopup.width) {
        popupElement.style.width = `${this.currentPopup.width}px`;
      }
      
      if (this.currentPopup.height) {
        popupElement.style.height = `${this.currentPopup.height}px`;
      }
      
      // 다시 보이게 설정
      setTimeout(() => {
        popupElement.style.visibility = 'visible';
      }, 0);
    }
  }
  
  /**
   * 팝업 닫기
   * @param popupId 팝업 ID
   * @returns 닫기 성공 여부
   */
  closePopup(popupId: string): boolean {
    if (!this.currentPopup || this.currentPopup.id !== popupId) return false;
    
    // 팝업 컨테이너 비활성화
    if (this.popupContainer) {
      this.popupContainer.classList.remove('active');
      this.popupContainer.innerHTML = '';
    }
    
    // 현재 팝업 초기화
    this.currentPopup = undefined;
    this.currentPopupComponent = undefined;
    
    return true;
  }
  
  /**
   * 현재 팝업 가져오기
   * @returns 현재 팝업
   */
  getCurrentPopup(): IToolbarPopup | undefined {
    return this.currentPopup;
  }
  
  /**
   * 외부 클릭 이벤트 처리
   * @param event 클릭 이벤트
   */
  private handleOutsideClick = (event: MouseEvent): void => {
    // 팝업이 없거나 컨테이너가 없으면 무시
    if (!this.currentPopup || !this.popupContainer) return;
    
    // 클릭된 요소
    const target = event.target as HTMLElement;
    
    // 팝업 컨테이너 내부 클릭인지 확인
    if (this.popupContainer.contains(target)) {
      // 팝업 요소 가져오기
      const popupElement = this.popupContainer.querySelector('.popup');
      
      // 팝업 외부 클릭인 경우 (컨테이너 배경 클릭)
      if (popupElement && !popupElement.contains(target)) {
        this.closePopup(this.currentPopup.id);
      }
    }
    
    // 툴바 버튼 클릭인 경우 무시 (팝업 토글을 위해)
    if (this.isToolbarButton(target)) {
      return;
    }
  };
  
  /**
   * 툴바 버튼 여부 확인
   * @param element 요소
   * @returns 툴바 버튼 여부
   */
  private isToolbarButton(element: HTMLElement): boolean {
    // 툴바 버튼 클래스 확인
    if (element.classList.contains('toolbar-button')) {
      return true;
    }
    
    // 부모 요소 확인
    if (element.parentElement) {
      return this.isToolbarButton(element.parentElement);
    }
    
    return false;
  }
  
  /**
   * 키 이벤트 처리
   * @param event 키 이벤트
   */
  private handleKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'Escape' && this.currentPopup) {
      this.closePopup(this.currentPopup.id);
    }
  };
  
  /**
   * 정리
   */
  cleanup(): void {
    // 현재 팝업 닫기
    if (this.currentPopup) {
      this.closePopup(this.currentPopup.id);
    }
    
    // 이벤트 리스너 제거
    document.removeEventListener('click', this.handleOutsideClick);
    document.removeEventListener('keydown', this.handleKeyDown);
    
    // 팝업 컨테이너 제거
    if (this.popupContainer) {
      if (this.popupContainer.parentNode) {
        this.popupContainer.parentNode.removeChild(this.popupContainer);
      }
    }
    
    // 참조 정리
    this.popupContainer = null;
    this.currentPopup = undefined;
    this.currentPopupComponent = undefined;
    
    console.log('팝업 관리자 정리 완료');
  }
} 