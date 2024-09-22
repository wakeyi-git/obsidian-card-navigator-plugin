import { Setting, ButtonComponent, DropdownComponent, Notice } from 'obsidian';
import CardNavigatorPlugin from '../../main';
import { SettingsManager } from './settingsManager';
import { PresetSuggest, FileSuggestMode } from './components/PresetSuggest';
import { PresetEditModal } from '../settings/modals/PresetEditModal';
import { PresetImportExportModal } from '../settings/modals/PresetImportExportModal';
import { FolderSuggest } from './components/FolderSuggest';

export function addPresetSettings(containerEl: HTMLElement, plugin: CardNavigatorPlugin, settingsManager: SettingsManager): void {
    addGlobalPresetSection(containerEl, plugin, settingsManager);
    addPresetManagementSection(containerEl, plugin, settingsManager);
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
        try {
            await plugin.presetManager.applyPreset(presetName);
            plugin.settings.lastActivePreset = presetName;
            await settingsManager.saveSettings();
            plugin.refreshCardNavigator(); // 플러그인 새로고침
            new Notice(`프리셋 "${presetName}"이(가) 적용되었습니다.`);
        } catch (error) {
            console.error('프리셋 적용 실패:', error);
            new Notice(`프리셋 적용 실패: ${error instanceof Error ? error.message : String(error)}`);
        }
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

function addPresetManagementSection(containerEl: HTMLElement, plugin: CardNavigatorPlugin, settingsManager: SettingsManager): void {
    new Setting(containerEl)
        .setName('프리셋 관리')
        .setHeading();

    new Setting(containerEl)
        .setName('새 프리셋 생성')
        .setDesc('현재 설정된 값을 바탕으로 새로운 프리셋을 만듭니다.')
        .addButton((button: ButtonComponent) => 
            button
                .setButtonText('생성')
                .setCta()
                .onClick(() => {
                    new PresetEditModal(plugin.app, plugin, settingsManager, 'create').open();
                })
        );

    const presetNames = plugin.presetManager.getPresetNames();
    if (presetNames.length > 0) {
        new Setting(containerEl)
            .setName('프리셋 수정')
            .setDesc('기존 프리셋의 설정을 현재 값으로 업데이트합니다.')
            .addDropdown((dropdown: DropdownComponent) => {
                presetNames.forEach((name: string) => dropdown.addOption(name, name));
                dropdown.setValue(presetNames[0]);
                dropdown.onChange((value) => {
                    new PresetEditModal(plugin.app, plugin, settingsManager, 'edit', value).open();
                });
            });

        new Setting(containerEl)
            .setName('프리셋 복제')
            .setDesc('선택한 프리셋을 복제하여 새로운 프리셋을 만듭니다.')
            .addDropdown((dropdown: DropdownComponent) => {
                presetNames.forEach((name: string) => dropdown.addOption(name, name));
                dropdown.setValue(presetNames[0]);
                dropdown.onChange((value) => {
                    new PresetEditModal(plugin.app, plugin, settingsManager, 'clone', value).open();
                });
            });
    }

    for (const presetName of presetNames) {
        const preset = plugin.presetManager.getPreset(presetName);
        if (!preset) continue;

        new Setting(containerEl)
            .setName(presetName)
            .setDesc(preset.description || '설명 없음')
            .addButton((button: ButtonComponent) => 
                button
                    .setButtonText('삭제')
                    .onClick(async () => {
                        if (await settingsManager.confirmDelete(`프리셋 "${presetName}"`)) {
                            await plugin.presetManager.deletePreset(presetName);
                            settingsManager.applyChanges();
                        }
                    })
            );
    }

    new Setting(containerEl)
        .setName('프리셋 가져오기/내보내기')
        .setDesc('프리셋을 JSON 형식으로 가져오거나 내보냅니다.')
        .addButton((button: ButtonComponent) => 
            button
                .setButtonText('가져오기/내보내기')
                .onClick(() => {
                    new PresetImportExportModal(plugin.app, plugin, settingsManager).open();
                })
        );
}

function addFolderPresetSection(containerEl: HTMLElement, plugin: CardNavigatorPlugin, settingsManager: SettingsManager): void {
    new Setting(containerEl)
        .setName('폴더 프리셋 설정')
        .setHeading();

    const descHeading = document.createDocumentFragment();
    descHeading.append(
        "폴더 프리셋은 특정 폴더에 진입할 때 자동으로 적용됩니다.",
        descHeading.createEl("br"),
        "가장 깊은 경로의 폴더 프리셋이 우선 적용됩니다.",
        descHeading.createEl("br"),
        "전역 기본 프리셋은 루트 폴더 ",
        descHeading.createEl("code", { text: "/" }),
        "에 설정할 수 있습니다."
    );

    new Setting(containerEl).setDesc(descHeading);

    new Setting(containerEl)
        .setName('프리셋 자동 적용')
        .setDesc('폴더 변경 시 자동으로 폴더에 지정된 프리셋을 적용합니다.')
        .addToggle((toggle) => 
            toggle
                .setValue(plugin.settings.autoApplyFolderPresets)
                .onChange(async (value) => {
                    plugin.settings.autoApplyFolderPresets = value;
                    await settingsManager.saveSettings();
                    // Force refresh
                    addFolderPresetSection(containerEl, plugin, settingsManager);
                })
        );

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
                    plugin.settings.folderPresets[''] = [];
                    settingsManager.saveSettings();
                    addFolderPresetSection(containerEl, plugin, settingsManager);
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
                        addFolderPresetSection(containerEl, plugin, settingsManager);
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
                cb.setIcon('up-chevron-glyph')
                    .setTooltip('위로 이동')
                    .onClick(() => {
                        const entries = Object.entries(plugin.settings.folderPresets);
                        const index = entries.findIndex(([path]) => path === folderPath);
                        if (index > 0) {
                            [entries[index - 1], entries[index]] = [entries[index], entries[index - 1]];
                            plugin.settings.folderPresets = Object.fromEntries(entries);
                            settingsManager.saveSettings();
                            addFolderPresetSection(containerEl, plugin, settingsManager);
                        }
                    });
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
                            addFolderPresetSection(containerEl, plugin, settingsManager);
                        }
                    });
            })
            .addExtraButton((cb) => {
                cb.setIcon('cross')
                    .setTooltip('삭제')
                    .onClick(() => {
                        delete plugin.settings.folderPresets[folderPath];
                        settingsManager.saveSettings();
                        addFolderPresetSection(containerEl, plugin, settingsManager);
                    });
            });
        s.infoEl.remove();
    }
}
