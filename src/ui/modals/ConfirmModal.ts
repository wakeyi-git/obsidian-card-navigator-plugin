import { App, Modal } from 'obsidian';
import { ErrorHandler } from '../../utils/error/ErrorHandler';
import { MODAL_CLASS_NAMES } from '../../styles/components/modal.styles';
import { LAYOUT_CLASS_NAMES } from '../../styles/components/layout.styles';

/**
 * 확인 모달 컴포넌트
 * 사용자에게 확인 메시지를 표시하고 응답을 받습니다.
 */
export class ConfirmModal extends Modal {
  /**
   * 확인 콜백 함수
   */
  private onConfirm: () => void;
  
  /**
   * 취소 콜백 함수
   */
  private onCancel: () => void;
  
  /**
   * Promise 해결 함수
   */
  private resolvePromise: (value: boolean) => void = () => {};
  
  /**
   * 생성자
   * @param app Obsidian 앱 인스턴스
   * @param title 모달 제목
   * @param message 확인 메시지
   * @param confirmText 확인 버튼 텍스트
   * @param cancelText 취소 버튼 텍스트
   * @param onConfirm 확인 콜백 함수
   * @param onCancel 취소 콜백 함수
   */
  constructor(
    app: App,
    private title: string,
    private message: string,
    private confirmText: string = '확인',
    private cancelText: string = '취소',
    onConfirm: () => void = () => {},
    onCancel: () => void = () => {}
  ) {
    super(app);
    this.onConfirm = onConfirm;
    this.onCancel = onCancel;
  }
  
  /**
   * 모달을 열고 사용자 응답을 기다립니다.
   * @returns Promise<boolean> - 사용자가 확인 버튼을 클릭하면 true, 취소 버튼을 클릭하면 false
   */
  public open(): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      this.resolvePromise = resolve;
      super.open();
    });
  }
  
  /**
   * 모달이 열릴 때 호출됩니다.
   */
  onOpen(): void {
    try {
      const { contentEl } = this;
      
      // 모달 제목
      contentEl.createEl('h2', { text: this.title });
      
      // 메시지
      const messageEl = contentEl.createDiv({ cls: MODAL_CLASS_NAMES.CONTENT.MESSAGE });
      messageEl.setText(this.message);
      
      // 버튼 영역
      const buttonContainer = contentEl.createDiv({ cls: MODAL_CLASS_NAMES.BUTTONS.CONTAINER });
      
      // 취소 버튼
      const cancelButton = document.createElement('button');
      cancelButton.classList.add(LAYOUT_CLASS_NAMES.BUTTON.BASE, LAYOUT_CLASS_NAMES.BUTTON.CANCEL);
      cancelButton.textContent = this.cancelText;
      cancelButton.addEventListener('click', () => {
        this.close();
        this.onCancel();
        this.resolvePromise(false);
      });
      
      // 확인 버튼
      const confirmButton = document.createElement('button');
      confirmButton.classList.add(LAYOUT_CLASS_NAMES.BUTTON.BASE, LAYOUT_CLASS_NAMES.BUTTON.CONFIRM);
      confirmButton.textContent = this.confirmText;
      confirmButton.addEventListener('click', () => {
        this.close();
        this.onConfirm();
        this.resolvePromise(true);
      });
      
      // 버튼 추가
      buttonContainer.appendChild(cancelButton);
      buttonContainer.appendChild(confirmButton);
    } catch (error) {
      ErrorHandler.getInstance().handleError(
        '확인 모달을 열 때 오류가 발생했습니다.',
        error
      );
      this.resolvePromise(false);
    }
  }
  
  /**
   * 모달이 닫힐 때 호출됩니다.
   */
  onClose(): void {
    try {
      const { contentEl } = this;
      contentEl.empty();
    } catch (error) {
      ErrorHandler.getInstance().handleError(
        '확인 모달을 닫을 때 오류가 발생했습니다.',
        error
      );
    }
  }
} 