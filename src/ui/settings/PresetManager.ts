import { App, Notice } from 'obsidian';
import { CardNavigatorSettings, Preset, globalSettingsKeys, DEFAULT_SETTINGS } from '../../common/types';
import { IPresetManager } from '../../common/IPresetManager';
import CardNavigatorPlugin from '../../main';
import * as path from 'path';

export class PresetManager implements IPresetManager {
    private presets: { [key: string]: Preset } = {};
    private presetFolder: string;

    constructor(private app: App, private plugin: CardNavigatorPlugin, private settings: CardNavigatorSettings) {
        this.presetFolder = this.settings.presetFolderPath || 'CardNavigatorPresets';
    }

    updatePresetFolder(newFolder: string): void {
        this.presetFolder = newFolder;
    }

    private async ensurePresetFolder(): Promise<void> {
        if (!await this.app.vault.adapter.exists(this.presetFolder)) {
            await this.app.vault.createFolder(this.presetFolder);
        }
    }

	async initialize(): Promise<void> {
		await this.ensurePresetFolder();
		await this.loadPresets();
		await this.loadPresetsFromFiles();
	
		// 기본 프리셋이 없으면 생성
		if (!this.presets['default']) {
			const defaultPreset: Preset = {
				name: 'default',
				settings: DEFAULT_SETTINGS,
				isDefault: true,
				description: 'Default preset'
			};
			await this.savePresetToFile('default', defaultPreset);
			this.presets['default'] = defaultPreset;
		}
	}

	async savePreset(name: string, description?: string): Promise<void> {
        const settings = this.getPreset(name)?.settings;
        if (!settings) {
            throw new Error(`프리셋 "${name}"을(를) 찾을 수 없습니다.`);
        }
        await this.createPreset(name, settings, description);
    }

    async loadPreset(name: string): Promise<void> {
        const preset = this.getPreset(name);
        if (!preset) {
            throw new Error(`프리셋 "${name}"을(를) 찾을 수 없습니다.`);
        }
        this.settings = {
            ...this.settings,
            ...preset.settings,
        };
        this.settings.lastActivePreset = name;
        await this.plugin.saveSettings();
        this.plugin.refreshCardNavigator();
    }

    exportPresets(): string {
        return JSON.stringify(this.presets, null, 2);
    }

    getFolderPresets(): Record<string, string[]> {
        return this.settings.folderPresets || {};
    }

    async setFolderPreset(folderPath: string, presetName: string): Promise<void> {
        if (!this.settings.folderPresets) {
            this.settings.folderPresets = {};
        }
        this.settings.folderPresets[folderPath] = [presetName];
        await this.plugin.saveSettings();
    }

    async toggleAutoApplyFolderPresets(value: boolean): Promise<void> {
        this.settings.autoApplyFolderPresets = value;
        await this.plugin.saveSettings();
    }

    async applyFolderPreset(folderPath: string): Promise<void> {
        const presetName = this.settings.folderPresets?.[folderPath]?.[0];
        if (presetName) {
            await this.applyPreset(presetName);
        }
    }

    async loadPresetsFromFiles() {
        const presetFiles = await this.app.vault.adapter.list(this.presetFolder);
        for (const file of presetFiles.files) {
            if (file.endsWith('.json')) {
                const presetName = path.basename(file, '.json');
                const presetSettings = await this.loadPresetFromFile(file);
                if (presetSettings) {
                    this.addPresetToFolder('/', presetName);
                    if (!this.plugin.settings.activeFolderPresets['/']) {
                        this.plugin.settings.activeFolderPresets['/'] = presetName;
                    }
                }
            }
        }
        await this.plugin.saveSettings();
    }

    private async loadPresetFromFile(filePath: string): Promise<Preset | null> {
        try {
            const exists = await this.app.vault.adapter.exists(filePath);
            if (!exists) {
                new Notice(`프리셋 파일을 찾을 수 없습니다: ${filePath}`);
                return null;
            }
            const content = await this.app.vault.adapter.read(filePath);
            const preset: Preset = JSON.parse(content);
            return preset;
        } catch (error) {
            console.error(`Error loading preset from file ${filePath}:`, error);
            return null;
        }
    }

    private addPresetToFolder(folderPath: string, presetName: string): void {
        if (!this.settings.folderPresets) {
            this.settings.folderPresets = {};
        }
        if (!this.settings.folderPresets[folderPath]) {
            this.settings.folderPresets[folderPath] = [];
        }
        if (!this.settings.folderPresets[folderPath].includes(presetName)) {
            this.settings.folderPresets[folderPath].push(presetName);
        }
    }

