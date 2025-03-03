import { App, Modal, Setting, TextAreaComponent, TextComponent, Notice } from 'obsidian';
import { Preset } from '../../core/models/Preset';
import { ErrorHandler } from '../../utils/error/ErrorHandler';
import { MODAL_CLASS_NAMES } from '../../styles/components/modal.styles';

/**
 * 프리셋 모달 모드
 */
export enum PresetModalMode {
  CREATE = 'create',
  EDIT = 'edit',
  CLONE = 'clone'
}

/**
 * 프리셋 모달 컴포넌트
 * 프리셋 생성, 편집, 복제 기능을 제공합니다.
 */
export class PresetModal extends Modal {
  /**
   * 프리셋 이름
   */
  private presetName: string = '';
  
  /**
   * 프리셋 설명
   */
  private description: string = '';
  
  /**
   * 프리셋 데이터
   */
  private presetData: string = '';
  
  /**
   * 데이터 텍스트 영역 컴포넌트
   */
  private dataTextArea: TextAreaComponent | null = null;
  
  /**
   * 이름 입력 컴포넌트
   */
  private nameInput: TextComponent | null = null;
  
  /**
   * 설명 입력 컴포넌트
   */
  private descriptionInput: TextComponent | null = null;
  
  /**
   * 저장 콜백 함수
   */
  private onSave: (preset: Preset) => Promise<void>;
  
  /**
   * 생성자
   * @param app Obsidian 앱 인스턴스
   * @param mode 모달 모드
   * @param onSave 저장 콜백 함수
   * @param existingPreset 기존 프리셋 (편집/복제 시)
   */
  constructor(
    app: App,
    private mode: PresetModalMode,
    onSave: (preset: Preset) => Promise<void>,
    private existingPreset?: Preset
  ) {
    super(app);
    this.onSave = onSave;
    
    if (existingPreset) {
      this.presetName = mode === PresetModalMode.CLONE ? `${existingPreset.name} 복사본` : existingPreset.name;
      this.description = existingPreset.description || '';
      this.presetData = JSON.stringify(existingPreset.settings, null, 2);
    }
  }
  
  /**
   * 모달이 열릴 때 호출됩니다.
   */
  onOpen(): void {
    try {
      const { contentEl } = this;
      
      // 모달 제목 설정
      let titleText = '';
      switch (this.mode) {
        case PresetModalMode.CREATE:
          titleText = '새 프리셋 생성';
          break;
        case PresetModalMode.EDIT:
          titleText = '프리셋 편집';
          break;
        case PresetModalMode.CLONE:
          titleText = '프리셋 복제';
          break;
      }
      
      contentEl.createEl('h2', { text: titleText });
      
      // 프리셋 이름 입력 필드
      new Setting(contentEl)
        .setName('프리셋 이름')
        .setDesc('프리셋의 고유한 이름을 입력하세요.')
        .addText(text => {
          this.nameInput = text;
          text.setValue(this.presetName)
            .onChange(value => {
              this.presetName = value;
            });
        });
      
      // 프리셋 설명 입력 필드
      new Setting(contentEl)
        .setName('설명 (선택사항)')
        .setDesc('프리셋에 대한 설명을 입력하세요.')
        .addText(text => {
          this.descriptionInput = text;
          text.setValue(this.description)
            .onChange(value => {
              this.description = value;
            });
        });
      
      // 고급 모드: JSON 직접 편집 (접을 수 있는 섹션)
      const advancedSection = contentEl.createDiv({ cls: MODAL_CLASS_NAMES.ADVANCED.SECTION });
      const advancedHeader = advancedSection.createDiv({ cls: MODAL_CLASS_NAMES.ADVANCED.HEADER });
      
      advancedHeader.createEl('h3', { text: '고급 설정 (JSON)' });
      const toggleButton = advancedHeader.createEl('button', { 
        cls: MODAL_CLASS_NAMES.ADVANCED.TOGGLE,
        text: '표시'
      });
      
      const advancedContent = advancedSection.createDiv({ 
        cls: MODAL_CLASS_NAMES.ADVANCED.CONTENT
      });
      advancedContent.style.display = 'none';
      
      // JSON 편집 영역
      new Setting(advancedContent)
        .setName('프리셋 데이터 (JSON)')
        .setDesc('프리셋 설정을 JSON 형식으로 직접 편집합니다.')
        .addTextArea(text => {
          this.dataTextArea = text;
          text.setValue(this.presetData)
            .onChange(value => {
              this.presetData = value;
            });
          
          // 텍스트 영역 스타일 설정
          text.inputEl.rows = 10;
          text.inputEl.cols = 50;
          text.inputEl.addClass(MODAL_CLASS_NAMES.TEXTAREA.JSON);
        });
      
      // 고급 섹션 토글 버튼 이벤트
      toggleButton.addEventListener('click', () => {
        const isVisible = advancedContent.style.display !== 'none';
        advancedContent.style.display = isVisible ? 'none' : 'block';
        toggleButton.textContent = isVisible ? '표시' : '숨기기';
      });
      
      // 버튼 영역
      const buttonContainer = contentEl.createDiv({ cls: MODAL_CLASS_NAMES.BUTTONS.CONTAINER });
      
      // 취소 버튼
      const cancelButton = buttonContainer.createEl('button', {
        text: '취소',
        cls: `${MODAL_CLASS_NAMES.BUTTONS.BUTTON} ${MODAL_CLASS_NAMES.BUTTONS.CANCEL}`
      });
      
      // 저장 버튼
      const saveButton = buttonContainer.createEl('button', {
        text: '저장',
        cls: `${MODAL_CLASS_NAMES.BUTTONS.BUTTON} ${MODAL_CLASS_NAMES.BUTTONS.SAVE}`
      });
      
      // 버튼 이벤트 설정
      cancelButton.addEventListener('click', () => {
        this.close();
      });
      
      saveButton.addEventListener('click', async () => {
        await this.savePreset();
      });
    } catch (error) {
      ErrorHandler.getInstance().handleError(
        '프리셋 모달을 열 때 오류가 발생했습니다.',
        error
      );
    }
  }
  
  /**
   * 프리셋 저장
   */
  private async savePreset(): Promise<void> {
    try {
      // 이름 유효성 검사
      if (!this.presetName) {
        new Notice('프리셋 이름을 입력해주세요.');
        return;
      }
      
      // JSON 유효성 검사
      let settings: any = {};
      if (this.presetData) {
        try {
          settings = JSON.parse(this.presetData);
        } catch (e) {
          new Notice('JSON 형식이 올바르지 않습니다.');
          return;
        }
      } else if (this.existingPreset) {
        // 기존 설정 사용
        settings = this.existingPreset.settings;
      }
      
      // 프리셋 객체 생성
      const preset = new Preset(
        this.presetName,
        settings,
        this.description,
        new Date()
      );
      
      // 저장 콜백 호출
      await this.onSave(preset);
      
      // 모달 닫기
      this.close();
    } catch (error) {
      ErrorHandler.getInstance().handleError(
        '프리셋을 저장하는 중 오류가 발생했습니다.',
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
        '프리셋 모달을 닫을 때 오류가 발생했습니다.',
        error
      );
    }
  }
} 