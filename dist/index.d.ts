declare global {
    interface Window {
        typebloxEditor?: Typeblox;
    }
}
import { detectedStyles, imageUploadFunction, onChangeFunction, Extension, BlockSettings, BlockType } from "./types";
import { EventEmitter } from "events";
import { Blox } from "./classes/Blox";
import { StyleManager } from "./managers/StyleManager";
import { HistoryManager } from "./managers/HistoryManager";
import { TypingManager } from "./managers/TypingManager";
import { DOMManager } from "./managers/DOMManager";
import { BloxManager } from "./managers/BloxManager";
import { PasteManager } from "./managers/PasteManager";
import { ExtensionsManager } from "./managers/ExtensionsManager";
import { LinkManager } from "./managers/LinkManager";
import { EditorManager } from "./managers/EditorManager";
export interface TypeBloxInitOptions {
    elementSelector?: string;
    HTMLString: string;
    onUpdate: onChangeFunction;
    onImageUpload?: imageUploadFunction;
    extensions?: Extension[] | null;
    blocks?: Record<BlockType, Partial<BlockSettings>>;
    editorContainer?: string;
}
declare class Typeblox extends EventEmitter {
    private HistoryManager;
    private TypingManager;
    private StyleManager;
    private DOMManager;
    private BloxManager;
    private PasteManager;
    private ExtensionsManager;
    private ShortcutsManager;
    private LinkManager;
    private EditorManager;
    onChange: onChangeFunction;
    onImageUpload: imageUploadFunction;
    private currentSelection;
    isSameSelection(newStart: number, newEnd: number): boolean;
    constructor();
    init(options: TypeBloxInitOptions): void;
    private updateBlockSettings;
    private registerAllExtensions;
    destroy(): void;
    selection(): TypingManager;
    style(): StyleManager;
    blox(): BloxManager;
    extensions(): ExtensionsManager;
    elements(): DOMManager;
    link(): LinkManager;
    paste(): PasteManager;
    history(): HistoryManager;
    editor(): EditorManager;
    getBlockById(id: string | undefined): Blox | undefined;
    getBlockElementById(id: string | undefined): HTMLElement | null;
    getSelectionStyle(): detectedStyles;
    unselect(element: HTMLElement | null, callBack?: () => void): void;
    select(range: Range, callBack?: () => void): void;
    private executeCallback;
    private handleSelectionChange;
    isStyle(style: string): boolean;
    getStyle(style: string): string;
    private detectSelection;
    private updateEditorContent;
}
export default Typeblox;
