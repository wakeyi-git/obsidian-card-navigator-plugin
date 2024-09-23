import { TFolder, debounce, Notice } from 'obsidian';
import CardNavigatorPlugin from '../../main';
import { CardNavigatorSettings, NumberSettingKey, RangeSettingConfig, rangeSettingConfigs, DEFAULT_SETTINGS } from '../../common/types';
import { ISettingsManager } from '../../common/ISettingsManager';

export class SettingsManager implements ISettingsManager {
	private saveSettingsDebounced = debounce(async () => {
		try {
			await this.plugin.saveSettings();
		} catch (error) {
			console.error('Error saving settings:', error);
		}
	}, 500);

	constructor(private plugin: CardNavigatorPlugin) {}

	async saveSettings(): Promise<void> {
		console.log('Saving settings...', this.plugin.settings.presets);
		try {
			await this.plugin.saveSettings();
			console.log('Settings saved successfully');
		} catch (error) {
			console.error('Error saving settings:', error);
		}
	}

	async loadSettings(): Promise<void> {
		try {
			const loadedData = await this.plugin.loadData();
			
			if (loadedData) {
				this.plugin.settings = Object.assign({}, DEFAULT_SETTINGS, loadedData) as CardNavigatorSettings;
			} else {
				this.plugin.settings = { ...DEFAULT_SETTINGS };
			}
		
			// 누락된 설정을 기본값으로 채움
			Object.keys(DEFAULT_SETTINGS).forEach((key) => {
				if (!(key in this.plugin.settings)) {
					if (key in DEFAULT_SETTINGS) {
						// eslint-disable-next-line @typescript-eslint/no-explicit-any
						(this.plugin.settings as any)[key] = (DEFAULT_SETTINGS as any)[key];
					}
				}
			});
		
			await this.saveSettings();
		} catch (error) {
			console.error('Error loading settings:', error);
		}
	}

	getCurrentSettings(): Partial<CardNavigatorSettings> {
		return this.plugin.settings;
	}

	async updateSetting<K extends keyof CardNavigatorSettings>(
		key: K,
		value: CardNavigatorSettings[K]
	): Promise<void> {
		this.plugin.settings[key] = value;
		this.saveSettingsDebounced();
		this.plugin.triggerRefresh();
	}

	async confirmDelete(itemName: string): Promise<boolean> {
		return new Promise((resolve) => {
			const notice = new Notice(`정말로 ${itemName}을(를) 삭제하시겠습니까?`, 0);
			const buttonsContainer = notice.noticeEl.createDiv('buttons-container');

			const cancelButton = buttonsContainer.createEl('button', { text: '취소' });
			cancelButton.onclick = () => {
				notice.hide();
				resolve(false);
			};

			const deleteButton = buttonsContainer.createEl('button', { text: '삭제' });
			deleteButton.onclick = () => {
				notice.hide();
				resolve(true);
			};
		});
	}

	applyChanges(): void {
		this.plugin.triggerRefresh();
	}

	getActiveFolder(): string | null {
		return this.plugin.settings.selectedFolder;
	}

	async updateSelectedFolder(folder: TFolder | null): Promise<void> {
		await this.updateSetting('selectedFolder', folder ? folder.path : null);
	}

	getNumberSettingConfig(key: NumberSettingKey): RangeSettingConfig {
		return rangeSettingConfigs[key];
	}
	
	async updateBooleanSetting(key: keyof CardNavigatorSettings, value: boolean): Promise<void> {
		await this.updateSetting(key, value);
	}

	async updateLastActivePreset(presetName: string): Promise<void> {
		this.plugin.settings.lastActivePreset = presetName;
		await this.saveSettings();
	}

	async updateAutoApplyFolderPresets(value: boolean): Promise<void> {
		this.plugin.settings.autoApplyFolderPresets = value;
		await this.saveSettings();
	}
}
