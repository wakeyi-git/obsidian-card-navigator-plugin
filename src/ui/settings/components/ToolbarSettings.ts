import { App, Setting } from 'obsidian';
import { CardSetType } from '@/domain/models/CardSet';
import { LayoutType, LayoutDirection } from '@/domain/models/Layout';

/**
 * 툴바 설정 컴포넌트
 */
export class ToolbarSettings {
  constructor(
    private readonly containerEl: HTMLElement,
    private readonly app: App,
    private readonly plugin: any
  ) {}

  /**
   * 설정 표시
   */
  display(): void {
    // 툴바 설정
    new Setting(this.containerEl)
      .setName('툴바 설정')
      .setHeading();

    // 기본 카드셋 타입
    new Setting(this.containerEl)
      .setName('기본 카드셋 타입')
      .setDesc('새로운 카드셋을 생성할 때 사용할 기본 타입을 선택합니다.')
      .addDropdown(dropdown => {
        dropdown
          .addOption('folder', '폴더')
          .addOption('tag', '태그')
          .addOption('link', '링크')
          .addOption('search', '검색')
          .setValue(this.plugin.settings.defaultCardSetType)
          .onChange(value => {
            this.plugin.settings.defaultCardSetType = value as CardSetType;
            this.plugin.saveData();
          });
      });

    // 하위 폴더 포함
    new Setting(this.containerEl)
      .setName('하위 폴더 포함')
      .setDesc('폴더 기반 카드셋 생성 시 하위 폴더의 파일도 포함합니다.')
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
      .setDesc('링크 기반 카드셋 생성 시 탐색할 링크의 깊이를 설정합니다.')
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

    // 기본 레이아웃 타입
    new Setting(this.containerEl)
      .setName('기본 레이아웃 타입')
      .setDesc('새로운 레이아웃을 생성할 때 사용할 기본 타입을 선택합니다.')
      .addDropdown(dropdown => {
        dropdown
          .addOption(LayoutType.GRID, '그리드')
          .addOption(LayoutType.MASONRY, '메이슨리')
          .setValue(this.plugin.settings.layout.type)
          .onChange(value => {
            this.plugin.settings.layout.type = value as LayoutType;
            this.plugin.saveData();
          });
      });

    // 기본 레이아웃 방향
    new Setting(this.containerEl)
      .setName('기본 레이아웃 방향')
      .setDesc('새로운 레이아웃을 생성할 때 사용할 기본 방향을 선택합니다.')
      .addDropdown(dropdown => {
        dropdown
          .addOption(LayoutDirection.VERTICAL, '세로')
          .addOption(LayoutDirection.HORIZONTAL, '가로')
          .setValue(this.plugin.settings.layout.direction)
          .onChange(value => {
            this.plugin.settings.layout.direction = value as LayoutDirection;
            this.plugin.saveData();
          });
      });

    // 카드 높이 일치
    new Setting(this.containerEl)
      .setName('카드 높이 일치')
      .setDesc('모든 카드의 높이를 동일하게 맞춥니다.')
      .addToggle(toggle => {
        toggle
          .setValue(this.plugin.settings.layout.fixedHeight)
          .onChange(value => {
            this.plugin.settings.layout.fixedHeight = value;
            this.plugin.saveData();
          });
      });

    // 최소 카드 너비
    new Setting(this.containerEl)
      .setName('최소 카드 너비')
      .setDesc('카드의 최소 너비를 설정합니다.')
      .addText(text => {
        text
          .setValue(this.plugin.settings.layout.minCardWidth.toString())
          .onChange(value => {
            this.plugin.settings.layout.minCardWidth = parseInt(value);
            this.plugin.saveData();
          });
      });

    // 최소 카드 높이
    new Setting(this.containerEl)
      .setName('최소 카드 높이')
      .setDesc('카드의 최소 높이를 설정합니다.')
      .addText(text => {
        text
          .setValue(this.plugin.settings.layout.minCardHeight.toString())
          .onChange(value => {
            this.plugin.settings.layout.minCardHeight = parseInt(value);
            this.plugin.saveData();
          });
      });
  }
} 