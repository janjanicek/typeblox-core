import { EventEmitter } from "../classes/EventEmitter";
import { DOMManager } from "./DOMManager";
export declare class HistoryManager extends EventEmitter {
    private undoStack;
    private redoStack;
    private maxHistorySize;
    private DOMManager;
    constructor(maxHistorySize?: number, initialDOMManager?: DOMManager);
    setDependencies(DOMManager: DOMManager): void;
    isUndoAvailable(): boolean;
    isRedoAvailable(): boolean;
    saveState(state?: string): void;
    undo(state?: string): string | null;
    redo(): string | null;
}
