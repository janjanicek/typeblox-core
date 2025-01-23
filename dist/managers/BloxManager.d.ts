import { EventEmitter } from "../classes/EventEmitter";
import { Blox } from "../classes/Blox";
import { BlockType } from "../types";
import { StyleManager } from "./StyleManager";
import { PasteManager } from "./PasteManager";
import { TypingManager } from "./TypingManager";
import { DOMManager } from "./DOMManager";
import { HistoryManager } from "./HistoryManager";
interface CreateBloxParams {
    id?: string;
    type?: BlockType;
    content?: string;
    style?: string | null;
    classes?: string | null;
    attributes?: string | null;
}
export declare class BloxManager extends EventEmitter {
    private blocks;
    private TypingManager;
    private StyleManager;
    private DOMManager;
    private PasteManager;
    private HistoryManager;
    private onChange;
    private wasCreatedByUndo;
    constructor(onChange: Function);
    setDependencies(TypingManager: TypingManager, FormatManager: StyleManager, PasteManager: PasteManager, DOMManager: DOMManager, HistoryManager: HistoryManager, onChange: Function): void;
    private areDependenciesSet;
    addBlockAfter(blockId: string, type: BlockType, content?: string, select?: boolean): string | null;
    addBlockBefore(blockId: string, type: BlockType, content?: string, select?: boolean): string | null;
    getBlockById(id: string | undefined): Blox | undefined;
    getBlox(): Blox[];
    setBlox(newBlox: Blox[], isUndo?: boolean): void;
    isUndo(): boolean;
    private areBloxArraysEqual;
    update(onChange: Function, providedBlocks?: Blox[], calledFromEditor?: false): void;
    createBlox({ id, type, content, style, classes, attributes, }: CreateBloxParams): Blox | null;
    removeById(blockId: string): boolean;
    moveBlockUp(blockId: string): boolean;
    moveBlockDown(blockId: string): boolean;
    split(blockId: string): void;
    merge(blockId: string): void;
    getCurrentBlock(): Blox | null;
}
export {};
