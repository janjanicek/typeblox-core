import { getAvailableBlockTags } from "../blockTypes";
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

    const wrapper = document.createElement("div");
    wrapper.innerHTML = clean;

    const blockTags = getAvailableBlockTags();
    const isBlockElement = (el: Element) =>
      blockTags.includes(el.tagName.toLowerCase());

    // Batch consecutive inline/text nodes into <p> blocks, including entire content if no blocks
    const batchInlineNodes = (container: HTMLElement) => {
      const nodes = Array.from(container.childNodes);
      const newChildren: Node[] = [];
      let inlineFrag = document.createDocumentFragment();

      const flushInline = () => {
        if (inlineFrag.childNodes.length) {
          const p = document.createElement("p");
          // Use this loop to *move* nodes, preserving full structure:
          while (inlineFrag.firstChild) {
            p.appendChild(inlineFrag.firstChild);
          }
          newChildren.push(p);
        }
      };

      nodes.forEach((node) => {
        if (
          node.nodeType === Node.ELEMENT_NODE &&
          isBlockElement(node as Element)
        ) {
          flushInline();
          newChildren.push(node);
        } else {
          inlineFrag.appendChild(node);
        }
      });
      flushInline();

      container.innerHTML = "";
      newChildren.forEach((n) => container.appendChild(n));
    };

    batchInlineNodes(wrapper);

    // *** REMOVE the old wrapping logic here, since batching already wraps everything ***

    // Parse into blocks using your DOMManager parser
    const newBlocks = this.DOMManager!.parseHTMLToBlocks(wrapper.innerHTML);

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

    // Fallback: insert sanitized HTML at cursor position
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();

      const fragment = range.createContextualFragment(clean);
      range.insertNode(fragment);

      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
    }
  }
}
