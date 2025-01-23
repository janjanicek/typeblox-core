export class HistoryManager {
    constructor(maxHistorySize = 100) {
        this.undoStack = [];
        this.redoStack = [];
        this.maxHistorySize = maxHistorySize;
    }
    // Save the current state to the undo stack
    saveState(state) {
        const lastState = this.undoStack[this.undoStack.length - 1];
        if (state === lastState)
            return;
        if (this.undoStack.length >= this.maxHistorySize) {
            this.undoStack.shift(); // Remove the oldest state if max size is exceeded
        }
        this.undoStack.push(state);
        this.redoStack = []; // Clear the redo stack on a new change
    }
    // Undo: Move the current state to the redo stack and return the previous state
    undo(currentState) {
        if (this.undoStack.length === 0)
            return null;
        const lastState = this.undoStack.pop();
        this.redoStack.push(currentState);
        return lastState;
    }
    // Redo: Move the last redo state to the undo stack and return it
    redo() {
        if (this.redoStack.length === 0)
            return null;
        const nextState = this.redoStack.pop();
        this.undoStack.push(nextState);
        return nextState;
    }
}
