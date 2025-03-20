/**
 * @jest-environment jsdom
 */
import { TypingManager } from "../TypingManager"; // Adjust the import path
import { DOMManager } from "../DOMManager";

describe("TypingManager", () => {
  let typingManager: TypingManager;
  let domManager: DOMManager;
  let container: HTMLElement;
  let textNode: Text;

  beforeEach(() => {
    // Setup JSDOM environment
    document.body.innerHTML =
      '<div id="editor" contenteditable="true" data-typeblox-id="1">Hello</div>';

    typingManager = new TypingManager();
    domManager = new DOMManager();
    typingManager.setDependencies(domManager);
    jest
      .spyOn(domManager, "getBlockElement")
      .mockReturnValue(document.getElementById("editor"));

    container = document.getElementById("editor")!;
    textNode = container.firstChild as Text;

    // Create an initial selection
    const range = document.createRange();
    range.setStart(textNode, 0);
    range.setEnd(textNode, 1);

    const selection = window.getSelection();
    selection!.removeAllRanges();
    selection!.addRange(range);

    jest.spyOn(window, "getSelection").mockReturnValue(selection);
  });

  test("should save and restore selection correctly", () => {
    typingManager.saveSelection();

    // Ensure selection data is saved correctly
    expect(typingManager.lastSelectionData).toEqual({
      blockElementId: container.dataset.typebloxId,
      isCursorOnly: false,
      startOffset: 0,
      endOffset: 1,
    });

    // Change selection
    const range = document.createRange();
    range.setStart(textNode, 2);
    range.setEnd(textNode, 2);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);

    // Restore selection
    typingManager.restoreSelection();

    // Verify if selection is restored by checking the offset manually
    const restoredSelection = window.getSelection();
    const restoredRange = restoredSelection?.getRangeAt(0);

    expect(restoredRange?.startContainer).toBe(textNode);
    expect(restoredRange?.startOffset).toBe(0);
    expect(restoredRange?.endOffset).toBe(1);
  });

  test("should save and restore cursor position correctly", () => {
    document.body.innerHTML = `<div data-typeblox-id="test-block">Hello World</div>`;
    
    const container = document.querySelector("[data-typeblox-id='test-block']") as HTMLElement;

    jest.spyOn(domManager, "getBlockElement").mockReturnValue(container);
  
    const textNode = container.firstChild as Text;
  
    // Place cursor at offset 5 (between "Hello" and " World")
    const range = document.createRange();
    range.setStart(textNode, 5);
    range.collapse(true);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);

    jest.spyOn(window, "getSelection").mockReturnValue(selection);
  
    // Save cursor position
    typingManager.saveSelection();
  
    // Verify selection data is actually stored
    expect(typingManager.lastSelectionData).not.toBeNull();
    expect(typingManager.lastSelectionData).toEqual({
      blockElementId: "test-block",
      isCursorOnly: true,
      startOffset: 5,
      endOffset: 5, // Length should be zero for collapsed cursor
    });
  
    // Restore selection
    typingManager.restoreSelection();
  
    // Verify if selection is restored by checking the offset manually
    const restoredSelection = window.getSelection();
    const restoredRange = restoredSelection?.getRangeAt(0);
  
    expect(restoredRange).not.toBeNull(); // Ensure a range exists
    expect(restoredRange?.startContainer).toBe(textNode);
    expect(restoredRange?.startOffset).toBe(5);
    expect(restoredRange?.collapsed).toBe(true); // Ensures it's a cursor, not a selection
  });  
  
  test("should correctly detect cursor at start", () => {
    expect(typingManager.isCursorAtStart(container)).toBe(true);

    // Move cursor
    const range = document.createRange();
    range.setStart(textNode, 2);
    range.setEnd(textNode, 2);
    window.getSelection()?.removeAllRanges();
    window.getSelection()?.addRange(range);

    expect(typingManager.isCursorAtStart(container)).toBe(false);
  });

  test("should correctly restore selection using offsets", () => {
    typingManager.saveSelection();

    if (typingManager.lastSelectionData) {
      const { blockElementId, startOffset, endOffset } =
        typingManager.lastSelectionData;
      expect(blockElementId).not.toBeNull();
      expect(startOffset).toBe(0);
      expect(endOffset).toBeGreaterThan(0);
    }

    // Change content to simulate an update
    container.innerHTML = "Hello, world!";
    typingManager.restoreSelection();

    const restoredRange = window.getSelection()?.getRangeAt(0);
    expect(restoredRange?.startOffset).toBe(0);
  });

  test("should merge consecutive styled elements", () => {
    container.innerHTML = `<span style="color: red;">Hello</span><span style="color: red;"> World</span>`;
    typingManager.mergeConsecutiveStyledElements(container);

    expect(container.innerHTML).toBe(
      '<span style="color: red;">Hello World</span>',
    );
  });

  test("should correctly detect cursor at end", () => {
    const range = document.createRange();
    range.setStart(textNode, textNode.textContent!.length);
    range.setEnd(textNode, textNode.textContent!.length);
    window.getSelection()?.removeAllRanges();
    window.getSelection()?.addRange(range);

    expect(typingManager.isCursorAtEnd(container)).toBe(true);
  });

  test("should remove selection from block", () => {
    // Create and set up the range for selection
    const range = document.createRange();
    range.setStart(textNode, 0);
    range.setEnd(textNode, textNode.textContent!.length);
  
    // Set the selection
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
  
    // Ensure selection is initially present
    expect(selection?.rangeCount).toBe(1);
  
    // Execute the removal function
    typingManager.removeSelection();
  
    // Check if the selection is removed
    expect(selection?.rangeCount).toBe(0);
  });
  

  test("should correctly detect if text is selected", () => {
    const range = document.createRange();
    range.setStart(textNode, 0);
    range.setEnd(textNode, textNode.textContent!.length);
    window.getSelection()?.removeAllRanges();
    window.getSelection()?.addRange(range);

    expect(typingManager.hasTextSelection()).toBe(true);
  });
});
