import { App, Modal, Setting, Notice, TextAreaComponent } from 'obsidian';
import CardNavigatorPlugin from '../../../main';
import { SettingsManager } from '../settingsManager';

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
			.setName('프리셋 이름')
			.setDesc('프리셋 이름을 입력하세요.')
			.addTextArea(async text => {
				text.setPlaceholder('프리셋 이름 입력')
				.setValue(this.getInitialPresetName())
				.onChange(value => this.presetName = value);
				text.inputEl.rows = 1;
				text.inputEl.style.width = '350px';
			});
	
		new Setting(contentEl)
			.setName('설명')
			.setDesc('프리셋에 대한 설명을 입력하세요.')
			.addTextArea(async text => {
				text.setPlaceholder('프리셋 설명 입력 (선택사항)')
					.setValue(await this.getInitialDescription())
					.onChange(value => this.description = value);
				text.inputEl.rows = 4;
				text.inputEl.style.width = '350px';
			});
	
		new Setting(contentEl)
		.setName('프리셋 데이터')
		.setDesc('JSON 형식의 프리셋 데이터를 직접 편집할 수 있습니다.')
		.addTextArea(async text => {
			this.dataTextArea = text;
			const initialData = await this.getInitialPresetData();
			this.presetData = initialData;
			text.setPlaceholder('프리셋 데이터 (JSON)')
				.setValue(initialData)
				.onChange(value => this.presetData = value);
			text.inputEl.rows = 10;
			text.inputEl.style.width = '350px';
		});
	
		new Setting(contentEl)
			.addButton(btn => btn
				.setButtonText('현재 설정으로 업데이트')
				.onClick(() => this.updatePresetWithCurrentSettings()));
	
		new Setting(contentEl)
			.addButton(btn => btn
				.setButtonText('저장')
				.setCta()
				.onClick(() => this.savePreset()));
	}

    private getModalTitle(): string {
        switch (this.mode) {
            case 'create': return '새 프리셋 만들기';
            case 'edit': return '프리셋 수정';
            case 'clone': return '프리셋 복제';
        }
    }

    private getInitialPresetName(): string {
        switch (this.mode) {
            case 'create': return '';
            case 'edit': return this.existingPresetName || '';
            case 'clone': return `${this.existingPresetName || ''} 복사본`;
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
			new Notice('프리셋 이름을 입력해주세요.');
			return;
		}
	
		if (!this.presetData.trim()) {
			new Notice('프리셋 데이터가 비어있습니다.');
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
			this.settingsManager.applyChanges();
			new Notice(`프리셋 "${saveName}"이(가) 저장되었습니다.`);
			
			if (this.refreshPresetList) {
				this.refreshPresetList();
			}
		} catch (error) {
			console.error('Failed to save preset:', error);
			new Notice(`프리셋 저장 실패: ${error instanceof Error ? error.message : String(error)}`);
		}
	}
}
