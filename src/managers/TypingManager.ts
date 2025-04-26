import { isEmpty } from "../utils/elements";
import { EVENTS } from "../constants";
import { DOMManager } from "./DOMManager";
import { EventEmitter } from "../classes/EventEmitter";

export interface SelectionData {
  blockElementId: string | undefined;
  startOffset: number;
  endOffset: number;
  isCursorOnly: boolean;
  startPath?: number[];
  endPath?: number[];
  startNodeOffset?: number;
  endNodeOffset?: number;
}

export class TypingManager extends EventEmitter {
  private DOMManager: DOMManager | null = null;
  public lastSelectionData: SelectionData | null = null;

  // Selection change tracking
  private _prevSelectionKey: string = "";
  private _onNativeSelectionChange = this._checkSelectionChange.bind(this);

  constructor() {
    super();
    // Listen for native selection changes
    document.addEventListener("selectionchange", this._onNativeSelectionChange);
    // Initialize previous key
    this._prevSelectionKey = this._makeSelectionKey();
  }

  // Cleanup listener when destroying
  public destroy() {
    document.removeEventListener(
      "selectionchange",
      this._onNativeSelectionChange,
    );
    // additional cleanup if needed
  }

  setDependencies(DOMManager: DOMManager) {
    this.DOMManager = DOMManager;
  }

  // Merges consecutive styled siblings
  public mergeConsecutiveStyledElements(blockElement: HTMLElement): void {
    const childNodes = Array.from(blockElement.childNodes);
    const ignoreTags = ["LI"];

    let i = 0;
    while (i < childNodes.length - 1) {
      const currentNode = childNodes[i];
      const nextNode = childNodes[i + 1];

      if (
        currentNode.nodeType === Node.ELEMENT_NODE &&
        nextNode.nodeType === Node.ELEMENT_NODE
      ) {
        const currentEl = currentNode as HTMLElement;
        const nextEl = nextNode as HTMLElement;
        if (
          !ignoreTags.includes(currentEl.tagName) &&
          !ignoreTags.includes(nextEl.tagName) &&
          currentEl.tagName === nextEl.tagName &&
          currentEl.getAttribute("style") === nextEl.getAttribute("style")
        ) {
          currentEl.textContent =
            (currentEl.textContent || "") + (nextEl.textContent || "");
          nextEl.remove();
          childNodes.splice(i + 1, 1);
          continue;
        }
      }
      i++;
    }
  }

  // --- selection change helpers --- //
  private _makeSelectionKey(): string {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return "";
    const r = sel.getRangeAt(0);
    return [
      r.startContainer.nodeName,
      r.startOffset,
      r.endContainer.nodeName,
      r.endOffset,
    ].join("|");
  }

  private _checkSelectionChange(): void {
    const key = this._makeSelectionKey();
    if (key !== this._prevSelectionKey) {
      this._prevSelectionKey = key;
      this.handleSelectionChange();
    }
  }

  protected handleSelectionChange(): void {
    this.emit(EVENTS.selectionChange);
  }

  // --- existing methods follow --- //

  getCursorElement(): HTMLElement | null {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return null;
    const range = selection.getRangeAt(0);
    const container = range.commonAncestorContainer;
    return container.nodeType === Node.TEXT_NODE
      ? container.parentElement
      : (container as HTMLElement);
  }

  getCursorElementBySelector(selector: string): HTMLElement | null {
    return this.getCursorElement()?.closest(selector) || null;
  }

  removeSelection(): void {
    const selection = window.getSelection();
    if (selection && !selection.isCollapsed) {
      selection.removeAllRanges();
    }
  }

  isCursorAtStart(container: HTMLElement): boolean {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return false;
    const range = selection.getRangeAt(0);
    let startNode = range.commonAncestorContainer;
    let startOffset = range.startOffset;

    if (!container.contains(startNode)) return false;
    if (isEmpty(container)) return true;

    const firstNode = this.getFirstMeaningfulNode(container);
    if (!firstNode) return false;

    // handle <br> edge cases ...
    const childNodes = Array.from(container.childNodes);
    const firstChild = childNodes[0];
    if (firstChild?.nodeName === "BR" && startOffset === 0) return false;
    const lastChild = childNodes[childNodes.length - 1];
    if (lastChild?.nodeName === "BR" && startNode === lastChild) return false;

    return (
      (startNode === firstNode || startNode === container) && startOffset === 0
    );
  }

  isCursorAtEnd(container: HTMLElement): boolean {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return false;
    if (isEmpty(container)) return true;
    const range = selection.getRangeAt(0);
    let endNode: Node = range.endContainer;
    let endOffset = range.endOffset;
    if (endNode.nodeType === Node.ELEMENT_NODE) {
      const lastText = this.getLastMeaningfulNode(
        endNode as HTMLElement,
      ) as Text;
      if (lastText) {
        endNode = lastText;
        endOffset = lastText.length;
      }
    }
    const lastNode = this.getLastMeaningfulNode(container);
    return (
      lastNode === endNode && endOffset === (lastNode?.textContent?.length || 0)
    );
  }

