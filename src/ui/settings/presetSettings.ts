import { Setting, ButtonComponent, Notice } from 'obsidian';
import CardNavigatorPlugin from '../../main';
import { SettingsManager } from './settingsManager';
import { PresetSuggest, FileSuggestMode } from './components/PresetSuggest';
import { PresetEditModal } from '../settings/modals/PresetEditModal';
import { PresetImportExportModal } from '../settings/modals/PresetImportExportModal';
import { FolderSuggest } from './components/FolderSuggest';

export function addPresetSettings(containerEl: HTMLElement, plugin: CardNavigatorPlugin, settingsManager: SettingsManager): void {
    const refreshAllSettings = () => {
        containerEl.empty();
        addPresetSettings(containerEl, plugin, settingsManager);
    };

    addGlobalPresetSection(containerEl, plugin, settingsManager);
    addPresetManagementSection(containerEl, plugin, settingsManager, refreshAllSettings);
    addFolderPresetSection(containerEl, plugin, settingsManager);
}

function addGlobalPresetSection(containerEl: HTMLElement, plugin: CardNavigatorPlugin, settingsManager: SettingsManager): void {

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
        });

    const setting = new Setting(containerEl)
        .setName('프리셋 적용')
        .setDesc('Card Navigator에 적용할 기본 프리셋을 선택하여 적용합니다.');

	const input = setting.controlEl.createEl("input", {
		cls: "preset-suggest-input",
		type: "text",
		value: plugin.settings.lastActivePreset
	});

	const applyPreset = async (presetName: string) => {
		await settingsManager.applyPreset(presetName);
		input.value = presetName; // 입력 필드 업데이트
	};

	new PresetSuggest(
		plugin.app,
		input,
		plugin,
		FileSuggestMode.PresetsFiles
	);

	setting.addButton((button: ButtonComponent) =>
		button
			.setButtonText('적용')
			.onClick(() => applyPreset(input.value))
	);

	// lastActivePreset이 변경될 때마다 입력 필드 업데이트
	plugin.registerEvent(
		plugin.app.workspace.on('layout-change', () => {
			input.value = plugin.settings.lastActivePreset;
		})
	);
}

function addPresetManagementSection(containerEl: HTMLElement, plugin: CardNavigatorPlugin, settingsManager: SettingsManager, refreshAllSettings: () => void): void {
    const presetManagementEl = containerEl.createDiv('preset-management-section');
    addPresetManagementSectionContent(presetManagementEl, plugin, settingsManager, refreshAllSettings);
}

function addPresetManagementSectionContent(presetManagementEl: HTMLElement, plugin: CardNavigatorPlugin, settingsManager: SettingsManager, refreshAllSettings: () => void): void {
    new Setting(presetManagementEl)
        .setName('프리셋 관리')
        .setDesc('프리셋을 관리하고 생성합니다.')
        .addButton((button: ButtonComponent) => 
            button
                .setTooltip('새 프리셋 생성')
                .setIcon('plus')
                .onClick(() => {
                    new PresetEditModal(plugin.app, plugin, settingsManager, 'create').open();
                })
        )
        .addButton((button: ButtonComponent) => 
            button
                .setTooltip('프리셋 가져오기')
                .setIcon('upload')
                .onClick(() => {
                    new PresetImportExportModal(plugin.app, plugin, settingsManager, 'import').open();
                })
        );

    const presetListEl = presetManagementEl.createDiv('preset-list');

    const presetNames = plugin.presetManager.getPresetNames();
    for (const presetName of presetNames) {
        const preset = plugin.presetManager.getPreset(presetName);
        if (!preset) continue;

        new Setting(presetListEl)
            .setName(presetName)
            .setDesc(preset.description || '설명 없음')
            .addButton((button: ButtonComponent) => 
                button
                    .setTooltip('수정')
                    .setIcon('pencil')
                    .onClick(() => {
                        new PresetEditModal(plugin.app, plugin, settingsManager, 'edit', presetName).open();
                    })
            )
            .addButton((button: ButtonComponent) => 
                button
                    .setTooltip('복제')
                    .setIcon('copy')
                    .onClick(() => {
                        new PresetEditModal(plugin.app, plugin, settingsManager, 'clone', presetName).open();
                    })
            )
            .addButton((button: ButtonComponent) => 
                button
                    .setTooltip('삭제')
                    .setIcon('trash')
                    .onClick(async () => {
                        if (await settingsManager.confirmDelete(`프리셋 "${presetName}"`)) {
                            await plugin.presetManager.deletePreset(presetName);
                            settingsManager.applyChanges();
                            refreshAllSettings();
                        }
                    })
            )
            .addButton((button: ButtonComponent) => 
                button
                    .setTooltip('내보내기')
                    .setIcon('download')
                    .onClick(() => {
                        new PresetImportExportModal(plugin.app, plugin, settingsManager, 'export', presetName).open();
                    })
            );
    }
}

