import { Setting } from 'obsidian';
import { t } from 'i18next';
import { keyboardShortcuts } from '../../common/types';

export function addKeyboardShortcutsInfo(containerEl: HTMLElement): void {
    new Setting(containerEl)
        .setName(t('Keyboard shortcuts'))
        .setHeading();

    const shortcutDesc = containerEl.createEl('p', { cls: 'keyboard-shortcuts-description' });
    shortcutDesc.setText(t('Card Navigator provides the following features that can be assigned keyboard shortcuts. You can set these up in Obsidian\'s Hotkeys settings:'));

    const tableContainer = containerEl.createEl('div', { cls: 'keyboard-shortcuts-table-container' });
    const table = tableContainer.createEl('table', { cls: 'keyboard-shortcuts-table' });
    
    const thead = table.createEl('thead');
    const headerRow = thead.createEl('tr');
    headerRow.createEl('th', { text: t('Command') });
    headerRow.createEl('th', { text: t('Description') });

    const tbody = table.createEl('tbody');
    keyboardShortcuts.forEach(({ name, description }) => {
        const row = tbody.createEl('tr');
        row.createEl('td', { text: t(name), cls: 'keyboard-shortcut-name' });
        row.createEl('td', { text: t(description), cls: 'keyboard-shortcut-description' });
    });

    const customizeNote = containerEl.createEl('p', { cls: 'keyboard-shortcuts-note' });
    customizeNote.setText(t('To set up shortcuts for these actions, go to Settings → Hotkeys and search for "Card Navigator". You can then assign your preferred key combinations for each action.'));

    const additionalNote = containerEl.createEl('p', { cls: 'keyboard-shortcuts-note' });
    additionalNote.setText(t('Note: Some shortcuts like arrow keys for navigation and Enter for opening cards are built-in and cannot be customized.'));
}
