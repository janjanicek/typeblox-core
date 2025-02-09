import { EventEmitter } from "../classes/EventEmitter";
import { EVENTS } from "../constants";
export class HistoryManager extends EventEmitter {
    constructor(maxHistorySize = 100, initialDOMManager) {
        super();
        this.undoStack = [];
        this.redoStack = [];
        this.DOMManager = null;
        this.maxHistorySize = maxHistorySize;
        if (initialDOMManager)
            this.DOMManager = initialDOMManager;
    }
    setDependencies(DOMManager) {
        this.DOMManager = DOMManager;
    }
    isUndoAvailable() {
        return this.undoStack.length > 0;
    }
    isRedoAvailable() {
        return this.redoStack.length > 0;
    }
    // Save the current state to the undo stack
    saveState(state) {
        var _a;
        const currentState = state !== null && state !== void 0 ? state : (_a = this.DOMManager) === null || _a === void 0 ? void 0 : _a.getCurrentDOM();
        const lastState = this.undoStack[this.undoStack.length - 1];
        if (!currentState || currentState === lastState)
            return;
        if (this.undoStack.length >= this.maxHistorySize) {
            this.undoStack.shift(); // Remove the oldest state if max size is exceeded
        }
        this.undoStack.push(currentState);
        this.redoStack = []; // Clear the redo stack on a new change
    }
    // Undo: Move the current state to the redo stack and return the previous state
    undo(state) {
        var _a;
        const currentState = state !== null && state !== void 0 ? state : (_a = this.DOMManager) === null || _a === void 0 ? void 0 : _a.getCurrentDOM();
        if (this.undoStack.length === 0 || !currentState)
            return null;
        let lastState = this.undoStack.pop();
        // If lastState is the same as currentDOM, pop the next state as well
        if (lastState === currentState && this.undoStack.length > 0) {
            lastState = this.undoStack.pop();
        }
        this.redoStack.push(currentState);
        if (lastState)
            this.emit(EVENTS.historyChange, lastState, true);
        return lastState;
    }
    // Redo: Move the last redo state to the undo stack and return it
    redo() {
        var _a;
        if (this.redoStack.length === 0)
            return null;
        const nextState = this.redoStack.pop();
        const currentState = (_a = this.DOMManager) === null || _a === void 0 ? void 0 : _a.getCurrentDOM();
        this.undoStack.push(currentState !== null && currentState !== void 0 ? currentState : nextState);
        if (nextState)
            this.emit(EVENTS.historyChange, nextState, false);
        return nextState;
    }
}
