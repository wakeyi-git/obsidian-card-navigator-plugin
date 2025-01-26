import { Preset, FolderPresets } from '../common/types';

// 프리셋 관리 함수들의 타입 정의
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
