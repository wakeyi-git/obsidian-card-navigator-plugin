import { Setting } from 'obsidian';
import { CardSetType } from '@/domain/models/CardSet';

/**
 * 카드셋 설정 컴포넌트
 */
export class CardSetSettings {
  constructor(
    private readonly containerEl: HTMLElement,
    private readonly plugin: any
  ) {}

  /**
   * 카드셋 설정 표시
   */
  display(): void {
    // 카드셋 설정
    new Setting(this.containerEl)
      .setName('카드셋 설정')
      .setHeading();

    // 기본 카드셋 타입
    new Setting(this.containerEl)
      .setName('기본 카드셋 타입')
      .setDesc('새 카드셋을 생성할 때 사용할 기본 타입을 선택합니다.')
      .addDropdown(dropdown => {
        dropdown
          .addOption('folder', '폴더')
          .addOption('tag', '태그')
          .addOption('link', '링크')
          .setValue(this.plugin.settings.defaultCardSetType)
          .onChange(value => {
            this.plugin.settings.defaultCardSetType = value as CardSetType;
            this.plugin.saveData();
          });
      });

    // 하위 폴더 포함
    new Setting(this.containerEl)
      .setName('하위 폴더 포함')
      .setDesc('폴더 카드셋에서 하위 폴더의 노트도 포함합니다.')
      .addToggle(toggle => {
        toggle
          .setValue(this.plugin.settings.includeSubfolders)
          .onChange(value => {
            this.plugin.settings.includeSubfolders = value;
            this.plugin.saveData();
          });
      });

    // 링크 레벨
    new Setting(this.containerEl)
      .setName('링크 레벨')
      .setDesc('링크 카드셋에서 탐색할 링크의 깊이를 설정합니다.')
      .addSlider(slider => {
        slider
          .setLimits(1, 5, 1)
          .setValue(this.plugin.settings.linkLevel)
          .setDynamicTooltip()
          .onChange(value => {
            this.plugin.settings.linkLevel = value;
            this.plugin.saveData();
          });
      });
  }
} 