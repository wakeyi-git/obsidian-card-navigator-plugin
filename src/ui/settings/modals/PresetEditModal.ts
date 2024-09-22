import { App, Modal, Setting, Notice } from 'obsidian';
import CardNavigatorPlugin from '../../../main';
import { SettingsManager } from '../settingsManager';

export class PresetEditModal extends Modal {
    private presetName = '';
    private description = '';

    constructor(
        app: App,
        private plugin: CardNavigatorPlugin,
        private settingsManager: SettingsManager,
        private mode: 'create' | 'edit' | 'clone',
        private existingPresetName?: string
    ) {
        super(app);
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.createEl('h2', { text: this.getModalTitle() });

        new Setting(contentEl)
            .setName('프리셋 이름')
            .addText(text => text
                .setPlaceholder('프리셋 이름 입력')
                .setValue(this.getInitialPresetName())
                .onChange(value => this.presetName = value));

        new Setting(contentEl)
            .setName('설명')
            .addTextArea(text => text
                .setPlaceholder('프리셋 설명 입력 (선택사항)')
                .setValue(this.getInitialDescription())
                .onChange(value => this.description = value));

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

    private getInitialDescription(): string {
        if (this.mode === 'create') return '';
        const existingPreset = this.plugin.presetManager.getPreset(this.existingPresetName || '');
        return existingPreset?.description || '';
    }

    private async savePreset() {
        if (!this.presetName) {
            new Notice('프리셋 이름을 입력해주세요.');
            return;
        }

        const currentSettings = this.settingsManager.getCurrentSettings();
        
        try {
            switch (this.mode) {
                case 'create':
                    await this.plugin.presetManager.createPreset(this.presetName, currentSettings, this.description);
                    break;
                case 'edit':
                    if (this.existingPresetName) {
                        if (this.existingPresetName !== this.presetName) {
                            // 이름이 변경된 경우, 기존 프리셋 삭제 후 새로 생성
                            await this.plugin.presetManager.deletePreset(this.existingPresetName);
                            await this.plugin.presetManager.createPreset(this.presetName, currentSettings, this.description);
                        } else {
                            await this.plugin.presetManager.updatePreset(this.presetName, currentSettings, this.description);
                        }
                    }
                    break;
                case 'clone':
                    if (this.existingPresetName) {
                        await this.plugin.presetManager.clonePreset(this.existingPresetName, this.presetName);
                        await this.plugin.presetManager.updatePreset(this.presetName, currentSettings, this.description);
                    }
                    break;
            }
            this.close();
            this.settingsManager.applyChanges();
            new Notice(`프리셋 "${this.presetName}"이(가) 저장되었습니다.`);
        } catch (error) {
            console.error('Failed to save preset:', error);
            new Notice(`프리셋 저장 실패: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}
