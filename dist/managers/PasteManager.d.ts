import { DOMManager } from "./DOMManager";
export declare class PasteManager {
    private DOMManager;
    constructor(initialDOMManager?: DOMManager);
    setDependencies(DOMManager: DOMManager): void;
    pasteContent(e: ClipboardEvent): void;
}
