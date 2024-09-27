// Credits go to Liam's Periodic Notes Plugin: https://github.com/liamcain/obsidian-periodic-notes

import { App, TAbstractFile, TFolder } from "obsidian";
import { TextInputSuggest } from "./suggest";

export class FolderSuggest extends TextInputSuggest<TFolder> {
    onBlur: () => void;
    containerEl: HTMLElement;

    constructor(
        protected app: App,
        public inputEl: HTMLInputElement,
        onBlur?: () => void
    ) {
        super(app, inputEl);
        this.onBlur = onBlur || (() => {});
        this.containerEl = createDiv('suggestion-container');
        
        // 입력 요소에 blur 이벤트 리스너 추가
        this.inputEl.addEventListener('blur', () => {
            setTimeout(() => {
                if (!this.containerEl.contains(document.activeElement)) {
                    this.onBlur();
                }
            }, 100);
        });
    }

    getSuggestions(inputStr: string): TFolder[] {
        const abstractFiles = this.app.vault.getAllLoadedFiles();
        const folders: TFolder[] = [];
        const lowerCaseInputStr = inputStr.toLowerCase();

        abstractFiles.forEach((folder: TAbstractFile) => {
            if (
                folder instanceof TFolder &&
                folder.path.toLowerCase().contains(lowerCaseInputStr)
            ) {
                folders.push(folder);
            }
        });

        return folders.slice(0, 1000);
    }

    renderSuggestion(file: TFolder, el: HTMLElement): void {
        el.setText(file.path);
    }

    selectSuggestion(file: TFolder): void {
        this.inputEl.value = file.path;
        this.inputEl.trigger("input");
        this.close();
    }
}
