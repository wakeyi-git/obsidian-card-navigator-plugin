import { App, Modal, Setting, Notice, TextAreaComponent } from 'obsidian';
import CardNavigatorPlugin from '../../../main';
import { SettingsManager } from '../settingsManager';
import { t } from 'i18next';

export class PresetEditModal extends Modal {
    private presetName = '';
    private description = '';
    private presetData = '';
    private dataTextArea: TextAreaComponent | null = null;

    constructor(
        app: App,
        private plugin: CardNavigatorPlugin,
        private settingsManager: SettingsManager,
        private mode: 'create' | 'edit' | 'clone',
        private existingPresetName?: string,
        private refreshPresetList?: () => void
    ) {
        super(app);
    }

	async onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.createEl('h2', { text: this.getModalTitle() });
	
		new Setting(contentEl)
			.setName(t('PRESET_NAME'))
			.setDesc(t('ENTER_PRESET_NAME'))
			.addTextArea(async text => {
				text.setPlaceholder(t('ENTER_PRESET_NAME_PLACEHOLDER'))
				.setValue(this.getInitialPresetName())
				.onChange(value => this.presetName = value);
				text.inputEl.rows = 1;
				text.inputEl.style.width = '350px';
			});
	
		new Setting(contentEl)
			.setName(t('DESCRIPTION'))
			.setDesc(t('ENTER_PRESET_DESCRIPTION'))
			.addTextArea(async text => {
				text.setPlaceholder(t('ENTER_PRESET_DESCRIPTION_PLACEHOLDER'))
					.setValue(await this.getInitialDescription())
					.onChange(value => this.description = value);
				text.inputEl.rows = 4;
				text.inputEl.style.width = '350px';
			});
	
		new Setting(contentEl)
		.setName(t('PRESET_DATA'))
		.setDesc(t('EDIT_PRESET_DATA_DESC'))
		.addTextArea(async text => {
			this.dataTextArea = text;
			const initialData = await this.getInitialPresetData();
			this.presetData = initialData;
			text.setPlaceholder(t('PRESET_DATA_PLACEHOLDER'))
				.setValue(initialData)
				.onChange(value => this.presetData = value);
			text.inputEl.rows = 10;
			text.inputEl.style.width = '350px';
		});
	
		new Setting(contentEl)
			.addButton(btn => btn
				.setButtonText(t('UPDATE_WITH_CURRENT_SETTINGS'))
				.onClick(() => this.updatePresetWithCurrentSettings()));
	
		new Setting(contentEl)
			.addButton(btn => btn
				.setButtonText(t('SAVE'))
				.setCta()
				.onClick(() => this.savePreset()));
	}

    private getModalTitle(): string {
        switch (this.mode) {
            case 'create': return t('CREATE_NEW_PRESET');
            case 'edit': return t('EDIT_PRESET');
            case 'clone': return t('CLONE_PRESET');
        }
    }

    private getInitialPresetName(): string {
        switch (this.mode) {
            case 'create': return '';
            case 'edit': return this.existingPresetName || '';
            case 'clone': return t('PRESET_COPY', {name: this.existingPresetName || ''});
        }
    }

    private async getInitialDescription(): Promise<string> {
        if (this.mode === 'create') return '';
        const existingPreset = await this.plugin.presetManager.getPreset(this.existingPresetName || '');
        return existingPreset?.description || '';
    }
    
    private async getInitialPresetData(): Promise<string> {
        if (this.mode === 'create') return JSON.stringify(this.plugin.settingsManager.getCurrentSettings(), null, 2);
        const existingPreset = await this.plugin.presetManager.getPreset(this.existingPresetName || '');
        return JSON.stringify(existingPreset?.settings || {}, null, 2);
    }

    private async updatePresetWithCurrentSettings() {
        const currentSettings = this.plugin.settingsManager.getCurrentSettings();
        this.presetData = JSON.stringify(currentSettings, null, 2);
        if (this.dataTextArea) {
            this.dataTextArea.setValue(this.presetData);
        }
    }

    private async savePreset() {
        if (!this.presetName && this.mode !== 'edit') {
            new Notice(t('ENTER_PRESET_NAME_NOTICE'));
            return;
        }
    
        if (!this.presetData.trim()) {
            new Notice(t('PRESET_DATA_EMPTY'));
            return;
        }
	
		try {
			const presetSettings = JSON.parse(this.presetData);
			const saveName = this.mode === 'edit' ? (this.existingPresetName || this.presetName) : this.presetName;
	
			switch (this.mode) {
				case 'create':
				case 'clone':
					await this.plugin.presetManager.savePreset(saveName, this.description, presetSettings);
					await this.plugin.presetManager.applyGlobalPreset(saveName);
					break;
				case 'edit':
					if (this.existingPresetName) {
						if (this.existingPresetName !== saveName) {
							await this.plugin.presetManager.deletePreset(this.existingPresetName);
						}
						await this.plugin.presetManager.savePreset(saveName, this.description, presetSettings);
					}
					break;
			}
	
            this.close();
            // this.settingsManager.applyChanges();
            new Notice(t('PRESET_SAVED', {name: saveName}));
            
            if (this.refreshPresetList) {
                this.refreshPresetList();
            }
        } catch (error) {
            console.error(t('FAILED_TO_SAVE_PRESET'), error);
            new Notice(t('PRESET_SAVE_FAILED', {error: error instanceof Error ? error.message : String(error)}));
        }
    }
}
