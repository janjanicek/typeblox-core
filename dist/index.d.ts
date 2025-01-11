import { detectedStyles } from "./types";
import { EventEmitter } from "events";
import { Blox } from "./classes/Blox";
import { FormatManager } from "./managers/FormatManager";
import { TypingManager } from "./managers/TypingManager";
import { DOMManager } from "./managers/DOMManager";
import { PasteManager } from "./managers/PasteManager";
export interface TypeBloxInitOptions {
    elementSelector?: string;
    HTMLString: string;
    onUpdate: Function;
}
declare class Typeblox extends EventEmitter {
    private blocks;
    private HistoryManager;
    private TypingManager;
    private FormatManager;
    private DOMManager;
    private PasteManager;
    private currentStyles;
    onChange: Function;
    private currentSelection;
    isSameSelection(newStart: number, newEnd: number): boolean;
    constructor();
    private updateCurrentStyles;
    private parseHTMLToBlocks;
    init(options: TypeBloxInitOptions): void;
    destroy(): void;
    selection(): TypingManager;
    format(): FormatManager;
    DOM(): DOMManager;
    paste(): PasteManager;
    update(onChange: Function, providedBlocks?: Blox[], calledFromEditor?: false): void;
    getBlockById(id: string | undefined): Blox | undefined;
    getBlockElementById(id: string | undefined): HTMLElement | null;
    getBlocks(): Blox[];
    getSelectionStyle(): detectedStyles;
    getSelectionElement(): HTMLElement | null;
    unselect(element: HTMLElement | null, callBack?: () => void): void;
    select(range: Range, callBack?: () => void): void;
    private executeCallback;
    private handleSelectionChange;
    isStyle(style: string): boolean;
    getStyle(style: string): string;
    getCurrentBlock(): Blox | null;
    private detectSelection;
    private getCurrentDom;
    private saveHistory;
    private updateEditorContent;
    handleUndo: () => void;
    handleRedo: () => void;
    getSelectedBlock(): void;
}
export default Typeblox;
