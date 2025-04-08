import { Setting } from 'obsidian';
import type CardNavigatorPlugin from '@/main';
import { Container } from '@/infrastructure/di/Container';
import type { ISettingsService } from '@/domain/services/application/ISettingsService';
import { IEventDispatcher } from '@/domain/infrastructure/IEventDispatcher';
import { PresetMappingType } from '@/domain/models/Preset';

/**
 * 프리셋 설정 섹션
 */
export class PresetSettingsSection {
  private settingsService: ISettingsService;
  private eventDispatcher: IEventDispatcher;

  constructor(private plugin: CardNavigatorPlugin, eventDispatcher: IEventDispatcher) {
    // 설정 서비스 가져오기
    this.settingsService = Container.getInstance().resolve<ISettingsService>('ISettingsService');
    this.eventDispatcher = eventDispatcher;
  }

  /**
   * 프리셋 설정 섹션 생성
   */
  create(containerEl: HTMLElement): void {
    containerEl.createEl('h3', { text: '프리셋 설정' });

    const settings = this.settingsService.getSettings();

    // 기본 프리셋
    new Setting(containerEl)
      .setName('기본 프리셋')
      .setDesc('카드 내비게이터를 열 때 사용할 기본 프리셋을 선택합니다.')
      .addText(text =>
        text
          .setValue(settings.preset.mappings.find(m => m.type === PresetMappingType.GLOBAL)?.value || '')
          .onChange(async (value) => {
            const globalMapping = settings.preset.mappings.find(m => m.type === PresetMappingType.GLOBAL);
            if (globalMapping) {
              await this.settingsService.saveSettings({
                ...settings,
                preset: {
                  ...settings.preset,
                  mappings: [
                    ...settings.preset.mappings.filter(m => m.type !== PresetMappingType.GLOBAL),
                    { ...globalMapping, value }
                  ]
                }
              });
            } else {
              await this.settingsService.saveSettings({
                ...settings,
                preset: {
                  ...settings.preset,
                  mappings: [
                    ...settings.preset.mappings,
                    {
                      id: `global-${Date.now()}`,
                      type: PresetMappingType.GLOBAL,
                      value,
                      priority: 0,
                      enabled: true
                    }
                  ]
                }
              });
            }
          }));

    // 자동 프리셋 적용
    new Setting(containerEl)
      .setName('자동 프리셋 적용')
      .setDesc('파일을 열 때 자동으로 프리셋을 적용합니다.')
      .addToggle(toggle =>
        toggle
          .setValue(settings.preset.mappings.some(m => m.type === PresetMappingType.GLOBAL))
          .onChange(async (value) => {
            if (value) {
              const globalMapping = settings.preset.mappings.find(m => m.type === PresetMappingType.GLOBAL);
              if (!globalMapping) {
                await this.settingsService.saveSettings({
                  ...settings,
                  preset: {
                    ...settings.preset,
                    mappings: [
                      ...settings.preset.mappings,
                      {
                        id: `global-${Date.now()}`,
                        type: PresetMappingType.GLOBAL,
                        value: '',
                        priority: 0,
                        enabled: true
                      }
                    ]
                  }
                });
              }
            } else {
              await this.settingsService.saveSettings({
                ...settings,
                preset: {
                  ...settings.preset,
                  mappings: settings.preset.mappings.filter(m => m.type !== PresetMappingType.GLOBAL)
                }
              });
            }
          }));

    // 프리셋 매핑 섹션
    containerEl.createEl('h4', { text: '프리셋 매핑' });

    // 폴더 매핑
    new Setting(containerEl)
      .setName('폴더 매핑')
      .setDesc('폴더별 프리셋 매핑을 설정합니다. (폴더 경로:프리셋 이름)')
      .addTextArea(text => {
        const folderMappings = settings.preset.mappings.filter(m => m.type === PresetMappingType.FOLDER);
        text
          .setValue(folderMappings.map(m => `${m.value}:${m.options?.includeSubfolders || false}`).join('\n'))
          .onChange(async (value) => {
            const mappings = value
              .split('\n')
              .map(line => {
                const [path, includeSubfolders] = line.split(':').map(s => s.trim());
                return {
                  id: `folder-${Date.now()}`,
                  type: PresetMappingType.FOLDER,
                  value: path,
                  priority: 0,
                  enabled: true,
                  options: {
                    includeSubfolders: includeSubfolders === 'true'
                  }
                };
              })
              .filter(m => m.value);
            
            await this.settingsService.saveSettings({
              ...settings,
              preset: {
                ...settings.preset,
                mappings: [
                  ...settings.preset.mappings.filter(m => m.type !== PresetMappingType.FOLDER),
                  ...mappings
                ]
              }
            });
          });
        return text;
      });

    // 태그 매핑
    new Setting(containerEl)
      .setName('태그 매핑')
      .setDesc('태그별 프리셋 매핑을 설정합니다. (태그:프리셋 이름)')
      .addTextArea(text => {
        const tagMappings = settings.preset.mappings.filter(m => m.type === PresetMappingType.TAG);
        text
          .setValue(tagMappings.map(m => m.value).join('\n'))
          .onChange(async (value) => {
            const mappings = value
              .split('\n')
              .map(tag => ({
                id: `tag-${Date.now()}`,
                type: PresetMappingType.TAG,
                value: tag.trim(),
                priority: 0,
                enabled: true
              }))
              .filter(m => m.value);
            
            await this.settingsService.saveSettings({
              ...settings,
              preset: {
                ...settings.preset,
                mappings: [
                  ...settings.preset.mappings.filter(m => m.type !== PresetMappingType.TAG),
                  ...mappings
                ]
              }
            });
          });
        return text;
      });

    // 생성일 매핑
    new Setting(containerEl)
      .setName('생성일 매핑')
      .setDesc('생성일별 프리셋 매핑을 설정합니다. (시작일-종료일:프리셋 이름)')
      .addTextArea(text => {
        const dateMappings = settings.preset.mappings.filter(m => m.type === PresetMappingType.CREATED_DATE);
        text
          .setValue(dateMappings.map(m => 
            `${m.options?.dateRange?.start.toISOString()}-${m.options?.dateRange?.end.toISOString()}`
          ).join('\n'))
          .onChange(async (value) => {
            const mappings = value
              .split('\n')
              .map(line => {
                const [start, end] = line.split('-').map(d => d.trim());
                return {
                  id: `date-${Date.now()}`,
                  type: PresetMappingType.CREATED_DATE,
                  value: '',
                  priority: 0,
                  enabled: true,
                  options: {
                    dateRange: {
                      start: new Date(start),
                      end: new Date(end)
                    }
                  }
                };
              })
              .filter(m => m.options?.dateRange?.start && m.options?.dateRange?.end);
            
            await this.settingsService.saveSettings({
              ...settings,
              preset: {
                ...settings.preset,
                mappings: [
                  ...settings.preset.mappings.filter(m => m.type !== PresetMappingType.CREATED_DATE),
                  ...mappings
                ]
              }
            });
          });
        return text;
      });

    // 수정일 매핑
    new Setting(containerEl)
      .setName('수정일 매핑')
      .setDesc('수정일별 프리셋 매핑을 설정합니다. (시작일-종료일:프리셋 이름)')
      .addTextArea(text => {
        const dateMappings = settings.preset.mappings.filter(m => m.type === PresetMappingType.MODIFIED_DATE);
        text
          .setValue(dateMappings.map(m => 
            `${m.options?.dateRange?.start.toISOString()}-${m.options?.dateRange?.end.toISOString()}`
          ).join('\n'))
          .onChange(async (value) => {
            const mappings = value
              .split('\n')
              .map(line => {
                const [start, end] = line.split('-').map(d => d.trim());
                return {
                  id: `date-${Date.now()}`,
                  type: PresetMappingType.MODIFIED_DATE,
                  value: '',
                  priority: 0,
                  enabled: true,
                  options: {
                    dateRange: {
                      start: new Date(start),
                      end: new Date(end)
                    }
                  }
                };
              })
              .filter(m => m.options?.dateRange?.start && m.options?.dateRange?.end);
            
            await this.settingsService.saveSettings({
              ...settings,
              preset: {
                ...settings.preset,
                mappings: [
                  ...settings.preset.mappings.filter(m => m.type !== PresetMappingType.MODIFIED_DATE),
                  ...mappings
                ]
              }
            });
          });
        return text;
      });

    // 속성 매핑
    new Setting(containerEl)
      .setName('속성 매핑')
      .setDesc('속성별 프리셋 매핑을 설정합니다. (속성명=속성값:프리셋 이름)')
      .addTextArea(text => {
        const propertyMappings = settings.preset.mappings.filter(m => m.type === PresetMappingType.PROPERTY);
        text
          .setValue(propertyMappings.map(m => 
            `${m.options?.property?.name}=${m.options?.property?.value}`
          ).join('\n'))
          .onChange(async (value) => {
            const mappings = value
              .split('\n')
              .map(line => {
                const [name, value] = line.split('=').map(p => p.trim());
                return {
                  id: `property-${Date.now()}`,
                  type: PresetMappingType.PROPERTY,
                  value: '',
                  priority: 0,
                  enabled: true,
                  options: {
                    property: {
                      name,
                      value
                    }
                  }
                };
              })
              .filter(m => m.options?.property?.name && m.options?.property?.value);
            
            await this.settingsService.saveSettings({
              ...settings,
              preset: {
                ...settings.preset,
                mappings: [
                  ...settings.preset.mappings.filter(m => m.type !== PresetMappingType.PROPERTY),
                  ...mappings
                ]
              }
            });
          });
        return text;
      });
  }
} 