import { App } from 'obsidian';
import { CardNavigatorSettings, Preset, globalSettingsKeys, DEFAULT_SETTINGS } from '../../common/types';
import { IPresetManager } from '../../common/IPresetManager';
import CardNavigatorPlugin from '../../main';
import * as path from 'path';

export class PresetManager implements IPresetManager {
    private presetFolder: string;
    private presetCache: Map<string, Preset> = new Map();

    constructor(private app: App, private plugin: CardNavigatorPlugin, private settings: CardNavigatorSettings) {
        this.presetFolder = this.settings.presetFolderPath || 'CardNavigatorPresets';
        if (!this.settings.folderPresets) {
            this.settings.folderPresets = {};
        }
        if (!this.settings.activeFolderPresets) {
            this.settings.activeFolderPresets = {};
        }
    }

    updatePresetFolder(newFolder: string): void {
        this.presetFolder = newFolder;
        this.presetCache.clear();
    }

    private async ensurePresetFolder(): Promise<void> {
        if (!await this.app.vault.adapter.exists(this.presetFolder)) {
            await this.app.vault.createFolder(this.presetFolder);
        }
    }

	async initialize(): Promise<void> {
		await this.ensurePresetFolder();
		await this.loadPresetsFromFiles();
	
		// 기본 프리셋이 없으면 생성
		if (!await this.presetExists('default')) {
			// 기본 프리셋 생성 시 globalSettingsKeys 제외
			const defaultPresetSettings = Object.fromEntries(
				Object.entries(DEFAULT_SETTINGS).filter(([key]) => !globalSettingsKeys.includes(key as keyof CardNavigatorSettings))
			);
			const defaultPreset: Preset = {
				name: 'default',
				settings: defaultPresetSettings,
				isDefault: true,
				description: 'Default preset'
			};
			await this.savePresetToFile('default', defaultPreset);
		}
	}

