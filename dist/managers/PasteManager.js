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
        var _a, _b, _c;
        if (!this.DOMManager)
            return;
        e.preventDefault(); // Prevent default paste behavior
        // Get the pasted HTML or plain text
        const pastedHTML = ((_a = e.clipboardData) === null || _a === void 0 ? void 0 : _a.getData("text/html")) ||
            ((_b = e.clipboardData) === null || _b === void 0 ? void 0 : _b.getData("text/plain"));
        if (!pastedHTML)
            return;
        // Sanitize the HTML
        const cleanHTML = this.DOMManager.sanitizeHTML(pastedHTML);
        const newBlocks = this.DOMManager.parseHTMLToBlocks(cleanHTML);
        if (newBlocks.length > 1) {
            (_c = this.BloxManager) === null || _c === void 0 ? void 0 : _c.setBlox([...this.BloxManager.getBlox(), ...newBlocks]);
            return;
        }
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
