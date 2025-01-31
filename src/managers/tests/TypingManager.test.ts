/**
 * @jest-environment jsdom
 */
import { TypingManager } from "../TypingManager"; // Adjust the import path
import { CLASSES } from "../../constants"; // Ensure this matches the correct file
import { DOMManager } from "../DOMManager";
import { BloxManager } from "../BloxManager";

describe("TypingManager", () => {
  let typingManager: TypingManager;
  let container: HTMLElement;
  let target: HTMLElement;
  let textNode: Text;

  beforeEach(() => {
    // Setup JSDOM environment
    document.body.innerHTML =
      '<div id="editor" contenteditable="true">Hello</div>';

    typingManager = new TypingManager();
    container = document.getElementById("editor")!;
    textNode = container.firstChild as Text;

    // Create an initial selection
    const range = document.createRange();
    range.setStart(textNode, 0);
    range.setEnd(textNode, 0);

    const selection = window.getSelection();
    selection!.removeAllRanges();
    selection!.addRange(range);

    jest.spyOn(window, "getSelection").mockReturnValue(selection);
  });

  test("should save and restore the selection range", () => {
    typingManager.saveSelectionRange();

    // Change selection
    const range = document.createRange();
    range.setStart(textNode, 2);
    range.setEnd(textNode, 2);
    window.getSelection()?.removeAllRanges();
    window.getSelection()?.addRange(range);

    // Restore selection
    typingManager.restoreSelectionRange();

    const restoredRange = window.getSelection()?.getRangeAt(0);
    expect(restoredRange?.startOffset).toBe(0);
    expect(restoredRange?.endOffset).toBe(0);
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

  test("should correctly detect cursor at start for complex elements", () => {
    document.body.innerHTML = `
      <ul id="editor" contenteditable="true">
        <li id="first">First</li>
        <li id="target">Second</li>
      </ul>`;
    const container = document.getElementById("editor")!;
    let target = document.getElementById("target")!;
    let textNode = target.firstChild as Text;

    // Place cursor at the start of the "Second" <li>
    const range = document.createRange();
    range.setStart(textNode, 0);
    range.setEnd(textNode, 0);
    window.getSelection()?.removeAllRanges();
    window.getSelection()?.addRange(range);

    // Cursor is not at the start of the container
    expect(typingManager.isCursorAtStart(container)).toBe(false);

    // Place cursor at the start of the "First" <li>
    target = document.getElementById("first")!;
    textNode = target.firstChild as Text;

    const rangeNew = document.createRange();
    rangeNew.setStart(textNode, 0);
    rangeNew.setEnd(textNode, 0);
    window.getSelection()?.removeAllRanges();
    window.getSelection()?.addRange(rangeNew);

    // Cursor is now at the start of the container
    expect(typingManager.isCursorAtStart(container)).toBe(true);
  });

  test("should correctly detect cursor at end", () => {
    const range = document.createRange();
    range.setStart(textNode, textNode.textContent!.length);
    range.setEnd(textNode, textNode.textContent!.length);
    window.getSelection()?.removeAllRanges();
    window.getSelection()?.addRange(range);

    expect(typingManager.isCursorAtEnd(container)).toBe(true);
  });

  test("should correctly detect cursor at end after focus", (done) => {
    const domManager = new DOMManager(
      new BloxManager(() => {}),
      new TypingManager(),
    );
    domManager.focusElement(container, true);

    setTimeout(() => {
      expect(typingManager.isCursorAtEnd(container)).toBe(true);
      done();
    }, 10);
  });

  test("should correctly detect cursor at end for complex elements", () => {
    document.body.innerHTML = `
      <ul id="editor" contenteditable="true">
        <li id="first">First</li>
        <li id="target">Second</li>
      </ul>`;
    const container = document.getElementById("editor")!;
    let target = document.getElementById("target")!;
    let textNode = target.firstChild as Text;

    // Place cursor at the start of the "Second" <li>
    const range = document.createRange();
    range.setStart(textNode, 0);
    range.setEnd(textNode, 0);
    window.getSelection()?.removeAllRanges();
    window.getSelection()?.addRange(range);

    // Cursor is not at the start of the container
    expect(typingManager.isCursorAtEnd(container)).toBe(false);

    range.setStart(textNode, 6);
    range.setEnd(textNode, 6);
    window.getSelection()?.removeAllRanges();
    window.getSelection()?.addRange(range);

    expect(typingManager.isCursorAtEnd(container)).toBe(true);

    // Place cursor at the start of the "First" <li>
    target = document.getElementById("first")!;
    textNode = target.firstChild as Text;

    const rangeNew = document.createRange();
    rangeNew.setStart(textNode, 5);
    rangeNew.setEnd(textNode, 5);
    window.getSelection()?.removeAllRanges();
    window.getSelection()?.addRange(rangeNew);

    expect(typingManager.isCursorAtEnd(container)).toBe(false);
  });

  test("should merge consecutive styled elements", () => {
    container.innerHTML = `<span style="color: red;">Hello</span><span style="color: red;"> World</span>`;
    typingManager.mergeConsecutiveStyledElements(container);

    expect(container.innerHTML).toBe(
      '<span style="color: red;">Hello World</span>',
    );
  });

  test("should create a selected element", () => {
    typingManager.createSelectedElement();

    const selectedElement = typingManager.getSelectedElement();
    expect(selectedElement).not.toBeNull();
    expect(selectedElement?.classList.contains(CLASSES.selected)).toBe(true);
  });

  test("should remove selection from block", () => {
    container.innerHTML = `<span class="${CLASSES.selected}">Selected Text</span>`;
    typingManager.removeSelection(container);

    expect(container.querySelector(`.${CLASSES.selected}`)).toBeNull();
  });

  test("should return null if no selected element exists", () => {
    expect(typingManager.getSelectedElement()).toBeNull();
  });

  test("should select all text in selected element", () => {
    container.innerHTML = `<span class="${CLASSES.selected}">Selected Text</span>`;
    typingManager.selectAllTextInSelectedElement();

    const selection = window.getSelection();
    expect(selection?.toString()).toBe("Selected Text");
  });

  test("should return cursor element", () => {
    const cursorElement = typingManager.getCursorElement();
    expect(cursorElement).toBe(container);
  });

  test("should return the first meaningful text node", () => {
    document.body.innerHTML = `
      <div id="editor" contenteditable="true">
        <p></p>
        <span> </span>
        <p>First meaningful text</p>
        <p>Second</p>
      </div>`;

    const container = document.getElementById("editor")!;
    const firstTextNode = typingManager.getFirstMeaningfulNode(container);

    expect(firstTextNode).not.toBeNull();
    expect(firstTextNode?.nodeType).toBe(Node.TEXT_NODE);
    expect(firstTextNode?.textContent).toBe("First meaningful text");
  });

  test("should return null if container has no meaningful text", () => {
    document.body.innerHTML = `<div id="editor" contenteditable="true"><p></p><span> </span></div>`;

    const container = document.getElementById("editor")!;
    const firstTextNode = typingManager.getFirstMeaningfulNode(container);

    expect(firstTextNode).toBeNull();
  });

  test("should return the last meaningful text node", () => {
    document.body.innerHTML = `
      <div id="editor" contenteditable="true">
        <p>First</p>
        <p>Second meaningful text</p>
        <p></p>
      </div>`;

    const container = document.getElementById("editor")!;
    const lastTextNode = typingManager.getLastMeaningfulNode(container);

    expect(lastTextNode).not.toBeNull();
    expect(lastTextNode?.nodeType).toBe(Node.TEXT_NODE);
    expect(lastTextNode?.textContent).toBe("Second meaningful text");
  });

  test("should ignore <br>", () => {
    document.body.innerHTML = `
      <div id="editor" contenteditable="true">
        <p>First</p>
        <p>Second meaningful text</p>
        <p></p>
        <br />
      </div>`;

    const container = document.getElementById("editor")!;
    const lastTextNode = typingManager.getLastMeaningfulNode(container);

    expect(lastTextNode).not.toBeNull();
    expect(lastTextNode?.nodeType).toBe(Node.TEXT_NODE);
    expect(lastTextNode?.textContent).toBe("Second meaningful text");
  });

  test("should return null if no meaningful text exists", () => {
    document.body.innerHTML = `<div id="editor" contenteditable="true"><p></p><span> </span></div>`;

    const container = document.getElementById("editor")!;
    const lastTextNode = typingManager.getLastMeaningfulNode(container);

    expect(lastTextNode).toBeNull();
  });
});
