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
interface UpdateProps {
    onChange: Function;
    blocks?: Blox[];
    calledFromEditor?: boolean;
    forceUpdate?: boolean;
}
export declare class BloxManager extends EventEmitter {
    private blocks;
    private lastUpdatedContent;
    private TypingManager;
    private StyleManager;
    private DOMManager;
    private PasteManager;
    private HistoryManager;
    private onChange;
    private wasHistoryOperation;
    constructor(onChange: Function);
    updateChange(onChange: Function): void;
    setDependencies(TypingManager: TypingManager, FormatManager: StyleManager, PasteManager: PasteManager, DOMManager: DOMManager, HistoryManager: HistoryManager): void;
    private areDependenciesSet;
    addBlockAfter(blockId: string, type: BlockType, content?: string, select?: boolean): string | null;
    addBlockBefore(blockId: string, type: BlockType, content?: string, select?: boolean): string | null;
    getBlockById(id: string | undefined): Blox | undefined;
    getBlox(): Blox[];
    setBlox(newBlox: Blox[], isHistoryOperation?: boolean): void;
    isAllSelected(): boolean;
    isAnySelected(): boolean;
    selectAllBlox(selectAll: boolean): void;
    isHistoryOperation(): boolean;
    private areBloxArraysEqual;
    update({ onChange, blocks, calledFromEditor, forceUpdate, }: UpdateProps): void;
    createBlox({ id, type, content, style, classes, attributes, }: CreateBloxParams): Blox | null;
    private registerEvents;
    removeById(blockId: string): boolean;
    moveBlock(blockId: string, newIndex: number): boolean;
    moveBlockUp(blockId: string): boolean;
    moveBlockDown(blockId: string): boolean;
    split(blockId: string): void;
    getPreviousBlock(blockId: string): Blox | null;
    getNextBlock(blockId: string): Blox | null;
    private canBeMerged;
    merge(blockId: string): void;
    sendUpdateEvent(): void;
    getCurrentBlock(): Blox | null;
}
export {};
