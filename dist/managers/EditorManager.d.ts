import { BloxManager } from "./BloxManager";
import { TypingManager } from "./TypingManager";
export declare class EditorManager {
    private BloxManager;
    private TypingManager;
    editorContainer: string | undefined;
    constructor(initialBloxManager?: BloxManager, initialTypingManager?: TypingManager, editorContainer?: string);
    setDependencies(BloxManager: BloxManager, TypingManager: TypingManager): void;
    createEditorContent(editorContainer: string | undefined): void;
    clearEditor: () => void;
    refresh: () => void;
}