export function addFolderPresetSection(containerEl: HTMLElement, plugin: CardNavigatorPlugin, settingsManager: SettingsManager): void {
    
	new Setting(containerEl)
		.setName('프리셋 자동 적용')
		.setDesc('폴더 변경 시 자동으로 폴더에 지정된 프리셋을 적용합니다.')
		.addToggle((toggle) => 
			toggle
				.setValue(plugin.settings.autoApplyFolderPresets)
				.onChange(async (value) => {
					await settingsManager.toggleAutoApplyPresets(value);
					refreshFolderPresetList(containerEl, plugin, settingsManager);
				})
		);
}

export function refreshFolderPresetList(containerEl: HTMLElement, plugin: CardNavigatorPlugin, settingsManager: SettingsManager): void {
    containerEl.empty();

    new Setting(containerEl)
        .setName('새 폴더 프리셋 추가')
        .setDesc('새로운 폴더 프리셋을 추가합니다. 전역 기본 프리셋은 루트 폴더 "/"에 설정할 수 있습니다.')
        .addButton((button: ButtonComponent) => 
            button
                .setTooltip('새 폴더 프리셋 추가')
                .setButtonText('+')
                .setCta()
                .onClick(() => {
                    const newFolderPath = '';
                    const presetNames = plugin.presetManager.getPresetNames();
                    const newPresetName = presetNames.length > 0 ? presetNames[0] : '';
                    
                    if (!plugin.settings.folderPresets[newFolderPath]) {
                        plugin.settings.folderPresets[newFolderPath] = [newPresetName];
                        plugin.settings.activeFolderPresets[newFolderPath] = newPresetName;
                        settingsManager.saveSettings();
                        refreshFolderPresetList(containerEl, plugin, settingsManager);
                    } else {
                        new Notice('빈 폴더 경로에 이미 프리셋이 연결되어 있습니다.');
                    }
                })
        );

		for (const [folderPath, presets] of Object.entries(plugin.settings.folderPresets)) {
			const s = new Setting(containerEl)
				.addSearch((cb) => {
					new FolderSuggest(plugin.app, cb.inputEl);
					cb.setPlaceholder('폴더')
						.setValue(folderPath)
						.onChange((newFolder) => {
							if (newFolder && plugin.settings.folderPresets[newFolder]) {
								new Notice('이 폴더에는 이미 프리셋이 연결되어 있습니다.');
								return;
							}
							delete plugin.settings.folderPresets[folderPath];
							plugin.settings.folderPresets[newFolder] = presets; // 여기서 presets 사용
							if (plugin.settings.activeFolderPresets[folderPath]) {
								plugin.settings.activeFolderPresets[newFolder] = plugin.settings.activeFolderPresets[folderPath];
								delete plugin.settings.activeFolderPresets[folderPath];
							}
							settingsManager.saveSettings();
							refreshFolderPresetList(containerEl, plugin, settingsManager);
						});
					// cb.inputEl.addClass('card-navigator-search');
				});
		
			const presetInput = s.controlEl.createEl("input", {
				cls: "preset-suggest-input",
				type: "text",
				value: plugin.settings.activeFolderPresets[folderPath] || presets[0] || '' // presets 배열의 첫 번째 항목을 기본값으로 사용
			});

        new PresetSuggest(
            plugin.app,
            presetInput,
            plugin,
            FileSuggestMode.PresetsFiles
        );

        presetInput.onblur = async () => {
            const newValue = presetInput.value;
            if (newValue !== plugin.settings.activeFolderPresets[folderPath]) {
                plugin.settings.activeFolderPresets[folderPath] = newValue;
                plugin.settings.folderPresets[folderPath] = [newValue];
                await settingsManager.saveSettings();
            }
        };

        s.addExtraButton((cb) => {
            cb.setIcon('down-chevron-glyph')
                .setTooltip('아래로 이동')
                .onClick(() => {
                    const entries = Object.entries(plugin.settings.folderPresets);
                    const index = entries.findIndex(([path]) => path === folderPath);
                    if (index < entries.length - 1) {
                        [entries[index], entries[index + 1]] = [entries[index + 1], entries[index]];
                        plugin.settings.folderPresets = Object.fromEntries(entries);
                        settingsManager.saveSettings();
                        refreshFolderPresetList(containerEl, plugin, settingsManager);
                    }
                });
        })
        .addExtraButton((cb) => {
            cb.setIcon('cross')
                .setTooltip('삭제')
                .onClick(() => {
                    delete plugin.settings.folderPresets[folderPath];
                    delete plugin.settings.activeFolderPresets[folderPath];
                    settingsManager.saveSettings();
                    refreshFolderPresetList(containerEl, plugin, settingsManager);
                });
        });
        s.infoEl.remove();
    }
}
