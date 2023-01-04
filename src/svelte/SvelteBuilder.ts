import { MarkdownRenderChild } from "obsidian";

import type { SvelteComponent } from "svelte";

//Helper class to create the svelte component as a MarkdownRenderChild to add life cycle back to components
export class SvelteBuilder extends MarkdownRenderChild {

    comp: SvelteComponent;
    a: any;
    b: any;
    constructor(a: any, containerEl: HTMLElement, b: any) {
        super(containerEl)
        this.a = a;
        this.b = b;
    }

    load(): void {
        this.comp = new this.a({
            target: this.containerEl,
            props: this.b,
        });
    }

    unload(): void {
        this.comp.$destroy();
    }

}