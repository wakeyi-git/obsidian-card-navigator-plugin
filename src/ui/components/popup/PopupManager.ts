import { Component } from '../Component';
import { IToolbarService, IToolbarPopup } from '../../../application/toolbar/ToolbarService';
import { ISettingsService } from '../../../domain/settings/SettingsInterfaces';
import { DomainEventBus } from '../../../core/events/DomainEventBus';
import { EventType } from '../../../domain/events/EventTypes';

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
 * 팝업 관리자 클래스
 * 툴바 팝업을 관리합니다.
 */
export class PopupManager implements IPopupManager {
  private toolbarService: IToolbarService;
  private settingsService: ISettingsService;
  private currentPopup: IToolbarPopup | undefined;
  private popupElement: HTMLElement | null = null;
  private popupOverlay: HTMLElement | null = null;
  
  /**
   * 생성자
   * @param toolbarService 툴바 서비스
   * @param settingsService 설정 서비스
   */
  constructor(toolbarService: IToolbarService, settingsService: ISettingsService) {
    this.toolbarService = toolbarService;
    this.settingsService = settingsService;
    
    // 문서 클릭 이벤트 처리
    document.addEventListener('click', this.handleDocumentClick.bind(this));
    
    // ESC 키 이벤트 처리
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
  }
  
