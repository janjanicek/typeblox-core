import { DOMManager } from "./DOMManager";
export declare class PasteManager {
    private DOMManager;
    constructor(DOMManager: DOMManager);
    pasteContent(e: ClipboardEvent): void;
}
