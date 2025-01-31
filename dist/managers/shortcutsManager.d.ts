import { BloxManager } from "./BloxManager";
import { DOMManager } from "./DOMManager";
import { HistoryManager } from "./HistoryManager";
import { TypingManager } from "./TypingManager";
export declare class ShortcutsManager {
    private DOMManager;
    private BloxManager;
    private TypingManager;
    private HistoryManager;
    private shortcutHandler;
    constructor(initialBloxManager?: BloxManager, initialDOMManager?: DOMManager, initialTypingManager?: TypingManager, initialHistoryManager?: HistoryManager);
    setDependencies(BloxManager: BloxManager, DOMManager: DOMManager, TypingManager: TypingManager, HistoryManager: HistoryManager): void;
    registerShortcuts(): void;
    unregisterShortcuts(): void;
}
