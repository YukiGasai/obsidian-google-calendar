import { App, Editor, EditorPosition, EditorSuggest, EditorSuggestContext, EditorSuggestTriggerInfo } from "obsidian";
import { GoogleEventSuggestionList } from './GoogleEventSuggestionList';

export class TemplateSuggest extends EditorSuggest<string>{

    constructor(app: App) {
        super(app);
    }

    onTrigger(cursor: EditorPosition, editor: Editor): EditorSuggestTriggerInfo {
        const sub = editor.getLine(cursor.line).substring(0, cursor.ch);
        const match = sub.match(/{{gEvent(\d)?(\S+$)/);
        if (match) {

            let extraOffSet = "{{gEvent".length;
            if (match[1]) {
                extraOffSet++;
            }

            return {
                end: cursor,
                start: {
                    ch: match.index + extraOffSet,
                    line: cursor.line,
                },
                query: match[2],
            };
        }
    }

    //https://github.com/aidenlx/obsidian-icon-shortcodes/blob/a33c33ca019ed0580f2301907d5f50b84b999c33/src/modules/suggester.ts#L49-L60
    getSuggestions(context: EditorSuggestContext): string[] | Promise<string[]> {
        return GoogleEventSuggestionList.filter((option) => {
            return context.query === option.substring(0, context.query.length);
        });
    }

    renderSuggestion(value: string, el: HTMLElement): void {
        el.createEl("span", {
            text: value,
            cls: "suggestionText"
        })
    }

    selectSuggestion(value: string): void {
        if (!this.context) return;

        const { editor } = this.context;

        editor.replaceRange(value, this.context.start, this.context.end);

        const remainingOptions = GoogleEventSuggestionList.filter((option) => {
            return option.startsWith(`${value}.`);
        });

        if (remainingOptions.length == 0) {
            const oldCursor = editor.getCursor();

            const newCursor: EditorPosition = structuredClone(oldCursor);
            newCursor.ch += 2;

            if (editor.getLine(newCursor.line).length < newCursor.ch ||
                editor.getRange(oldCursor, newCursor) != "}}") {
                editor.replaceRange("}}", oldCursor)
            }

            editor.setCursor(newCursor);

        }
    }
}