// Credits go to Liam's Periodic Notes Plugin: https://github.com/liamcain/obsidian-periodic-notes

import { App, TAbstractFile, TFile } from "obsidian";
import { TextInputSuggest } from "./suggest";
import { get_tfiles_from_folder } from "./Utils";
import CardNavigatorPlugin from "main";
import { errorWrapperSync } from "./Error";
import * as path from 'path';

export enum FileSuggestMode {
    PresetsFiles,
}

export class PresetSuggest extends TextInputSuggest<TFile> {
    constructor(
        protected app: App,
        public inputEl: HTMLInputElement,
        private plugin: CardNavigatorPlugin,
        private mode: FileSuggestMode
    ) {
        super(app, inputEl);
    }

    get_folder(mode: FileSuggestMode): string {
        switch (mode) {
            case FileSuggestMode.PresetsFiles:
                return this.plugin.settings.presetFolderPath;
        }
    }

    get_error_msg(mode: FileSuggestMode): string {
        switch (mode) {
            case FileSuggestMode.PresetsFiles:
                return `Presets folder doesn't exist`;
        }
    }

    getSuggestions(input_str: string): TFile[] {
        const all_files = errorWrapperSync(
            () => get_tfiles_from_folder(this.app, this.get_folder(this.mode)),
            this.get_error_msg(this.mode)
        );
        if (!all_files) {
            return [];
        }

        const files: TFile[] = [];
        const lower_input_str = input_str.toLowerCase();

        all_files.forEach((file: TAbstractFile) => {
            if (
                file instanceof TFile &&
                file.extension === "json" &&
                file.path.toLowerCase().includes(lower_input_str)
            ) {
                files.push(file);
            }
        });

        return files.slice(0, 1000);
    }

    renderSuggestion(file: TFile, el: HTMLElement): void {
        const presetName = path.basename(file.path, '.json');
        el.setText(presetName);
    }

    selectSuggestion(file: TFile): void {
        const presetName = path.basename(file.path, '.json');
        this.inputEl.value = presetName;
        this.inputEl.trigger("input");
        this.close();
    }
}
