import { Setting, Notice } from 'obsidian';
import CardNavigatorPlugin from '../../main';
import { SettingsManager } from './settingsManager';
import { PresetManager } from './PresetManager';
import { SettingTab } from './settingsTab';
import { t } from 'i18next';

export function addPresetSettings(
    containerEl: HTMLElement,
    plugin: CardNavigatorPlugin,
    settingsManager: SettingsManager,
    presetManager: PresetManager,
    settingTab: SettingTab
): void {
    containerEl.createEl('h3', { text: t('프리셋 관리') });

    // 프리셋 선택 드롭다운
    new Setting(containerEl)
        .setName(t('프리셋 선택'))
        .setDesc(t('저장된 프리셋을 선택하여 로드합니다.'))
        .addDropdown(dropdown => {
            dropdown.addOption('', t('선택 없음'));
            const presets = presetManager.getPresets();
            const presetOptions: Record<string, string> = Object.fromEntries(
                Object.entries(presets).map(([key, preset]) => [key, preset.name])
            );
            dropdown.addOptions(presetOptions);
            dropdown
                .setValue(plugin.settings.lastActivePreset || '')
                .onChange(async (value: string) => {
                    if (value) {
                        await presetManager.loadPreset(value);
                        settingTab.display(); // 설정 UI 새로고침
                    }
                });
        });

    // 새로운 프리셋 추가 섹션
    const newPresetContainer = containerEl.createDiv('new-preset-container');
    const newPresetInput = newPresetContainer.createEl('input', { type: 'text', placeholder: t('새 프리셋 이름') }) as HTMLInputElement;
    const addPresetButton = newPresetContainer.createEl('button', { text: t('프리셋 추가') }) as HTMLButtonElement;
    
    addPresetButton.onclick = async () => {
        const presetName = newPresetInput.value.trim();
        if (presetName) {
            try {
                await presetManager.savePreset(presetName);
                newPresetInput.value = '';
                settingTab.display(); // 설정 UI 새로고침
            } catch (error) {
                console.error(`프리셋 추가 오류: ${error}`);
                new Notice(t('프리셋을 추가하는 중 오류가 발생했습니다.'));
            }
        } else {
            new Notice(t('프리셋 이름을 입력해주세요.'));
        }
    };

    // 폴더별 프리셋 설정
    const folderPresets = presetManager.getFolderPresets();
    for (const folderPath in folderPresets) {
        const folderPreset = folderPresets[folderPath];
        new Setting(containerEl)
            .setName(folderPath)
            .addDropdown(dropdown => {
                const presets = presetManager.getPresets();
                
                // Preset 객체를 Record<string, string>으로 변환
                const presetOptions: Record<string, string> = {};
                for (const presetKey in presets) {
                    presetOptions[presetKey] = presets[presetKey].name;
                }

                dropdown.addOptions(presetOptions);
                dropdown.setValue(folderPreset.activePreset)
                    .onChange(async (value: string) => {
                        await presetManager.setFolderPreset(folderPath, value);
                        settingTab.display(); // 설정 UI 새로고침
                    });
            })
            .addButton(button => button
                .setButtonText(t('제거'))
                .setCta()
                .onClick(async () => {
                    await presetManager.removeFolderPreset(folderPath, folderPreset.activePreset);
                    settingTab.display(); // 설정 UI 새로고침
                })
            );
    }

    // 새로운 폴더 프리셋 추가 섹션
    const newFolderPresetContainer = containerEl.createDiv('new-folder-preset-container');
    const newFolderInput = newFolderPresetContainer.createEl('input', { type: 'text', placeholder: t('폴더 경로') }) as HTMLInputElement;
    const newFolderPresetDropdown = newFolderPresetContainer.createEl('select') as HTMLSelectElement;
    const presets = presetManager.getPresets();

    // Preset 객체를 <option> 요소로 변환
    for (const presetKey in presets) {
        const option = newFolderPresetDropdown.createEl('option');
        option.value = presetKey;
        option.text = presets[presetKey].name;
    }
    const addFolderPresetButton = newFolderPresetContainer.createEl('button', { text: t('폴더에 프리셋 연결') }) as HTMLButtonElement;

    addFolderPresetButton.onclick = async () => {
        const folderPath = newFolderInput.value.trim();
        const presetName = newFolderPresetDropdown.value;
        if (folderPath && presetName) {
            try {
                await presetManager.setFolderPreset(folderPath, presetName);
                newFolderInput.value = '';
                settingTab.display(); // 설정 UI 새로고침
            } catch (error) {
                console.error(`폴더에 프리셋 연결 오류: ${error}`);
                new Notice(t('폴더에 프리셋을 연결하는 중 오류가 발생했습니다.'));
            }
        } else {
            new Notice(t('폴더 경로와 프리셋을 선택해주세요.'));
        }
    };
}
