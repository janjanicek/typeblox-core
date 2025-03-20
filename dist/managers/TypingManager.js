import { isEmpty } from "../utils/elements";
export class TypingManager {
    constructor() {
        this.DOMManager = null;
        this.lastSelectionData = null;
    }
    setDependencies(DOMManager) {
        this.DOMManager = DOMManager;
    }
    mergeConsecutiveStyledElements(blockElement) {
        const childNodes = Array.from(blockElement.childNodes);
        const ignoreTags = ["LI"];
        let i = 0;
        while (i < childNodes.length - 1) {
            const currentNode = childNodes[i];
            const nextNode = childNodes[i + 1];
            // Ensure both nodes are elements
            if (currentNode.nodeType === Node.ELEMENT_NODE &&
                nextNode.nodeType === Node.ELEMENT_NODE) {
                const currentElement = currentNode;
                const nextElement = nextNode;
                // Skip elements with tag names in the ignore list
                if (ignoreTags.includes(currentElement.tagName) ||
                    ignoreTags.includes(nextElement.tagName)) {
                    i++;
                    continue;
                }
                // Check if both elements have the same tag and style
                if (currentElement.tagName === nextElement.tagName &&
                    currentElement.getAttribute("style") ===
                        nextElement.getAttribute("style")) {
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
    getCursorElementBySelector(selector) {
        var _a;
        return (_a = this.getCursorElement()) === null || _a === void 0 ? void 0 : _a.closest(selector);
    }
    removeSelection() {
        const selection = window.getSelection();
        if (selection && !selection.isCollapsed) {
            selection.removeAllRanges(); // Ensure the selection is fully cleared
        }
    }
    isCursorAtStart(container) {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) {
            return false; // No selection or cursor available
        }
        const range = selection.getRangeAt(0);
        let startNode = range.commonAncestorContainer;
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
            if ((firstChild === null || firstChild === void 0 ? void 0 : firstChild.nodeName) === "BR" && startOffset === 0) {
                return false; // Cursor is after the first <br>
            }
            // Check if the cursor is after the last <br>
            const lastChild = childNodes[childNodes.length - 1];
            if ((lastChild === null || lastChild === void 0 ? void 0 : lastChild.nodeName) === "BR" && startNode === lastChild) {
                return false; // Cursor is after the last <br>
            }
        }
        // Check if the cursor is at the very start of the first meaningful content
        return ((startNode === firstContentNode || startNode === container) &&
            startOffset === 0);
    }
    isCursorAtEnd(container) {
        var _a, _b;
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0)
            return false;
        const range = selection.getRangeAt(0);
        let endNode = range.endContainer;
        let endOffset = range.endOffset;
        if (endNode.nodeType === Node.ELEMENT_NODE) {
            const lastTextNode = this.getLastMeaningfulNode(endNode);
            if (lastTextNode) {
                endNode = lastTextNode;
                endOffset = ((_a = lastTextNode.textContent) === null || _a === void 0 ? void 0 : _a.length) || 0;
            }
        }
        const lastNode = this.getLastMeaningfulNode(container);
        if (!lastNode)
            return false;
        return (endNode === lastNode && endOffset === (((_b = lastNode.textContent) === null || _b === void 0 ? void 0 : _b.length) || 0));
    }
    getFirstMeaningfulNode(container) {
        const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, {
            acceptNode: (node) => {
                var _a;
                if (node.nodeType === Node.TEXT_NODE &&
                    ((_a = node.textContent) === null || _a === void 0 ? void 0 : _a.trim()) !== "") {
                    return NodeFilter.FILTER_ACCEPT;
                }
                if (node.nodeType === Node.ELEMENT_NODE) {
                    return NodeFilter.FILTER_SKIP; // Skip elements, but process their children
                }
                return NodeFilter.FILTER_REJECT;
            },
        });
        let firstNode = walker.nextNode();
        while ((firstNode === null || firstNode === void 0 ? void 0 : firstNode.nodeName) === "BR") {
            firstNode = walker.nextNode();
        }
        return firstNode; // Return the first meaningful text node
    }
    getLastMeaningfulNode(container) {
        if (!container)
            return null;
        const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, {
            acceptNode: (node) => {
                var _a;
                if (node.nodeType === Node.TEXT_NODE &&
                    ((_a = node.textContent) === null || _a === void 0 ? void 0 : _a.trim()) !== "") {
                    return NodeFilter.FILTER_ACCEPT;
                }
                if (node.nodeType === Node.ELEMENT_NODE) {
                    return NodeFilter.FILTER_SKIP; // Skip elements, but process their children
                }
                return NodeFilter.FILTER_REJECT;
            },
        });
        let lastNode = null;
        while (walker.nextNode()) {
            lastNode = walker.currentNode;
        }
        return lastNode; // Return the last meaningful text node
    }
    hasTextSelection() {
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
    getSelectedElement() {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0)
            return null;
        const range = selection.getRangeAt(0);
        // Determine the block container (assumed to have a data attribute, e.g. data-typeblox-editor)
        const commonAncestor = range.commonAncestorContainer;
        let blockContainer = null;
        if (commonAncestor instanceof HTMLElement) {
            blockContainer = commonAncestor.closest("[data-typeblox-editor]");
        }
        else if (commonAncestor.parentElement) {
            blockContainer = commonAncestor.parentElement.closest("[data-typeblox-editor]");
        }
        // Build the chain of parent elements for the start container.
        const getParentChain = (node) => {
            const chain = [];
            while (node) {
                if (node instanceof HTMLElement) {
                    chain.push(node);
                }
                node = node.parentNode;
            }
            return chain;
        };
        const startChain = getParentChain(range.startContainer);
        const endChain = getParentChain(range.endContainer);
        // Find the lowest common ancestor (LCA) between start and end chains.
        let lca = null;
        for (const el of startChain) {
            if (endChain.includes(el)) {
                lca = el;
                break;
            }
        }
        if (!lca)
            return null;
        // If the LCA is the block container, we may be too high.
        // In that case, we want to return the immediate child of the block that is on the start chain.
        if (blockContainer && lca === blockContainer) {
            // Find the element in the start chain whose parent is the block container.
            const candidate = startChain.find((el) => el.parentElement === blockContainer);
            if (candidate) {
                console.warn("getSelectedElement", candidate);
                return candidate;
            }
        }
        console.warn("getSelectedElement", lca);
        return lca;
    }
    saveSelection() {
        var _a;
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) {
            console.warn("[TypingManager] No selection found.");
            return;
        }
        const range = selection.getRangeAt(0);
        const blockElement = (_a = this.DOMManager) === null || _a === void 0 ? void 0 : _a.getBlockElement();
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
        this.lastSelectionData = {
            blockElementId: blockElement.dataset.typebloxId || undefined,
            startOffset,
            endOffset,
            isCursorOnly: range.collapsed,
        };
    }
    restoreSelection(justCollapsed = false) {
        var _a;
        if (!this.lastSelectionData)
            return;
        const { blockElementId, startOffset, endOffset, isCursorOnly } = this.lastSelectionData;
        if (!blockElementId)
            return;
        const blockElement = (_a = this.DOMManager) === null || _a === void 0 ? void 0 : _a.getBlockElementById(blockElementId);
        if (!blockElement)
            return;
        const range = document.createRange();
        let currentOffset = 0;
        let startNode = null;
        let endNode = null;
        let startTextOffset = 0;
        let endTextOffset = 0;
        // Walk through all text nodes in the block to find the ones containing the saved offsets.
        const walker = document.createTreeWalker(blockElement, NodeFilter.SHOW_TEXT, null);
        while (walker.nextNode()) {
            const node = walker.currentNode;
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
        if (!startNode)
            return;
        range.setStart(startNode, startTextOffset);
        if (isCursorOnly || !endNode) {
            range.collapse(true);
        }
        else {
            range.setEnd(endNode, endTextOffset);
        }
        if (!isCursorOnly && justCollapsed)
            return;
        const selection = window.getSelection();
        selection === null || selection === void 0 ? void 0 : selection.removeAllRanges();
        selection === null || selection === void 0 ? void 0 : selection.addRange(range);
    }
}
