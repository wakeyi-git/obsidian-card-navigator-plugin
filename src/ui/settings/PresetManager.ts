import { App } from 'obsidian';
import { CardNavigatorSettings, Preset, globalSettingsKeys, DEFAULT_SETTINGS } from '../../common/types';
import { IPresetManager } from '../../common/interface';
import CardNavigatorPlugin from '../../main';
import { t } from 'i18next';
import { CardNavigatorView, RefreshType, VIEW_TYPE_CARD_NAVIGATOR } from 'ui/cardNavigatorView';

//#region 유틸리티 클래스 및 함수
// LRU 캐시 클래스
class LRUCache<K, V> {
    private cache: Map<K, V>;
    private maxSize: number;
    private timestamps: Map<K, number>;

    constructor(maxSize: number) {
        this.cache = new Map();
        this.timestamps = new Map();
        this.maxSize = maxSize;
    }

    // 캐시에서 값 가져오기
    get(key: K): V | undefined {
        const value = this.cache.get(key);
        if (value !== undefined) {
            this.timestamps.set(key, Date.now());
        }
        return value;
    }

    // 캐시에 값 설정
    set(key: K, value: V): void {
        if (this.cache.size >= this.maxSize) {
            this.evictOldest();
        }
        this.cache.set(key, value);
        this.timestamps.set(key, Date.now());
    }

    // 캐시에서 항목 삭제
    delete(key: K): void {
        this.cache.delete(key);
        this.timestamps.delete(key);
    }

    // 캐시 초기화
    clear(): void {
        this.cache.clear();
        this.timestamps.clear();
    }

    // 가장 오래된 항목 제거
    private evictOldest(): void {
        let oldestKey: K | null = null;
        let oldestTime = Infinity;

        for (const [key, time] of this.timestamps.entries()) {
            if (time < oldestTime) {
                oldestTime = time;
                oldestKey = key;
            }
        }

        if (oldestKey) {
            this.delete(oldestKey);
        }
    }
}

// 파일 경로에서 기본 이름 추출
function basename(path: string, ext?: string): string {
    const name = path.split('/').pop() || path;
    return ext && name.endsWith(ext) ? name.slice(0, -ext.length) : name;
}
//#endregion

export class PresetManager implements IPresetManager {
    //#region 클래스 속성
    private presetFolder: string;
    private presetCache: LRUCache<string, Preset>;
    private static readonly CACHE_MAX_SIZE = 50;
    //#endregion

    //#region 초기화 및 기본 설정
    // 생성자: 프리셋 매니저 초기화
    constructor(private app: App, private plugin: CardNavigatorPlugin, private settings: CardNavigatorSettings) {
        this.presetFolder = this.settings.presetFolderPath || 'CardNavigatorPresets';
        this.presetCache = new LRUCache<string, Preset>(PresetManager.CACHE_MAX_SIZE);
        if (!this.settings.folderPresets) {
            this.settings.folderPresets = {};
        }
        if (!this.settings.activeFolderPresets) {
            this.settings.activeFolderPresets = {};
        }
    }

