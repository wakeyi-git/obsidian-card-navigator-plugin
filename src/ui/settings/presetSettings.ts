import { Setting, ButtonComponent, ToggleComponent, Notice } from 'obsidian';
import CardNavigatorPlugin from '../../main';
import { SettingsManager } from './settingsManager';
import { PresetSuggest, FileSuggestMode } from './components/PresetSuggest';
import { PresetEditModal } from '../settings/modals/PresetEditModal';
import { PresetImportExportModal } from '../settings/modals/PresetImportExportModal';
import { FolderSuggest } from './components/FolderSuggest';
import { SettingTab } from './settingsTab';
import { t } from 'i18next';

let presetListContainer: HTMLElement;

export function addPresetSettings(containerEl: HTMLElement, plugin: CardNavigatorPlugin, settingsManager: SettingsManager, settingTab: SettingTab): void {
    const refreshAllSettings = () => {
        settingTab.updateAllSections();
    };

    addGlobalPresetSection(containerEl, plugin, refreshAllSettings);
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

function addGlobalPresetSection(containerEl: HTMLElement, plugin: CardNavigatorPlugin, refreshAllSettings: () => void): void {
    new Setting(containerEl)
		.setName(t('PRESET_FOLDER'))
		.setDesc(t('SELECT_PRESET_FOLDER'))
			.addSearch(cb => {
				new FolderSuggest(plugin.app, cb.inputEl);
				cb.setPlaceholder('예: CardNavigatorPresets')
					.setValue(plugin.settings.presetFolderPath)
					.onChange(async (newFolder) => {
						plugin.settings.presetFolderPath = newFolder;
						await plugin.saveSettings();
						await plugin.presetManager.updatePresetFolder(newFolder);
						refreshAllSettings(); // 모든 설정을 새로고침합니다.
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
		.setName(t('PRESET_MANAGEMENT_AND_GLOBAL_SETTINGS'))
		.setDesc(t('PRESET_MANAGEMENT_DESC'))
		.addButton((button: ButtonComponent) => 
			button
				.setTooltip(t('CREATE_NEW_PRESET'))
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
                .setTooltip('IMPORT_PRESET')
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
            .setDesc(preset.description || t('NO_DESCRIPTION'));
		
		if (presetName !== 'default') {
			setting.addButton((button: ButtonComponent) => 
				button
					.setTooltip(t('EDIT'))
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
					.setTooltip(t('CLONE'))
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
					.setTooltip(t('DELETE'))
					.setIcon('trash')
					.onClick(async () => {
						if (await settingsManager.confirmDelete(t('PRESET_NAME', {name: presetName}))) {
							await plugin.presetManager.deletePreset(presetName);
							
							// 모든 폴더 프리셋 목록에서 삭제된 프리셋 제거
							await plugin.presetManager.removePresetFromAllFolders(presetName);
							
							if (plugin.settings.GlobalPreset === presetName) {
								await plugin.presetManager.applyGlobalPreset('default');
								new Notice(t('PRESET_DELETED_NOTICE'));
							}
							
							settingsManager.applyChanges();
							refreshAllSettings();
						}
					})
			);
		}

		setting.addButton((button: ButtonComponent) => 
			button
				.setTooltip(t('EXPORT'))
				.setIcon('download')
				.onClick(() => {
					new PresetImportExportModal(plugin.app, plugin, settingsManager, 'export', presetName).open();
				})
		)
        .addToggle((toggle: ToggleComponent) => {
            toggle
                .setTooltip(t('SET_AS_GLOBAL_PRESET'))
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
        .setName(t('AUTO_APPLY_PRESET'))
        .setDesc(t('AUTO_APPLY_PRESET_DESC'))
        .addToggle((toggle) => 
            toggle
                .setValue(plugin.settings.autoApplyFolderPresets)
                .onChange(async (value) => {
                    await settingsManager.toggleAutoApplyPresets(value);
                    const currentFile = plugin.app.workspace.getActiveFile();
                    if (currentFile) {
                        await plugin.selectAndApplyPresetForCurrentFile();
                    }
                })
        );

    new Setting(containerEl)
        .setName(t('ADD_NEW_FOLDER_PRESET'))
        .setDesc(t('ADD_NEW_FOLDER_PRESET_DESC'))
        .addButton((button: ButtonComponent) => 
            button
                .setTooltip(t('ADD_NEW_FOLDER_PRESET'))
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
                        new Notice(t('PRESET_ALREADY_EXISTS'));
                    }
                })
        );

    plugin.settings.folderPresets = plugin.settings.folderPresets || {};
    plugin.settings.activeFolderPresets = plugin.settings.activeFolderPresets || {};

    for (const [folderPath, presets] of Object.entries(plugin.settings.folderPresets)) {
        const s = new Setting(containerEl)
            .addSearch((cb) => {
                new FolderSuggest(plugin.app, cb.inputEl);
                cb.setPlaceholder(t('FOLDER'))
                    .setValue(folderPath)
                    .onChange((_newFolder) => {
                        // 변경 사항을 처리하는 로직
                    });
                cb.inputEl.addEventListener('blur', () => {
                    const newFolder = cb.inputEl.value;
                    if (newFolder && plugin.settings.folderPresets?.[newFolder]) {
                        new Notice(t('PRESET_ALREADY_EXISTS_FOR_FOLDER'));
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
			value: '',
			placeholder: t('PRESET')
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
                .setTooltip(t('MOVE_DOWN'))
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
                .setTooltip(t('DELETE'))
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