  getFirstMeaningfulNode(container: HTMLElement): Node | null {
    const walker = document.createTreeWalker(
      container,
      NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
      {
        acceptNode: (node) => {
          if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim())
            return NodeFilter.FILTER_ACCEPT;
          if (node.nodeType === Node.ELEMENT_NODE)
            return NodeFilter.FILTER_SKIP;
          return NodeFilter.FILTER_REJECT;
        },
      },
    );
    let node = walker.nextNode();
    while (node?.nodeName === "BR") node = walker.nextNode();
    return node;
  }

  getLastMeaningfulNode(container: HTMLElement): Node | null {
    let walker = document.createTreeWalker(
      container,
      NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
      {
        acceptNode: (node) => {
          if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim())
            return NodeFilter.FILTER_ACCEPT;
          if (node.nodeType === Node.ELEMENT_NODE)
            return NodeFilter.FILTER_SKIP;
          return NodeFilter.FILTER_REJECT;
        },
      },
    );
    let last: Node | null = null;
    while (walker.nextNode()) last = walker.currentNode;
    return last;
  }

  public hasTextSelection(): boolean {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return false;
    const range = selection.getRangeAt(0);
    if (range.collapsed) return false;
    return range.toString().trim().length > 0;
  }

  public getSelectedElement(): Element | null {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return null;
    const range = selection.getRangeAt(0);

    let startNode: Node = range.startContainer;
    if (
      startNode.nodeType === Node.TEXT_NODE &&
      range.startOffset === (startNode as Text).length &&
      startNode.nextSibling
    )
      startNode = startNode.nextSibling;

    let endNode: Node = range.endContainer;
    if (
      endNode.nodeType === Node.TEXT_NODE &&
      range.endOffset === 0 &&
      endNode.previousSibling
    )
      endNode = endNode.previousSibling;

    const commonAncestor = range.commonAncestorContainer;
    let blockContainer: HTMLElement | null;
    if (commonAncestor instanceof HTMLElement) {
      blockContainer = commonAncestor.closest("[data-typeblox-editor]");
    } else {
      blockContainer =
        (commonAncestor.parentElement as HTMLElement)?.closest(
          "[data-typeblox-editor]",
        ) || null;
    }

    const getParentChain = (node: Node): HTMLElement[] => {
      const chain: HTMLElement[] = [];
      while (node) {
        if (node instanceof HTMLElement) chain.push(node);
        node = node.parentNode!;
      }
      return chain;
    };
    const startChain = getParentChain(startNode);
    const endChain = getParentChain(endNode);

    let lca: HTMLElement | null = null;
    for (const el of startChain) {
      if (endChain.includes(el)) {
        lca = el;
        break;
      }
    }
    if (!lca) return null;

    if (blockContainer && lca === blockContainer) {
      const candidate = startChain.find(
        (el) =>
          el !== blockContainer &&
          el.closest("[data-typeblox-editor]") === blockContainer,
      );
      if (candidate) return candidate;
    }
    return lca;
  }

  public saveSelection() {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);
    const block = this.DOMManager?.getBlockElement();
    if (!block) return;
    const pre = range.cloneRange();
    pre.selectNodeContents(block);
    pre.setEnd(range.startContainer, range.startOffset);
    const startOffset = pre.toString().length;
    const endOffset = startOffset + range.toString().length;
    const startPath = this.getNodePath(range.startContainer, block);
    const endPath = range.collapsed
      ? startPath
      : this.getNodePath(range.endContainer, block);
    this.lastSelectionData = {
      blockElementId: block.dataset.typebloxId,
      startOffset,
      endOffset,
      isCursorOnly: range.collapsed,
      startPath,
      endPath,
      startNodeOffset: range.startOffset,
      endNodeOffset: range.endOffset,
    };
  }

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
    const block = this.DOMManager?.getBlockElementById(blockElementId);
    if (!block) return false;
    const range = document.createRange();
    if (
      startPath &&
      endPath &&
      this.tryRestoreUsingPaths(
        range,
        block,
        startPath,
        endPath,
        startNodeOffset || 0,
        endNodeOffset || 0,
        isCursorOnly,
      )
    ) {
      if (!isCursorOnly || !justCollapsed) {
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
      return true;
    }
    let currentOffset = 0;
    let startNode: Text | null = null;
    let endNode: Text | null = null;
    let startTextOffset = 0;
    let endTextOffset = 0;
    const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT, null);
    while (walker.nextNode()) {
      const node = walker.currentNode as Text;
      const len = node.length;
      if (!startNode && currentOffset + len >= startOffset) {
        startNode = node;
        startTextOffset = startOffset - currentOffset;
      }
      if (!endNode && currentOffset + len >= endOffset) {
        endNode = node;
        endTextOffset = endOffset - currentOffset;
        break;
      }
      currentOffset += len;
    }
    if (!startNode) {
      const first = this.getFirstMeaningfulNode(block) as Text;
      if (first) {
        range.setStart(first, 0);
        range.collapse(true);
      } else {
        range.selectNodeContents(block);
        range.collapse(true);
      }
    } else {
      range.setStart(startNode, startTextOffset);
      if (isCursorOnly || !endNode) range.collapse(true);
      else range.setEnd(endNode, endTextOffset);
    }
    if (!isCursorOnly || !justCollapsed) {
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
    return true;
  }

  private getNodePath(node: Node, ancestor: Node): number[] {
    const path: number[] = [];
    let cur: Node | null = node;
    while (cur && cur !== ancestor && cur.parentNode) {
      const parent: Node = cur.parentNode;
      const idx = Array.prototype.indexOf.call(parent.childNodes, cur);
      path.unshift(idx);
      cur = parent;
    }
    return path;
  }

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
      let cur: Node = root;
      for (const idx of startPath) {
        if (!cur.childNodes[idx]) return false;
        cur = cur.childNodes[idx];
      }
      range.setStart(cur, startOffset);
      if (!isCursorOnly) {
        let endCur: Node = root;
        for (const idx of endPath) {
          if (!endCur.childNodes[idx]) return false;
          endCur = endCur.childNodes[idx];
        }
        range.setEnd(endCur, endOffset);
      }
      return true;
    } catch {
      return false;
    }
  }
}
