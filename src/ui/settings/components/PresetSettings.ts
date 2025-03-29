import { App, Setting } from 'obsidian';
import { Preset } from '@/domain/models/Preset';
import { PresetEditModal } from '@/ui/components/modals/PresetEditModal';
import { PresetImportExportModal } from '@/ui/components/modals/PresetImportExportModal';
import { LayoutType, LayoutDirection } from '@/domain/models/Layout';

/**
 * 프리셋 설정 컴포넌트
 */
export class PresetSettings {
  constructor(
    private readonly containerEl: HTMLElement,
    private readonly app: App,
    private readonly plugin: any
  ) {}

  /**
   * 설정 표시
   */
  display(): void {
    // 프리셋 목록
    new Setting(this.containerEl)
      .setName('프리셋 목록')
      .setHeading();

    this.plugin.settings.presets.forEach((preset: Preset) => {
      const setting = new Setting(this.containerEl)
        .setName(preset.name)
        .setDesc(preset.description || '');

      // 편집 버튼
      setting.addButton(button => {
        button
          .setButtonText('편집')
          .onClick(() => {
            new PresetEditModal(this.app, preset, (updatedPreset) => {
              const index = this.plugin.settings.presets.findIndex((p: Preset) => p.id === preset.id);
              if (index !== -1) {
                this.plugin.settings.presets[index] = updatedPreset;
                this.plugin.saveData();
                this.display();
              }
            }).open();
          });
      });

      // 삭제 버튼
      setting.addButton(button => {
        button
          .setButtonText('삭제')
          .setWarning()
          .onClick(() => {
            if (confirm('이 프리셋을 삭제하시겠습니까?')) {
              const index = this.plugin.settings.presets.findIndex((p: Preset) => p.id === preset.id);
              if (index !== -1) {
                this.plugin.settings.presets.splice(index, 1);
                this.plugin.saveData();
                this.display();
              }
            }
          });
      });
    });

    // 프리셋 생성 버튼
    new Setting(this.containerEl)
      .addButton(button => {
        button
          .setButtonText('프리셋 생성')
          .onClick(() => {
            this._handleCreatePreset();
          });
      });

    // 프리셋 가져오기/내보내기 버튼
    new Setting(this.containerEl)
      .addButton(button => {
        button
          .setButtonText('프리셋 가져오기')
          .onClick(() => {
            new PresetImportExportModal(this.app, this.plugin.settings.presets, (presets) => {
              this.plugin.settings.presets.push(...presets);
              this.plugin.saveData();
              this.display();
            }).open();
          });
      })
      .addButton(button => {
        button
          .setButtonText('프리셋 내보내기')
          .onClick(() => {
            new PresetImportExportModal(this.app, this.plugin.settings.presets, () => {}).open();
          });
      });

    // 폴더 프리셋
    new Setting(this.containerEl)
      .setName('폴더 프리셋')
      .setHeading();

    this.plugin.settings.folderPresets.forEach((presetId: string, folderPath: string) => {
      const preset = this.plugin.settings.presets.find((p: Preset) => p.id === presetId);
      if (!preset) return;

      new Setting(this.containerEl)
        .setName(folderPath)
        .setDesc(preset.name)
        .addDropdown(dropdown => {
          this.plugin.settings.presets.forEach((p: Preset) => {
            dropdown.addOption(p.id, p.name);
          });
          dropdown.setValue(presetId);
          dropdown.onChange(value => {
            this.plugin.settings.folderPresets.set(folderPath, value);
            this.plugin.saveData();
          });
        });
    });

    // 태그 프리셋
    new Setting(this.containerEl)
      .setName('태그 프리셋')
      .setHeading();

    this.plugin.settings.tagPresets.forEach((presetId: string, tag: string) => {
      const preset = this.plugin.settings.presets.find((p: Preset) => p.id === presetId);
      if (!preset) return;

      new Setting(this.containerEl)
        .setName(tag)
        .setDesc(preset.name)
        .addDropdown(dropdown => {
          this.plugin.settings.presets.forEach((p: Preset) => {
            dropdown.addOption(p.id, p.name);
          });
          dropdown.setValue(presetId);
          dropdown.onChange(value => {
            this.plugin.settings.tagPresets.set(tag, value);
            this.plugin.saveData();
          });
        });
    });

    // 프리셋 우선순위
    new Setting(this.containerEl)
      .setName('프리셋 우선순위')
      .setHeading();

    this.plugin.settings.presetPriority.forEach((id: string, index: number) => {
      const preset = this.plugin.settings.presets.find((p: Preset) => p.id === id);
      if (!preset) return;

      new Setting(this.containerEl)
        .setName(preset.name)
        .addButton(button => {
          button
            .setButtonText('위로')
            .setDisabled(index === 0)
            .onClick(() => {
              const temp = this.plugin.settings.presetPriority[index];
              this.plugin.settings.presetPriority[index] = this.plugin.settings.presetPriority[index - 1];
              this.plugin.settings.presetPriority[index - 1] = temp;
              this.plugin.saveData();
              this.display();
            });
        })
        .addButton(button => {
          button
            .setButtonText('아래로')
            .setDisabled(index === this.plugin.settings.presetPriority.length - 1)
            .onClick(() => {
              const temp = this.plugin.settings.presetPriority[index];
              this.plugin.settings.presetPriority[index] = this.plugin.settings.presetPriority[index + 1];
              this.plugin.settings.presetPriority[index + 1] = temp;
              this.plugin.saveData();
              this.display();
            });
        });
    });
  }

  /**
   * 프리셋 생성 처리
   */
  private _handleCreatePreset(): void {
    const preset = new Preset(
      crypto.randomUUID(),
      '기본 프리셋',
      '기본 프리셋입니다.',
      {
        type: 'folder',
        value: '',
        includeSubfolders: true,
        sortBy: 'fileName',
        sortOrder: 'asc'
      },
      {
        type: LayoutType.GRID,
        direction: LayoutDirection.VERTICAL,
        fixedHeight: true,
        minCardWidth: 200,
        minCardHeight: 150,
        cardWidth: 200,
        cardHeight: 150,
        gap: 16,
        padding: 16,
        viewportWidth: 800,
        viewportHeight: 600
      },
      {
        header: {
          showFileName: true,
          showFirstHeader: true,
          showTags: true,
          showCreatedDate: false,
          showUpdatedDate: false,
          showProperties: [],
          renderMarkdown: true
        },
        body: {
          showFileName: false,
          showFirstHeader: false,
          showContent: true,
          showTags: false,
          showCreatedDate: false,
          showUpdatedDate: false,
          showProperties: [],
          contentLength: 200,
          renderMarkdown: true
        },
        footer: {
          showFileName: false,
          showFirstHeader: false,
          showTags: false,
          showCreatedDate: false,
          showUpdatedDate: false,
          showProperties: [],
          renderMarkdown: true
        },
        renderAsHtml: true
      }
    );

    this.plugin.settings.presets.push(preset);
    this.plugin.saveData();
    this.display();
  }
} 