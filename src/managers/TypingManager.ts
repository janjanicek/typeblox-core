import { isEmpty } from "../utils/elements";
import { CLASSES } from "../constants";
import { DOMManager } from "./DOMManager";

export class TypingManager {
  private DOMManager: DOMManager | null = null;

  public lastSelectionData: {
    blockElementId: string | undefined;
    startOffset: number;
    endOffset: number;
    isCursorOnly: boolean;
    // Additional properties for more robust selection restoration
    startPath?: number[];
    endPath?: number[];
    startNodeOffset?: number;
    endNodeOffset?: number;
  } | null = null;

  setDependencies(DOMManager: DOMManager) {
    this.DOMManager = DOMManager;
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

  removeSelection() {
    const selection = window.getSelection();
    if (selection && !selection.isCollapsed) {
      selection.removeAllRanges(); // Ensure the selection is fully cleared
    }
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

  public getSelectedElement(): Element | null {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return null;
    const range = selection.getRangeAt(0);
  
    // Determine the block container (assumed to have a data attribute, e.g. data-typeblox-editor)
    const commonAncestor = range.commonAncestorContainer;
    let blockContainer: HTMLElement | null = null;
    if (commonAncestor instanceof HTMLElement) {
      blockContainer = commonAncestor.closest("[data-typeblox-editor]");
    } else if (commonAncestor.parentElement) {
      blockContainer = commonAncestor.parentElement.closest(
        "[data-typeblox-editor]",
      );
    }
  
    // Build the chain of parent elements for the start container.
    const getParentChain = (node: Node): HTMLElement[] => {
      const chain: HTMLElement[] = [];
      while (node) {
        if (node instanceof HTMLElement) {
          chain.push(node);
        }
        node = node.parentNode!;
      }
      return chain;
    };

    const startChain = getParentChain(range.startContainer);
    const endChain = getParentChain(range.endContainer);

    // Find the lowest common ancestor (LCA) between start and end chains.
    let lca: HTMLElement | null = null;
    for (const el of startChain) {
      if (endChain.includes(el)) {
        lca = el;
        break;
      }
    }
    if (!lca) return null;

    // If the LCA is the block container, we may be too high.
    // In that case, we want to return the immediate child of the block that is on the start chain.
    if (blockContainer && lca === blockContainer) {
      // Find the element in the start chain whose parent is the block container.
      const candidate = startChain.find(
        (el) => el.parentElement === blockContainer,
      );
      if (candidate) {

        return candidate;
      }
    }

  
    return lca;
  }

  /**
   * Saves the current selection state.
   * This method captures the current selection and stores information about it
   * for later restoration, including the block element ID, character offsets,
   * and whether it's a cursor-only selection.
   *
   * It also stores DOM path information to handle cases where the DOM structure
   * changes between saving and restoring the selection.
   */
  public saveSelection() {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      console.warn("[TypingManager] No selection found.");
      return;
    }

    const range = selection.getRangeAt(0);
    const blockElement = this.DOMManager?.getBlockElement();
    if (!blockElement) {
      console.warn("[TypingManager] No valid block element found.");
      return;
    }

    // Clone the range and select the full content of the block.
    const preSelectionRange = range.cloneRange();
    preSelectionRange.selectNodeContents(blockElement);
    preSelectionRange.setEnd(range.startContainer, range.startOffset);

    // Compute global offsets: startOffset is the length of the text before the selection,
    // and endOffset is startOffset plus the length of the selected text.
    const startOffset = preSelectionRange.toString().length;
    const endOffset = startOffset + range.toString().length;

    // Get DOM paths for more robust selection restoration
    const startPath = this.getNodePath(range.startContainer, blockElement);
    const endPath = range.collapsed
      ? startPath
      : this.getNodePath(range.endContainer, blockElement);

    this.lastSelectionData = {
      blockElementId: blockElement.dataset.typebloxId || undefined,
      startOffset,
      endOffset,
      isCursorOnly: range.collapsed,
      startPath,
      endPath,
      startNodeOffset: range.startOffset,
      endNodeOffset: range.endOffset,
    };
  }

  /**
   * Restores a previously saved selection.
   * This method attempts to restore the selection using multiple strategies:
   * 1. First tries to use DOM paths (most accurate when DOM structure is preserved)
   * 2. Falls back to character offset-based approach if DOM paths fail
   * 3. Has additional fallbacks for edge cases
   *
   * @param justCollapsed - If true, creates the range but doesn't apply it to the selection
   * @returns boolean - Whether the selection was successfully restored
   */
  public restoreSelection(justCollapsed = false): boolean {
    if (!this.lastSelectionData) return false;

    const {
      blockElementId,
      startOffset,
      endOffset,
      isCursorOnly,
      startPath,
      endPath,
      startNodeOffset,
      endNodeOffset,
    } = this.lastSelectionData;

    if (!blockElementId) return false;

    const blockElement = this.DOMManager?.getBlockElementById(blockElementId);
    if (!blockElement) return false;

    const range = document.createRange();

    // Try to restore using DOM paths first (more accurate if DOM structure is preserved)
    if (
      startPath &&
      endPath &&
      this.tryRestoreUsingPaths(
        range,
        blockElement,
        startPath,
        endPath,
        startNodeOffset || 0,
        endNodeOffset || 0,
        isCursorOnly,
      )
    ) {
      if (!isCursorOnly && justCollapsed) return true;

      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
      return true;
    }

    // Fall back to character offset approach
    let currentOffset = 0;
    let startNode: Text | null = null;
    let endNode: Text | null = null;
    let startTextOffset = 0;
    let endTextOffset = 0;

    // Walk through all text nodes in the block to find the ones containing the saved offsets.
    const walker = document.createTreeWalker(
      blockElement,
      NodeFilter.SHOW_TEXT,
      null,
    );

    try {
      while (walker.nextNode()) {
        const node = walker.currentNode as Text;
        const nodeLength = node.length;

        if (!startNode && currentOffset + nodeLength >= startOffset) {
          startNode = node;
          startTextOffset = startOffset - currentOffset;
        }

        if (!endNode && currentOffset + nodeLength >= endOffset) {
          endNode = node;
          endTextOffset = endOffset - currentOffset;
          break;
        }

        currentOffset += nodeLength;
      }

      // Handle edge case: no text nodes found or offsets beyond available text
      if (!startNode) {
        // Try to get the first or last meaningful node as fallback
        startNode = this.getFirstMeaningfulNode(blockElement) as Text;
        if (!startNode && blockElement.firstChild) {
          // Last resort: use the first child and position at start
          range.setStart(blockElement.firstChild, 0);
          range.collapse(true);
        } else if (startNode) {
          range.setStart(startNode, 0);
          range.collapse(true);
        } else {
          // If all else fails, just select the block element
          range.selectNodeContents(blockElement);
          range.collapse(true);
        }
      } else {
        // Normal case: we found our nodes
        range.setStart(startNode, startTextOffset);
        if (isCursorOnly || !endNode) {
          range.collapse(true);
        } else {
          range.setEnd(
            endNode || startNode,
            endNode ? endTextOffset : startTextOffset,
          );
        }
      }

      if (!isCursorOnly && justCollapsed) return true;

      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
      return true;
    } catch (error) {
      console.error("[TypingManager] Error restoring selection:", error);
      // Last resort fallback: just focus the block
      try {
        blockElement.focus();
        return false;
      } catch (e) {
        return false;
      }
    }
  }

  /**
   * Gets the DOM path from a node to an ancestor.
   * This creates an array of indices that can be used to navigate from the ancestor to the node.
   *
   * @param node - The node to find the path for
   * @param ancestor - The ancestor to stop at
   * @returns number[] - Array of child indices from ancestor to node
   */
  private getNodePath(node: Node, ancestor: Node): number[] {
    const path: number[] = [];
    let current: Node | null = node;

    // Walk up the DOM tree until we reach the ancestor or the document
    while (current && current !== ancestor && current.parentNode) {
      const parent: Node = current.parentNode;
      // Find the index of the current node in its parent's children
      let index = 0;
      for (let i = 0; i < parent.childNodes.length; i++) {
        if (parent.childNodes[i] === current) {
          index = i;
          break;
        }
      }
      path.unshift(index); // Add to the beginning of the array
      current = parent;
    }

    return path;
  }

  /**
   * Attempts to restore a selection using DOM paths.
   *
   * @param range - The range to set
   * @param root - The root element to start from
   * @param startPath - Path to the start node
   * @param endPath - Path to the end node
   * @param startOffset - Offset within the start node
   * @param endOffset - Offset within the end node
   * @param isCursorOnly - Whether this is a cursor-only selection
   * @returns boolean - Whether the restoration was successful
   */
  private tryRestoreUsingPaths(
    range: Range,
    root: Node,
    startPath: number[],
    endPath: number[],
    startOffset: number,
    endOffset: number,
    isCursorOnly: boolean,
  ): boolean {
    try {
      // Follow the path to find the start node
      let startNode: Node = root;
      for (const index of startPath) {
        if (!startNode.childNodes[index]) return false;
        startNode = startNode.childNodes[index];
      }

      // Set the start of the range
      range.setStart(startNode, startOffset);

      if (isCursorOnly) {
        range.collapse(true);
      } else {
        // Follow the path to find the end node
        let endNode: Node = root;
        for (const index of endPath) {
          if (!endNode.childNodes[index]) return false;
          endNode = endNode.childNodes[index];
        }

        // Set the end of the range
        range.setEnd(endNode, endOffset);
      }

      return true;
    } catch (error) {
      console.warn("[TypingManager] Failed to restore using paths:", error);
      return false;
    }
  }
}
