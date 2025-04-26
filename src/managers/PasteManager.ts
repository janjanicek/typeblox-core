import { BloxManager } from "./BloxManager";
import { DOMManager } from "./DOMManager";

export class PasteManager {
  private DOMManager: DOMManager | null = null;
  private BloxManager: BloxManager | null = null;

  constructor(
    initialDOMManager?: DOMManager,
    initialBloxManager?: BloxManager,
  ) {
    if (initialDOMManager) {
      this.DOMManager = initialDOMManager;
    }
    if (initialBloxManager) {
      this.BloxManager = initialBloxManager;
    }
  }

  setDependencies(DOMManager: DOMManager, BloxManager: BloxManager) {
    this.DOMManager = DOMManager;
    this.BloxManager = BloxManager;
  }

  public pasteContent(e: ClipboardEvent) {
    e.preventDefault();
    const html =
      e.clipboardData?.getData("text/html") ||
      e.clipboardData?.getData("text/plain");
    if (!html) return;

    const clean = this.DOMManager!.sanitizeHTML(html);
    const newBlocks = this.DOMManager!.parseHTMLToBlocks(clean);

    if (newBlocks.length > 1) {
      const all = this.BloxManager!.getBlox();
      const current = this.BloxManager!.getCurrentBlock()!;
      const idx = all.findIndex((b) => b.id === current.id);

      this.BloxManager!.setBlox([
        ...all.slice(0, idx + 1),
        ...newBlocks,
        ...all.slice(idx + 1),
      ]);
      return;
    }

    // Insert the sanitized HTML at the cursor position
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);

      range.deleteContents(); // Remove selected content, if any

      const fragment = range.createContextualFragment(clean);
      range.insertNode(fragment);

      // Collapse the selection to the end of the inserted content
      range.collapse(false); // `false` collapses the selection to the end
      selection.removeAllRanges(); // Clear any remaining selection
      selection.addRange(range); // Reset the collapsed range
    }
  }
}
