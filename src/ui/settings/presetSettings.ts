import { Setting, ButtonComponent, ToggleComponent, Notice } from 'obsidian';
import CardNavigatorPlugin from '../../main';
import { SettingsManager } from './settingsManager';
import { PresetSuggest, FileSuggestMode } from './components/PresetSuggest';
import { PresetEditModal } from '../settings/modals/PresetEditModal';
import { PresetImportExportModal } from '../settings/modals/PresetImportExportModal';
import { FolderSuggest } from './components/FolderSuggest';
import { SettingTab } from './settingsTab';

let presetListContainer: HTMLElement;

export function addPresetSettings(containerEl: HTMLElement, plugin: CardNavigatorPlugin, settingsManager: SettingsManager, settingTab: SettingTab): void {
    const refreshAllSettings = () => {
        settingTab.updateAllSections();
    };

    addGlobalPresetSection(containerEl, plugin);
    addFolderPresetSection(containerEl, plugin, settingsManager, refreshAllSettings);
    addPresetManagementSection(containerEl, plugin, settingsManager, refreshAllSettings);
    
    // 프리셋 목록을 위한 컨테이너 생성
    presetListContainer = containerEl.createDiv('preset-list-container');
    refreshPresetList(plugin, settingsManager, refreshAllSettings);
}

async function refreshPresetList(plugin: CardNavigatorPlugin, settingsManager: SettingsManager, refreshAllSettings: () => void): Promise<void> {
    if (!presetListContainer) return;

    presetListContainer.empty();
    await addPresetListSection(presetListContainer, plugin, settingsManager, refreshAllSettings);
}

function addGlobalPresetSection(containerEl: HTMLElement, plugin: CardNavigatorPlugin): void {
    new Setting(containerEl)
        .setName('프리셋 폴더')
        .setDesc('Card Navigator 프리셋을 저장할 폴더를 선택하세요.')
        .addSearch(cb => {
            new FolderSuggest(plugin.app, cb.inputEl);
            cb.setPlaceholder('예: CardNavigatorPresets')
                .setValue(plugin.settings.presetFolderPath)
                .onChange(async (newFolder) => {
                    plugin.settings.presetFolderPath = newFolder;
                    await plugin.saveSettings();
                    plugin.presetManager.updatePresetFolder(newFolder);
                });
            const parentEl = cb.inputEl.parentElement;
            if (parentEl) {
                parentEl.classList.add('wide-input-container');
            }
            
            cb.inputEl.removeAttribute('autofocus');
            
            setTimeout(() => {
                cb.inputEl.blur();
            }, 0);
        });
}

function addPresetManagementSection(containerEl: HTMLElement, plugin: CardNavigatorPlugin, settingsManager: SettingsManager, refreshAllSettings: () => void): void {
    addPresetManagementSectionContent(containerEl, plugin, settingsManager, refreshAllSettings);
}

function addPresetManagementSectionContent(containerEl: HTMLElement, plugin: CardNavigatorPlugin, settingsManager: SettingsManager, refreshAllSettings: () => void): void {
    new Setting(containerEl)
        .setName('프리셋 관리 및 전역 프리셋 설정')
        .setDesc('프리셋을 생성하고 관리합니다. 토글 버튼을 활성화하여 전역 프리셋으로 설정합니다.')
        .addButton((button: ButtonComponent) => 
            button
                .setTooltip('새 프리셋 생성')
                .setIcon('plus')
                .onClick(async () => {
                    const modal = new PresetEditModal(
                        plugin.app, 
                        plugin, 
                        settingsManager, 
                        'create', 
                        undefined,
						refreshAllSettings
					);
                    await modal.open();
                })
        )
        .addButton((button: ButtonComponent) => 
            button
                .setTooltip('프리셋 가져오기')
                .setIcon('upload')
                .onClick(async () => {
                    const modal = new PresetImportExportModal(
                        plugin.app,
                        plugin,
                        settingsManager,
                        'import',
                        undefined,
                        () => refreshPresetList(plugin, settingsManager, refreshAllSettings) 
                    );
                    await modal.open();
                })
        );
}

