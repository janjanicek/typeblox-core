import { getAvailableBlockTags } from "../blockTypes";
export class PasteManager {
    constructor(initialDOMManager, initialBloxManager) {
        this.DOMManager = null;
        this.BloxManager = null;
        if (initialDOMManager) {
            this.DOMManager = initialDOMManager;
        }
        if (initialBloxManager) {
            this.BloxManager = initialBloxManager;
        }
    }
    setDependencies(DOMManager, BloxManager) {
        this.DOMManager = DOMManager;
        this.BloxManager = BloxManager;
    }
    pasteContent(e) {
        var _a, _b;
        e.preventDefault();
        const html = ((_a = e.clipboardData) === null || _a === void 0 ? void 0 : _a.getData("text/html")) ||
            ((_b = e.clipboardData) === null || _b === void 0 ? void 0 : _b.getData("text/plain"));
        if (!html)
            return;
        const clean = this.DOMManager.sanitizeHTML(html);
        const wrapper = document.createElement("div");
        wrapper.innerHTML = clean;
        const blockTags = getAvailableBlockTags();
        const isBlockElement = (el) => blockTags.includes(el.tagName.toLowerCase());
        // Batch consecutive inline/text nodes into <p> blocks, including entire content if no blocks
        const batchInlineNodes = (container) => {
            const nodes = Array.from(container.childNodes);
            const newChildren = [];
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
                if (node.nodeType === Node.ELEMENT_NODE &&
                    isBlockElement(node)) {
                    flushInline();
                    newChildren.push(node);
                }
                else {
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
        const newBlocks = this.DOMManager.parseHTMLToBlocks(wrapper.innerHTML);
        if (newBlocks.length > 1) {
            const all = this.BloxManager.getBlox();
            const current = this.BloxManager.getCurrentBlock();
            const idx = all.findIndex((b) => b.id === current.id);
            this.BloxManager.setBlox([
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
