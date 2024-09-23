import { Notice } from 'obsidian';
import CardNavigatorPlugin from '../../main';
import { Preset, FolderPresets } from '../../common/types';
import { IPresetManager } from '../../common/IPresetManager';
import { SettingsManager } from './settingsManager';

export class PresetManager implements IPresetManager {
	constructor(
		private plugin: CardNavigatorPlugin,
		private settingsManager: SettingsManager
	) {}

    async savePreset(name: string, description?: string): Promise<void> {
        console.log(`Saving preset: ${name}`);
        const newPreset: Preset = {
            name,
            settings: { ...this.plugin.settings },
            isDefault: false,
            description,
        };
        this.plugin.settings.presets[name] = newPreset;
        console.log(`Preset added to settings:`, this.plugin.settings.presets);
        await this.settingsManager.saveSettings();
        console.log(`Settings saved`);
    }

	async loadPreset(name: string): Promise<void> {
		const preset = this.plugin.settings.presets[name];
		if (preset) {
			Object.assign(this.plugin.settings, preset.settings);
			this.plugin.settings.lastActivePreset = name;
			await this.settingsManager.saveSettings();
			this.settingsManager.applyChanges();
			new Notice(`프리셋 "${name}"이(가) 로드되었습니다.`);
		} else {
			new Notice(`프리셋 "${name}"을(를) 찾을 수 없습니다.`);
		}
	}

	async deletePreset(name: string): Promise<void> {
		if (await this.settingsManager.confirmDelete(name)) {
			delete this.plugin.settings.presets[name];
			await this.settingsManager.saveSettings();
			new Notice(`프리셋 "${name}"이(가) 삭제되었습니다.`);
		}
	}

	async renamePreset(oldName: string, newName: string): Promise<void> {
		if (this.plugin.settings.presets[newName]) {
			new Notice(`프리셋 이름 "${newName}"이(가) 이미 존재합니다.`);
			return;
		}

		const preset = this.plugin.settings.presets[oldName];
		if (preset) {
			this.plugin.settings.presets[newName] = { ...preset, name: newName };
			delete this.plugin.settings.presets[oldName];
			await this.settingsManager.saveSettings();
			new Notice(`프리셋 이름이 "${oldName}"에서 "${newName}"(으)로 변경되었습니다.`);
		} else {
			new Notice(`프리셋 "${oldName}"을(를) 찾을 수 없습니다.`);
		}
	}

	exportPresets(): string {
		return JSON.stringify(this.plugin.settings.presets, null, 2);
	}

	async importPresets(presetsJson: string): Promise<void> {
		try {
			const importedPresets = JSON.parse(presetsJson) as Record<string, Preset>;
			this.plugin.settings.presets = { ...this.plugin.settings.presets, ...importedPresets };
			await this.settingsManager.saveSettings();
			new Notice('프리셋이 성공적으로 가져왔습니다.');
		} catch (error) {
			console.error('프리셋 가져오기 실패:', error);
			new Notice('프리셋 가져오기에 실패했습니다. 올바른 JSON 형식인지 확인해주세요.');
		}
	}

	getPresets(): Record<string, Preset> {
		return this.plugin.settings.presets;
	}

	async setFolderPreset(folderPath: string, presetName: string): Promise<void> {
		if (!this.plugin.settings.folderPresets[folderPath]) {
			this.plugin.settings.folderPresets[folderPath] = { activePreset: presetName, availablePresets: [presetName] };
		} else {
			const folderPreset = this.plugin.settings.folderPresets[folderPath];
			if (!folderPreset.availablePresets.includes(presetName)) {
				folderPreset.availablePresets.push(presetName);
			}
			folderPreset.activePreset = presetName;
		}
		await this.settingsManager.saveSettings();
		new Notice(`프리셋 "${presetName}"이(가) 폴더 "${folderPath}"에 연결되었습니다.`);
	}

	async removeFolderPreset(folderPath: string, presetName: string): Promise<void> {
		const folderPreset = this.plugin.settings.folderPresets[folderPath];
		if (folderPreset) {
			folderPreset.availablePresets = folderPreset.availablePresets.filter(name => name !== presetName);
			if (folderPreset.availablePresets.length > 0) {
				folderPreset.activePreset = folderPreset.availablePresets[0];
			} else {
				delete this.plugin.settings.folderPresets[folderPath];
			}
			await this.settingsManager.saveSettings();
			new Notice(`프리셋 "${presetName}"이(가) 폴더 "${folderPath}"에서 제거되었습니다.`);
		}
	}

	getFolderPresets(): FolderPresets {
		return this.plugin.settings.folderPresets;
	}

	async applyFolderPreset(folderPath: string): Promise<void> {
		const folderPreset = this.plugin.settings.folderPresets[folderPath];
		if (folderPreset && folderPreset.activePreset) {
			await this.loadPreset(folderPreset.activePreset);
			new Notice(`폴더 "${folderPath}"에 프리셋 "${folderPreset.activePreset}"이(가) 자동 적용되었습니다.`);
		}
	}

	async toggleAutoApplyFolderPresets(enable: boolean): Promise<void> {
		this.plugin.settings.autoApplyFolderPresets = enable;
		await this.settingsManager.saveSettings();
		new Notice(`폴더별 프리셋 자동 적용이 ${enable ? '활성화' : '비활성화'}되었습니다.`);
	}
}