    // 프리셋 매니저 초기화
    async initialize(): Promise<void> {
        await this.ensurePresetFolder();
        await this.loadPresetsFromFiles();
    
        if (!await this.presetExists('default')) {
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

    // 프리셋 폴더 업데이트
    updatePresetFolder(newFolder: string): void {
        this.presetFolder = newFolder;
        this.presetCache.clear();
    }

    // 프리셋 폴더 존재 확인 및 생성
    private async ensurePresetFolder(): Promise<void> {
        if (!await this.app.vault.adapter.exists(this.presetFolder)) {
            await this.app.vault.createFolder(this.presetFolder);
        }
    }
    //#endregion

    //#region 프리셋 로드 및 저장
    // 프리셋 로드
    async loadPreset(name: string): Promise<void> {
        const preset = await this.getPreset(name);
        if (!preset) {
            throw new Error(t('PRESET_NOT_FOUND', {name: name}));
        }
        this.settings = {
            ...this.settings,
            ...preset.settings,
        };
        this.settings.lastActivePreset = name;
        await this.plugin.saveSettings();
        
        const leaves = this.plugin.app.workspace.getLeavesOfType(VIEW_TYPE_CARD_NAVIGATOR);
        leaves.forEach(leaf => {
            if (leaf.view instanceof CardNavigatorView) {
                leaf.view.refresh(RefreshType.SETTINGS);
            }
        });
    }

    // 프리셋 저장
    public async savePreset(name: string, description?: string, settings?: Partial<CardNavigatorSettings>): Promise<void> {
        const currentSettings = settings || this.getCurrentSettings();
        const preset: Preset = {
            name: name,
            settings: currentSettings,
            isDefault: false,
            description: description
        };
        await this.savePresetToFile(name, preset);
        this.presetCache.set(name, preset);
    }

    // 현재 설정 가져오기
    private getCurrentSettings(): Partial<CardNavigatorSettings> {
        const currentSettings = { ...this.plugin.settings };
        globalSettingsKeys.forEach(key => delete currentSettings[key]);
        return currentSettings;
    }

    // 파일에서 프리셋 로드
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

    // 파일에 프리셋 저장
    private async savePresetToFile(name: string, preset: Preset): Promise<void> {
        const filePath = `${this.presetFolder}/${name}.json`;
        await this.app.vault.adapter.write(filePath, JSON.stringify(preset, null, 2));
        this.presetCache.set(name, preset);
    }

    // 모든 프리셋 파일 로드
    async loadPresetsFromFiles(): Promise<void> {
        const presetFiles = await this.app.vault.adapter.list(this.presetFolder);
        for (const file of presetFiles.files) {
            if (file.endsWith('.json')) {
                const presetName = basename(file, '.json');
                await this.loadPresetFromFile(presetName);
            }
        }
    }
    //#endregion

    //#region 프리셋 관리
    // 프리셋 삭제
    async deletePreset(name: string): Promise<void> {
        const filePath = `${this.presetFolder}/${name}.json`;
        await this.app.vault.adapter.remove(filePath);
        this.presetCache.delete(name);
    }

    // 프리셋 이름 변경
    async renamePreset(oldName: string, newName: string): Promise<void> {
        const preset = await this.getPreset(oldName);
        if (!preset) {
            throw new Error(t('PRESET_NOT_FOUND', {name: oldName}));
        }
        preset.name = newName;
        await this.savePresetToFile(newName, preset);
        await this.deletePreset(oldName);
    }

    // 프리셋 복제
    async clonePreset(sourceName: string, newName: string): Promise<void> {
        const sourcePreset = await this.getPreset(sourceName);
        if (!sourcePreset) {
            throw new Error(t('SOURCE_PRESET_NOT_FOUND', {name: sourceName}));
        }
        if (await this.presetExists(newName)) {
            throw new Error(t('PRESET_ALREADY_EXISTS_WITH_NAME', {name: newName}));
        }
        const clonedPreset: Preset = { ...sourcePreset, name: newName, isDefault: false };
        await this.savePresetToFile(newName, clonedPreset);
    }

    // 모든 프리셋 삭제
    async deleteAllPresets(): Promise<void> {
        const presetNames = await this.getPresetNames();
        for (const name of presetNames) {
            await this.deletePreset(name);
        }
    }

    // 기본 프리셋으로 초기화
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
    //#endregion

    //#region 프리셋 조회
    // 프리셋 존재 여부 확인
    private async presetExists(name: string): Promise<boolean> {
        const filePath = `${this.presetFolder}/${name}.json`;
        return await this.app.vault.adapter.exists(filePath);
    }

    // 프리셋 가져오기
    async getPreset(presetName: string): Promise<Preset | undefined> {
        const cachedPreset = this.presetCache.get(presetName);
        if (cachedPreset) {
            return cachedPreset;
        }
        const preset = await this.loadPresetFromFile(presetName);
        if (preset) {
            this.presetCache.set(presetName, preset);
        }
        return preset || undefined;
    }

    // 모든 프리셋 가져오기
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

    // 프리셋 이름 목록 가져오기
    async getPresetNames(): Promise<string[]> {
        const presetFiles = await this.app.vault.adapter.list(this.presetFolder);
        return presetFiles.files
            .filter(file => file.endsWith('.json'))
            .map(file => basename(file, '.json'));
    }
    //#endregion

    //#region 프리셋 적용
    // 전역 프리셋 적용
    async applyGlobalPreset(presetName?: string): Promise<void> {
        const globalPresetName = presetName || this.plugin.settings.GlobalPreset;
        if (!globalPresetName) {
            console.error(t('GLOBAL_PRESET_NOT_SET'));
            return;
        }
        
        await this.applyPreset(globalPresetName);
        
        this.plugin.settings.GlobalPreset = globalPresetName;
        await this.plugin.saveSettings();
    }

    // 폴더 프리셋 적용
    async applyFolderPreset(folderPath: string): Promise<void> {
        let currentPath: string | null = folderPath;
        let presetApplied = false;
    
        while (currentPath && !presetApplied) {
            if (!this.plugin.settings.activeFolderPresets) {
                this.plugin.settings.activeFolderPresets = {};
            }
            const presetName = this.plugin.settings.activeFolderPresets[currentPath];
            if (presetName) {
                await this.applyPreset(presetName);
                presetApplied = true;
            } else {
                currentPath = currentPath.includes('/') 
                    ? currentPath.substring(0, currentPath.lastIndexOf('/')) 
                    : null;
            }
        }
    
        if (!presetApplied) {
            await this.applyGlobalPreset();
        }
    }

    // 프리셋 적용
    async applyPreset(presetName: string): Promise<void> {
        const preset = await this.getPreset(presetName);
        if (preset) {
            const globalSettings = globalSettingsKeys.reduce((acc, key) => {
                if (key in this.plugin.settings && this.plugin.settings[key] !== undefined) {
                    acc[key] = this.plugin.settings[key] as any;
                }
                return acc;
            }, {} as Partial<Pick<CardNavigatorSettings, typeof globalSettingsKeys[number]>>);
            
            this.plugin.settings = {
                ...DEFAULT_SETTINGS,
                ...preset.settings,
                ...globalSettings,
                lastActivePreset: presetName
            };
            
            await this.plugin.saveSettings();
            
            const leaves = this.plugin.app.workspace.getLeavesOfType(VIEW_TYPE_CARD_NAVIGATOR);
            leaves.forEach(leaf => {
                if (leaf.view instanceof CardNavigatorView) {
                    leaf.view.refresh(RefreshType.SETTINGS);
                }
            });
        } else {
            console.error(t('PRESET_NOT_FOUND', {name: presetName}));
        }
    }
    //#endregion

    //#region 프리셋 가져오기/내보내기
    // 프리셋 내보내기
    async exportPreset(name: string): Promise<string> {
        const preset = await this.getPreset(name);
        if (!preset) {
            throw new Error(t('PRESET_NOT_FOUND', {name: name}));
        }
        return JSON.stringify(preset, null, 2);
    }

    // 프리셋 가져오기
    async importPreset(jsonString: string): Promise<void> {
        try {
            const importedPreset: Preset = JSON.parse(jsonString);
            if (!importedPreset.name || !importedPreset.settings) {
                throw new Error(t('INVALID_PRESET_FORMAT'));
            }
            await this.savePresetToFile(importedPreset.name, importedPreset);
        } catch (error) {
            throw new Error(t('PRESET_IMPORT_FAILED', {error: error instanceof Error ? error.message : String(error)}));
        }
    }

    // 모든 프리셋 내보내기
    async exportPresets(): Promise<string> {
        const presets = await this.getPresets();
        return JSON.stringify(presets, null, 2);
    }

    // 모든 프리셋 가져오기
    async importPresets(jsonString: string): Promise<void> {
        const importedPresets = JSON.parse(jsonString) as Record<string, Preset>;
        for (const [name, preset] of Object.entries(importedPresets)) {
            await this.savePresetToFile(name, preset);
        }
    }
    //#endregion

    //#region 폴더 프리셋 관리
    // 폴더 프리셋 가져오기
    getFolderPresets(): Record<string, string[]> {
        return this.settings.folderPresets || {};
    }

    // 폴더 프리셋 설정
    async setFolderPreset(folderPath: string, presetName: string): Promise<void> {
        if (!this.settings.folderPresets) {
            this.settings.folderPresets = {};
        }
        this.settings.folderPresets[folderPath] = [presetName];
        await this.plugin.saveSettings();
    }

    // 폴더에서 프리셋 제거
    async removeFolderPreset(folderPath: string, presetName: string): Promise<void> {
        if (this.settings.folderPresets && this.settings.folderPresets[folderPath]) {
            this.settings.folderPresets[folderPath] = this.settings.folderPresets[folderPath].filter(name => name !== presetName);
            if (this.settings.folderPresets[folderPath].length === 0) {
                delete this.settings.folderPresets[folderPath];
            }
            await this.plugin.saveSettings();
        }
    }

    // 모든 폴더에서 프리셋 제거
    async removePresetFromAllFolders(presetName: string) {
        if (this.plugin.settings.folderPresets) {
            for (const folderPath in this.plugin.settings.folderPresets) {
                this.plugin.settings.folderPresets[folderPath] = this.plugin.settings.folderPresets[folderPath].filter(name => name !== presetName);
                if (this.plugin.settings.folderPresets[folderPath].length === 0) {
                    delete this.plugin.settings.folderPresets[folderPath];
                }
            }
            await this.plugin.saveSettings();
        }
    }

    // 폴더 프리셋 자동 적용 설정
    async toggleAutoApplyFolderPresets(value: boolean): Promise<void> {
        this.settings.autoApplyFolderPresets = value;
        await this.plugin.saveSettings();
    }
    //#endregion
}