	async createPreset(name: string, settings: Partial<CardNavigatorSettings>, description = ""): Promise<void> {
		if (this.presets[name]) {
			throw new Error(`프리셋 "${name}"이(가) 이미 존재합니다.`);
		}
		const filteredSettings = this.filterGlobalSettings(settings);
		const newPreset: Preset = { name, settings: filteredSettings, isDefault: false, description };
		await this.savePresetToFile(name, newPreset);
		this.presets[name] = newPreset;
		await this.plugin.saveSettings(); // 설정 저장
		this.plugin.refreshSettingsTab(); // UI 전체 새로고침
	}
    
    async updatePreset(name: string, settings: Partial<CardNavigatorSettings>, description?: string): Promise<void> {
        if (!this.presets[name]) {
            throw new Error(`프리셋 "${name}"을(를) 찾을 수 없습니다.`);
        }
        const filteredSettings = this.filterGlobalSettings(settings);
        const updatedPreset = { 
            ...this.presets[name], 
            settings: filteredSettings, 
            description: description !== undefined ? description : this.presets[name].description 
        };
        await this.savePresetToFile(name, updatedPreset);
        this.presets[name] = updatedPreset;
    }

	private filterGlobalSettings(settings: Partial<CardNavigatorSettings>): Partial<CardNavigatorSettings> {
		const filteredSettings: Partial<CardNavigatorSettings> = {};
		for (const key in settings) {
			if (settings.hasOwnProperty(key) && !globalSettingsKeys.includes(key as keyof CardNavigatorSettings)) {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				(filteredSettings as any)[key] = settings[key as keyof CardNavigatorSettings];
			}
		}
		return filteredSettings;
	}

	private async savePresetToFile(name: string, preset: Preset): Promise<void> {
		const filePath = `${this.presetFolder}/${name}.json`;
        
        await this.ensureDirectory(this.presetFolder);

        await this.app.vault.adapter.write(filePath, JSON.stringify(preset, null, 2));
    }

    private async ensureDirectory(path: string): Promise<void> {
        const exists = await this.app.vault.adapter.exists(path);
        if (!exists) {
            await this.app.vault.adapter.mkdir(path);
        }
    }

    async deletePreset(name: string): Promise<void> {
        if (!this.presets[name]) {
            throw new Error(`프리셋 "${name}"을(를) 찾을 수 없습니다.`);
        }
        await this.deletePresetFile(name);
        delete this.presets[name];
    }

    private async deletePresetFile(name: string): Promise<void> {
        const filePath = `${this.presetFolder}/${name}.json`;
        await this.app.vault.adapter.remove(filePath);
    }

    async loadPresets(): Promise<void> {
		const presetFiles = await this.app.vault.adapter.list(this.presetFolder);
        for (const file of presetFiles.files) {
            if (file.endsWith('.json')) {
                const content = await this.app.vault.adapter.read(file);
                const preset: Preset = JSON.parse(content);
                this.presets[preset.name] = preset;
            }
        }
    }

	async applyPreset(presetName: string): Promise<void> {
		const preset = this.getPreset(presetName);
		if (preset) {
			this.settings = {
				...this.settings,
				...preset.settings,
			};
			this.settings.lastActivePreset = presetName;
			// 설정을 저장하고 플러그인을 새로고침합니다.
			await this.plugin.saveSettings();
			this.plugin.refreshCardNavigator(); // 플러그인 새로고침
		} else {
			throw new Error(`프리셋 "${presetName}"을(를) 찾을 수 없습니다.`);
		}
	}

    getPresetNames(): string[] {
        return Object.keys(this.presets);
    }

    getPreset(name: string): Preset | undefined {
        return this.presets[name];
    }

    async clonePreset(sourceName: string, newName: string): Promise<void> {
        if (!this.presets[sourceName]) {
            throw new Error(`원본 프리셋 "${sourceName}"을(를) 찾을 수 없습니다.`);
        }
        if (this.presets[newName]) {
            throw new Error(`프리셋 "${newName}"이(가) 이미 존재합니다.`);
        }
        const clonedPreset: Preset = { ...this.presets[sourceName], name: newName, isDefault: false };
        await this.savePresetToFile(newName, clonedPreset);
        this.presets[newName] = clonedPreset;
    }

