// Credits go to Liam's Periodic Notes Plugin: https://github.com/liamcain/obsidian-periodic-notes

import { normalizePath, TAbstractFile, TFile, TFolder, Vault } from "obsidian";
import { TextInputSuggest } from "./suggest";
import type GoogleCalendarPlugin from './../../GoogleCalendarPlugin';

export function resolve_tfolder(folder_str: string): TFolder {
    folder_str = normalizePath(folder_str);
 
    const folder = app.vault.getAbstractFileByPath(folder_str);
    if (!folder || !(folder instanceof TFolder)) {
        return null
    }

    return folder;
}


export function get_tfiles_from_folder(folder_str: string): Array<TFile> {
    const folder = resolve_tfolder(folder_str);

    const files: Array<TFile> = [];
    Vault.recurseChildren(folder, (file: TAbstractFile) => {
        if (file instanceof TFile) {
            files.push(file);
        }
    });

    files.sort((a, b) => {
        return a.basename.localeCompare(b.basename);
    });

    return files;
}


export enum FileSuggestMode {
    TemplateFiles,
    ScriptFiles,
}

export class FileSuggest extends TextInputSuggest<TFile> {
    constructor(
        public inputEl: HTMLInputElement,
        private plugin: GoogleCalendarPlugin
    ) {
        super(inputEl);
    }

    getSuggestions(input_str: string): TFile[] {
        const templater  = normalizePath(this.plugin?.templaterPlugin?.settings?.templates_folder);
        //const core       = normalizePath(this.plugin?.coreTemplatePlugin?.instance?.options?.folder);
        const all_files = get_tfiles_from_folder(templater);
        if (!all_files) {
            return [];
        }

        const files: TFile[] = [];
        const lower_input_str = input_str.toLowerCase();

        all_files.forEach((file: TAbstractFile) => {
            if (
                file instanceof TFile &&
                file.extension === "md" &&
                file.path.toLowerCase().contains(lower_input_str)
            ) {
                files.push(file);
            }
        });

        return files;
    }

    renderSuggestion(file: TFile, el: HTMLElement): void {
        el.setText(file.path);
    }

    selectSuggestion(file: TFile): void {
        this.inputEl.value = file.path;
        this.inputEl.trigger("input");
        this.close();
    }
}