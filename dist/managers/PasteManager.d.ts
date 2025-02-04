import { BloxManager } from "./BloxManager";
import { DOMManager } from "./DOMManager";
export declare class PasteManager {
    private DOMManager;
    private BloxManager;
    constructor(initialDOMManager?: DOMManager, initialBloxManager?: BloxManager);
    setDependencies(DOMManager: DOMManager, BloxManager: BloxManager): void;
    pasteContent(e: ClipboardEvent): void;
}
