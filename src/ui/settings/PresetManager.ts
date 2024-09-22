import { App, Notice } from 'obsidian';
import { CardNavigatorSettings, Preset, globalSettingsKeys, DEFAULT_SETTINGS } from '../../common/types';
import { IPresetManager } from '../../common/IPresetManager';
import CardNavigatorPlugin from '../../main';
import * as path from 'path';

export class PresetManager implements IPresetManager {
    private presets: { [key: string]: Preset } = {};
    private presetFolder: string;

    constructor(private app: App, private plugin: CardNavigatorPlugin) {
        this.presetFolder = this.plugin.settings.presetFolderPath || 'CardNavigatorPresets';
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
        await this.loadPresetsFromFiles();

        console.log('초기화 후 프리셋:', this.presets);
        console.log('초기화 후 폴더 프리셋:', this.plugin.settings.folderPresets);
        console.log('초기화 후 활성 폴더 프리셋:', this.plugin.settings.activeFolderPresets);

        // 기본 프리셋이 없으면 생성
        if (!this.presets['default']) {
            const defaultPreset: Preset = {
                name: 'default',
                settings: DEFAULT_SETTINGS,
                isDefault: true,
                description: '기본 프리셋'
            };
            await this.savePresetToFile('default', defaultPreset);
            this.presets['default'] = defaultPreset;
        }

        await this.plugin.saveSettings();
    }

	async loadSettings(): Promise<void> {
        await this.plugin.loadSettings();
        this.presetFolder = this.plugin.settings.presetFolderPath || 'CardNavigatorPresets';
        console.log('설정 로드됨:', this.plugin.settings);
    }

	async applyPreset(presetName: string): Promise<void> {
		const preset = this.presets[presetName];
		if (!preset) {
			console.error(`프리셋을 찾을 수 없음: ${presetName}`);
			return;
		}
	
		console.log(`프리셋 적용 중: ${presetName}`);
		console.log('프리셋 설정:', preset.settings);
	
		// 프리셋 설정을 현재 설정에 병합
		Object.assign(this.plugin.settings, preset.settings);
	
		// 변경된 설정 저장
		await this.plugin.saveSettings();
	
		console.log('프리셋 적용 후 설정:', this.plugin.settings);
	}

	async applyFolderPreset(folderPath: string): Promise<void> {
		console.log(`폴더 경로에 대한 프리셋 적용 중: ${folderPath}`);
		console.log('현재 폴더 프리셋:', this.plugin.settings.folderPresets);
		console.log('현재 활성 폴더 프리셋:', this.plugin.settings.activeFolderPresets);
	
		let currentPath = folderPath;
		while (currentPath !== '') {
			console.log(`폴더 확인 중: ${currentPath}`);
			const activePreset = this.plugin.settings.activeFolderPresets[currentPath];
			if (activePreset && this.presets[activePreset]) {
				console.log(`${currentPath} 폴더에 대한 프리셋 찾음: ${activePreset}`);
				await this.applyPreset(activePreset);
				console.log(`${currentPath} 폴더에 ${activePreset} 프리셋 적용됨`);
				console.log('적용된 설정:', this.plugin.settings);
				return;
			}
			currentPath = currentPath.substring(0, currentPath.lastIndexOf('/'));
		}
	
		// 루트 폴더 확인
		if (this.plugin.settings.activeFolderPresets['/']) {
			const rootPreset = this.plugin.settings.activeFolderPresets['/'];
			console.log(`루트 폴더에 대한 프리셋 찾음: ${rootPreset}`);
			await this.applyPreset(rootPreset);
			console.log('적용된 설정:', this.plugin.settings);
			return;
		}
	
		console.log('어떤 폴더에서도 프리셋을 찾지 못함. 기본 프리셋 적용.');
		await this.applyPreset('default');
		console.log('적용된 설정:', this.plugin.settings);
	}

	async loadPresets(): Promise<void> {
        await this.loadPresetsFromFiles();
    }

