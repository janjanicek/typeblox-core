import { isEmpty } from "../utils/elements";
import { EVENTS } from "../constants";
import { EventEmitter } from "../classes/EventEmitter";
export class TypingManager extends EventEmitter {
    constructor() {
        super();
        this.DOMManager = null;
        this.lastSelectionData = null;
        // Selection change tracking
        this._prevSelectionKey = "";
        this._onNativeSelectionChange = this._checkSelectionChange.bind(this);
        // Listen for native selection changes
        document.addEventListener("selectionchange", this._onNativeSelectionChange);
        // Initialize previous key
        this._prevSelectionKey = this._makeSelectionKey();
    }
    // Cleanup listener when destroying
    destroy() {
        document.removeEventListener("selectionchange", this._onNativeSelectionChange);
        // additional cleanup if needed
    }
    setDependencies(DOMManager) {
        this.DOMManager = DOMManager;
    }
    // Merges consecutive styled siblings
    mergeConsecutiveStyledElements(blockElement) {
        const childNodes = Array.from(blockElement.childNodes);
        const ignoreTags = ["LI"];
        let i = 0;
        while (i < childNodes.length - 1) {
            const currentNode = childNodes[i];
            const nextNode = childNodes[i + 1];
            if (currentNode.nodeType === Node.ELEMENT_NODE &&
                nextNode.nodeType === Node.ELEMENT_NODE) {
                const currentEl = currentNode;
                const nextEl = nextNode;
                if (!ignoreTags.includes(currentEl.tagName) &&
                    !ignoreTags.includes(nextEl.tagName) &&
                    currentEl.tagName === nextEl.tagName &&
                    currentEl.getAttribute("style") === nextEl.getAttribute("style")) {
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
    _makeSelectionKey() {
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0)
            return "";
        const r = sel.getRangeAt(0);
        return [
            r.startContainer.nodeName,
            r.startOffset,
            r.endContainer.nodeName,
            r.endOffset,
        ].join("|");
    }
    _checkSelectionChange() {
        const key = this._makeSelectionKey();
        if (key !== this._prevSelectionKey) {
            this._prevSelectionKey = key;
            this.handleSelectionChange();
        }
    }
    handleSelectionChange() {
        this.emit(EVENTS.selectionChange);
    }
    // --- existing methods follow --- //
    getCursorElement() {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0)
            return null;
        const range = selection.getRangeAt(0);
        const container = range.commonAncestorContainer;
        return container.nodeType === Node.TEXT_NODE
            ? container.parentElement
            : container;
    }
    getCursorElementBySelector(selector) {
        var _a;
        return ((_a = this.getCursorElement()) === null || _a === void 0 ? void 0 : _a.closest(selector)) || null;
    }
    removeSelection() {
        const selection = window.getSelection();
        if (selection && !selection.isCollapsed) {
            selection.removeAllRanges();
        }
    }
    isCursorAtStart(container) {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0)
            return false;
        const range = selection.getRangeAt(0);
        let startNode = range.commonAncestorContainer;
        let startOffset = range.startOffset;
        if (!container.contains(startNode))
            return false;
        if (isEmpty(container))
            return true;
        const firstNode = this.getFirstMeaningfulNode(container);
        if (!firstNode)
            return false;
        // handle <br> edge cases ...
        const childNodes = Array.from(container.childNodes);
        const firstChild = childNodes[0];
        if ((firstChild === null || firstChild === void 0 ? void 0 : firstChild.nodeName) === "BR" && startOffset === 0)
            return false;
        const lastChild = childNodes[childNodes.length - 1];
        if ((lastChild === null || lastChild === void 0 ? void 0 : lastChild.nodeName) === "BR" && startNode === lastChild)
            return false;
        return ((startNode === firstNode || startNode === container) && startOffset === 0);
    }
    isCursorAtEnd(container) {
        var _a;
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0)
            return false;
        if (isEmpty(container))
            return true;
        const range = selection.getRangeAt(0);
        let endNode = range.endContainer;
        let endOffset = range.endOffset;
        if (endNode.nodeType === Node.ELEMENT_NODE) {
            const lastText = this.getLastMeaningfulNode(endNode);
            if (lastText) {
                endNode = lastText;
                endOffset = lastText.length;
            }
        }
        const lastNode = this.getLastMeaningfulNode(container);
        return (lastNode === endNode && endOffset === (((_a = lastNode === null || lastNode === void 0 ? void 0 : lastNode.textContent) === null || _a === void 0 ? void 0 : _a.length) || 0));
    }
    getFirstMeaningfulNode(container) {
        const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, {
            acceptNode: (node) => {
                var _a;
                if (node.nodeType === Node.TEXT_NODE && ((_a = node.textContent) === null || _a === void 0 ? void 0 : _a.trim()))
                    return NodeFilter.FILTER_ACCEPT;
                if (node.nodeType === Node.ELEMENT_NODE)
                    return NodeFilter.FILTER_SKIP;
                return NodeFilter.FILTER_REJECT;
            },
        });
        let node = walker.nextNode();
        while ((node === null || node === void 0 ? void 0 : node.nodeName) === "BR")
            node = walker.nextNode();
        return node;
    }
    getLastMeaningfulNode(container) {
        let walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, {
            acceptNode: (node) => {
                var _a;
                if (node.nodeType === Node.TEXT_NODE && ((_a = node.textContent) === null || _a === void 0 ? void 0 : _a.trim()))
                    return NodeFilter.FILTER_ACCEPT;
                if (node.nodeType === Node.ELEMENT_NODE)
                    return NodeFilter.FILTER_SKIP;
                return NodeFilter.FILTER_REJECT;
            },
        });
        let last = null;
        while (walker.nextNode())
            last = walker.currentNode;
        return last;
    }
    hasTextSelection() {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0)
            return false;
        const range = selection.getRangeAt(0);
        if (range.collapsed)
            return false;
        return range.toString().trim().length > 0;
    }
    getSelectedElement() {
        var _a;
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0)
            return null;
        const range = selection.getRangeAt(0);
        let startNode = range.startContainer;
        if (startNode.nodeType === Node.TEXT_NODE &&
            range.startOffset === startNode.length &&
            startNode.nextSibling)
            startNode = startNode.nextSibling;
        let endNode = range.endContainer;
        if (endNode.nodeType === Node.TEXT_NODE &&
            range.endOffset === 0 &&
            endNode.previousSibling)
            endNode = endNode.previousSibling;
        const commonAncestor = range.commonAncestorContainer;
        let blockContainer;
        if (commonAncestor instanceof HTMLElement) {
            blockContainer = commonAncestor.closest("[data-typeblox-editor]");
        }
        else {
            blockContainer =
                ((_a = commonAncestor.parentElement) === null || _a === void 0 ? void 0 : _a.closest("[data-typeblox-editor]")) || null;
        }
        const getParentChain = (node) => {
            const chain = [];
            while (node) {
                if (node instanceof HTMLElement)
                    chain.push(node);
                node = node.parentNode;
            }
            return chain;
        };
        const startChain = getParentChain(startNode);
        const endChain = getParentChain(endNode);
        let lca = null;
        for (const el of startChain) {
            if (endChain.includes(el)) {
                lca = el;
                break;
            }
        }
        if (!lca)
            return null;
        if (blockContainer && lca === blockContainer) {
            const candidate = startChain.find((el) => el !== blockContainer &&
                el.closest("[data-typeblox-editor]") === blockContainer);
            if (candidate)
                return candidate;
        }
        return lca;
    }
    saveSelection() {
        var _a;
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0)
            return;
        const range = selection.getRangeAt(0);
        const block = (_a = this.DOMManager) === null || _a === void 0 ? void 0 : _a.getBlockElement();
        if (!block)
            return;
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
    restoreSelection(justCollapsed = false) {
        var _a;
        if (!this.lastSelectionData)
            return false;
        const { blockElementId, startOffset, endOffset, isCursorOnly, startPath, endPath, startNodeOffset, endNodeOffset, } = this.lastSelectionData;
        if (!blockElementId)
            return false;
        const block = (_a = this.DOMManager) === null || _a === void 0 ? void 0 : _a.getBlockElementById(blockElementId);
        if (!block)
            return false;
        const range = document.createRange();
        if (startPath &&
            endPath &&
            this.tryRestoreUsingPaths(range, block, startPath, endPath, startNodeOffset || 0, endNodeOffset || 0, isCursorOnly)) {
            if (!isCursorOnly || !justCollapsed) {
                const sel = window.getSelection();
                sel === null || sel === void 0 ? void 0 : sel.removeAllRanges();
                sel === null || sel === void 0 ? void 0 : sel.addRange(range);
            }
            return true;
        }
        let currentOffset = 0;
        let startNode = null;
        let endNode = null;
        let startTextOffset = 0;
        let endTextOffset = 0;
        const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT, null);
        while (walker.nextNode()) {
            const node = walker.currentNode;
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
            const first = this.getFirstMeaningfulNode(block);
            if (first) {
                range.setStart(first, 0);
                range.collapse(true);
            }
            else {
                range.selectNodeContents(block);
                range.collapse(true);
            }
        }
        else {
            range.setStart(startNode, startTextOffset);
            if (isCursorOnly || !endNode)
                range.collapse(true);
            else
                range.setEnd(endNode, endTextOffset);
        }
        if (!isCursorOnly || !justCollapsed) {
            const sel = window.getSelection();
            sel === null || sel === void 0 ? void 0 : sel.removeAllRanges();
            sel === null || sel === void 0 ? void 0 : sel.addRange(range);
        }
        return true;
    }
    getNodePath(node, ancestor) {
        const path = [];
        let cur = node;
        while (cur && cur !== ancestor && cur.parentNode) {
            const parent = cur.parentNode;
            const idx = Array.prototype.indexOf.call(parent.childNodes, cur);
            path.unshift(idx);
            cur = parent;
        }
        return path;
    }
    tryRestoreUsingPaths(range, root, startPath, endPath, startOffset, endOffset, isCursorOnly) {
        try {
            let cur = root;
            for (const idx of startPath) {
                if (!cur.childNodes[idx])
                    return false;
                cur = cur.childNodes[idx];
            }
            range.setStart(cur, startOffset);
            if (!isCursorOnly) {
                let endCur = root;
                for (const idx of endPath) {
                    if (!endCur.childNodes[idx])
                        return false;
                    endCur = endCur.childNodes[idx];
                }
                range.setEnd(endCur, endOffset);
            }
            return true;
        }
        catch (_a) {
            return false;
        }
    }
}
