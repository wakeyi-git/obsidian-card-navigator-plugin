import { TFolder } from 'obsidian';
import { CardNavigatorSettings, NumberSettingKey, RangeSettingConfig } from './types';

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
