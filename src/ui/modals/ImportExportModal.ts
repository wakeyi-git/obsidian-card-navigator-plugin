import { App, Modal, Notice, Setting, TextAreaComponent } from 'obsidian';
import { ErrorHandler } from '../../utils/error/ErrorHandler';
import { Preset } from '../../core/models/Preset';
import { MODAL_CLASS_NAMES } from '../../styles/components/modal.styles';

/**
 * 가져오기/내보내기 모달 모드
 */
export enum ImportExportMode {
  IMPORT = 'import',
  EXPORT = 'export'
}

/**
 * 가져오기/내보내기 모달 컴포넌트
 * 프리셋 데이터를 가져오거나 내보내는 기능을 제공합니다.
 */
export class ImportExportModal extends Modal {
  /**
   * 텍스트 영역 컴포넌트
   */
  private textArea: TextAreaComponent;
  
  /**
   * JSON 데이터
   */
  private jsonData: string = '';
  
  /**
   * 가져오기 콜백 함수
   */
  private onImport: (presets: Preset[]) => void;
  
  /**
   * 생성자
   * @param app Obsidian 앱 인스턴스
   * @param mode 모달 모드 (가져오기/내보내기)
   * @param presets 내보내기 모드에서 사용할 프리셋 배열
   * @param onImport 가져오기 콜백 함수
   */
  constructor(
    app: App,
    private mode: ImportExportMode,
    private presets: Preset[] = [],
    onImport: (presets: Preset[]) => void = () => {}
  ) {
    super(app);
    this.onImport = onImport;
    
    // 내보내기 모드인 경우 프리셋 데이터를 JSON 문자열로 변환
    if (mode === ImportExportMode.EXPORT && presets.length > 0) {
      try {
        this.jsonData = JSON.stringify(presets, null, 2);
      } catch (error) {
        ErrorHandler.getInstance().handleError(
          '프리셋 데이터를 JSON으로 변환하는 중 오류가 발생했습니다.',
          error
        );
      }
    }
  }
  
  /**
   * 모달이 열릴 때 호출됩니다.
   */
  onOpen(): void {
    try {
      const { contentEl } = this;
      
      // 모달 제목
      contentEl.createEl('h2', { 
        text: this.mode === ImportExportMode.IMPORT ? '프리셋 가져오기' : '프리셋 내보내기' 
      });
      
      // 설명 텍스트
      const descEl = contentEl.createDiv({ cls: MODAL_CLASS_NAMES.DESCRIPTION });
      if (this.mode === ImportExportMode.IMPORT) {
        descEl.setText('가져올 프리셋 데이터를 JSON 형식으로 입력하세요.');
      } else {
        descEl.setText('아래 JSON 데이터를 복사하여 저장하세요.');
      }
      
      // 텍스트 영역 설정
      new Setting(contentEl)
        .setName('JSON 데이터')
        .then((setting) => {
          this.textArea = new TextAreaComponent(setting.controlEl);
          this.textArea
            .setClass(MODAL_CLASS_NAMES.TEXTAREA.JSON)
            .setRows(15)
            .setSpellcheck(false);
          
          if (this.mode === ImportExportMode.EXPORT) {
            this.textArea.setValue(this.jsonData);
          }
          
          return setting;
        });
      
      // 버튼 영역
      const buttonContainer = contentEl.createDiv({ cls: MODAL_CLASS_NAMES.BUTTONS.CONTAINER });
      
      // 취소 버튼
      const cancelButton = buttonContainer.createEl('button', {
        text: '취소',
        cls: `${MODAL_CLASS_NAMES.BUTTONS.BUTTON} ${MODAL_CLASS_NAMES.BUTTONS.CANCEL}`
      });
      
      // 가져오기/내보내기 버튼
      const actionButton = buttonContainer.createEl('button', {
        text: this.mode === ImportExportMode.IMPORT ? '가져오기' : '복사하기',
        cls: `${MODAL_CLASS_NAMES.BUTTONS.BUTTON} ${MODAL_CLASS_NAMES.BUTTONS.CONFIRM}`
      });
      
      // 버튼 이벤트 설정
      cancelButton.addEventListener('click', () => {
        this.close();
      });
      
      actionButton.addEventListener('click', () => {
        if (this.mode === ImportExportMode.IMPORT) {
          this.importPresets();
        } else {
          this.copyToClipboard();
        }
      });
    } catch (error) {
      ErrorHandler.getInstance().handleError(
        '가져오기/내보내기 모달을 열 때 오류가 발생했습니다.',
        error
      );
    }
  }
  
  /**
   * 프리셋 데이터를 가져옵니다.
   */
  private importPresets(): void {
    try {
      const jsonText = this.textArea.getValue().trim();
      
      if (!jsonText) {
        // 빈 데이터 처리
        new Notice('가져올 데이터가 없습니다.');
        return;
      }
      
      // JSON 파싱
      const data = JSON.parse(jsonText);
      
      // 배열 확인
      if (!Array.isArray(data)) {
        new Notice('유효한 프리셋 데이터 형식이 아닙니다.');
        return;
      }
      
      // 프리셋 객체 생성
      const presets: Preset[] = data.map(item => {
        return new Preset(
          item.id || crypto.randomUUID(),
          item.name,
          item.description || '',
          item.settings
        );
      });
      
      // 콜백 호출
      this.onImport(presets);
      this.close();
      new Notice(`${presets.length}개의 프리셋을 가져왔습니다.`);
    } catch (error) {
      ErrorHandler.getInstance().handleError(
        '프리셋 데이터를 가져오는 중 오류가 발생했습니다.',
        error
      );
      new Notice('프리셋 데이터를 가져오는 중 오류가 발생했습니다.');
    }
  }
  
  /**
   * 클립보드에 JSON 데이터를 복사합니다.
   */
  private copyToClipboard(): void {
    try {
      navigator.clipboard.writeText(this.textArea.getValue()).then(() => {
        new Notice('클립보드에 복사되었습니다.');
      }).catch(() => {
        new Notice('클립보드에 복사하지 못했습니다.');
      });
    } catch (error) {
      ErrorHandler.getInstance().handleError(
        '클립보드에 복사하는 중 오류가 발생했습니다.',
        error
      );
      new Notice('클립보드에 복사하는 중 오류가 발생했습니다.');
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
        '가져오기/내보내기 모달을 닫을 때 오류가 발생했습니다.',
        error
      );
    }
  }
} 