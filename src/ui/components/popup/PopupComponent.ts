import { Component } from '../Component';
import { IToolbarService } from '../../../application/toolbar/ToolbarService';
import { ISettingsService } from '../../../domain/settings/SettingsInterfaces';
import { IPopupComponent } from './PopupInterfaces';

/**
 * 팝업 컴포넌트 기본 클래스
 * 팝업 컴포넌트의 기본 기능을 제공합니다.
 */
export abstract class PopupComponent implements IPopupComponent {
  /**
   * 팝업 ID
   */
  abstract popupId: string;
  
  /**
   * 툴바 서비스
   */
  protected toolbarService: IToolbarService;
  
  /**
   * 설정 서비스
   */
  protected settingsService: ISettingsService;
  
  /**
   * 팝업 제목
   */
  protected popupTitle: string = '';
  
  /**
   * 현재 팝업 요소
   */
  protected currentPopupElement: HTMLElement | null = null;
  
  /**
   * 생성자
   * @param toolbarService 툴바 서비스
   * @param settingsService 설정 서비스
   */
  constructor(toolbarService: IToolbarService, settingsService: ISettingsService) {
    this.toolbarService = toolbarService;
    this.settingsService = settingsService;
  }
  
  /**
   * 팝업 내용 생성
   * @returns 팝업 내용 HTML
   */
  abstract generateContent(): string;
  
  /**
   * 팝업 이벤트 리스너 등록
   * @param popupElement 팝업 요소
   */
  abstract registerPopupEventListeners(popupElement: HTMLElement): void;
  
  /**
   * 팝업 이벤트 리스너 제거
   * @param popupElement 팝업 요소
   */
  removePopupEventListeners(popupElement: HTMLElement): void {
    // 기본 구현은 비어 있음
  }
  
  /**
   * 팝업 ID 가져오기
   * @returns 팝업 ID
   */
  getPopupId(): string {
    return this.popupId;
  }
  
  /**
   * 팝업 제목 가져오기
   * @returns 팝업 제목
   */
  getPopupTitle(): string {
    return this.popupTitle;
  }
  
  /**
   * 컴포넌트 생성
   * @returns 생성된 컴포넌트 요소
   */
  protected async createComponent(): Promise<HTMLElement> {
    const element = document.createElement('div');
    element.className = 'popup-container';
    element.innerHTML = this.generateContent();
    this.currentPopupElement = element;
    return element;
  }
  
  /**
   * 현재 팝업 요소 설정
   * @param popupElement 팝업 요소
   */
  setCurrentPopupElement(popupElement: HTMLElement): void {
    this.currentPopupElement = popupElement;
    this.registerPopupEventListeners(popupElement);
  }
  
  /**
   * 취소 버튼 이벤트 리스너 등록
   * @param popupElement 팝업 요소
   * @param callback 콜백 함수
   */
  protected registerCancelButtonListener(popupElement: HTMLElement, callback: () => void): void {
    const cancelButton = popupElement.querySelector('.cancel-button');
    if (cancelButton) {
      cancelButton.addEventListener('click', () => {
        callback();
      });
    }
  }
} 