import { TFolder } from 'obsidian';
import { Preset, FolderPresets, CardNavigatorSettings, NumberSettingKey, RangeSettingConfig } from '../domain/models/types';
import { SearchService } from '../presentation/views/toolbar/search/SearchService';
import { App } from 'obsidian';

export type { CardNavigatorSettings, NumberSettingKey };

export interface ISettingsManager {
    saveSettings(): Promise<void>;
    loadSettings(): Promise<void>;
    updateSetting<K extends keyof CardNavigatorSettings>(key: K, value: CardNavigatorSettings[K]): Promise<void>;
    confirmDelete(itemName: string): Promise<boolean>;
    applyChanges(): void;
    getCurrentSettings(): Partial<CardNavigatorSettings>;
    getActiveFolder(): string | null;
    updateSelectedFolder(folder: TFolder | null): Promise<void>;
    getNumberSettingConfig(key: NumberSettingKey): RangeSettingConfig;
    updateBooleanSetting(key: keyof CardNavigatorSettings, value: boolean): Promise<void>;
    updateLastActivePreset(presetName: string): Promise<void>;
    updateAutoApplyFolderPresets(value: boolean): Promise<void>;
}

export interface IPresetManager {
	savePreset: (name: string, description?: string) => Promise<void>;
	loadPreset: (name: string) => Promise<void>;
	deletePreset: (name: string) => Promise<void>;
	renamePreset: (oldName: string, newName: string) => Promise<void>;
	importPresets: (presetsJson: string) => Promise<void>;
	exportPresets(): Promise<string>;
    getPresets(): Promise<Record<string, Preset>>;
    getPreset(presetName: string): Promise<Preset | undefined>;
    getFolderPresets: () => FolderPresets;
	setFolderPreset: (folderPath: string, presetName: string) => Promise<void>;
	removeFolderPreset: (folderPath: string, presetName: string) => Promise<void>;
	toggleAutoApplyFolderPresets: (value: boolean) => Promise<void>;
	applyFolderPreset: (folderPath: string) => Promise<void>;
}

/**
 * 툴바 메뉴 타입
 */
export type ToolbarMenu = 'settings' | 'sort' | 'search' | 'layout';

/**
 * 카드 네비게이터 플러그인 인터페이스
 */
export interface CardNavigatorPlugin {
    settings: CardNavigatorSettings;
    saveSettings: () => Promise<void>;
    updateLayout: (layout: CardNavigatorSettings['defaultLayout']) => void;
    settingsManager: ISettingsManager;
    presetManager: IPresetManager;
    searchService: SearchService;
    app: App;
    selectAndApplyPresetForCurrentFile: () => Promise<void>;
}
