import { CardNavigatorSettings, FolderPresets } from '../common/types';
import { TFolder } from 'obsidian';

export interface ISettingsManager {
    saveSettings(): Promise<void>;
    loadSettings(): Promise<void>;
    updateSetting<K extends keyof CardNavigatorSettings>(key: K, value: CardNavigatorSettings[K]): Promise<void>;
    getCurrentSettings(): Partial<CardNavigatorSettings>;
    applyPreset(presetName: string): Promise<void>;
    getActiveFolder(): string | null;
    updateSelectedFolder(folder: TFolder | null): Promise<void>;
    getFolderPresets(): FolderPresets;
    getPresetsForFolder(folderPath: string): string[];
    addPresetToFolder(folderPath: string, presetName: string): Promise<void>;
    removePresetFromFolder(folderPath: string, presetName: string): Promise<void>;
    setDefaultPresetForFolder(folderPath: string, presetName: string): Promise<void>;
}
