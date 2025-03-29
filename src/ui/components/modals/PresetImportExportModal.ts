import { App, Modal, Setting } from 'obsidian';
import { Preset } from '@/domain/models/Preset';

/**
 * 프리셋 가져오기/내보내기 모달
 */
export class PresetImportExportModal extends Modal {
  private presets: Preset[];
  private onImport: (presets: Preset[]) => void;

  constructor(
    app: App,
    presets: Preset[],
    onImport: (presets: Preset[]) => void
  ) {
    super(app);
    this.presets = presets;
    this.onImport = onImport;
  }

  /**
   * 모달 표시
   */
  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();

    // 제목
    contentEl.createEl('h2', { text: '프리셋 가져오기/내보내기' });

    // 프리셋 목록
    new Setting(contentEl)
      .setName('프리셋 목록')
      .setHeading();

    this.presets.forEach(preset => {
      new Setting(contentEl)
        .setName(preset.name)
        .setDesc(preset.description || '')
        .addToggle(toggle => {
          toggle.setValue(true);
        });
    });

    // 가져오기
    new Setting(contentEl)
      .setName('프리셋 가져오기')
      .setHeading();

    new Setting(contentEl)
      .setName('JSON 파일')
      .setDesc('프리셋이 포함된 JSON 파일을 선택합니다.')
      .addButton(button => {
        button
          .setButtonText('파일 선택')
          .onClick(() => {
            // TODO: 파일 선택 다이얼로그 표시
          });
      });

    // 내보내기
    new Setting(contentEl)
      .setName('프리셋 내보내기')
      .setHeading();

    new Setting(contentEl)
      .setName('선택한 프리셋')
      .setDesc('선택한 프리셋을 JSON 파일로 내보냅니다.')
      .addButton(button => {
        button
          .setButtonText('내보내기')
          .onClick(() => {
            // TODO: 파일 저장 다이얼로그 표시
          });
      });

    // 버튼
    new Setting(contentEl)
      .addButton(button => {
        button
          .setButtonText('닫기')
          .onClick(() => {
            this.close();
          });
      });
  }

  /**
   * JSON 파일 가져오기
   */
  private async _importJsonFile(): Promise<void> {
    // TODO: 파일 선택 다이얼로그 표시 및 JSON 파일 가져오기
  }

  /**
   * JSON 파일 내보내기
   */
  private async _exportJsonFile(): Promise<void> {
    // TODO: 파일 저장 다이얼로그 표시 및 JSON 파일 내보내기
  }
} 