    async loadPresetsFromFiles() {
        const presetFiles = await this.app.vault.adapter.list(this.presetFolder);
        console.log('프리셋 파일 발견:', presetFiles);
        for (const file of presetFiles.files) {
            if (file.endsWith('.json')) {
                const presetName = path.basename(file, '.json');
                const preset = await this.loadPresetFromFile(path.join(this.presetFolder, file));
                console.log(`로드된 프리셋 ${presetName}:`, preset);
                if (preset) {
                    this.presets[presetName] = preset;
                }
            }
        }
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
            if (!this.isValidPreset(preset)) {
                new Notice(`유효하지 않은 프리셋 형식입니다: ${filePath}`);
                return null;
            }
            return preset;
        } catch (error) {
            console.error(`${filePath} 파일에서 프리셋 로딩 중 오류 발생:`, error);
            return null;
        }
    }
    
    private isValidPreset(preset: unknown): preset is Preset {
        return (
            typeof preset === 'object' &&
            preset !== null &&
            'name' in preset &&
            'settings' in preset &&
            'isDefault' in preset &&
            'description' in preset &&
            typeof (preset as Preset).name === 'string' &&
            typeof (preset as Preset).settings === 'object' &&
            typeof (preset as Preset).isDefault === 'boolean' &&
            typeof (preset as Preset).description === 'string'
        );
    }

    // private addPresetToFolder(folderPath: string, presetName: string): void {
    //     console.log(`프리셋 ${presetName}을(를) 폴더 ${folderPath}에 추가 중`);
    //     if (!this.settings.folderPresets) {
    //         this.settings.folderPresets = {};
    //     }
    //     if (!this.settings.folderPresets[folderPath]) {
    //         this.settings.folderPresets[folderPath] = [];
    //     }
    //     if (!this.settings.folderPresets[folderPath].includes(presetName)) {
    //         this.settings.folderPresets[folderPath].push(presetName);
    //         console.log(`프리셋 ${presetName}을(를) 폴더 ${folderPath}에 추가함`);
    //     } else {
    //         console.log(`프리셋 ${presetName}이(가) 이미 폴더 ${folderPath}에 존재함`);
    //     }
    // }

    async createPreset(name: string, settings: Partial<CardNavigatorSettings>, description = ""): Promise<void> {
        if (this.presets[name]) {
            throw new Error(`프리셋 "${name}"이(가) 이미 존재합니다.`);
        }
        const filteredSettings = this.filterGlobalSettings(settings);
        const newPreset: Preset = { name, settings: filteredSettings, isDefault: false, description };
        await this.savePresetToFile(name, newPreset);
        this.presets[name] = newPreset;
        await this.plugin.saveSettings();
        this.plugin.refreshSettingsTab();
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
        this.plugin.settings.lastActivePreset = name;
    }

    setActiveFolderPreset(folderPath: string, presetName: string): void {
        if (!this.plugin.settings.activeFolderPresets) {
            this.plugin.settings.activeFolderPresets = {};
        }
        this.plugin.settings.activeFolderPresets[folderPath] = presetName;
    }
    
    getActiveFolderPreset(folderPath: string): string | undefined {
        return this.plugin.settings.activeFolderPresets?.[folderPath];
    }

    togglePresetActive(name: string, isActive: boolean): void {
        if (!this.presets[name]) {
            throw new Error(`프리셋 "${name}"을(를) 찾을 수 없습니다.`);
        }
        this.presets[name].isDefault = isActive;
        this.savePresetToFile(name, this.presets[name]);
    }

    addFolderPreset(folderPath: string, presetName: string): void {
        if (!this.presets[presetName]) {
            throw new Error(`프리셋 "${presetName}"을(를) 찾을 수 없습니다.`);
        }
        if (!this.plugin.settings.folderPresets) {
            this.plugin.settings.folderPresets = {};
        }
        if (!this.plugin.settings.folderPresets[folderPath]) {
            this.plugin.settings.folderPresets[folderPath] = [];
        }
        if (!this.plugin.settings.folderPresets[folderPath].includes(presetName)) {
            this.plugin.settings.folderPresets[folderPath].push(presetName);
        }
    }

    removeFolderPreset(folderPath: string, presetName: string): void {
        if (this.plugin.settings.folderPresets && this.plugin.settings.folderPresets[folderPath]) {
            this.plugin.settings.folderPresets[folderPath] = this.plugin.settings.folderPresets[folderPath].filter((name: string) => name !== presetName);
            if (this.plugin.settings.folderPresets[folderPath].length === 0) {
                delete this.plugin.settings.folderPresets[folderPath];
            }
        }
    }
}
