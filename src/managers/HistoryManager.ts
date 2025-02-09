import { EventEmitter } from "../classes/EventEmitter";
import { EVENTS } from "../constants";
import { DOMManager } from "./DOMManager";

export class HistoryManager extends EventEmitter {
  private undoStack: string[] = [];
  private redoStack: string[] = [];
  private maxHistorySize: number;
  private DOMManager: DOMManager | null = null;

  constructor(maxHistorySize: number = 100, initialDOMManager?: DOMManager) {
    super();
    this.maxHistorySize = maxHistorySize;
    if (initialDOMManager) this.DOMManager = initialDOMManager;
  }

  setDependencies(DOMManager: DOMManager) {
    this.DOMManager = DOMManager;
  }

  isUndoAvailable() {
    return this.undoStack.length > 0;
  }

  isRedoAvailable() {
    return this.redoStack.length > 0;
  }

  // Save the current state to the undo stack
  saveState(state?: string) {
    const currentState = state ?? this.DOMManager?.getCurrentDOM();
    const lastState = this.undoStack[this.undoStack.length - 1];

    if (!currentState || currentState === lastState) return;
    if (this.undoStack.length >= this.maxHistorySize) {
      this.undoStack.shift(); // Remove the oldest state if max size is exceeded
    }
    this.undoStack.push(currentState);
    this.redoStack = []; // Clear the redo stack on a new change
  }

  // Undo: Move the current state to the redo stack and return the previous state
  undo(state?: string): string | null {
    const currentState = state ?? this.DOMManager?.getCurrentDOM();
    if (this.undoStack.length === 0 || !currentState) return null;

    let lastState = this.undoStack.pop()!;

    // If lastState is the same as currentDOM, pop the next state as well
    if (lastState === currentState && this.undoStack.length > 0) {
      lastState = this.undoStack.pop()!;
    }

    this.redoStack.push(currentState);
    if (lastState) this.emit(EVENTS.historyChange, lastState, true);

    return lastState;
  }

  // Redo: Move the last redo state to the undo stack and return it
  redo(): string | null {
    if (this.redoStack.length === 0) return null;

    const nextState = this.redoStack.pop()!;
    const currentState = this.DOMManager?.getCurrentDOM();
    this.undoStack.push(currentState ?? nextState);

    if (nextState) this.emit(EVENTS.historyChange, nextState, false);

    return nextState;
  }
}
