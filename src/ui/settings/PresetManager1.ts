import { App, Notice } from 'obsidian';
import { CardNavigatorSettings, Preset, globalSettingsKeys } from '../../common/types';
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
    }

    async loadPresetsFromFiles() {
        const presetFiles = await this.app.vault.adapter.list(this.presetFolder);
        for (const file of presetFiles.files) {
            if (file.endsWith('.json')) {
                const presetName = path.basename(file, '.json');
                const presetSettings = await this.loadPresetFromFile(file);
                if (presetSettings) {
                    this.presets[presetName] = presetSettings;
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
            return preset;
        } catch (error) {
            console.error(`Error loading preset from file ${filePath}:`, error);
            return null;
        }
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

    private async deletePresetFile(name: string): Promise<void> {
        const filePath = `${this.presetFolder}/${name}.json`;
        await this.app.vault.adapter.remove(filePath);
    }

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

    async deletePreset(name: string): Promise<void> {
        if (!this.presets[name]) {
            throw new Error(`프리셋 "${name}"을(를) 찾을 수 없습니다.`);
        }
        await this.deletePresetFile(name);
        delete this.presets[name];
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

    async exportPreset(name: string): Promise<string> {
        if (!this.presets[name]) {
            throw new Error(`프리셋 "${name}"을(를) 찾을 수 없습니다.`);
        }
        return JSON.stringify(this.presets[name], null, 2);
    }

    async applyPreset(presetName: string): Promise<void> {
        // 현재 설정을 로드합니다.
        const currentSettings = await this.plugin.loadData();
        const presetSettings = await this.loadPresetFromFile(`${presetName}.json`);
        if (presetSettings) {
            // 전역 설정은 제외하고 프리셋 설정만 적용
            const filteredSettings = Object.fromEntries(
                Object.entries(presetSettings.settings).filter(
                    ([key]) => !globalSettingsKeys.includes(key as keyof CardNavigatorSettings)
                )
            );
            // 현재 설정과 프리셋 설정을 병합합니다.
            const newSettings = Object.assign({}, currentSettings, filteredSettings);
            this.plugin.settings = newSettings;
            // 변경된 설정을 저장합니다.
            await this.plugin.saveData(newSettings);
            this.plugin.refreshCardNavigator();
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
}