    async loadPreset(name: string): Promise<void> {
        const preset = await this.getPreset(name);
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

	async savePreset(name: string, description?: string): Promise<void> {
		const currentSettings = this.getCurrentSettings();
		const preset: Preset = {
			name: name,
			settings: currentSettings,
			isDefault: false,
			description: description
		};
		await this.savePresetToFile(name, preset);
		this.presetCache.set(name, preset);
	}
	
	private getCurrentSettings(): Partial<CardNavigatorSettings> {
		const currentSettings = { ...this.settings };
		globalSettingsKeys.forEach(key => delete currentSettings[key]);
		return currentSettings;
	}

    private async loadPresetFromFile(name: string): Promise<Preset | null> {
        const filePath = `${this.presetFolder}/${name}.json`;
        try {
            const content = await this.app.vault.adapter.read(filePath);
            const preset = JSON.parse(content) as Preset;
            this.presetCache.set(name, preset);
            return preset;
        } catch (error) {
            console.error(`Error loading preset ${name}:`, error);
            return null;
        }
    }

    private async savePresetToFile(name: string, preset: Preset): Promise<void> {
        const filePath = `${this.presetFolder}/${name}.json`;
        await this.app.vault.adapter.write(filePath, JSON.stringify(preset, null, 2));
        this.presetCache.set(name, preset);
    }

    async deletePreset(name: string): Promise<void> {
        const filePath = `${this.presetFolder}/${name}.json`;
        await this.app.vault.adapter.remove(filePath);
        this.presetCache.delete(name);
    }

	async renamePreset(oldName: string, newName: string): Promise<void> {
        const preset = await this.getPreset(oldName);
        if (!preset) {
            throw new Error(`프리셋 "${oldName}"을(를) 찾을 수 없습니다.`);
        }
        preset.name = newName;
        await this.savePresetToFile(newName, preset);
        await this.deletePreset(oldName);
    }

    async exportPresets(): Promise<string> {
        const presets = await this.getPresets();
        return JSON.stringify(presets, null, 2);
    }

    async importPresets(jsonString: string): Promise<void> {
        const importedPresets = JSON.parse(jsonString) as Record<string, Preset>;
        for (const [name, preset] of Object.entries(importedPresets)) {
            await this.savePresetToFile(name, preset);
        }
    }

    async getPresets(): Promise<Record<string, Preset>> {
        const presetNames = await this.getPresetNames();
        const presets: Record<string, Preset> = {};
        for (const name of presetNames) {
            const preset = await this.getPreset(name);
            if (preset) {
                presets[name] = preset;
            }
        }
        return presets;
    }

    async removeFolderPreset(folderPath: string, presetName: string): Promise<void> {
        if (this.settings.folderPresets && this.settings.folderPresets[folderPath]) {
            this.settings.folderPresets[folderPath] = this.settings.folderPresets[folderPath].filter(name => name !== presetName);
            if (this.settings.folderPresets[folderPath].length === 0) {
                delete this.settings.folderPresets[folderPath];
            }
            await this.plugin.saveSettings();
        }
    }

	async getPresetNames(): Promise<string[]> {
        const presetFiles = await this.app.vault.adapter.list(this.presetFolder);
        return presetFiles.files
            .filter(file => file.endsWith('.json'))
            .map(file => path.basename(file, '.json'));
    }

    async clonePreset(sourceName: string, newName: string): Promise<void> {
        const sourcePreset = await this.getPreset(sourceName);
        if (!sourcePreset) {
            throw new Error(`원본 프리셋 "${sourceName}"을(를) 찾을 수 없습니다.`);
        }
        if (await this.presetExists(newName)) {
            throw new Error(`프리셋 "${newName}"이(가) 이미 존재합니다.`);
        }
        const clonedPreset: Preset = { ...sourcePreset, name: newName, isDefault: false };
        await this.savePresetToFile(newName, clonedPreset);
    }

    async exportPreset(name: string): Promise<string> {
        const preset = await this.getPreset(name);
        if (!preset) {
            throw new Error(`프리셋 "${name}"을(를) 찾을 수 없습니다.`);
        }
        return JSON.stringify(preset, null, 2);
    }

    async importPreset(jsonString: string): Promise<void> {
        try {
            const importedPreset: Preset = JSON.parse(jsonString);
            if (!importedPreset.name || !importedPreset.settings) {
                throw new Error("유효하지 않은 프리셋 형식입니다.");
            }
            await this.savePresetToFile(importedPreset.name, importedPreset);
        } catch (error) {
            throw new Error(`프리셋 가져오기 실패: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

	async getPreset(presetName: string): Promise<Preset | undefined> {
		if (this.presetCache.has(presetName)) {
			return this.presetCache.get(presetName);
		}
		const preset = await this.loadPresetFromFile(presetName);
		return preset || undefined;
	}

    getFolderPresets(): Record<string, string[]> {
        return this.settings.folderPresets || {};
    }

    async deleteAllPresets(): Promise<void> {
        const presetNames = await this.getPresetNames();
        for (const name of presetNames) {
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
    }

    private async presetExists(name: string): Promise<boolean> {
        const filePath = `${this.presetFolder}/${name}.json`;
        return await this.app.vault.adapter.exists(filePath);
    }

    async loadPresetsFromFiles(): Promise<void> {
        const presetFiles = await this.app.vault.adapter.list(this.presetFolder);
        for (const file of presetFiles.files) {
            if (file.endsWith('.json')) {
                const presetName = path.basename(file, '.json');
                await this.loadPresetFromFile(presetName);
            }
        }
    }

	async applyGlobalPreset(presetName?: string): Promise<void> {
		const globalPresetName = presetName || this.plugin.settings.GlobalPreset;
		if (!globalPresetName) {
			console.error('글로벌 프리셋이 설정되지 않았습니다.');
			return;
		}
		console.log(`글로벌 프리셋 적용 시작: ${globalPresetName}`);
		
		await this.applyPreset(globalPresetName);
		
		// GlobalPreset 설정 업데이트
		this.plugin.settings.GlobalPreset = globalPresetName;
		await this.plugin.saveSettings();
		
		console.log('GlobalPreset 업데이트:', this.plugin.settings.GlobalPreset);
	}
	
	async applyFolderPreset(folderPath: string): Promise<void> {
		console.log(`폴더 프리셋 적용 시도: ${folderPath}`);
		let currentPath: string | null = folderPath;
		let presetApplied = false;
	
		while (currentPath && !presetApplied) {
			if (!this.plugin.settings.activeFolderPresets) {
				this.plugin.settings.activeFolderPresets = {};
			}
			const presetName = this.plugin.settings.activeFolderPresets[currentPath];
			if (presetName) {
				console.log(`폴더 프리셋 찾음: ${presetName} (폴더: ${currentPath})`);
				await this.applyPreset(presetName);
				presetApplied = true;
			} else {
				currentPath = currentPath.includes('/') 
					? currentPath.substring(0, currentPath.lastIndexOf('/')) 
					: null;
			}
		}
	
		if (!presetApplied) {
			console.log('폴더 프리셋을 찾지 못해 글로벌 프리셋 적용');
			await this.applyGlobalPreset();
		}
	}
	
	async applyPreset(presetName: string): Promise<void> {
		console.log(`프리셋 적용 시작: ${presetName}`);
		const preset = await this.getPreset(presetName);
		if (preset) {
			console.log(`프리셋 찾음: ${presetName}`, preset);
			
			// 글로벌 설정값 보존
			const globalSettings = globalSettingsKeys.reduce((acc, key) => {
				if (key in this.plugin.settings && this.plugin.settings[key] !== undefined) {
					acc[key] = this.plugin.settings[key] as any;
				}
				return acc;
			}, {} as Partial<Pick<CardNavigatorSettings, typeof globalSettingsKeys[number]>>);
			
			// 프리셋 설정 적용
			this.plugin.settings = {
				...DEFAULT_SETTINGS,  // 기본 설정으로 시작
				...preset.settings,   // 프리셋 설정 적용
				...globalSettings,    // 글로벌 설정값 복원
				lastActivePreset: presetName
			};
			
			console.log('적용 후 설정:', this.plugin.settings);
			await this.plugin.saveSettings();
			this.plugin.refreshCardNavigator();
		} else {
			console.error(`프리셋 "${presetName}"을(를) 찾을 수 없습니다.`);
		}
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
}
