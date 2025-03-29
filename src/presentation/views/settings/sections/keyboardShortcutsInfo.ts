import { Setting } from 'obsidian';
import { keyboardShortcuts, KeyboardShortcut } from '../../../../domain/models/types';
import { t } from 'i18next';

export function addKeyboardShortcutsInfo(containerEl: HTMLElement): void {

    containerEl.createEl('div', { cls: 'settings-section-margin' });

    new Setting(containerEl)
        .setName(t('KEYBOARD_SHORTCUTS'))
        .setHeading();

    new Setting(containerEl)
    .setDesc(t('KEYBOARD_SHORTCUTS_DESC'))

    const tableContainer = containerEl.createEl('div', { cls: 'keyboard-shortcuts-table-container' });
    const table = tableContainer.createEl('table', { cls: 'keyboard-shortcuts-table' });
    
    const thead = table.createEl('thead');
    const headerRow = thead.createEl('tr');
    headerRow.createEl('th', { text: t('COMMAND') });
    headerRow.createEl('th', { text: t('DESCRIPTION') });

    const tbody = table.createEl('tbody');
    keyboardShortcuts.forEach(({ name, description }: KeyboardShortcut) => {
        const row = tbody.createEl('tr');
        row.createEl('td', { text: t(name), cls: 'keyboard-shortcut-name' });
        row.createEl('td', { text: t(description), cls: 'keyboard-shortcut-description' });
    });

    const customizeNote = containerEl.createEl('p', { cls: 'keyboard-shortcuts-note' });
    customizeNote.setText(t('KEYBOARD_SHORTCUTS_CUSTOMIZE_NOTE'));

    const additionalNote = containerEl.createEl('p', { cls: 'keyboard-shortcuts-note' });
    additionalNote.setText(t('KEYBOARD_SHORTCUTS_ADDITIONAL_NOTE'));
}