    async exportPreset(name: string): Promise<string> {
        if (!this.presets[name]) {
            throw new Error(`프리셋 "${name}"을(를) 찾을 수 없습니다.`);
        }
        return JSON.stringify(this.presets[name], null, 2);
    }

    async importPreset(jsonString: string): Promise<void> {
        try {
            const importedPreset: Preset = JSON.parse(jsonString);
            if (!importedPreset.name || !importedPreset.settings) {
                throw new Error("유효하지 않은 프리셋 형식입니다.");
            }
            await this.savePresetToFile(importedPreset.name, importedPreset);
            this.presets[importedPreset.name] = importedPreset;
        } catch (error) {
            throw new Error(`프리셋 가져오기 실패: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    setGlobalPreset(name: string): void {
        if (!this.presets[name]) {
            throw new Error(`프리셋 "${name}"을(를) 찾을 수 없습니다.`);
        }
        this.settings.lastActivePreset = name;
    }

	async setActiveFolderPreset(folderPath: string, presetName: string): Promise<void> {
		if (!this.settings.activeFolderPresets) {
			this.settings.activeFolderPresets = {};
		}
		this.settings.activeFolderPresets[folderPath] = presetName;
		await this.plugin.saveSettings(); // 설정 저장
	}
    
    getActiveFolderPreset(folderPath: string): string | undefined {
        return this.settings.activeFolderPresets?.[folderPath];
    }

    togglePresetActive(name: string, isActive: boolean): void {
        if (!this.presets[name]) {
            throw new Error(`프리셋 "${name}"을(를) 찾을 수 없습니다.`);
        }
        this.presets[name].isDefault = isActive;
        this.savePresetToFile(name, this.presets[name]);
    }

	async addFolderPreset(folderPath: string, presetName: string): Promise<void> {
		if (!this.presets[presetName]) {
			throw new Error(`프리셋 "${presetName}"을(를) 찾을 수 없습니다.`);
		}
		if (!this.settings.folderPresets) {
			this.settings.folderPresets = {};
		}
		if (!this.settings.folderPresets[folderPath]) {
			this.settings.folderPresets[folderPath] = [];
		}
		if (!this.settings.folderPresets[folderPath].includes(presetName)) {
			this.settings.folderPresets[folderPath].push(presetName);
			await this.plugin.saveSettings(); // 설정 저장
		}
	}

	async removeFolderPreset(folderPath: string, presetName: string): Promise<void> {
		if (this.settings.folderPresets && this.settings.folderPresets[folderPath]) {
			this.settings.folderPresets[folderPath] = this.settings.folderPresets[folderPath].filter((name: string) => name !== presetName);
			if (this.settings.folderPresets[folderPath].length === 0) {
				delete this.settings.folderPresets[folderPath];
			}
			await this.plugin.saveSettings();
		}
	}

    async renamePreset(oldName: string, newName: string): Promise<void> {
        if (!this.presets[oldName]) {
            throw new Error(`프리셋 "${oldName}"을(를) 찾을 수 없습니다.`);
        }
        if (this.presets[newName]) {
            throw new Error(`프리셋 "${newName}"이(가) 이미 존재합니다.`);
        }
        const preset = this.presets[oldName];
        preset.name = newName;
        await this.savePresetToFile(newName, preset);
        delete this.presets[oldName];
        this.presets[newName] = preset;
        await this.deletePresetFile(oldName);
    }

    async importPresets(jsonString: string): Promise<void> {
        try {
            const importedPresets = JSON.parse(jsonString);
            for (const [name, preset] of Object.entries(importedPresets)) {
                await this.savePresetToFile(name, preset as Preset);
                this.presets[name] = preset as Preset;
            }
        } catch (error) {
            throw new Error(`프리셋 가져오기 실패: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    getPresets(): Record<string, Preset> {
        return this.presets;
    }

    async deleteAllPresets(): Promise<void> {
        for (const name of Object.keys(this.presets)) {
            await this.deletePreset(name);
        }
    }

    async resetToDefaultPresets(): Promise<void> {
        await this.deleteAllPresets();
        const defaultPreset: Preset = {
            name: 'default',
            settings: DEFAULT_SETTINGS,
            isDefault: true,
            description: 'Default preset'
        };
        await this.savePresetToFile('default', defaultPreset);
        this.presets['default'] = defaultPreset;
    }

    getDefaultPreset(): Preset {
        return this.presets['default'] || {
            name: 'default',
            settings: DEFAULT_SETTINGS,
            isDefault: true,
            description: 'Default preset'
        };
    }
}
