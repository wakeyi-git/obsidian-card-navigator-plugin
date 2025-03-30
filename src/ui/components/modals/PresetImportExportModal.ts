import { App, Modal, Setting } from 'obsidian';
import { Preset } from '@/domain/models/Preset';

/**
 * 프리셋 가져오기/내보내기 모달
 */
export class PresetImportExportModal extends Modal {
  private presets: Preset[];
  private onImport: (presets: Preset[]) => void;
  private selectedPresets: Set<string> = new Set();

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
          toggle.setValue(this.selectedPresets.has(preset.id));
          toggle.onChange(value => {
            if (value) {
              this.selectedPresets.add(preset.id);
            } else {
              this.selectedPresets.delete(preset.id);
            }
          });
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
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            input.onchange = async (e) => {
              const file = (e.target as HTMLInputElement).files?.[0];
              if (!file) return;

              try {
                const text = await file.text();
                const presets = JSON.parse(text);
                this.onImport(presets);
                this.close();
              } catch (error) {
                console.error('Error importing presets:', error);
                alert('프리셋 가져오기 실패');
              }
            };
            input.click();
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
            const selectedPresets = this.presets.filter(preset => this.selectedPresets.has(preset.id));
            if (selectedPresets.length === 0) {
              alert('내보낼 프리셋을 선택해주세요.');
              return;
            }

            const json = JSON.stringify(selectedPresets, null, 2);
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'presets.json';
            a.click();
            URL.revokeObjectURL(url);
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
} 