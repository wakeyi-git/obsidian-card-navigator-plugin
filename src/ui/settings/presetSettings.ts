import { Setting, ButtonComponent, Notice, setIcon } from 'obsidian';
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
}

function addPresetManagementSection(containerEl: HTMLElement, plugin: CardNavigatorPlugin, settingsManager: SettingsManager, refreshAllSettings: () => void): void {
    const presetManagementEl = containerEl.createDiv('preset-management-section');
    addPresetManagementSectionContent(presetManagementEl, plugin, settingsManager, refreshAllSettings);
}

function addPresetManagementSectionContent(presetManagementEl: HTMLElement, plugin: CardNavigatorPlugin, settingsManager: SettingsManager, refreshAllSettings: () => void): void {
    new Setting(presetManagementEl)
        .setName('프리셋 관리')
        .setHeading()
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
    const presetToggle = presetManagementEl.createEl('button', {text: '프리셋 목록 펼치기/접기', cls: 'preset-toggle'});
    setIcon(presetToggle, 'chevron-down');
    
    presetToggle.onclick = () => {
        const isCollapsed = presetListEl.hasClass('collapsed');
        presetListEl.toggleClass('collapsed', !isCollapsed);
        setIcon(presetToggle, isCollapsed ? 'chevron-down' : 'chevron-right');
    };

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
                            refreshAllSettings(); // 여기서 전체 설정을 새로고침합니다.
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

function addFolderPresetSection(containerEl: HTMLElement, plugin: CardNavigatorPlugin, settingsManager: SettingsManager): void {
    const folderPresetSectionEl = containerEl.createDiv('folder-preset-section');
    
    new Setting(folderPresetSectionEl)
        .setName('폴더 프리셋 설정')
        .setHeading();

    const descHeading = folderPresetSectionEl.createEl("p", { cls: "setting-item-description" });
    descHeading.append(
        "폴더 프리셋은 특정 폴더에 진입할 때 자동으로 적용됩니다.",
        descHeading.createEl("br"),
        "가장 깊은 경로의 폴더 프리셋이 우선 적용됩니다.",
        descHeading.createEl("br"),
        "전역 기본 프리셋은 루트 폴더 ",
        descHeading.createEl("code", { text: "/" }),
        "에 설정할 수 있습니다."
    );

    new Setting(folderPresetSectionEl)
        .setName('프리셋 자동 적용')
        .setDesc('폴더 변경 시 자동으로 폴더에 지정된 프리셋을 적용합니다.')
        .addToggle((toggle) => 
            toggle
                .setValue(plugin.settings.autoApplyFolderPresets)
                .onChange(async (value) => {
                    plugin.settings.autoApplyFolderPresets = value;
                    await settingsManager.saveSettings();
                    refreshFolderPresetList(folderPresetSectionEl, plugin, settingsManager);
                })
        );

    const folderPresetListEl = folderPresetSectionEl.createDiv('folder-preset-list');
    refreshFolderPresetList(folderPresetListEl, plugin, settingsManager);
}

function refreshFolderPresetList(containerEl: HTMLElement, plugin: CardNavigatorPlugin, settingsManager: SettingsManager): void {
    containerEl.empty();

    if (!plugin.settings.autoApplyFolderPresets) {
        return;
    }

    new Setting(containerEl)
        .setName('새 폴더 프리셋 추가')
        .setDesc('새로운 폴더 프리셋을 추가합니다.')
        .addButton((button: ButtonComponent) => 
            button
                .setTooltip('새 폴더 프리셋 추가')
                .setButtonText('+')
                .setCta()
                .onClick(() => {
                    const newFolderPath = '';
                    const presetNames = plugin.presetManager.getPresetNames();
                    const newPresetName = presetNames.length > 0 ? presetNames[0] : 'default';
                    
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

		for (const [folderPath, presetNames] of Object.entries(plugin.settings.folderPresets)) {
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
							const presets = plugin.settings.folderPresets[folderPath];
							delete plugin.settings.folderPresets[folderPath];
							plugin.settings.folderPresets[newFolder] = presets;
							settingsManager.saveSettings();
							refreshFolderPresetList(containerEl, plugin, settingsManager);
						});
					cb.inputEl.addClass('card-navigator-search');
				})
				.addDropdown((dropdown) => {
					presetNames.forEach(name => dropdown.addOption(name, name));
					const activePreset = plugin.settings.activeFolderPresets[folderPath];
					dropdown.setValue(activePreset || presetNames[0])
						.onChange(async (value) => {
							plugin.settings.activeFolderPresets[folderPath] = value;
							await settingsManager.saveSettings();
						});
					dropdown.selectEl.addClass('card-navigator-search');
				})
				.addExtraButton((cb) => {
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
