import { Preset, CardNavigatorSettings } from '../common/types';

export interface IPresetManager {
    createPreset(name: string, settings: Partial<CardNavigatorSettings>, description?: string): Promise<void>;
    updatePreset(name: string, settings: Partial<CardNavigatorSettings>, description?: string): Promise<void>;
    deletePreset(name: string): Promise<void>;
    clonePreset(sourceName: string, newName: string): Promise<void>;
    exportPreset(name: string): Promise<string>;
    importPreset(jsonString: string): Promise<void>;
    getPresetNames(): string[];
    getPreset(name: string): Preset | undefined;
    loadPresets(): Promise<void>;
}
