import { Setting } from 'obsidian';
import type CardNavigatorPlugin from '@/main';
import { PresetType } from '@/domain/models/Preset';

/**
 * 프리셋 설정 섹션
 */
export class PresetSettingsSection {
  constructor(private plugin: CardNavigatorPlugin) {}

  /**
   * 프리셋 설정 섹션 생성
   */
  create(containerEl: HTMLElement): void {
    containerEl.createEl('h3', { text: '프리셋 설정' });

    // 기본 프리셋
    new Setting(containerEl)
      .setName('기본 프리셋')
      .setDesc('카드 내비게이터를 열 때 사용할 기본 프리셋을 선택합니다.')
      .addText(text =>
        text
          .setValue(this.plugin.settings.defaultPreset)
          .onChange(async (value) => {
            this.plugin.settings = {
              ...this.plugin.settings,
              defaultPreset: value
            };
            await this.plugin.saveSettings();
          }));

    // 자동 프리셋 적용
    new Setting(containerEl)
      .setName('자동 프리셋 적용')
      .setDesc('파일을 열 때 자동으로 프리셋을 적용합니다.')
      .addToggle(toggle =>
        toggle
          .setValue(this.plugin.settings.autoApplyPreset)
          .onChange(async (value) => {
            this.plugin.settings = {
              ...this.plugin.settings,
              autoApplyPreset: value
            };
            await this.plugin.saveSettings();
          }));

    // 프리셋 타입
    new Setting(containerEl)
      .setName('프리셋 타입')
      .setDesc('프리셋의 적용 범위를 선택합니다.')
      .addDropdown(dropdown =>
        dropdown
          .addOption(PresetType.GLOBAL, '전역')
          .addOption(PresetType.FOLDER, '폴더별')
          .addOption(PresetType.TAG, '태그별')
          .addOption(PresetType.DATE, '날짜별')
          .addOption(PresetType.PROPERTY, '속성별')
          .setValue(this.plugin.settings.presetType)
          .onChange(async (value) => {
            this.plugin.settings = {
              ...this.plugin.settings,
              presetType: value as PresetType
            };
            await this.plugin.saveSettings();
          }));

    // 우선 순위 태그
    new Setting(containerEl)
      .setName('우선 순위 태그')
      .setDesc('우선 순위가 높은 태그를 쉼표로 구분하여 입력합니다.')
      .addText(text =>
        text
          .setValue(this.plugin.settings.priorityTags.join(', '))
          .onChange(async (value) => {
            this.plugin.settings = {
              ...this.plugin.settings,
              priorityTags: value.split(',').map(tag => tag.trim())
            };
            await this.plugin.saveSettings();
          }));

    // 우선 순위 폴더
    new Setting(containerEl)
      .setName('우선 순위 폴더')
      .setDesc('우선 순위가 높은 폴더를 쉼표로 구분하여 입력합니다.')
      .addText(text =>
        text
          .setValue(this.plugin.settings.priorityFolders.join(', '))
          .onChange(async (value) => {
            this.plugin.settings = {
              ...this.plugin.settings,
              priorityFolders: value.split(',').map(folder => folder.trim())
            };
            await this.plugin.saveSettings();
          }));

    // 프리셋 매핑 섹션
    containerEl.createEl('h4', { text: '프리셋 매핑' });

    // 폴더 매핑
    new Setting(containerEl)
      .setName('폴더 매핑')
      .setDesc('폴더별 프리셋 매핑을 설정합니다. (폴더 경로:프리셋 이름)')
      .addTextArea(text =>
        text
          .setValue(this.plugin.settings.folderPresetMappings.map(m => `${m.folder}:${m.preset}`).join('\n'))
          .onChange(async (value) => {
            this.plugin.settings = {
              ...this.plugin.settings,
              folderPresetMappings: value
                .split('\n')
                .map(line => {
                  const [folder, preset] = line.split(':').map(s => s.trim());
                  return { folder, preset };
                })
                .filter(m => m.folder && m.preset)
            };
            await this.plugin.saveSettings();
          }));

    // 태그 매핑
    new Setting(containerEl)
      .setName('태그 매핑')
      .setDesc('태그별 프리셋 매핑을 설정합니다. (태그:프리셋 이름)')
      .addTextArea(text =>
        text
          .setValue(this.plugin.settings.tagPresetMappings.map(m => `${m.tag}:${m.preset}`).join('\n'))
          .onChange(async (value) => {
            this.plugin.settings = {
              ...this.plugin.settings,
              tagPresetMappings: value
                .split('\n')
                .map(line => {
                  const [tag, preset] = line.split(':').map(s => s.trim());
                  return { tag, preset };
                })
                .filter(m => m.tag && m.preset)
            };
            await this.plugin.saveSettings();
          }));

    // 날짜 매핑
    new Setting(containerEl)
      .setName('날짜 매핑')
      .setDesc('날짜별 프리셋 매핑을 설정합니다. (시작일-종료일:프리셋 이름)')
      .addTextArea(text =>
        text
          .setValue(this.plugin.settings.datePresetMappings.map(m => `${m.startDate}-${m.endDate}:${m.preset}`).join('\n'))
          .onChange(async (value) => {
            this.plugin.settings = {
              ...this.plugin.settings,
              datePresetMappings: value
                .split('\n')
                .map(line => {
                  const [dates, preset] = line.split(':').map(s => s.trim());
                  const [startDate, endDate] = dates.split('-').map(d => d.trim());
                  return { startDate, endDate, preset };
                })
                .filter(m => m.startDate && m.endDate && m.preset)
            };
            await this.plugin.saveSettings();
          }));

    // 속성 매핑
    new Setting(containerEl)
      .setName('속성 매핑')
      .setDesc('속성별 프리셋 매핑을 설정합니다. (속성명=속성값:프리셋 이름)')
      .addTextArea(text =>
        text
          .setValue(this.plugin.settings.propertyPresetMappings.map(m => `${m.name}=${m.value}:${m.preset}`).join('\n'))
          .onChange(async (value) => {
            this.plugin.settings = {
              ...this.plugin.settings,
              propertyPresetMappings: value
                .split('\n')
                .map(line => {
                  const [property, preset] = line.split(':').map(s => s.trim());
                  const [name, value] = property.split('=').map(p => p.trim());
                  return { name, value, preset };
                })
                .filter(m => m.name && m.value && m.preset)
            };
            await this.plugin.saveSettings();
          }));
  }
} 