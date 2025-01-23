import { HistoryManager } from "../HistoryManager";

describe("HistoryManager", () => {
  let historyManager: HistoryManager;

  beforeEach(() => {
    historyManager = new HistoryManager(3); // Example maxHistorySize = 3
  });

  describe("saveState", () => {
    it("should save a new state to the undo stack", () => {
      historyManager.saveState("state1");
      expect(historyManager["undoStack"]).toEqual(["state1"]);
    });

    it("should not save duplicate consecutive states", () => {
      historyManager.saveState("state1");
      historyManager.saveState("state1");
      expect(historyManager["undoStack"]).toEqual(["state1"]);
    });

    it("should clear the redo stack when saving a new state", () => {
      historyManager.saveState("state1");
      historyManager.undo("currentState");
      expect(historyManager["redoStack"]).toEqual(["currentState"]);

      historyManager.saveState("state2");
      expect(historyManager["redoStack"]).toEqual([]); // Redo stack is cleared
    });

    it("should maintain a maximum history size", () => {
      historyManager.saveState("state1");
      historyManager.saveState("state2");
      historyManager.saveState("state3");
      historyManager.saveState("state4"); // Exceeds max size

      expect(historyManager["undoStack"]).toEqual([
        "state2",
        "state3",
        "state4",
      ]);
    });
  });

  describe("undo", () => {
    it("should move the current state to the redo stack and return the previous state", () => {
      historyManager.saveState("state1");
      historyManager.saveState("state2");

      const undoneState = historyManager.undo("currentState");
      expect(undoneState).toBe("state2");
      expect(historyManager["undoStack"]).toEqual(["state1"]);
      expect(historyManager["redoStack"]).toEqual(["currentState"]);
    });

    it("should return null if the undo stack is empty", () => {
      const undoneState = historyManager.undo("currentState");
      expect(undoneState).toBeNull();
    });
  });

  describe("redo", () => {
    it("should move the last redo state to the undo stack and return it", () => {
      historyManager.saveState("state1");
      historyManager.saveState("state2");

      // Perform undo to populate redoStack
      const undoneState = historyManager.undo("state3");
      expect(undoneState).toBe("state2");
      expect(historyManager["undoStack"]).toEqual(["state1"]);
      expect(historyManager["redoStack"]).toEqual(["state3"]);

      // Perform redo
      const redoneState = historyManager.redo();
      expect(redoneState).toBe("state3");
      expect(historyManager["undoStack"]).toEqual(["state1", "state3"]);
      expect(historyManager["redoStack"]).toEqual([]);
    });

    it("should return null if the redo stack is empty", () => {
      const redoneState = historyManager.redo();
      expect(redoneState).toBeNull();
    });
  });
});
