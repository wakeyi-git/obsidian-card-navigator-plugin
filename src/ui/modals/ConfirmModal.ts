import { App, Modal } from 'obsidian';
import { ErrorHandler } from '../../utils/error/ErrorHandler';

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
   * 모달이 열릴 때 호출됩니다.
   */
  onOpen(): void {
    try {
      const { contentEl } = this;
      
      // 모달 제목
      contentEl.createEl('h2', { text: this.title });
      
      // 메시지
      const messageEl = contentEl.createDiv({ cls: 'card-navigator-confirm-message' });
      messageEl.setText(this.message);
      
      // 버튼 영역
      const buttonContainer = contentEl.createDiv({ cls: 'card-navigator-modal-buttons' });
      
      // 취소 버튼
      const cancelButton = buttonContainer.createEl('button', {
        text: this.cancelText,
        cls: 'card-navigator-button card-navigator-button-cancel'
      });
      
      // 확인 버튼
      const confirmButton = buttonContainer.createEl('button', {
        text: this.confirmText,
        cls: 'card-navigator-button card-navigator-button-confirm'
      });
      
      // 버튼 이벤트 설정
      cancelButton.addEventListener('click', () => {
        this.close();
        this.onCancel();
      });
      
      confirmButton.addEventListener('click', () => {
        this.close();
        this.onConfirm();
      });
    } catch (error) {
      ErrorHandler.getInstance().handleError(
        '확인 모달을 열 때 오류가 발생했습니다.',
        error
      );
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