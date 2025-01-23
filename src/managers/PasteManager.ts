import { DOMManager } from "./DOMManager";

export class PasteManager {
  private DOMManager: DOMManager | null = null;

  constructor(initialDOMManager?: DOMManager) {
    if (initialDOMManager) {
      this.DOMManager = initialDOMManager;
    }
  }

  setDependencies(DOMManager: DOMManager) {
    this.DOMManager = DOMManager;
  }

  public pasteContent(e: ClipboardEvent) {
    if (!this.DOMManager) return;
    e.preventDefault(); // Prevent default paste behavior

    // Get the pasted HTML or plain text
    const pastedHTML =
      e.clipboardData?.getData("text/html") ||
      e.clipboardData?.getData("text/plain");

    if (!pastedHTML) return;

    // Sanitize the HTML
    const cleanHTML = this.DOMManager.sanitizeHTML(pastedHTML);

    // Insert the sanitized HTML at the cursor position
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);

      range.deleteContents(); // Remove selected content, if any

      const fragment = range.createContextualFragment(cleanHTML);
      range.insertNode(fragment);

      // Collapse the selection to the end of the inserted content
      range.collapse(false); // `false` collapses the selection to the end
      selection.removeAllRanges(); // Clear any remaining selection
      selection.addRange(range); // Reset the collapsed range
    }
  }
}
