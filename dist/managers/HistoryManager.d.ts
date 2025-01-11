export declare class HistoryManager {
    private undoStack;
    private redoStack;
    private maxHistorySize;
    constructor(maxHistorySize?: number);
    saveState(state: string): void;
    undo(currentState: string): string | null;
    redo(currentState: string): string | null;
}
