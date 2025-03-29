import { App, Modal, Setting } from 'obsidian';
import { CardSetType } from '../../../domain/models/types';
import { CreateCardSetDto } from '../../../application/dtos/CardSetDto';

/**
 * 새 카드셋 생성 모달
 */
export class CreateCardSetModal extends Modal {
  private type: CardSetType = 'folder';
  private source: string = '';
  private name: string = '';

  constructor(
    app: App,
    private readonly onSubmit: (dto: CreateCardSetDto) => void
  ) {
    super(app);
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();

    contentEl.createEl('h2', { text: '새 카드셋 생성' });

    new Setting(contentEl)
      .setName('이름')
      .setDesc('카드셋의 이름을 입력하세요.')
      .addText(text => text
        .onChange(value => this.name = value)
        .setPlaceholder('카드셋 이름'));

    new Setting(contentEl)
      .setName('타입')
      .setDesc('카드셋의 타입을 선택하세요.')
      .addDropdown(dropdown => {
        dropdown
          .addOption('folder', '폴더')
          .addOption('tag', '태그')
          .addOption('link', '링크')
          .addOption('activeFolder', '현재 폴더')
          .addOption('selectedFolder', '선택된 폴더')
          .addOption('vault', '보관함')
          .onChange(value => this.type = value as CardSetType);
      });

    new Setting(contentEl)
      .setName('소스')
      .setDesc('카드셋의 소스를 입력하세요.')
      .addText(text => text
        .onChange(value => this.source = value)
        .setPlaceholder('폴더 경로, 태그, 또는 링크'));

    new Setting(contentEl)
      .addButton(btn => btn
        .setButtonText('생성')
        .setCta()
        .onClick(() => {
          this.onSubmit({
            name: this.name,
            type: this.type,
            source: this.source
          });
          this.close();
        }))
      .addButton(btn => btn
        .setButtonText('취소')
        .onClick(() => {
          this.close();
        }));
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
} 