async function addPresetListSection(containerEl: HTMLElement, plugin: CardNavigatorPlugin, settingsManager: SettingsManager, refreshAllSettings: () => void): Promise<void> {
    const presetNames = await plugin.presetManager.getPresetNames();
    const presets = await Promise.all(presetNames.map(name => plugin.presetManager.getPreset(name)));
    
    presets.forEach((preset, index) => {
        if (!preset) return;
        
        const presetName = presetNames[index];
        const setting = new Setting(containerEl)
            .setName(presetName)
            .setDesc(preset.description || '설명 없음');
		
		if (presetName !== 'default') {
			setting.addButton((button: ButtonComponent) => 
				button
					.setTooltip('수정')
					.setIcon('pencil')
					.onClick(() => {
						new PresetEditModal(
							plugin.app, 
							plugin, 
							settingsManager, 
							'edit', 
							presetName,
							refreshAllSettings
						).open();
					})
			);

			setting.addButton((button: ButtonComponent) => 
				button
					.setTooltip('복제')
					.setIcon('copy')
					.onClick(() => {
						new PresetEditModal(
							plugin.app, 
							plugin, 
							settingsManager, 
							'clone', 
							presetName,
							refreshAllSettings
						).open();
					})
			);

			setting.addButton((button: ButtonComponent) => 
				button
					.setTooltip('삭제')
					.setIcon('trash')
					.onClick(async () => {
						if (await settingsManager.confirmDelete(`프리셋 "${presetName}"`)) {
							await plugin.presetManager.deletePreset(presetName);
							
							if (plugin.settings.GlobalPreset === presetName) {
								await plugin.presetManager.applyGlobalPreset('default');
								new Notice("현재 프리셋이 삭제되어 'default' 프리셋으로 변경되었습니다.");
							}
							
							settingsManager.applyChanges();
							refreshAllSettings();
						}
					})
			);
		}

		setting.addButton((button: ButtonComponent) => 
			button
				.setTooltip('내보내기')
				.setIcon('download')
				.onClick(() => {
					new PresetImportExportModal(plugin.app, plugin, settingsManager, 'export', presetName).open();
				})
		)
        .addToggle((toggle: ToggleComponent) => {
            toggle
                .setTooltip('전역 프리셋으로 설정')
                .setValue(plugin.settings.GlobalPreset === presetName)
                .onChange(async (value: boolean) => {
                    if (value) {
                        await plugin.presetManager.applyGlobalPreset(presetName);
                        refreshAllSettings();
                    } else if (plugin.settings.GlobalPreset === presetName) {
                        toggle.setValue(true);
                    }
                });
        });
    });
}