  /**
   * 팝업 표시
   * @param popup 팝업 정보
   * @returns 팝업 ID
   */
  showPopup(popup: IToolbarPopup): string {
    // 이미 열린 팝업이 있으면 닫기
    if (this.currentPopup) {
      this.closePopup(this.currentPopup.id);
    }
    
    // 팝업 ID가 없는 경우 생성
    if (!popup.id) {
      popup.id = `popup_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    }
    
    // 현재 팝업 설정
    this.currentPopup = popup;
    
    // 팝업 오버레이 생성
    this.createPopupOverlay();
    
    // 팝업 요소 생성
    this.createPopupElement(popup);
    
    return popup.id;
  }
  
  /**
   * 팝업 닫기
   * @param popupId 팝업 ID
   * @returns 닫기 성공 여부
   */
  closePopup(popupId: string): boolean {
    if (!this.currentPopup || this.currentPopup.id !== popupId) {
      return false;
    }
    
    // 팝업 요소 제거
    if (this.popupElement) {
      this.popupElement.remove();
      this.popupElement = null;
    }
    
    // 오버레이 제거
    if (this.popupOverlay) {
      this.popupOverlay.remove();
      this.popupOverlay = null;
    }
    
    // 현재 팝업 초기화
    this.currentPopup = undefined;
    
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
   * 정리
   */
  cleanup(): void {
    // 이벤트 리스너 제거
    document.removeEventListener('click', this.handleDocumentClick.bind(this));
    document.removeEventListener('keydown', this.handleKeyDown.bind(this));
    
    // 열린 팝업 닫기
    if (this.currentPopup) {
      this.closePopup(this.currentPopup.id);
    }
  }
  
  /**
   * 팝업 오버레이 생성
   */
  private createPopupOverlay(): void {
    // 오버레이 요소 생성
    this.popupOverlay = document.createElement('div');
    this.popupOverlay.className = 'card-navigator-popup-overlay';
    
    // 스타일 설정
    this.popupOverlay.style.position = 'fixed';
    this.popupOverlay.style.top = '0';
    this.popupOverlay.style.left = '0';
    this.popupOverlay.style.width = '100%';
    this.popupOverlay.style.height = '100%';
    this.popupOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.3)';
    this.popupOverlay.style.zIndex = '1000';
    
    // 문서에 추가
    document.body.appendChild(this.popupOverlay);
  }
  
  /**
   * 팝업 요소 생성
   * @param popup 팝업 정보
   */
  private createPopupElement(popup: IToolbarPopup): void {
    // 팝업 요소 생성
    this.popupElement = document.createElement('div');
    this.popupElement.className = 'card-navigator-popup';
    this.popupElement.dataset.popupId = popup.id;
    
    // 스타일 설정
    this.popupElement.style.position = 'fixed';
    this.popupElement.style.backgroundColor = 'var(--background-primary)';
    this.popupElement.style.border = '1px solid var(--background-modifier-border)';
    this.popupElement.style.borderRadius = '4px';
    this.popupElement.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.2)';
    this.popupElement.style.zIndex = '1001';
    this.popupElement.style.overflow = 'auto';
    
    // 팝업 크기 설정
    if (popup.width) {
      this.popupElement.style.width = `${popup.width}px`;
    } else {
      this.popupElement.style.minWidth = '200px';
      this.popupElement.style.maxWidth = '400px';
    }
    
    if (popup.height) {
      this.popupElement.style.height = `${popup.height}px`;
    } else {
      this.popupElement.style.maxHeight = '80vh';
    }
    
    // 팝업 위치 설정
    if (popup.position) {
      this.popupElement.style.left = `${popup.position.x}px`;
      this.popupElement.style.top = `${popup.position.y}px`;
    } else {
      // 기본 위치: 화면 중앙
      this.popupElement.style.left = '50%';
      this.popupElement.style.top = '50%';
      this.popupElement.style.transform = 'translate(-50%, -50%)';
    }
    
    // 팝업 내용 생성
    this.createPopupContent(popup);
    
    // 문서에 추가
    document.body.appendChild(this.popupElement);
  }
  
  /**
   * 팝업 내용 생성
   * @param popup 팝업 정보
   */
  private createPopupContent(popup: IToolbarPopup): void {
    if (!this.popupElement) return;
    
    // 헤더 생성 (제목이 있는 경우)
    if (popup.title) {
      const headerEl = document.createElement('div');
      headerEl.className = 'card-navigator-popup-header';
      headerEl.style.padding = '8px 12px';
      headerEl.style.borderBottom = '1px solid var(--background-modifier-border)';
      headerEl.style.display = 'flex';
      headerEl.style.justifyContent = 'space-between';
      headerEl.style.alignItems = 'center';
      
      // 제목 요소
      const titleEl = document.createElement('div');
      titleEl.className = 'card-navigator-popup-title';
      titleEl.textContent = popup.title;
      titleEl.style.fontWeight = 'bold';
      
      // 닫기 버튼
      const closeBtn = document.createElement('button');
      closeBtn.className = 'card-navigator-popup-close';
      closeBtn.innerHTML = '&times;';
      closeBtn.style.background = 'none';
      closeBtn.style.border = 'none';
      closeBtn.style.cursor = 'pointer';
      closeBtn.style.fontSize = '16px';
      closeBtn.style.padding = '0 4px';
      
      // 닫기 버튼 클릭 이벤트
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.currentPopup) {
          this.closePopup(this.currentPopup.id);
        }
      });
      
      headerEl.appendChild(titleEl);
      headerEl.appendChild(closeBtn);
      this.popupElement.appendChild(headerEl);
    }
    
    // 내용 생성
    const contentEl = document.createElement('div');
    contentEl.className = 'card-navigator-popup-content';
    contentEl.style.padding = '12px';
    
    // 내용 타입에 따라 처리
    if (popup.type === 'html') {
      // HTML 내용
      contentEl.innerHTML = popup.content;
    } else {
      // 기본: 텍스트 내용
      contentEl.textContent = popup.content;
    }
    
    this.popupElement.appendChild(contentEl);
  }
  
  /**
   * 문서 클릭 이벤트 처리
   * @param e 클릭 이벤트
   */
  private handleDocumentClick(e: MouseEvent): void {
    if (!this.currentPopup || !this.popupElement || !this.popupOverlay) return;
    
    // 팝업 외부 클릭 시 팝업 닫기
    if (e.target === this.popupOverlay) {
      this.closePopup(this.currentPopup.id);
    }
  }
  
  /**
   * 키 이벤트 처리
   * @param e 키 이벤트
   */
  private handleKeyDown(e: KeyboardEvent): void {
    if (!this.currentPopup) return;
    
    // ESC 키 누를 때 팝업 닫기
    if (e.key === 'Escape') {
      this.closePopup(this.currentPopup.id);
    }
  }
} 