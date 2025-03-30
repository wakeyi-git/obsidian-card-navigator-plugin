import { App, Modal, Setting } from 'obsidian';
import { Preset } from '@/domain/models/Preset';

/**
 * 프리셋 수정 모달
 */
export class PresetEditModal extends Modal {
  private preset: Preset;
  private onSubmit: (preset: Preset) => void;

  constructor(
    app: App,
    preset: Preset,
    onSubmit: (preset: Preset) => void
  ) {
    super(app);
    this.preset = preset;
    this.onSubmit = onSubmit;
  }

  /**
   * 모달 표시
   */
  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();

    // 제목
    contentEl.createEl('h2', { text: '프리셋 수정' });

    // 이름
    new Setting(contentEl)
      .setName('이름')
      .setDesc('프리셋의 이름을 입력하세요.')
      .addText(text => {
        text
          .setValue(this.preset.name)
          .onChange(value => {
            this.preset.name = value;
          });
      });

    // 설명
    new Setting(contentEl)
      .setName('설명')
      .setDesc('프리셋에 대한 설명을 입력하세요.')
      .addTextArea(text => {
        text
          .setValue(this.preset.description || '')
          .onChange(value => {
            this.preset.description = value;
          });
      });

    // 고정 높이
    new Setting(contentEl)
      .setName('고정 높이')
      .setDesc('카드의 높이를 고정할지 여부를 설정합니다.')
      .addToggle(toggle => {
        toggle
          .setValue(this.preset.layoutConfig.fixedHeight)
          .onChange(value => {
            this.preset.layoutConfig.fixedHeight = value;
          });
      });

    // 최소 카드 너비
    new Setting(contentEl)
      .setName('최소 카드 너비')
      .setDesc('카드의 최소 너비를 설정합니다.')
      .addText(text => {
        text
          .setValue(this.preset.layoutConfig.minCardWidth.toString())
          .onChange(value => {
            this.preset.layoutConfig.minCardWidth = parseInt(value);
          });
      });

    // 최소 카드 높이
    new Setting(contentEl)
      .setName('최소 카드 높이')
      .setDesc('카드의 최소 높이를 설정합니다.')
      .addText(text => {
        text
          .setValue(this.preset.layoutConfig.minCardHeight.toString())
          .onChange(value => {
            this.preset.layoutConfig.minCardHeight = parseInt(value);
          });
      });

    // 카드 너비
    new Setting(contentEl)
      .setName('카드 너비')
      .setDesc('카드의 너비를 설정합니다.')
      .addText(text => {
        text
          .setValue(this.preset.layoutConfig.cardWidth.toString())
          .onChange(value => {
            this.preset.layoutConfig.cardWidth = parseInt(value);
          });
      });

    // 카드 높이
    new Setting(contentEl)
      .setName('카드 높이')
      .setDesc('카드의 높이를 설정합니다.')
      .addText(text => {
        text
          .setValue(this.preset.layoutConfig.cardHeight.toString())
          .onChange(value => {
            this.preset.layoutConfig.cardHeight = parseInt(value);
          });
      });

    // 간격
    new Setting(contentEl)
      .setName('간격')
      .setDesc('카드 간의 간격을 설정합니다.')
      .addText(text => {
        text
          .setValue(this.preset.layoutConfig.gap.toString())
          .onChange(value => {
            this.preset.layoutConfig.gap = parseInt(value);
          });
      });

    // 여백
    new Setting(contentEl)
      .setName('여백')
      .setDesc('카드 컨테이너의 여백을 설정합니다.')
      .addText(text => {
        text
          .setValue(this.preset.layoutConfig.padding.toString())
          .onChange(value => {
            this.preset.layoutConfig.padding = parseInt(value);
          });
      });

    // 뷰포트 너비
    new Setting(contentEl)
      .setName('뷰포트 너비')
      .setDesc('뷰포트의 너비를 설정합니다.')
      .addText(text => {
        text
          .setValue(this.preset.layoutConfig.viewportWidth.toString())
          .onChange(value => {
            this.preset.layoutConfig.viewportWidth = parseInt(value);
          });
      });

    // 뷰포트 높이
    new Setting(contentEl)
      .setName('뷰포트 높이')
      .setDesc('뷰포트의 높이를 설정합니다.')
      .addText(text => {
        text
          .setValue(this.preset.layoutConfig.viewportHeight.toString())
          .onChange(value => {
            this.preset.layoutConfig.viewportHeight = parseInt(value);
          });
      });

    // 버튼
    new Setting(contentEl)
      .addButton(button => {
        button
          .setButtonText('저장')
          .setCta()
          .onClick(() => {
            this.onSubmit(this.preset);
            this.close();
          });
      })
      .addButton(button => {
        button
          .setButtonText('취소')
          .onClick(() => {
            this.close();
          });
      });
  }

  /**
   * 모달 닫기
   */
  onClose(): void {
    const { contentEl } = this;
    contentEl.empty();
  }
} 