function addFolderPresetSection(containerEl: HTMLElement, plugin: CardNavigatorPlugin, settingsManager: SettingsManager, refreshAllSettings: () => void): void {
    new Setting(containerEl)
        .setName('프리셋 자동 적용')
        .setDesc('폴더 변경 시 자동으로 폴더에 지정된 프리셋을 적용합니다.')
        .addToggle((toggle) => 
            toggle
                .setValue(plugin.settings.autoApplyFolderPresets)
                .onChange(async (value) => {
                    await settingsManager.toggleAutoApplyPresets(value);
                })
        );

		new Setting(containerEl)
        .setName('새 폴더 프리셋 추가')
        .setDesc('새로운 폴더 프리셋을 추가합니다. 프리셋이 등록되지 않은 폴더는 전역 프리셋이 적용됩니다.')
        .addButton((button: ButtonComponent) => 
            button
                .setTooltip('새 폴더 프리셋 추가')
                .setButtonText('+')
                .setCta()
                .onClick(async () => {
                    const newFolderPath = '';
                    const presetNames = await plugin.presetManager.getPresetNames();
                    const newPresetName = presetNames.length > 0 ? presetNames[0] : '';
                    
                    plugin.settings.folderPresets = plugin.settings.folderPresets || {};
                    plugin.settings.activeFolderPresets = plugin.settings.activeFolderPresets || {};
                    
                    if (!plugin.settings.folderPresets[newFolderPath]) {
                        plugin.settings.folderPresets[newFolderPath] = [newPresetName];
                        plugin.settings.activeFolderPresets[newFolderPath] = newPresetName;
                        await settingsManager.saveSettings();
                        refreshAllSettings();
                    } else {
                        new Notice('빈 폴더 경로에 이미 프리셋이 연결되어 있습니다.');
                    }
                })
        );

		plugin.settings.folderPresets = plugin.settings.folderPresets || {};
		plugin.settings.activeFolderPresets = plugin.settings.activeFolderPresets || {};
	
		for (const [folderPath, presets] of Object.entries(plugin.settings.folderPresets)) {
			const s = new Setting(containerEl)
				.addSearch((cb) => {
					new FolderSuggest(plugin.app, cb.inputEl);
					cb.setPlaceholder('폴더')
						.setValue(folderPath)
						.onChange((_newFolder) => {
							// 변경 사항을 처리하는 로직
						});
					cb.inputEl.addEventListener('blur', () => {
						const newFolder = cb.inputEl.value;
						if (newFolder && plugin.settings.folderPresets?.[newFolder]) {
							new Notice('이 폴더에는 이미 프리셋이 연결되어 있습니다.');
							return;
						}
						if (plugin.settings.folderPresets) {
							delete plugin.settings.folderPresets[folderPath];
							plugin.settings.folderPresets[newFolder] = presets;
						}
						if (plugin.settings.activeFolderPresets?.[folderPath]) {
							plugin.settings.activeFolderPresets[newFolder] = plugin.settings.activeFolderPresets[folderPath];
							delete plugin.settings.activeFolderPresets[folderPath];
						}
						settingsManager.saveSettings();
						refreshAllSettings();
					});
				});

		const presetInput = s.controlEl.createEl("input", {
			cls: "preset-suggest-input",
			type: "text",
			value: plugin.settings.activeFolderPresets?.[folderPath] || '',
			placeholder: folderPath ? '' : '프리셋'
		});

        new PresetSuggest(
            plugin.app,
            presetInput,
            plugin,
            FileSuggestMode.PresetsFiles
        );

		presetInput.onblur = async () => {
			const newValue = presetInput.value;
			plugin.settings.activeFolderPresets = plugin.settings.activeFolderPresets || {};
			plugin.settings.folderPresets = plugin.settings.folderPresets || {};
		
			if (newValue !== plugin.settings.activeFolderPresets[folderPath]) {
				plugin.settings.activeFolderPresets[folderPath] = newValue;
				plugin.settings.folderPresets[folderPath] = [newValue];
				await settingsManager.saveSettings();
				refreshAllSettings();
			}
		};

		s.addExtraButton((cb) => {
            cb.setIcon('down-chevron-glyph')
                .setTooltip('아래로 이동')
                .onClick(() => {
                    const entries = Object.entries(plugin.settings.folderPresets || {});
                    const index = entries.findIndex(([path]) => path === folderPath);
                    if (index < entries.length - 1) {
                        [entries[index], entries[index + 1]] = [entries[index + 1], entries[index]];
                        plugin.settings.folderPresets = Object.fromEntries(entries);
                        settingsManager.saveSettings();
                        refreshAllSettings();
                    }
                });
        })
        .addExtraButton((cb) => {
            cb.setIcon('cross')
                .setTooltip('삭제')
                .onClick(() => {
                    if (plugin.settings.folderPresets) {
                        delete plugin.settings.folderPresets[folderPath];
                    }
                    if (plugin.settings.activeFolderPresets) {
                        delete plugin.settings.activeFolderPresets[folderPath];
                    }
                    settingsManager.saveSettings();
                    refreshAllSettings();
                });
        });
        s.infoEl.remove();
    }
}
