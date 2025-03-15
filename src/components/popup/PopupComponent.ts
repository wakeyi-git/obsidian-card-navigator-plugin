import { Component } from '../Component';
import { IToolbarService } from '../../services/toolbar/ToolbarService';
import { ISettingsService } from '../../domain/settings/SettingsInterfaces';

/**
 * 팝업 컴포넌트 인터페이스
 */
export interface IPopupComponent {
  /**
   * 팝업 내용 생성
   * @returns 팝업 내용 HTML
   */
  generateContent(): string;
  
  /**
   * 팝업 이벤트 리스너 등록
   * @param popupElement 팝업 요소
   */
  registerPopupEventListeners(popupElement: HTMLElement): void;
  
  /**
   * 팝업 이벤트 리스너 제거
   * @param popupElement 팝업 요소
   */
  removePopupEventListeners(popupElement: HTMLElement): void;
  
  /**
   * 팝업 ID 가져오기
   * @returns 팝업 ID
   */
  getPopupId(): string;
  
  /**
   * 팝업 제목 가져오기
   * @returns 팝업 제목
   */
  getPopupTitle(): string;
  
  /**
   * 현재 팝업 요소 설정
   * @param popupElement 팝업 요소
   */
  setCurrentPopupElement(popupElement: HTMLElement): void;
}

/**
 * 팝업 컴포넌트 추상 클래스
 */
export abstract class PopupComponent extends Component implements IPopupComponent {
  protected toolbarService: IToolbarService;
  protected settingsService: ISettingsService;
  protected popupId: string;
  protected popupTitle: string;
  protected currentPopupElement: HTMLElement | null = null;
  
  /**
   * 생성자
   * @param toolbarService 툴바 서비스
   * @param settingsService 설정 서비스
   * @param popupId 팝업 ID
   * @param popupTitle 팝업 제목
   */
  constructor(
    toolbarService: IToolbarService,
    settingsService: ISettingsService,
    popupId: string,
    popupTitle: string
  ) {
    super();
    this.toolbarService = toolbarService;
    this.settingsService = settingsService;
    this.popupId = popupId;
    this.popupTitle = popupTitle;
  }
  
  /**
   * 팝업 내용 생성
   * @returns 팝업 내용 HTML
   */
  abstract generateContent(): string;
  
  /**
   * 팝업 이벤트 리스너 등록 (팝업 요소에 대한 이벤트 리스너)
   * @param popupElement 팝업 요소
   */
  abstract registerPopupEventListeners(popupElement: HTMLElement): void;
  
  /**
   * 이벤트 리스너 등록 (Component 클래스 메서드 오버라이드)
   */
  protected registerEventListeners(): void {
    if (this.element && this.currentPopupElement) {
      this.registerPopupEventListeners(this.currentPopupElement);
    }
  }
  
  /**
   * 팝업 이벤트 리스너 제거 (팝업 요소에 대한 이벤트 리스너)
   * @param popupElement 팝업 요소
   */
  removePopupEventListeners(popupElement: HTMLElement): void {
    // 기본 구현은 비어 있음
  }
  
  /**
   * 이벤트 리스너 제거 (Component 클래스 메서드 오버라이드)
   */
  protected removeEventListeners(): void {
    if (this.currentPopupElement) {
      this.removePopupEventListeners(this.currentPopupElement);
      this.currentPopupElement = null;
    }
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