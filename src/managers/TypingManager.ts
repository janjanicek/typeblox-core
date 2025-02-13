import { isEmpty } from "../utils/elements";
import { CLASSES } from "../constants";

export class TypingManager {
  private lastRange: Range | null = null;

  public saveSelectionRange() {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return null; // No selection or cursor
    }

    const range = selection.getRangeAt(0); // Get the current selection range
    this.lastRange = range;
  }

  public restoreSelectionRange() {
    if (!this.lastRange) {
      return; // Nothing to restore
    }

    const selection = window.getSelection();
    if (!selection) {
      return;
    }
    selection.removeAllRanges();
    const range = document.createRange();
    range.setStart(this.lastRange.startContainer, this.lastRange.startOffset);
    range.setEnd(this.lastRange.endContainer, this.lastRange.endOffset);

    selection.addRange(range);
  }

  public mergeConsecutiveStyledElements(blockElement: HTMLElement): void {
    const childNodes = Array.from(blockElement.childNodes);
    const ignoreTags = ["LI"];

    let i = 0;
    while (i < childNodes.length - 1) {
      const currentNode = childNodes[i];
      const nextNode = childNodes[i + 1];

      // Ensure both nodes are elements
      if (
        currentNode.nodeType === Node.ELEMENT_NODE &&
        nextNode.nodeType === Node.ELEMENT_NODE
      ) {
        const currentElement = currentNode as HTMLElement;
        const nextElement = nextNode as HTMLElement;

        // Skip elements with tag names in the ignore list
        if (
          ignoreTags.includes(currentElement.tagName) ||
          ignoreTags.includes(nextElement.tagName)
        ) {
          i++;
          continue;
        }

        // Check if both elements have the same tag and style
        if (
          currentElement.tagName === nextElement.tagName &&
          currentElement.getAttribute("style") ===
            nextElement.getAttribute("style")
        ) {
          // Merge the text content of the two elements
          currentElement.textContent =
            (currentElement.textContent || "") +
            (nextElement.textContent || "");
          nextElement.remove();
          childNodes.splice(i + 1, 1);

          continue;
        }
      }
      i++;
    }
  }

  createSelectedElement(range?: Range): void {
    const selection = window.getSelection();
    if (!selection) return;

    let customRange = range || selection.getRangeAt(0); // Get current selection if no range is provided
    if (!customRange) return;

    const commonAncestor = customRange.commonAncestorContainer;

    if (
      commonAncestor.nodeType === Node.ELEMENT_NODE &&
      commonAncestor.nodeName === "UL"
    ) {
      const selectedNodes = Array.from(customRange.cloneContents().childNodes);

      selectedNodes.forEach((node) => {
        if (node.nodeName === "LI") {
          const wrapper = document.createElement("span");
          wrapper.className = CLASSES.selected;

          // Wrap the contents of the <li> item
          wrapper.appendChild(node.cloneNode(true));
          node.parentNode?.replaceChild(wrapper, node);
        }
      });
      return;
    }

    const wrapper = document.createElement("span");
    wrapper.className = CLASSES.selected;
    wrapper.appendChild(customRange.extractContents());
    customRange.insertNode(wrapper);
  }

  getSelectedElement(
    wrapper: Element | Document = document,
  ): HTMLElement | null {
    const selectionElement = wrapper.querySelector(
      `.${CLASSES.selected}`,
    ) as HTMLElement;
    return selectionElement;
  }

  getCursorElement() {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return null;
    }

    const range = selection.getRangeAt(0);
    const container = range.commonAncestorContainer;

    return container.nodeType === Node.TEXT_NODE
      ? container.parentElement
      : container;
  }

  getCursorElementBySelector(selector: string): HTMLElement | null {
    return (this.getCursorElement() as HTMLElement)?.closest(selector);
  }

  selectAllTextInSelectedElement(): void {
    let selectedElement = this.getSelectedElement();
    if (!selectedElement) {
      this.createSelectedElement();
      selectedElement = this.getSelectedElement();
    }

    if (!selectedElement) {
      console.warn("No .selected element found.");
      return;
    }

    // Create a new range
    const range = document.createRange();

    try {
      // Set the range to start at the beginning and end at the last character of the `.selected` element
      range.selectNodeContents(selectedElement);

      // Clear any existing selections
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(range);
      }
    } catch (error) {
      console.error("Error selecting text:", error);
    }
  }

  removeSelection(blockElement: HTMLElement | null) {
    if (!blockElement) return;

    const selectedElements = blockElement.querySelectorAll(
      `.${CLASSES.selected}`,
    );
    selectedElements.forEach((element) => {
      const parent = element.parentNode;

      if (element.innerHTML.trim() === "") {
        // remove empty selected element
        if (element.innerHTML === " ") {
          const spaceNode = document.createTextNode(" ");
          parent?.replaceChild(spaceNode, element);
        } else {
          // Otherwise, remove the empty selected element
          element.remove();
        }
        return;
      }

      while (element.firstChild) {
        parent?.insertBefore(element.firstChild, element);
      }
      parent?.removeChild(element);
    });

    this.mergeConsecutiveStyledElements(blockElement);
  }

  isCursorAtStart(container: HTMLElement): boolean {
    const selection = window.getSelection();

    if (!selection || selection.rangeCount === 0) {
      return false; // No selection or cursor available
    }

    const range = selection.getRangeAt(0);
    let startNode: Node | null = range.commonAncestorContainer;
    let startOffset = range.startOffset;

    if (container && !container.contains(startNode)) {
      return false; // Cursor is not inside the container
    }

    if (isEmpty(container)) {
      return true; // Empty container counts as "at the start"
    }

    const firstContentNode = container
      ? this.getFirstMeaningfulNode(container)
      : null;

    if (!firstContentNode) {
      return false; // No meaningful content found
    }

    // Handle cases where startNode is a block-level element (like <blockquote>)
    if (container) {
      const childNodes = Array.from(container.childNodes);

      // Check if the first child is a <br> and the cursor is after it
      const firstChild = childNodes[0];
      if (firstChild?.nodeName === "BR" && startOffset === 0) {
        return false; // Cursor is after the first <br>
      }

      // Check if the cursor is after the last <br>
      const lastChild = childNodes[childNodes.length - 1];
      if (lastChild?.nodeName === "BR" && startNode === lastChild) {
        return false; // Cursor is after the last <br>
      }
    }

    // Check if the cursor is at the very start of the first meaningful content
    return (
      (startNode === firstContentNode || startNode === container) &&
      startOffset === 0
    );
  }

  isCursorAtEnd(container: HTMLElement): boolean {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return false;

    const range = selection.getRangeAt(0);
    let endNode: Node | null = range.endContainer;
    let endOffset = range.endOffset;

    if (endNode.nodeType === Node.ELEMENT_NODE) {
      const lastTextNode = this.getLastMeaningfulNode(endNode as HTMLElement);
      if (lastTextNode) {
        endNode = lastTextNode;
        endOffset = lastTextNode.textContent?.length || 0;
      }
    }

    const lastNode = this.getLastMeaningfulNode(container);
    if (!lastNode) return false;

    return (
      endNode === lastNode && endOffset === (lastNode.textContent?.length || 0)
    );
  }

  getFirstMeaningfulNode(container: HTMLElement): Node | null {
    const walker = document.createTreeWalker(
      container,
      NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
      {
        acceptNode: (node) => {
          if (
            node.nodeType === Node.TEXT_NODE &&
            node.textContent?.trim() !== ""
          ) {
            return NodeFilter.FILTER_ACCEPT;
          }
          if (node.nodeType === Node.ELEMENT_NODE) {
            return NodeFilter.FILTER_SKIP; // Skip elements, but process their children
          }
          return NodeFilter.FILTER_REJECT;
        },
      },
    );

    let firstNode = walker.nextNode();

    while (firstNode?.nodeName === "BR") {
      firstNode = walker.nextNode();
    }

    return firstNode; // Return the first meaningful text node
  }

  getLastMeaningfulNode(container: HTMLElement): Node | null {
    if (!container) return null;
    const walker = document.createTreeWalker(
      container,
      NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
      {
        acceptNode: (node) => {
          if (
            node.nodeType === Node.TEXT_NODE &&
            node.textContent?.trim() !== ""
          ) {
            return NodeFilter.FILTER_ACCEPT;
          }
          if (node.nodeType === Node.ELEMENT_NODE) {
            return NodeFilter.FILTER_SKIP; // Skip elements, but process their children
          }
          return NodeFilter.FILTER_REJECT;
        },
      },
    );

    let lastNode: Node | null = null;
    while (walker.nextNode()) {
      lastNode = walker.currentNode;
    }

    return lastNode; // Return the last meaningful text node
  }

  public hasTextSelection(): boolean {
    const selection = window.getSelection();

    if (!selection || selection.rangeCount === 0) {
      return false; // No selection exists
    }

    const range = selection.getRangeAt(0);

    // Ensure selection is within an editable element
    if (!range || range.collapsed) {
      return false; // Selection is collapsed (cursor only)
    }

    // Check if the selected text contains at least one non-whitespace character
    const selectedText = range.toString().trim();
    return selectedText.length > 0;
  }
}
